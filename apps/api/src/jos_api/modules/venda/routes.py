from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect, Query, Header, Body
from sqlalchemy.orm import Session
import uuid
from decimal import Decimal
from jos_api.db.session import get_db
from jos_api.modules.venda import schemas, service
from jos_api.modules.venda.models import Venda, VendaItemStatus, VendaStatus
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User
from jos_api.modules.caixa.models import Caixa
from jos_api.modules.caixa import service as caixa_service
from jos_api.core.realtime import manager
from jos_api.core.config import settings
from jose import jwt
import json

router = APIRouter(prefix="/vendas", tags=["Vendas"])

def _get_empresa_id_from_user(current_user: User, x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    eid = x_empresa_id or getattr(current_user, 'empresa_id', None) or current_user.__dict__.get("empresa_id")
    if not eid: raise HTTPException(403, "Sem X-Empresa-ID")
    return uuid.UUID(str(eid))

def _get_nome(user: User): return getattr(user, 'nome', None) or getattr(user, 'full_name', None) or getattr(user, 'email', None) or "Caixa"
def _get_ip(req: Request): return req.client.host if req.client else None

def _get_caixa_aberto_dep(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    caixa = caixa_service.get_caixa_aberto(db, empresa_id)
    if not caixa: raise HTTPException(400, "Nenhum caixa aberto")
    return caixa

#... seu código igual, só troca o ws_vendas por esse:
@router.websocket("/ws")
async def ws_vendas(ws: WebSocket, token: str = Query(...), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        empresa_id = payload.get("empresa_id")
        if not empresa_id:
            await ws.close(code=1008)
            return
    except Exception as e:
        print(f"[WS] token invalido: {e}")
        await ws.close(code=1008)
        return
    await manager.connect(str(empresa_id), ws)
    try:
        reservas = service.get_reservas_ativas(db, uuid.UUID(empresa_id))
        await ws.send_text(json.dumps({"type": "reserva:init", "data": [{"produto_id": str(r.produto_id), "user_id": str(r.user_id), "quantidade": str(r.quantidade)} for r in reservas]}, default=str))
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(str(empresa_id), ws)
    except Exception as e:
        print(f"[WS] erro: {e}")
        manager.disconnect(str(empresa_id), ws)

        
@router.post("/reservas")
def reservar(dados: schemas.ReservaRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    return service.reservar_produto(db, empresa_id, dados.produto_id, current_user.id, dados.quantidade)

@router.delete("/reservas/{produto_id}")
def liberar(produto_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    service.liberar_reserva(db, empresa_id, produto_id, current_user.id)
    return {"ok": True}

@router.delete("/reservas")
def liberar_todas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    service.liberar_todas_reservas_user(db, empresa_id, current_user.id)
    return {"ok": True}

@router.post("/", response_model=schemas.VendaResponse, status_code=201)
def criar_venda(dados: schemas.VendaCreateRequest, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID"), caixa_aberto: Caixa = Depends(_get_caixa_aberto_dep)):
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    venda, _ = service.create_venda(db, dados, empresa_id, current_user.id, caixa_aberto, _get_nome(current_user), ip=_get_ip(request))
    return venda

@router.get("/cozinha/pendentes", response_model=list[schemas.VendaResponse])
def cozinha_pendentes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    return db.query(Venda).filter(Venda.empresa_id == empresa_id, Venda.status == VendaStatus.ABERTA).order_by(Venda.created_at.asc()).all()

@router.get("/", response_model=list[schemas.VendaResponse])
def listar_vendas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    eid = _get_empresa_id_from_user(current_user, x_empresa_id)
    return db.query(Venda).filter(Venda.empresa_id == eid).order_by(Venda.created_at.desc()).limit(100).all()

@router.get("/{venda_id}", response_model=schemas.VendaResponse)
def get_venda(venda_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    venda = db.query(Venda).filter(Venda.id == venda_id, Venda.empresa_id == empresa_id).first()
    if not venda: raise HTTPException(404, "Venda não encontrada")
    return venda

@router.post("/{venda_id}/itens", response_model=schemas.VendaResponse)
def add_item(venda_id: uuid.UUID, request: Request, payload: dict = Body(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    itens = payload.get("itens", []) if isinstance(payload, dict) else []
    if not itens:
        itens = [payload] if isinstance(payload, dict) else []
    venda = None
    for it in itens:
        if not isinstance(it, dict): continue
        if "qtd" in it: it["quantidade"] = it.pop("qtd")
        req = schemas.AddItemRequest(**it)
        venda = service.add_item_comanda(db, venda_id, req, empresa_id, current_user.id, _get_nome(current_user), ip=_get_ip(request))
    if venda is None:
        venda = db.query(Venda).filter(Venda.id == venda_id, Venda.empresa_id == empresa_id).first()
    return venda

@router.post("/{venda_id}/fechar", response_model=schemas.VendaResponse)
def fechar(venda_id: uuid.UUID, request: Request, body: schemas.FecharMesaRequest = Body(default=None), dinheiro_recebido: Decimal | None = Query(default=None), forma_pagamento: str | None = Query(default=None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    valor = dinheiro_recebido
    if valor is None and body is not None and body.dinheiro_recebido is not None:
        valor = body.dinheiro_recebido
    if valor is None:
        valor = Decimal("0")
    venda, _ = service.fechar_comanda(db, venda_id, empresa_id, valor, current_user.id, _get_nome(current_user), ip=_get_ip(request))
    return venda

@router.post("/{venda_id}/cancelar", response_model=schemas.VendaResponse)
def cancelar(venda_id: uuid.UUID, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    return service.cancelar_venda(db, venda_id, empresa_id, current_user.id, _get_nome(current_user), ip=_get_ip(request))

@router.post("/{venda_id}/transferir", response_model=schemas.VendaResponse)
def transferir(venda_id: uuid.UUID, dados: schemas.TransferirMesaRequest, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    return service.transferir_mesa(db, venda_id, dados.nova_mesa_id, empresa_id, current_user.id, _get_nome(current_user), ip=_get_ip(request))

@router.put("/{venda_id}/itens/{item_id}/status")
def update_status_item(venda_id: uuid.UUID, item_id: uuid.UUID, dados: schemas.UpdateItemStatusRequest, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    try: novo = VendaItemStatus(dados.status.upper())
    except: raise HTTPException(400, "Status inválido")
    empresa_id = _get_empresa_id_from_user(current_user, x_empresa_id)
    return service.update_item_status(db, venda_id, item_id, novo, empresa_id, current_user.id, _get_nome(current_user), ip=_get_ip(request))
