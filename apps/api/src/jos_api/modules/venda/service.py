from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
import uuid
from sqlalchemy import func
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from jos_api.modules.venda.models import Venda, VendaItem, VendaTipo, VendaStatus, VendaItemStatus, ReservaCarrinho
from jos_api.modules.mesa.models import Mesa, MesaStatus, MesaReserva, ReservaStatus
from jos_api.modules.produto.models import Product
from jos_api.modules.caixa.models import Caixa, CaixaMovimento, TipoMovimento, OrigemMovimento
from jos_api.modules.atividade.service import registrar_atividade
from jos_api.core.events import emit

def _next_numero(db: Session, empresa_id: uuid.UUID) -> int:
    max_n = db.query(func.max(Venda.numero)).filter(Venda.empresa_id == empresa_id).scalar()
    return (max_n or 0) + 1

def _limpar_expiradas(db: Session, empresa_id: uuid.UUID):
    db.query(ReservaCarrinho).filter(ReservaCarrinho.empresa_id == empresa_id, ReservaCarrinho.expira_em < datetime.utcnow()).delete()
    db.flush()

def get_stock_disponivel(db: Session, empresa_id: uuid.UUID, produto_id: uuid.UUID, ignorar_user_id: uuid.UUID | None = None) -> Decimal:
    _limpar_expiradas(db, empresa_id)
    prod = db.query(Product).filter(Product.id == produto_id, Product.empresa_id == empresa_id).first()
    if not prod: return Decimal("0")
    stock = Decimal(str(prod.stock_atual or 0))
    if not getattr(prod, 'controlar_stock', False): return Decimal("999999")
    q = db.query(func.coalesce(func.sum(ReservaCarrinho.quantidade), 0)).filter(ReservaCarrinho.empresa_id == empresa_id, ReservaCarrinho.produto_id == produto_id)
    if ignorar_user_id: q = q.filter(ReservaCarrinho.user_id!= ignorar_user_id)
    reservado = Decimal(str(q.scalar() or 0))
    return stock - reservado

def get_reservas_ativas(db: Session, empresa_id: uuid.UUID):
    _limpar_expiradas(db, empresa_id)
    return db.query(ReservaCarrinho).filter(ReservaCarrinho.empresa_id == empresa_id, ReservaCarrinho.expira_em > datetime.utcnow()).all()

def reservar_produto(db: Session, empresa_id: uuid.UUID, produto_id: uuid.UUID, user_id: uuid.UUID, quantidade: Decimal):
    _limpar_expiradas(db, empresa_id)
    db.query(ReservaCarrinho).filter(ReservaCarrinho.empresa_id == empresa_id, ReservaCarrinho.produto_id == produto_id, ReservaCarrinho.user_id == user_id).delete()
    db.flush()
    disponivel = get_stock_disponivel(db, empresa_id, produto_id)
    if disponivel < quantidade: raise HTTPException(400, f"Stock insuficiente. Disponível: {disponivel}")
    r = ReservaCarrinho(empresa_id=empresa_id, produto_id=produto_id, user_id=user_id, quantidade=quantidade, expira_em=datetime.utcnow() + timedelta(minutes=5))
    db.add(r); db.commit(); db.refresh(r)
    return r

def liberar_reserva(db: Session, empresa_id: uuid.UUID, produto_id: uuid.UUID, user_id: uuid.UUID):
    db.query(ReservaCarrinho).filter(ReservaCarrinho.empresa_id == empresa_id, ReservaCarrinho.produto_id == produto_id, ReservaCarrinho.user_id == user_id).delete()
    db.commit()

def liberar_todas_reservas_user(db: Session, empresa_id: uuid.UUID, user_id: uuid.UUID):
    db.query(ReservaCarrinho).filter(ReservaCarrinho.empresa_id == empresa_id, ReservaCarrinho.user_id == user_id).delete()
    db.commit()

