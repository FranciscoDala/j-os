from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
import uuid
from sqlalchemy import func
from typing import Optional
from jos_api.modules.venda.models import Venda, VendaItem, VendaTipo, VendaStatus
from jos_api.modules.mesa.models import Mesa, MesaStatus
from jos_api.modules.produto.models import Product
from jos_api.modules.caixa.models import Caixa, CaixaMovimento, TipoMovimento, OrigemMovimento
from jos_api.modules.atividade.service import registrar_atividade

def _next_numero(db: Session, empresa_id: uuid.UUID) -> int:
    max_n = db.query(func.max(Venda.numero)).filter(Venda.empresa_id == empresa_id).scalar()
    return (max_n or 0) + 1

def get_mesas(db: Session, empresa_id: uuid.UUID):
    return db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.ativa == True).order_by(Mesa.numero).all()

def criar_mesa(db: Session, empresa_id: uuid.UUID, numero: str, capacidade: int):
    exists = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.numero == numero, Mesa.ativa == True).first()
    if exists: raise HTTPException(400, f"Mesa {numero} já existe")
    m = Mesa(empresa_id=empresa_id, numero=numero.strip().upper(), capacidade=capacidade, status=MesaStatus.LIVRE)
    db.add(m); db.commit(); db.refresh(m)
    return m

def create_venda(db: Session, data, empresa_id: uuid.UUID, created_by: uuid.UUID, caixa: Caixa, criado_por_nome: str = "Sistema", ip: str | None = None):
    if not data.itens: raise HTTPException(400, "Sem itens")
    mesa: Optional[Mesa] = None
    venda_tipo = VendaTipo.BALCAO
    venda_status = VendaStatus.CONCLUIDA
    if data.mesa_id:
        mesa = db.query(Mesa).filter(Mesa.id == data.mesa_id, Mesa.empresa_id == empresa_id).with_for_update().first()
        if not mesa: raise HTTPException(404, "Mesa não encontrada")
        if mesa.status!= MesaStatus.LIVRE: raise HTTPException(400, f"Mesa {mesa.numero} está {mesa.status.value}")
        venda_tipo = VendaTipo.MESA
        venda_status = VendaStatus.ABERTA if data.dinheiro_recebido == Decimal("0") else VendaStatus.CONCLUIDA

    venda = Venda(empresa_id=empresa_id, created_by=created_by, caixa_id=caixa.id, numero=_next_numero(db, empresa_id), tipo=venda_tipo, mesa_id=data.mesa_id, status=venda_status, forma_pagamento=data.forma_pagamento, dinheiro_recebido=data.dinheiro_recebido)
    sub = Decimal("0"); iva_tot = Decimal("0"); tot = Decimal("0")
    for it in data.itens:
        prod = db.query(Product).filter(Product.id == it.produto_id, Product.empresa_id == empresa_id).with_for_update().first()
        if not prod: raise HTTPException(404, f"Produto {it.produto_id} não encontrado")
        if venda_status == VendaStatus.CONCLUIDA and getattr(prod, 'controlar_stock', False):
            if prod.stock_atual < it.quantidade and not getattr(prod, 'allow_negative', False):
                raise HTTPException(400, f"Stock insuficiente: {prod.nome} ({prod.stock_atual})")
        sub_item = prod.preco_venda * it.quantidade
        if getattr(prod, 'tem_iva', False) and getattr(prod, 'iva', Decimal("0")) > 0:
            iva_v = sub_item * (prod.iva / Decimal("100")); tem_iva = True; iva_p = prod.iva
        else: iva_v = Decimal("0"); tem_iva = False; iva_p = Decimal("0")
        tot_item = sub_item + iva_v
        venda.itens.append(VendaItem(empresa_id=empresa_id, produto_id=prod.id, nome_produto=prod.nome, quantidade=it.quantidade, preco_unit=prod.preco_venda, tem_iva=tem_iva, iva_percent=iva_p, subtotal=sub_item, iva_valor=iva_v, total=tot_item))
        sub += sub_item; iva_tot += iva_v; tot += tot_item
        if venda_status == VendaStatus.CONCLUIDA and getattr(prod, 'controlar_stock', False): prod.stock_atual -= it.quantidade

    venda.subtotal = sub; venda.total_iva = iva_tot; venda.total = tot
    venda.troco = data.dinheiro_recebido - tot if data.dinheiro_recebido >= tot else Decimal("0")
    if mesa: mesa.status = MesaStatus.OCUPADA if venda_status == VendaStatus.ABERTA else MesaStatus.LIVRE
    db.add(venda); db.flush()

    nomes_produtos = ", ".join([i.nome_produto for i in venda.itens])
    if venda_status == VendaStatus.CONCLUIDA:
        mov = CaixaMovimento(empresa_id=empresa_id, caixa_id=caixa.id, tipo=TipoMovimento.VENDA, origem=OrigemMovimento.VENDA, valor=venda.total, descricao=f"Venda #{venda.numero} - {venda.forma_pagamento}", venda_id=venda.id, forma_pagamento=venda.forma_pagamento, criado_por=created_by, criado_por_nome=criado_por_nome)
        db.add(mov)

    registrar_atividade(db, empresa_id=empresa_id, modulo="VENDA", acao="CRIAR",
        descricao=f"Venda #{venda.numero} - {nomes_produtos} - R$ {venda.total} - {venda.forma_pagamento}",
        entidade="Venda", entidade_id=venda.id, entidade_nome=f"Venda #{venda.numero} - {nomes_produtos}",
        user_id=created_by, user_nome=criado_por_nome, detalhes={"produtos": nomes_produtos, "total": str(venda.total), "forma": venda.forma_pagamento, "caixa_id": str(caixa.id)}, ip=ip, commit=False)

    db.commit(); db.refresh(venda); return venda

