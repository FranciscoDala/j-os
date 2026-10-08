from sqlalchemy.orm import Session
from fastapi import HTTPException
from decimal import Decimal
import uuid
import asyncio
import logging
from datetime import datetime
from jos_api.modules.pedido.models import PedidoQr, PedidoQrStatus
from jos_api.modules.mesa.models import Mesa, MesaStatus, ReservaStatus, MesaReserva
from jos_api.modules.produto.models import Product
from jos_api.modules.venda import service as venda_service
from jos_api.modules.venda.schemas import VendaCreateRequest, VendaItemCreate, AddItemRequest
from jos_api.core.events import emit
from jos_api.core.realtime import manager
import secrets

logger = logging.getLogger(__name__)

def _gen_token(): return secrets.token_urlsafe(6).upper()[:8]

def _broadcast_safe(empresa_id, payload: dict):
    try:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast(str(empresa_id), payload))
        except RuntimeError:
            asyncio.run(manager.broadcast(str(empresa_id), payload))
    except Exception as e:
        logger.warning(f"[WS] fail {e} type={payload.get('type')}")

def get_cardapio_publico(db: Session, empresa_id: uuid.UUID, mesa_numero: str | None = None, token: str | None = None):
    produtos = db.query(Product).filter(Product.empresa_id == empresa_id, Product.ativo == True).all()
    cats = list(set([p.categoria for p in produtos if p.categoria]))
    mesa_info = None
    if mesa_numero:
        mesa = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.numero == mesa_numero.upper()).with_for_update().first()
        if mesa:
            if mesa.status == MesaStatus.LIVRE and mesa.qr_token is None and token:
                raise HTTPException(status_code=410, detail="Mesa já foi fechada. Faça scan novamente.")
            if mesa.qr_token and token and mesa.qr_token!= token.upper():
                raise HTTPException(status_code=410, detail="Sessão desta mesa expirou. Faça scan novamente do QR da mesa.")
            if mesa.status == MesaStatus.LIVRE and not mesa.qr_token:
                mesa.qr_token = _gen_token()
                mesa.qr_token_criado_em = datetime.utcnow()
                db.commit(); db.refresh(mesa)
            pendentes_q = db.query(PedidoQr).filter(PedidoQr.empresa_id == empresa_id, PedidoQr.mesa_numero == mesa.numero, PedidoQr.status == PedidoQrStatus.AGUARDANDO_APROVACAO)
            pendentes_count = pendentes_q.count()
            primeiro_pendente = pendentes_q.order_by(PedidoQr.created_at.asc()).first()
            if pendentes_count > 0 and not mesa.venda_atual_id:
                token_upper = (token or "").upper().strip()
                if not token_upper or (mesa.qr_token and token_upper!= mesa.qr_token):
                    livres = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.ativa == True, Mesa.status == MesaStatus.LIVRE).order_by(Mesa.numero).limit(6).all()
                    mesa_info = {"numero": mesa.numero, "status": "OCUPADA", "qr_token": mesa.qr_token, "token_valido": False, "bloqueada": True, "ocupada_por_outro": True, "cliente_atual": primeiro_pendente.cliente_nome if primeiro_pendente else "outro cliente", "cliente_bloqueio": primeiro_pendente.cliente_nome if primeiro_pendente else None, "pendentes_count": pendentes_count, "venda_atual_id": None, "mesas_livres": [{"numero": m.numero, "capacidade": m.capacidade} for m in livres]}
                    return {"empresa_nome": "Restaurante", "mesa": mesa_info, "produtos": [], "categorias": []}
            bloqueada = False
            cliente_bloqueio = None
            if pendentes_count > 0 and not mesa.venda_atual_id:
                bloqueada = True
                cliente_bloqueio = primeiro_pendente.cliente_nome if primeiro_pendente else None
            mesa_info = {"numero": mesa.numero, "status": mesa.status, "qr_token": mesa.qr_token, "token_valido": True, "bloqueada": bloqueada, "ocupada_por_outro": False, "pendentes_count": pendentes_count, "cliente_bloqueio": cliente_bloqueio, "venda_atual_id": str(mesa.venda_atual_id) if mesa.venda_atual_id else None, "mesas_livres": []}
    return {"empresa_nome": "Restaurante", "mesa": mesa_info, "produtos": [{"id": str(p.id), "nome": p.nome, "preco": str(p.preco_venda), "preco_venda": str(p.preco_venda), "categoria": p.categoria, "descricao": getattr(p, 'descricao', None), "imagem": p.imagem_url, "imagem_url": p.imagem_url, "stock_atual": float(p.stock_atual) if p.stock_atual is not None else None, "stock_minimo": float(p.stock_minimo) if p.stock_minimo is not None else None, "controlar_stock": getattr(p, 'controlar_stock', True), "ativo": p.ativo, "disponivel": (p.stock_atual > 0 if p.stock_atual is not None else True) if getattr(p, 'controlar_stock', False) else True} for p in produtos], "categorias": cats}

