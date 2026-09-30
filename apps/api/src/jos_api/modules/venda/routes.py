from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
from decimal import Decimal
from jos_api.db.session import get_db
from jos_api.modules.venda import schemas, service
from jos_api.core.deps import get_current_user, precisa_modulo, precisa_caixa_aberto
from jos_api.modules.auth.models import User
from jos_api.modules.caixa.models import Caixa

router = APIRouter(prefix="/vendas", tags=["Vendas"])
mesa_router = APIRouter(prefix="/mesas", tags=["Mesas"])

def _get_empresa_id_from_perfil(perfil_data) -> uuid.UUID:
    eid = perfil_data.get("empresa_id")
    if not eid:
        raise HTTPException(403, "Usuário sem empresa vinculada")
    return eid

def _get_nome(user: User, perfil_data) -> str:
    return getattr(user, 'nome', None) or getattr(user, 'full_name', None) or getattr(user, 'email', None) or perfil_data.get("perfil_nome", "Usuário")

@mesa_router.get("/", response_model=list[schemas.MesaResponse])
def listar_mesas(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("mesas"))):
    return service.get_mesas(db, _get_empresa_id_from_perfil(perfil_data))

@mesa_router.post("/", response_model=schemas.MesaResponse, status_code=201)
def criar_mesa(dados: schemas.MesaCreateRequest, db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("mesas"))):
    return service.criar_mesa(db, _get_empresa_id_from_perfil(perfil_data), dados.numero, dados.capacidade)

@router.post("/", response_model=schemas.VendaResponse, status_code=201)
def criar_venda(
    dados: schemas.VendaCreateRequest,
    db: Session = Depends(get_db),
    perfil_data = Depends(precisa_modulo("caixa")),
    caixa_aberto: Caixa = Depends(precisa_caixa_aberto),
    current_user: User = Depends(get_current_user)
):
    empresa_id = _get_empresa_id_from_perfil(perfil_data)
    nome = _get_nome(current_user, perfil_data)
    # AGORA PASSA O OBJETO CAIXA INTEIRO, NÃO SÓ O ID
    return service.create_venda(db, dados, empresa_id, current_user.id, caixa_aberto, nome)

@router.post("/{venda_id}/fechar", response_model=schemas.VendaResponse)
def fechar(
    venda_id: uuid.UUID,
    dinheiro_recebido: Decimal,
    db: Session = Depends(get_db),
    perfil_data = Depends(precisa_modulo("caixa")),
    caixa_aberto: Caixa = Depends(precisa_caixa_aberto),
    current_user: User = Depends(get_current_user)
):
    empresa_id = _get_empresa_id_from_perfil(perfil_data)
    nome = _get_nome(current_user, perfil_data)
    return service.fechar_comanda(db, venda_id, empresa_id, dinheiro_recebido, current_user.id, nome)

@router.get("/", response_model=list[schemas.VendaResponse])
def listar_vendas(db: Session = Depends(get_db), perfil_data = Depends(precisa_modulo("caixa"))):
    from jos_api.modules.venda.models import Venda
    eid = _get_empresa_id_from_perfil(perfil_data)
    return db.query(Venda).filter(Venda.empresa_id == eid).order_by(Venda.created_at.desc()).limit(100).all()