def fechar_comanda(db: Session, venda_id: uuid.UUID, empresa_id: uuid.UUID, dinheiro_recebido: Decimal, user_id: uuid.UUID, user_nome: str, ip: str | None = None):
    venda = db.query(Venda).filter(Venda.id == venda_id, Venda.empresa_id == empresa_id).with_for_update().first()
    if not venda or venda.status!= VendaStatus.ABERTA: raise HTTPException(400, "Comanda não está aberta")
    caixa = db.query(Caixa).filter(Caixa.id == venda.caixa_id).first()
    if not caixa: raise HTTPException(400, "Caixa da venda não encontrado")
    for item in venda.itens:
        prod = db.query(Product).filter(Product.id == item.produto_id).with_for_update().first()
        if prod and getattr(prod, 'controlar_stock', False):
            if prod.stock_atual < item.quantidade and not getattr(prod, 'allow_negative', False): raise HTTPException(400, f"Sem stock para {prod.nome}")
            prod.stock_atual -= item.quantidade
    venda.dinheiro_recebido = dinheiro_recebido; venda.troco = dinheiro_recebido - venda.total if dinheiro_recebido >= venda.total else Decimal("0"); venda.status = VendaStatus.CONCLUIDA
    mov = CaixaMovimento(empresa_id=empresa_id, caixa_id=caixa.id, tipo=TipoMovimento.VENDA, origem=OrigemMovimento.VENDA, valor=venda.total, descricao=f"Fechamento comanda #{venda.numero} Mesa {venda.mesa_id}", venda_id=venda.id, forma_pagamento=venda.forma_pagamento, criado_por=user_id, criado_por_nome=user_nome)
    db.add(mov)
    nomes = ", ".join([i.nome_produto for i in venda.itens])
    registrar_atividade(db, empresa_id=empresa_id, modulo="VENDA", acao="FECHAR_COMANDA",
        descricao=f"Fechou comanda #{venda.numero} - {nomes} - R$ {venda.total}", entidade="Venda", entidade_id=venda.id, entidade_nome=f"Venda #{venda.numero} - {nomes}", user_id=user_id, user_nome=user_nome, detalhes={"produtos": nomes, "total": str(venda.total)}, ip=ip, commit=False)
    if venda.mesa_id:
        mesa = db.query(Mesa).filter(Mesa.id == venda.mesa_id).first()
        if mesa: mesa.status = MesaStatus.LIVRE
    db.commit(); db.refresh(venda); return venda

def cancelar_venda(db: Session, venda_id: uuid.UUID, empresa_id: uuid.UUID, user_id: uuid.UUID, user_nome: str, ip: str | None = None):
    venda = db.query(Venda).filter(Venda.id == venda_id, Venda.empresa_id == empresa_id).first()
    if not venda: raise HTTPException(404, "Venda não encontrada")
    venda.status = VendaStatus.CANCELADA
    nomes = ", ".join([i.nome_produto for i in venda.itens])
    registrar_atividade(db, empresa_id=empresa_id, modulo="VENDA", acao="CANCELAR",
        descricao=f"Cancelou venda #{venda.numero} - {nomes}", entidade="Venda", entidade_id=venda.id, entidade_nome=f"Venda #{venda.numero} - {nomes}", user_id=user_id, user_nome=user_nome, detalhes={"total": str(venda.total)}, ip=ip, commit=False)
    db.commit(); return venda