def criar_pedido_qr(db: Session, empresa_id: uuid.UUID, dados, ip: str | None):
    mesa_num_norm = dados.mesa_numero.strip().upper()
    token_cli = (dados.qr_token or "").upper().strip() if getattr(dados, 'qr_token', None) else None
    mesa = db.query(Mesa).filter(Mesa.empresa_id == empresa_id, Mesa.numero == mesa_num_norm).with_for_update().first()
    if not mesa: raise HTTPException(404, f"Mesa {mesa_num_norm} não existe")
    if mesa.status == MesaStatus.BLOQUEADA: raise HTTPException(400, f"Mesa {mesa_num_norm} está bloqueada.")
    if mesa.qr_token:
        if not token_cli or mesa.qr_token!= token_cli:
            raise HTTPException(status_code=410, detail="Link desta mesa expirou. Faça scan novamente do QR na mesa.")
    else:
        if mesa.status == MesaStatus.OCUPADA:
            mesa.qr_token = _gen_token(); mesa.qr_token_criado_em = datetime.utcnow()
    pendentes_mesa = db.query(PedidoQr).filter(PedidoQr.empresa_id == empresa_id, PedidoQr.mesa_numero == mesa_num_norm, PedidoQr.status == PedidoQrStatus.AGUARDANDO_APROVACAO).count()
    if not mesa.venda_atual_id:
        if pendentes_mesa >= 1:
            raise HTTPException(status_code=423, detail="Aguarde o garçom aprovar seu primeiro pedido para fazer outros pedidos.")
    else:
        if pendentes_mesa >= 10:
            raise HTTPException(429, "Mesa com muitos pedidos pendentes. Aguarde o garçom aprovar.")
    if mesa.status!= MesaStatus.OCUPADA:
        if mesa.status == MesaStatus.RESERVADA:
            res = db.query(MesaReserva).filter(MesaReserva.mesa_id == mesa.id, MesaReserva.status == ReservaStatus.PENDENTE).order_by(MesaReserva.data_reserva.desc()).first()
            if res: res.status = ReservaStatus.CHECKIN
        mesa.status = MesaStatus.OCUPADA; mesa.aberta_em = datetime.utcnow(); mesa.pessoas_atual = mesa.capacidade or 2; mesa.garcom_id = None
        if not mesa.qr_token: mesa.qr_token = _gen_token(); mesa.qr_token_criado_em = datetime.utcnow()
        db.flush()
        emit(str(empresa_id), "mesa:update", data={"id": str(mesa.id), "numero": mesa.numero, "status": "OCUPADA", "qr_token": mesa.qr_token})
        _broadcast_safe(empresa_id, {"type": "mesa:update", "data": {"id": str(mesa.id), "numero": mesa.numero, "status": "OCUPADA"}})

    total = Decimal("0"); itens_norm = []
    for it in dados.itens:
        prod = db.query(Product).filter(Product.id == it.produto_id, Product.empresa_id == empresa_id).first()
        if not prod: raise HTTPException(404, "Produto não encontrado")
        if not prod.ativo: raise HTTPException(400, f"{prod.nome} inativo")
        if getattr(prod, 'controlar_stock', False):
            stock = prod.stock_atual or Decimal("0")
            if stock <= 0: raise HTTPException(400, f"{prod.nome} esgotado")
            if stock < it.quantidade: raise HTTPException(400, f"{prod.nome} só tem {stock}")
        total += prod.preco_venda * it.quantidade
        itens_norm.append({
            "produto_id": str(it.produto_id),
            "nome": prod.nome,
            "produto_nome": prod.nome,
            "quantidade": str(it.quantidade),
            "preco": str(prod.preco_venda),
            "imagem_url": prod.imagem_url,
            "imagem": prod.imagem_url,
            "produto_imagem_url": prod.imagem_url,
            "observacao": it.observacao
        })

    pedido = PedidoQr(
        empresa_id=empresa_id,
        mesa_id=mesa.id,
        mesa_numero=mesa.numero,
        cliente_nome=dados.cliente_nome[:100],
        cliente_telefone=dados.cliente_telefone,
        itens=itens_norm,
        total_estimado=total,
        status=PedidoQrStatus.AGUARDANDO_APROVACAO,
        ip_cliente=ip,
        qr_token=mesa.qr_token
    )
    db.add(pedido); db.commit(); db.refresh(pedido)

    # === PEGA IMAGENS PARA NOTIFICAÇÃO ===
    imagens_pedido = [it.get("imagem_url") or it.get("imagem") or it.get("produto_imagem_url") for it in itens_norm if it.get("imagem_url") or it.get("imagem") or it.get("produto_imagem_url")][:3]
    primeira_img = imagens_pedido[0] if imagens_pedido else None
    nomes_itens = ", ".join([f"{it['quantidade']}x {it['nome']}" for it in itens_norm[:2]])
    if len(itens_norm) > 2:
        nomes_itens += f" +{len(itens_norm)-2}"

    # === WS IGUAL STOCKBOT - AGORA COM IMAGEM ===
    emit(str(empresa_id), "pedido_qr:novo", data={
        "id": str(pedido.id),
        "mesa": pedido.mesa_numero,
        "cliente": pedido.cliente_nome,
        "total": str(total),
        "imagem_url": primeira_img,
        "imagens": imagens_pedido
    })
    _broadcast_safe(empresa_id, {
        "type": "pedido_qr:novo",
        "data": {
            "id": str(pedido.id),
            "mesa_numero": pedido.mesa_numero,
            "cliente_nome": pedido.cliente_nome,
            "total_estimado": float(total),
            "created_at": pedido.created_at.isoformat(),
            "itens": itens_norm,
            "imagem_url": primeira_img,
            "imagens": imagens_pedido
        }
    })
    _broadcast_safe(empresa_id, {
        "type": "notificacao:nova",
        "data": {
            "id": f"pedido-{pedido.id}",
            "tipo": "PEDIDO_QR",
            "titulo": f"Novo pedido - Mesa {pedido.mesa_numero}",
            "desc": f"{pedido.cliente_nome} - {nomes_itens} - Kz {total}",
            "time": "agora",
            "mesa_numero": pedido.mesa_numero,
            "pedido_id": str(pedido.id),
            "imagem_url": primeira_img,
            "imagens": imagens_pedido,
            "total": str(total),
            "cliente_nome": pedido.cliente_nome,
            "qtd_itens": len(itens_norm)
        }
    })
    _broadcast_safe(empresa_id, {"type": "stats.updated", "acao": "pedido_qr_novo"})

    return pedido