def create_venda(db: Session, data, empresa_id: uuid.UUID, created_by: uuid.UUID, caixa: Caixa, criado_por_nome: str = "Sistema", ip: str | None = None):
    if not data.itens: raise HTTPException(400, "Sem itens")
    _limpar_expiradas(db, empresa_id)
    mesa: Optional[Mesa] = None
    venda_tipo = VendaTipo.BALCAO
    garcom_id = getattr(data, 'garcom_id', None) or created_by
    pessoas = getattr(data, 'pessoas', 1) or 1

    if data.mesa_id:
        mesa = db.query(Mesa).filter(Mesa.id == data.mesa_id, Mesa.empresa_id == empresa_id).with_for_update().first()
        if not mesa: raise HTTPException(404, "Mesa não encontrada")
        if mesa.status == MesaStatus.OCUPADA and mesa.venda_atual_id:
            venda_existente = db.query(Venda).filter(Venda.id == mesa.venda_atual_id, Venda.status == VendaStatus.ABERTA).first()
            if venda_existente:
                raise HTTPException(400, f"Mesa {mesa.numero} já ocupada com comanda #{venda_existente.numero}. Use adicionar itens.")
        venda_tipo = VendaTipo.MESA
        venda_status = VendaStatus.ABERTA if data.dinheiro_recebido == Decimal("0") else VendaStatus.CONCLUIDA
    else:
        venda_status = VendaStatus.CONCLUIDA

    # AGRUPA MESMO PRODUTO - 1 Cuca + 1 Cuca = 1 item com qtd 2 e total multiplicado
    agrupado: Dict[str, Any] = {}
    for it in data.itens:
        key = f"{it.produto_id}-{(getattr(it,'observacao',None) or '').strip().lower()}"
        if key in agrupado:
            agrupado[key].quantidade = Decimal(agrupado[key].quantidade) + Decimal(it.quantidade)
        else:
            agrupado[key] = it

    venda = Venda(empresa_id=empresa_id, created_by=created_by, garcom_id=garcom_id, caixa_id=caixa.id, numero=_next_numero(db, empresa_id), tipo=venda_tipo, mesa_id=data.mesa_id, pessoas=pessoas, observacao=getattr(data,'observacao',None), status=venda_status, forma_pagamento=data.forma_pagamento, dinheiro_recebido=data.dinheiro_recebido)
    sub = Decimal("0"); iva_tot = Decimal("0"); tot = Decimal("0")
    produtos_afectados = []

    for it in agrupado.values():
        prod = db.query(Product).filter(Product.id == it.produto_id, Product.empresa_id == empresa_id).with_for_update().first()
        if not prod: raise HTTPException(404, f"Produto {it.produto_id} não encontrado")
        if getattr(prod, 'controlar_stock', False):
            disp = get_stock_disponivel(db, empresa_id, prod.id, ignorar_user_id=created_by)
            minha_reserva_qtd = db.query(func.coalesce(func.sum(ReservaCarrinho.quantidade),0)).filter(ReservaCarrinho.empresa_id==empresa_id, ReservaCarrinho.produto_id==prod.id, ReservaCarrinho.user_id==created_by).scalar() or Decimal("0")
            if (disp + Decimal(str(minha_reserva_qtd))) < it.quantidade and not getattr(prod, 'allow_negative', False):
                raise HTTPException(400, f"Stock insuficiente: {prod.nome}")
        sub_item = prod.preco_venda * Decimal(it.quantidade) # AQUI JÁ MULTIPLICA
        if getattr(prod, 'tem_iva', False) and getattr(prod, 'iva', Decimal("0")) > 0:
            iva_v = sub_item * (prod.iva / Decimal("100")); tem_iva = True; iva_p = prod.iva
        else: iva_v = Decimal("0"); tem_iva = False; iva_p = Decimal("0")
        tot_item = sub_item + iva_v
        venda.itens.append(VendaItem(empresa_id=empresa_id, produto_id=prod.id, nome_produto=prod.nome, quantidade=it.quantidade, preco_unit=prod.preco_venda, tem_iva=tem_iva, iva_percent=iva_p, subtotal=sub_item, iva_valor=iva_v, total=tot_item, status=VendaItemStatus.PENDENTE, observacao=getattr(it, 'observacao', None)))
        sub += sub_item; iva_tot += iva_v; tot += tot_item
        if venda_status == VendaStatus.CONCLUIDA and getattr(prod, 'controlar_stock', False):
            prod.stock_atual -= Decimal(it.quantidade)
            produtos_afectados.append({"id": str(prod.id), "stock_atual": str(prod.stock_atual), "nome": prod.nome})
        db.query(ReservaCarrinho).filter(ReservaCarrinho.empresa_id==empresa_id, ReservaCarrinho.produto_id==prod.id, ReservaCarrinho.user_id==created_by).delete()

    venda.subtotal = sub; venda.total_iva = iva_tot; venda.total = tot
    venda.troco = data.dinheiro_recebido - tot if data.dinheiro_recebido >= tot else Decimal("0")
    db.add(venda); db.flush()

    if mesa:
        mesa.status = MesaStatus.OCUPADA
        mesa.venda_atual_id = venda.id
        mesa.garcom_id = garcom_id
        mesa.aberta_em = mesa.aberta_em or datetime.utcnow()
        mesa.pessoas_atual = pessoas

    mov = None
    if venda_status == VendaStatus.CONCLUIDA:
        mov = CaixaMovimento(empresa_id=empresa_id, caixa_id=caixa.id, tipo=TipoMovimento.VENDA, origem=OrigemMovimento.VENDA, valor=venda.total, descricao=f"Venda #{venda.numero} - {venda.forma_pagamento}", venda_id=venda.id, forma_pagamento=venda.forma_pagamento, criado_por=created_by, criado_por_nome=criado_por_nome)
        db.add(mov); db.flush()

    registrar_atividade(db, empresa_id=empresa_id, modulo="VENDA", acao="CRIAR", descricao=f"Venda #{venda.numero}", entidade="Venda", entidade_id=venda.id, entidade_nome=f"Venda #{venda.numero}", user_id=created_by, user_nome=criado_por_nome, detalhes={"total": str(venda.total)}, ip=ip, commit=False)
    db.commit(); db.refresh(venda)

    for p in produtos_afectados: emit(str(empresa_id), "produto:update", data=p)
    emit(str(empresa_id), "venda:nova", data={"id": str(venda.id), "numero": venda.numero, "total": str(venda.total), "mesa_id": str(venda.mesa_id) if venda.mesa_id else None})
    if mesa: emit(str(empresa_id), "mesa:update", data={"id": str(mesa.id), "numero": mesa.numero, "status": "OCUPADA", "venda_atual_id": str(venda.id)})
    return venda, produtos_afectados


