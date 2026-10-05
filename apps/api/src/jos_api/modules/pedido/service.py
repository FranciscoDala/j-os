from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
import uuid
from datetime import datetime
from jos_api.modules.pedido.models import PedidoQr, PedidoQrStatus
from jos_api.modules.mesa.models import Mesa, MesaStatus
from jos_api.modules.produto.models import Product
from jos_api.modules.venda import service as venda_service
from jos_api.modules.venda.schemas import VendaCreateRequest, VendaItemCreate, AddItemRequest
from jos_api.core.events import emit

def get_cardapio_publico(db: Session, empresa_id: uuid.UUID):
    produtos = db.query(Product).filter(Product.empresa_id == empresa_id, Product.ativo == True).all()
    cats = list(set([p.categoria for p in produtos if p.categoria]))
    return {
        "empresa_nome": "Restaurante",
        "produtos": [{"id": str(p.id), "nome": p.nome, "preco": str(p.preco_venda), "categoria": p.categoria, "imagem": p.imagem_url, "disponivel": (p.stock_atual > 0 if p.stock_atual is not None else True) if p.controlar_stock else True} for p in produtos],
        "categorias": cats
    }

def criar_pedido_qr(db: Session, empresa_id: uuid.UUID, dados, ip: str | None):
    mesa_num_norm = dados.mesa_numero.strip().upper() # FIX

    # Anti-spam 20s por IP na MESMA mesa (antes bloqueava mesas diferentes)
    ultimo = db.query(PedidoQr).filter(PedidoQr.empresa_id == empresa_id, PedidoQr.ip_cliente == ip, PedidoQr.mesa_numero == mesa_num_norm).order_by(PedidoQr.created_at.desc()).first()
    if ultimo and (datetime.utcnow() - ultimo.created_at).total_seconds() < 20:
        raise HTTPException(429, "Aguarde 20s para enviar outro pedido")

    mesa = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.numero == mesa_num_norm).first()
    if not mesa:
        raise HTTPException(404, f"Mesa {mesa_num_norm} não existe")
    if mesa.status!= MesaStatus.OCUPADA:
        raise HTTPException(400, f"Mesa {mesa_num_norm} não está aberta. Chame o garçom.")

    total = Decimal("0")
    itens_norm = []
    for it in dados.itens:
        prod = db.query(Product).filter(Product.id == it.produto_id, Product.empresa_id == empresa_id).first()
        if not prod: raise HTTPException(404, f"Produto não encontrado")
        total += prod.preco_venda * it.quantidade
        itens_norm.append({"produto_id": str(it.produto_id), "nome": prod.nome, "quantidade": str(it.quantidade), "preco": str(prod.preco_venda), "observacao": it.observacao})

    pedido = PedidoQr(
        empresa_id=empresa_id,
        mesa_id=mesa.id,
        mesa_numero=mesa.numero, # salva como está no banco: M01
        cliente_nome=dados.cliente_nome[:100],
        cliente_telefone=dados.cliente_telefone,
        itens=itens_norm,
        total_estimado=total,
        status=PedidoQrStatus.AGUARDANDO_APROVACAO,
        ip_cliente=ip
    )
    db.add(pedido); db.commit(); db.refresh(pedido)
    emit(str(empresa_id), "pedido_qr:novo", data={"id": str(pedido.id), "mesa": pedido.mesa_numero, "cliente": pedido.cliente_nome, "total": str(total)})
    return pedido

def listar_pendentes(db: Session, empresa_id: uuid.UUID):
    return db.query(PedidoQr).filter(PedidoQr.empresa_id == empresa_id, PedidoQr.status == PedidoQrStatus.AGUARDANDO_APROVACAO).order_by(PedidoQr.created_at.asc()).all()

def aprovar_pedido(db: Session, pedido_id: uuid.UUID, empresa_id: uuid.UUID, user_id: uuid.UUID, caixa):
    pedido = db.query(PedidoQr).filter(PedidoQr.id == pedido_id, PedidoQr.empresa_id == empresa_id).with_for_update().first()
    if not pedido: raise HTTPException(404, "Pedido QR não encontrado")
    if pedido.status!= PedidoQrStatus.AGUARDANDO_APROVACAO:
        raise HTTPException(400, "Pedido já processado")

    mesa = db.query(Mesa).filter(Mesa.id == pedido.mesa_id).first()
    if not mesa or mesa.status!= MesaStatus.OCUPADA:
        raise HTTPException(400, "Mesa não está mais ocupada")

    itens_venda = []
    for it in pedido.itens:
        itens_venda.append(VendaItemCreate(produto_id=uuid.UUID(it["produto_id"]), quantidade=Decimal(it["quantidade"]), observacao=it.get("observacao")))

    if mesa.venda_atual_id:
        for it in itens_venda:
            venda_service.add_item_comanda(db, mesa.venda_atual_id, AddItemRequest(produto_id=it.produto_id, quantidade=it.quantidade, observacao=it.observacao), empresa_id, user_id, "QR", ip=None)
        venda_id = mesa.venda_atual_id
    else:
        venda_req = VendaCreateRequest(itens=itens_venda, mesa_id=mesa.id, dinheiro_recebido=Decimal("0"), forma_pagamento="DINHEIRO", observacao=f"QR - Cliente: {pedido.cliente_nome}", modo="mesa")
        venda, _ = venda_service.create_venda(db, venda_req, empresa_id, user_id, caixa, "QR")
        venda_id = venda.id

    pedido.status = PedidoQrStatus.ACEITO
    pedido.venda_id = venda_id
    pedido.aprovado_em = datetime.utcnow()
    db.commit()
    emit(str(empresa_id), "pedido_qr:aceito", data={"id": str(pedido.id)})
    return pedido

def recusar_pedido(db: Session, pedido_id: uuid.UUID, empresa_id: uuid.UUID):
    pedido = db.query(PedidoQr).filter(PedidoQr.id == pedido_id, PedidoQr.empresa_id == empresa_id).first()
    if not pedido: raise HTTPException(404, "Não encontrado")
    pedido.status = PedidoQrStatus.RECUSADO
    db.commit()
    return pedido
