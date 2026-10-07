from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User
from . import schemas, service
from jos_api.core.events import emit

router = APIRouter(prefix="/empresas", tags=["empresas"])

@router.post("", response_model=schemas.EmpresaOut)
def criar_empresa(
    dados: schemas.EmpresaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = service.criar_empresa(db, dados, current_user)
    emit(str(emp.id), "empresa:created", data={"id": str(emp.id), "nome_fantasia": emp.nome_fantasia, "tipo": str(emp.tipo), "nif": emp.nif})
    return emp

@router.get("", response_model=list[schemas.EmpresaOut])
def listar_minhas_empresas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.listar_empresas_user(db, current_user.id)

@router.get("/{empresa_id}", response_model=schemas.EmpresaOut)
def get_empresa(
    empresa_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_empresa(db, empresa_id)

@router.put("/{empresa_id}", response_model=schemas.EmpresaOut)
def atualizar_empresa(
    empresa_id: UUID,
    dados: schemas.UpdateEmpresaRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = service.atualizar_empresa(db, empresa_id, dados)
    emit(str(empresa_id), "empresa:update", data={"id": str(emp.id), "nome_fantasia": emp.nome_fantasia})
    return emp

@router.delete("/{empresa_id}")
def deletar_empresa(
    empresa_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.deletar_empresa(db, empresa_id)

@router.post("/{empresa_id}/vincular-usuario")
def vincular_usuario(
    empresa_id: UUID,
    dados: schemas.VincularUsuarioRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = service.vincular_usuario(db, empresa_id, dados, current_user)
    emit(str(empresa_id), "usuario:vinculado", data=res)
    return res

@router.patch("/{empresa_id}/agt", response_model=schemas.EmpresaOut)
def atualizar_agt(
    empresa_id: UUID,
    dados: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.atualizar_agt_info(db, empresa_id, dados)