def add_item_comanda(db: Session, venda_id: uuid.UUID, data, empresa_id: uuid.UUID, user_id: uuid.UUID, user_nome: str, ip: str | None = None):
    venda = db.query(Venda).filter(Venda.id == venda_id, Venda.empresa_id == empresa_id).with_for_update().first()
    if not venda or venda.status!= VendaStatus.ABERTA:
        raise HTTPException(400, "Comanda não está aberta")

    prod = db.query(Product).filter(Product.id == data.produto_id, Product.empresa_id == empresa_id).first()
    if not prod:
        raise HTTPException(404, "Produto não encontrado")

    # SE JÁ EXISTE MESMO PRODUTO COM MESMA OBSERVAÇÃO, SOMA QUANTIDADE
    for existente in venda.itens:
        if existente.status == VendaItemStatus.CANCELADO:
            continue
        if str(existente.produto_id) == str(data.produto_id) and (existente.observacao or "") == (getattr(data, 'observacao', None) or ""):
            # SOMA QUANTIDADE
            nova_qtd = Decimal(existente.quantidade) + Decimal(data.quantidade)
            sub_item_novo = prod.preco_venda * nova_qtd
            iva_v_novo = sub_item_novo * (prod.iva / Decimal("100")) if getattr(prod, 'tem_iva', False) and prod.iva > 0 else Decimal("0")
            tot_item_novo = sub_item_novo + iva_v_novo

            # diferença para somar no total da venda
            diff_sub = sub_item_novo - existente.subtotal
            diff_iva = iva_v_novo - existente.iva_valor
            diff_tot = tot_item_novo - existente.total

            existente.quantidade = nova_qtd
            existente.subtotal = sub_item_novo
            existente.iva_valor = iva_v_novo
            existente.total = tot_item_novo

            venda.subtotal += diff_sub
            venda.total_iva += diff_iva
            venda.total += diff_tot

            db.flush()
            db.commit()
            db.refresh(venda)
            emit(str(empresa_id), "venda:update", data={"id": str(venda.id), "total": str(venda.total)})
            return venda

    # SE NÃO EXISTE, CRIA NOVO
    sub_item = prod.preco_venda * data.quantidade
    iva_v = sub_item * (prod.iva / Decimal("100")) if getattr(prod, 'tem_iva', False) and prod.iva > 0 else Decimal("0")
    tot_item = sub_item + iva_v

    item = VendaItem(
        empresa_id=empresa_id,
        venda_id=venda.id,
        produto_id=prod.id,
        nome_produto=prod.nome,
        quantidade=data.quantidade,
        preco_unit=prod.preco_venda,
        tem_iva=getattr(prod, 'tem_iva', False),
        iva_percent=prod.iva if getattr(prod, 'tem_iva', False) else Decimal("0"),
        subtotal=sub_item,
        iva_valor=iva_v,
        total=tot_item,
        status=VendaItemStatus.PENDENTE,
        observacao=getattr(data, 'observacao', None)
    )
    venda.itens.append(item)
    venda.subtotal += sub_item
    venda.total_iva += iva_v
    venda.total += tot_item
    db.flush()
    db.commit()
    db.refresh(venda)
    emit(str(empresa_id), "venda:update", data={"id": str(venda.id), "total": str(venda.total)})
    return venda

