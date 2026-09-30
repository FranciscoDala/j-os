from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User, UserEmpresa, RoleEnum
from . import models, schemas
from .seed import seed_perfis_por_tipo

router = APIRouter(prefix="/empresas", tags=["empresas"])

@router.post("", response_model=schemas.EmpresaOut)
def criar_empresa(
    dados: schemas.EmpresaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    emp = models.Empresa(
        nome_fantasia=dados.nome_fantasia,
        cnpj=dados.cnpj,
        tipo=dados.tipo
    )
    db.add(emp)
    db.flush()

    # 1. Vincula dono
    vinc = UserEmpresa(user_id=current_user.id, empresa_id=emp.id, role=RoleEnum.DONO)
    db.add(vinc)
    db.flush()

    # 2. Cria os perfis baseados no tipo da empresa
    seed_perfis_por_tipo(db, emp.id, emp.tipo)

    db.commit()
    db.refresh(emp)
    return emp

@router.get("", response_model=list[schemas.EmpresaOut])
def listar_minhas_empresas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vinc = db.query(UserEmpresa).filter(UserEmpresa.user_id == current_user.id).all()
    ids = [v.empresa_id for v in vinc]
    return db.query(models.Empresa).filter(models.Empresa.id.in_(ids)).all() if ids else []

@router.post("/{empresa_id}/vincular-usuario")
def vincular_usuario(
    empresa_id: UUID,
    dados: schemas.VincularUsuarioSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dono = db.query(UserEmpresa).filter(
        UserEmpresa.user_id == current_user.id,
        UserEmpresa.empresa_id == empresa_id,
        UserEmpresa.role == RoleEnum.DONO
    ).first()
    if not dono:
        raise HTTPException(403, "Só DONO pode vincular")

    user_alvo = db.query(User).filter(User.email == dados.email).first()
    if not user_alvo:
        raise HTTPException(404, "Usuário não existe, cadastre primeiro")

    if db.query(UserEmpresa).filter_by(user_id=user_alvo.id, empresa_id=empresa_id).first():
        raise HTTPException(400, "Já vinculado")

    try:
        role_enum = RoleEnum[dados.role.upper()]
    except:
        role_enum = RoleEnum.FUNCIONARIO

    db.add(UserEmpresa(user_id=user_alvo.id, empresa_id=empresa_id, role=role_enum))
    db.commit()
    return {"ok": True}
