from sqlalchemy.orm import Session
from. import models, schemas
from.models import RoleEnum
from src.jos_api.core.security import verify_password, hash_password, create_access_token, create_temp_token
from fastapi import HTTPException
from jose import jwt
from src.jos_api.core.config import settings
import uuid

def to_role_enum(role) -> RoleEnum:
    if isinstance(role, RoleEnum):
        return role
    try:
        return RoleEnum(str(role).upper())
    except:
        return RoleEnum.FUNCIONARIO

def criar_usuario(db: Session, dados: schemas.UserCreate):
    if db.query(models.User).filter(models.User.email == dados.email).first():
        raise HTTPException(400, "Email já cadastrado")
    user = models.User(nome=dados.nome, email=dados.email, senha_hash=hash_password(dados.senha), role=to_role_enum(dados.role), empresa_id=dados.empresa_id)
    db.add(user); db.flush()
    if not db.query(models.UserEmpresa).filter_by(user_id=user.id, empresa_id=dados.empresa_id).first():
        db.add(models.UserEmpresa(user_id=user.id, empresa_id=dados.empresa_id, role=to_role_enum(dados.role)))
    db.commit(); db.refresh(user)
    return user

def _get_empresas_do_user(db: Session, user: models.User):
    vinculos = db.query(models.UserEmpresa).filter(models.UserEmpresa.user_id == user.id).all()
    if not vinculos and getattr(user, 'empresa_id', None):
        novo = models.UserEmpresa(user_id=user.id, empresa_id=user.empresa_id, role=to_role_enum(user.role))
        db.add(novo); db.commit(); vinculos=[novo]

    empresas_resumo = []
    for v in vinculos:
        # NUNCA consulta tabela empresas - só usa o ID
        # Quando você criar a tabela empresas depois, descomenta o bloco abaixo
        empresas_resumo.append(
            schemas.EmpresaResumo(
                id=v.empresa_id,
                nome=f"Loja {str(v.empresa_id)[:8]}",
                role=to_role_enum(v.role)
            )
        )
    return empresas_resumo, vinculos

def autenticar(db: Session, dados: schemas.UserLogin):
    user = db.query(models.User).filter(models.User.email==dados.email).first()
    if not user or not verify_password(dados.senha, user.senha_hash):
        raise HTTPException(401, "Email ou senha inválidos")
    if not user.ativo:
        raise HTTPException(403, "Usuário desativado")
    empresas_resumo, vinculos = _get_empresas_do_user(db, user)
    if not vinculos:
        raise HTTPException(403, "Usuário sem empresa")
    if len(vinculos)==1:
        v=vinculos[0]
        token=create_access_token({"sub": str(user.id), "empresa_id": str(v.empresa_id), "role": to_role_enum(v.role).value})
        return {"access_token": token, "user": user, "empresas": empresas_resumo, "temp_token": None}
    temp=create_temp_token(str(user.id))
    return {"access_token": None, "temp_token": temp, "user": user, "empresas": empresas_resumo}

def selecionar_empresa(db: Session, dados: schemas.SelectEmpresaRequest):
    try:
        payload=jwt.decode(dados.temp_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type")!="temp_select": raise HTTPException(401, "Token inválido")
        user_id=uuid.UUID(payload.get("sub"))
    except:
        raise HTTPException(401, "Token expirado")
    vinculo=db.query(models.UserEmpresa).filter(models.UserEmpresa.user_id==user_id, models.UserEmpresa.empresa_id==dados.empresa_id).first()
    if not vinculo: raise HTTPException(403, "Sem acesso a essa loja")
    user=db.query(models.User).filter(models.User.id==user_id).first()
    if not user: raise HTTPException(404, "Usuário não encontrado")
    token=create_access_token({"sub": str(user.id), "empresa_id": str(vinculo.empresa_id), "role": to_role_enum(vinculo.role).value})
    return {"access_token": token, "user": user, "empresas": None, "temp_token": None}