def fechar_comanda(db: Session, venda_id: uuid.UUID, empresa_id: uuid.UUID, dinheiro_recebido: Decimal, user_id: uuid.UUID, user_nome: str, ip: str | None = None):
    venda = db.query(Venda).filter(Venda.id == venda_id, Venda.empresa_id == empresa_id).with_for_update().first()
    if not venda or venda.status!= VendaStatus.ABERTA: raise HTTPException(400, "Comanda não está aberta")
    caixa = db.query(Caixa).filter(Caixa.id == venda.caixa_id).first()
    if not caixa: raise HTTPException(400, "Caixa não encontrado")
    produtos_afectados = []
    for item in venda.itens:
        if item.status == VendaItemStatus.CANCELADO: continue
        prod = db.query(Product).filter(Product.id == item.produto_id).with_for_update().first()
        if prod and getattr(prod, 'controlar_stock', False):
            prod.stock_atual -= item.quantidade
            produtos_afectados.append({"id": str(prod.id), "stock_atual": str(prod.stock_atual)})
    venda.dinheiro_recebido = dinheiro_recebido
    venda.troco = dinheiro_recebido - venda.total if dinheiro_recebido >= venda.total else Decimal("0")
    venda.status = VendaStatus.CONCLUIDA
    mov = CaixaMovimento(empresa_id=empresa_id, caixa_id=caixa.id, tipo=TipoMovimento.VENDA, origem=OrigemMovimento.VENDA, valor=venda.total, descricao=f"Fechamento #{venda.numero}", venda_id=venda.id, forma_pagamento=venda.forma_pagamento, criado_por=user_id, criado_por_nome=user_nome)
    db.add(mov)
    if venda.mesa_id:
        mesa = db.query(Mesa).filter(Mesa.id == venda.mesa_id).first()
        if mesa:
            mesa.status = MesaStatus.LIVRE
            mesa.venda_atual_id = None
            mesa.garcom_id = None
            mesa.aberta_em = None
            mesa.pessoas_atual = 0
            mesa.qr_token = None
            mesa.qr_token_criado_em = None

    db.commit(); db.refresh(venda)
    for p in produtos_afectados: emit(str(empresa_id), "produto:update", data=p)
    emit(str(empresa_id), "venda:fechada", data={"id": str(venda.id)})
    if venda.mesa_id: emit(str(empresa_id), "mesa:update", data={"id": str(venda.mesa_id), "status": "LIVRE"})
    return venda, produtos_afectados

def cancelar_venda(db: Session, venda_id: uuid.UUID, empresa_id: uuid.UUID, user_id: uuid.UUID, user_nome: str, ip: str | None = None):
    venda = db.query(Venda).filter(Venda.id == venda_id, Venda.empresa_id == empresa_id).first()
    if not venda: raise HTTPException(404, "Venda não encontrada")
    venda.status = VendaStatus.CANCELADA
    if venda.mesa_id:
        mesa = db.query(Mesa).filter(Mesa.id == venda.mesa_id).first()
        if mesa: mesa.status = MesaStatus.LIVRE; mesa.venda_atual_id = None
    db.commit()
    return venda

def transferir_mesa(db: Session, venda_id: uuid.UUID, nova_mesa_id: uuid.UUID, empresa_id: uuid.UUID, user_id: uuid.UUID, user_nome: str, ip: str | None = None):
    venda = db.query(Venda).filter(Venda.id == venda_id, Venda.empresa_id == empresa_id).with_for_update().first()
    if not venda or venda.status!= VendaStatus.ABERTA: raise HTTPException(400, "Comanda não está aberta")
    mesa_antiga = db.query(Mesa).filter(Mesa.id == venda.mesa_id, Mesa.empresa_id == empresa_id).with_for_update().first() if venda.mesa_id else None
    mesa_nova = db.query(Mesa).filter(Mesa.id == nova_mesa_id, Mesa.empresa_id == empresa_id).with_for_update().first()
    if not mesa_nova: raise HTTPException(404, "Nova mesa não encontrada")
    if mesa_nova.status!= MesaStatus.LIVRE: raise HTTPException(400, f"Mesa {mesa_nova.numero} ocupada")
    if mesa_antiga: mesa_antiga.status = MesaStatus.LIVRE; mesa_antiga.venda_atual_id = None
    mesa_nova.status = MesaStatus.OCUPADA; mesa_nova.venda_atual_id = venda.id
    venda.mesa_id = nova_mesa_id
    db.commit()
    return venda

def update_item_status(db: Session, venda_id: uuid.UUID, item_id: uuid.UUID, novo_status: VendaItemStatus, empresa_id: uuid.UUID, user_id: uuid.UUID, user_nome: str, ip: str | None = None):
    item = db.query(VendaItem).filter(VendaItem.id == item_id, VendaItem.venda_id == venda_id, VendaItem.empresa_id == empresa_id).first()
    if not item: raise HTTPException(404, "Item não encontrado")
    item.status = novo_status
    db.commit()
    return item
