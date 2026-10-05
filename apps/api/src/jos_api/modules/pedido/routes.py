from fastapi import APIRouter, Depends, Request, Header, HTTPException
from sqlalchemy.orm import Session
import uuid
from jos_api.db.session import get_db
from jos_api.modules.pedido import schemas, service
from jos_api.modules.auth.models import User
from jos_api.core.deps import get_current_user
from jos_api.modules.caixa.models import Caixa
from jos_api.modules.caixa import service as caixa_service

# ROTA PÚBLICA - SEM TOKEN
public_router = APIRouter(prefix="/public", tags=["Publico QR"])

@public_router.get("/{empresa_id}/cardapio", response_model=schemas.CardapioPublicResponse)
def cardapio_publico(empresa_id: uuid.UUID, db: Session = Depends(get_db)):
    return service.get_cardapio_publico(db, empresa_id)

@public_router.post("/{empresa_id}/pedido", response_model=schemas.PedidoQrResponse, status_code=201)
def criar_pedido_publico(empresa_id: uuid.UUID, dados: schemas.PedidoQrPublicCreate, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    return service.criar_pedido_qr(db, empresa_id, dados, ip)

# ROTA PRIVADA - COM TOKEN (seu painel)
private_router = APIRouter(prefix="/pedidos-qr", tags=["Pedidos QR"])

def _get_empresa_id(current_user: User, x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    eid = x_empresa_id or getattr(current_user, 'empresa_id', None) or current_user.__dict__.get("empresa_id")
    if not eid: raise HTTPException(403, "Sem X-Empresa-ID")
    return uuid.UUID(str(eid))

def _get_caixa(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    empresa_id = _get_empresa_id(current_user, x_empresa_id)
    caixa = caixa_service.get_caixa_aberto(db, empresa_id)
    if not caixa: raise HTTPException(400, "Abra o caixa primeiro")
    return caixa

@private_router.get("/pendentes", response_model=list[schemas.PedidoQrResponse])
def pendentes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    eid = _get_empresa_id(current_user, x_empresa_id)
    return service.listar_pendentes(db, eid)

@private_router.post("/{pedido_id}/aprovar", response_model=schemas.PedidoQrResponse)
def aprovar(pedido_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID"), caixa: Caixa = Depends(_get_caixa)):
    eid = _get_empresa_id(current_user, x_empresa_id)
    return service.aprovar_pedido(db, pedido_id, eid, current_user.id, caixa)

@private_router.post("/{pedido_id}/recusar", response_model=schemas.PedidoQrResponse)
def recusar(pedido_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user), x_empresa_id: str = Header(None, alias="X-Empresa-ID")):
    eid = _get_empresa_id(current_user, x_empresa_id)
    return service.recusar_pedido(db, pedido_id, eid)
