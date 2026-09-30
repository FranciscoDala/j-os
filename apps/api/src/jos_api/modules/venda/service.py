from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
import uuid
from sqlalchemy import func
from typing import Optional

from jos_api.modules.venda.models import Venda, VendaItem, VendaTipo, VendaStatus
from jos_api.modules.mesa.models import Mesa, MesaStatus
# AJUSTA AQUI SE TEU MODEL CHAMA Produto
from jos_api.modules.produto.models import Product

def _next_numero(db: Session, empresa_id: uuid.UUID) -> int:
    # lock implicito para evitar numero duplicado
    max_n = db.query(func.max(Venda.numero)).filter(Venda.empresa_id == empresa_id).with_for_update().scalar()
    return (max_n or 0) + 1

def get_mesas(db: Session, empresa_id: uuid.UUID):
    return db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.ativa == True).order_by(Mesa.numero).all()

def criar_mesa(db: Session, empresa_id: uuid.UUID, numero: str, capacidade: int):
    exists = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.numero == numero, Mesa.ativa == True).first()
    if exists:
        raise HTTPException(400, f"Mesa {numero} já existe")
    m = Mesa(empresa_id=empresa_id, numero=numero.strip().upper(), capacidade=capacidade, status=MesaStatus.LIVRE)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

def create_venda(db: Session, data, empresa_id: uuid.UUID, created_by: uuid.UUID):
    if not data.itens:
        raise HTTPException(400, "Sem itens")

    mesa: Optional[Mesa] = None
    venda_tipo = VendaTipo.BALCAO
    venda_status = VendaStatus.CONCLUIDA

    if data.mesa_id:
        mesa = db.query(Mesa).filter(Mesa.id == data.mesa_id, Mesa.empresa_id == empresa_id).with_for_update().first()
        if not mesa:
            raise HTTPException(404, "Mesa não encontrada")
        if mesa.status!= MesaStatus.LIVRE:
            raise HTTPException(400, f"Mesa {mesa.numero} está {mesa.status.value}")
        venda_tipo = VendaTipo.MESA
        venda_status = VendaStatus.ABERTA if data.dinheiro_recebido == 0 else VendaStatus.CONCLUIDA

    venda = Venda(
        empresa_id=empresa_id,
        created_by=created_by,
        numero=_next_numero(db, empresa_id),
        tipo=venda_tipo,
        mesa_id=data.mesa_id,
        status=venda_status,
        forma_pagamento=data.forma_pagamento,
        dinheiro_recebido=data.dinheiro_recebido
    )

    sub = Decimal("0")
    iva_tot = Decimal("0")
    tot = Decimal("0")

    for it in data.itens:
        prod = db.query(Product).filter(Product.id == it.produto_id, Product.empresa_id == empresa_id).first()
        if not prod:
            raise HTTPException(404, "Produto não encontrado")

        # validação de stock só se vai concluir agora
        if venda_status == VendaStatus.CONCLUIDA and getattr(prod, 'controlar_stock', False):
            if prod.stock_atual < it.quantidade and not getattr(prod, 'allow_negative', False):
                raise HTTPException(400, f"Stock insuficiente: {prod.nome} ({prod.stock_atual})")

        sub_item = prod.preco_venda * it.quantidade

        if getattr(prod, 'tem_iva', False) and getattr(prod, 'iva', Decimal("0")) > 0:
            iva_v = sub_item * (prod.iva / Decimal("100"))
            tem_iva = True
            iva_p = prod.iva
        else:
            iva_v = Decimal("0")
            tem_iva = False
            iva_p = Decimal("0")

        tot_item = sub_item + iva_v

        venda.itens.append(VendaItem(
            empresa_id=empresa_id,
            produto_id=prod.id,
            nome_produto=prod.nome,
            quantidade=it.quantidade,
            preco_unit=prod.preco_venda,
            tem_iva=tem_iva,
            iva_percent=iva_p,
            subtotal=sub_item,
            iva_valor=iva_v,
            total=tot_item
        ))

        sub += sub_item
        iva_tot += iva_v
        tot += tot_item

        if venda_status == VendaStatus.CONCLUIDA and getattr(prod, 'controlar_stock', False):
            prod.stock_atual -= it.quantidade

    venda.subtotal = sub
    venda.total_iva = iva_tot
    venda.total = tot
    venda.troco = data.dinheiro_recebido - tot if data.dinheiro_recebido >= tot else Decimal("0")

    if mesa:
        mesa.status = MesaStatus.OCUPADA if venda_status == VendaStatus.ABERTA else MesaStatus.LIVRE

    db.add(venda)
    db.commit()
    db.refresh(venda)
    return venda

def fechar_comanda(db: Session, venda_id: uuid.UUID, empresa_id: uuid.UUID, dinheiro_recebido: Decimal):
    venda = db.query(Venda).filter(Venda.id == venda_id, Venda.empresa_id == empresa_id).with_for_update().first()
    if not venda or venda.status!= VendaStatus.ABERTA:
        raise HTTPException(400, "Comanda não está aberta")

    # revalida stock ao fechar
    for item in venda.itens:
        prod = db.query(Product).filter(Product.id == item.produto_id).with_for_update().first()
        if prod and getattr(prod, 'controlar_stock', False):
            if prod.stock_atual < item.quantidade:
                raise HTTPException(400, f"Sem stock para {prod.nome}")
            prod.stock_atual -= item.quantidade

    venda.dinheiro_recebido = dinheiro_recebido
    venda.troco = dinheiro_recebido - venda.total if dinheiro_recebido >= venda.total else Decimal("0")
    venda.status = VendaStatus.CONCLUIDA

    if venda.mesa_id:
        mesa = db.query(Mesa).filter(Mesa.id == venda.mesa_id).first()
        if mesa:
            mesa.status = MesaStatus.LIVRE

    db.commit()
    db.refresh(venda)
    return venda
