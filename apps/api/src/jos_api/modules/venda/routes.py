from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from decimal import Decimal
from jos_api.db.session import get_db
from jos_api.modules.venda import schemas, service
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User

router = APIRouter(prefix="/vendas", tags=["Vendas"])
mesa_router = APIRouter(prefix="/mesas", tags=["Mesas"])

def get_empresa_id(current_user: User) -> uuid.UUID:
    eid = getattr(current_user, 'empresa_id', None) or getattr(current_user, 'current_empresa_id', None)
    if not eid:
        raise HTTPException(403, "Usuário sem empresa vinculada")
    return eid

@mesa_router.get("/", response_model=list[schemas.MesaResponse])
def listar_mesas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.get_mesas(db, get_empresa_id(current_user))

@mesa_router.post("/", response_model=schemas.MesaResponse, status_code=201)
def criar_mesa(dados: schemas.MesaCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.criar_mesa(db, get_empresa_id(current_user), dados.numero, dados.capacidade)

@router.post("/", response_model=schemas.VendaResponse, status_code=201)
def criar_venda(dados: schemas.VendaCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.create_venda(db, dados, get_empresa_id(current_user), current_user.id)

@router.post("/{venda_id}/fechar", response_model=schemas.VendaResponse)
def fechar(venda_id: uuid.UUID, dinheiro_recebido: Decimal, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return service.fechar_comanda(db, venda_id, get_empresa_id(current_user), dinheiro_recebido)

@router.get("/", response_model=list[schemas.VendaResponse])
def listar_vendas(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from jos_api.modules.venda.models import Venda
    eid = get_empresa_id(current_user)
    return db.query(Venda).filter(Venda.empresa_id == eid).order_by(Venda.created_at.desc()).limit(100).all()