def listar_pendentes(db: Session, empresa_id: uuid.UUID):
    pedidos = db.query(PedidoQr).filter(PedidoQr.empresa_id == empresa_id, PedidoQr.status == PedidoQrStatus.AGUARDANDO_APROVACAO).order_by(PedidoQr.created_at.asc()).all()
    for ped in pedidos:
        itens_enriquecidos = []
        for it in (ped.itens or []):
            prod_id = it.get("produto_id") if isinstance(it, dict) else getattr(it, 'produto_id', None)
            prod = None
            if prod_id:
                try: prod = db.query(Product).filter(Product.id == uuid.UUID(prod_id)).first()
                except: prod = None
            img = it.get("imagem_url") or it.get("imagem") if isinstance(it, dict) else None
            if not img and prod: img = prod.imagem_url
            if isinstance(it, dict):
                it["imagem_url"] = img; it["imagem"] = img; it["produto_imagem_url"] = img; it["produto_nome"] = it.get("produto_nome") or it.get("nome") or (prod.nome if prod else "Produto")
                itens_enriquecidos.append(it)
            else: itens_enriquecidos.append(it)
        ped.itens = itens_enriquecidos
    return pedidos

def aprovar_pedido(db: Session, pedido_id: uuid.UUID, empresa_id: uuid.UUID, user_id: uuid.UUID, caixa):
    pedido = db.query(PedidoQr).filter(PedidoQr.id == pedido_id, PedidoQr.empresa_id == empresa_id).with_for_update().first()
    if not pedido: raise HTTPException(404, "Pedido QR não encontrado")
    if pedido.status == PedidoQrStatus.ACEITO: return pedido
    if pedido.status!= PedidoQrStatus.AGUARDANDO_APROVACAO: raise HTTPException(400, "Pedido já processado")
    mesa = db.query(Mesa).filter(Mesa.id == pedido.mesa_id).with_for_update().first()
    if not mesa or mesa.status!= MesaStatus.OCUPADA: raise HTTPException(400, "Mesa não está mais ocupada")
    itens_venda = []
    for it in pedido.itens:
        itens_venda.append(VendaItemCreate(produto_id=uuid.UUID(it["produto_id"]), quantidade=Decimal(it["quantidade"]), observacao=it.get("observacao")))
    if mesa.venda_atual_id:
        from jos_api.modules.venda.models import Venda, VendaStatus
        venda_existente = db.query(Venda).filter(Venda.id == mesa.venda_atual_id).first()
        if venda_existente and venda_existente.status == VendaStatus.ABERTA:
            existentes_keys = set()
            for v_item in venda_existente.itens:
                if v_item.status.name!= "CANCELADO": existentes_keys.add((str(v_item.produto_id), str(v_item.quantidade), str(v_item.observacao or "")))
            itens_filtrados = []
            for it in itens_venda:
                key = (str(it.produto_id), str(it.quantidade), str(it.observacao or ""))
                if key not in existentes_keys: itens_filtrados.append(it)
            itens_venda = itens_filtrados
            if len(itens_venda) == 0:
                pedido.status = PedidoQrStatus.ACEITO; pedido.venda_id = mesa.venda_atual_id; pedido.aprovado_em = datetime.utcnow(); db.commit()
                emit(str(empresa_id), "pedido_qr:aceito", data={"id": str(pedido.id)})
                _broadcast_safe(empresa_id, {"type": "pedido_qr:aceito", "data": {"id": str(pedido.id), "mesa_numero": pedido.mesa_numero}})
                return pedido
        for it in itens_venda:
            venda_service.add_item_comanda(db, mesa.venda_atual_id, AddItemRequest(produto_id=it.produto_id, quantidade=it.quantidade, observacao=it.observacao), empresa_id, user_id, "QR", ip=None)
        venda_id = mesa.venda_atual_id
    else:
        venda_req = VendaCreateRequest(itens=itens_venda, mesa_id=mesa.id, dinheiro_recebido=Decimal("0"), forma_pagamento="DINHEIRO", observacao=f"QR - Cliente: {pedido.cliente_nome}", modo="mesa")
        venda, _ = venda_service.create_venda(db, venda_req, empresa_id, user_id, caixa, "QR")
        venda_id = venda.id
    pedido.status = PedidoQrStatus.ACEITO; pedido.venda_id = venda_id; pedido.aprovado_em = datetime.utcnow(); db.commit()
    emit(str(empresa_id), "pedido_qr:aceito", data={"id": str(pedido.id)})
    _broadcast_safe(empresa_id, {"type": "pedido_qr:aceito", "data": {"id": str(pedido.id), "mesa_numero": pedido.mesa_numero, "venda_id": str(venda_id)}})
    _broadcast_safe(empresa_id, {"type": "pedido_qr:remover", "data": {"id": str(pedido.id)}})
    _broadcast_safe(empresa_id, {"type": "venda:update", "data": {"id": str(venda_id), "mesa_numero": pedido.mesa_numero}})
    _broadcast_safe(empresa_id, {"type": "mesa:update", "data": {"id": str(mesa.id), "numero": mesa.numero, "status": "OCUPADA", "venda_atual_id": str(venda_id)}})
    return pedido

def recusar_pedido(db: Session, pedido_id: uuid.UUID, empresa_id: uuid.UUID):
    pedido = db.query(PedidoQr).filter(PedidoQr.id == pedido_id, PedidoQr.empresa_id == empresa_id).first()
    if not pedido: raise HTTPException(404, "Não encontrado")
    pedido.status = PedidoQrStatus.RECUSADO; db.commit()
    emit(str(empresa_id), "pedido_qr:recusado", data={"id": str(pedido.id)})
    _broadcast_safe(empresa_id, {"type": "pedido_qr:recusado", "data": {"id": str(pedido.id)}})
    _broadcast_safe(empresa_id, {"type": "pedido_qr:remover", "data": {"id": str(pedido.id)}})
    return pedido
