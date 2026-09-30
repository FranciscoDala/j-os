from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import uuid
from decimal import Decimal
from jos_api.db.session import get_db
from jos_api.modules.venda import schemas, service
from jos_api.modules.venda.models import Venda, VendaItemStatus, VendaStatus
from jos_api.core.deps import get_current_user, precisa_modulo, precisa_caixa_aberto
from jos_api.modules.auth.models import User
from jos_api.modules.caixa.models import Caixa

router = APIRouter(prefix="/vendas", tags=["Vendas"])
mesa_router = APIRouter(prefix="/mesas", tags=["Mesas"])

def _get_empresa_id(perfil_data) -> uuid.UUID:
    eid = perfil_data.get("empresa_id")
    if not eid: raise HTTPException(403, "Usuário sem empresa vinculada")
    return uuid.UUID(eid) if isinstance(eid, str) else eid

def _get_nome(user: User, perfil_data) -> str:
    return getattr(user, 'nome', None) or getattr(user, 'full_name', None) or getattr(user, 'email', None) or perfil_data.get("perfil_nome", "Usuário")

def _get_ip(req: Request): return req.client.host if req.client else None

@mesa_router.get("/", response_model=list[schemas.MesaResponse])
def listar_mesas(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    return service.get_mesas(db, _get_empresa_id(perfil_data))

@mesa_router.post("/", response_model=schemas.MesaResponse, status_code=201)
def criar_mesa(dados: schemas.MesaCreateRequest, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    return service.criar_mesa(db, _get_empresa_id(perfil_data), dados.numero, dados.capacidade)

@mesa_router.get("/{mesa_id}/comanda", response_model=schemas.VendaResponse | None)
def get_comanda_mesa(mesa_id: uuid.UUID, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id(perfil_data)
    return db.query(Venda).filter(Venda.mesa_id == mesa_id, Venda.empresa_id == empresa_id, Venda.status == VendaStatus.ABERTA).first()

@router.post("/", response_model=schemas.VendaResponse, status_code=201)
def criar_venda(dados: schemas.VendaCreateRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), caixa_aberto: Caixa = Depends(precisa_caixa_aberto), current_user: User = Depends(get_current_user)):
    empresa_id = _get_empresa_id(perfil_data)
    nome = _get_nome(current_user, perfil_data)
    return service.create_venda(db, dados, empresa_id, current_user.id, caixa_aberto, nome, ip=_get_ip(request))

@router.post("/{venda_id}/itens", response_model=schemas.VendaResponse)
def add_item(venda_id: uuid.UUID, dados: schemas.AddItemRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    return service.add_item_comanda(db, venda_id, dados, _get_empresa_id(perfil_data), current_user.id, _get_nome(current_user, perfil_data), ip=_get_ip(request))

@router.put("/{venda_id}/itens/{item_id}/status")
def update_status_item(venda_id: uuid.UUID, item_id: uuid.UUID, dados: schemas.UpdateItemStatusRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    try:
        novo = VendaItemStatus(dados.status.upper())
    except: raise HTTPException(400, f"Status inválido: {dados.status}. Use PENDENTE, EM_PREPARO, PRONTO, ENTREGUE, CANCELADO")
    return service.update_item_status(db, venda_id, item_id, novo, _get_empresa_id(perfil_data), current_user.id, _get_nome(current_user, perfil_data), ip=_get_ip(request))

@router.post("/{venda_id}/transferir", response_model=schemas.VendaResponse)
def transferir(venda_id: uuid.UUID, dados: schemas.TransferirMesaRequest, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    return service.transferir_mesa(db, venda_id, dados.nova_mesa_id, _get_empresa_id(perfil_data), current_user.id, _get_nome(current_user, perfil_data), ip=_get_ip(request))

@router.post("/{venda_id}/fechar", response_model=schemas.VendaResponse)
def fechar(venda_id: uuid.UUID, dinheiro_recebido: Decimal, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    return service.fechar_comanda(db, venda_id, _get_empresa_id(perfil_data), dinheiro_recebido, current_user.id, _get_nome(current_user, perfil_data), ip=_get_ip(request))

@router.post("/{venda_id}/cancelar", response_model=schemas.VendaResponse)
def cancelar(venda_id: uuid.UUID, request: Request, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa")), current_user: User = Depends(get_current_user)):
    return service.cancelar_venda(db, venda_id, _get_empresa_id(perfil_data), current_user.id, _get_nome(current_user, perfil_data), ip=_get_ip(request))

@router.get("/cozinha/pendentes", response_model=list[schemas.VendaResponse])
def cozinha_pendentes(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    empresa_id = _get_empresa_id(perfil_data)
    return db.query(Venda).filter(Venda.empresa_id == empresa_id, Venda.status == VendaStatus.ABERTA).order_by(Venda.created_at.asc()).all()

@router.get("/", response_model=list[schemas.VendaResponse])
def listar_vendas(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    eid = _get_empresa_id(perfil_data)
    return db.query(Venda).filter(Venda.empresa_id == eid).order_by(Venda.created_at.desc()).limit(100).all()
