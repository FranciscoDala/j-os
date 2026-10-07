from sqlalchemy.orm import Session
from. import models, schemas
from jos_api.modules.empresa.models import Empresa
from.models import RoleEnum
from jos_api.core.security import verify_password, hash_password, create_access_token, create_temp_token
from fastapi import HTTPException
from jose import jwt
from jos_api.core.config import settings
import uuid
from jos_api.modules.atividade.service import registrar_atividade
from jos_api.core.events import emit

def to_role_enum(role) -> RoleEnum:
    if isinstance(role, RoleEnum):
        return role
    if not role:
        return RoleEnum.FUNCIONARIO
    s = str(role).lower().strip()
    for m in RoleEnum:
        if m.value == s or m.name.lower() == s:
            return m
    return RoleEnum.FUNCIONARIO

def get_empresa_completa(db: Session, empresa_id: uuid.UUID):
    return db.query(Empresa).filter(Empresa.id == empresa_id).first()

def criar_usuario(db: Session, dados: schemas.UserCreate, criado_por_id: uuid.UUID | None = None, criado_por_nome: str = "Sistema", ip: str | None = None):
    existing = db.query(models.User).filter(models.User.email.ilike(dados.email)).first()
    if existing:
        raise HTTPException(400, "Email já cadastrado")
    role_enum = to_role_enum(dados.role)
    user = models.User(
        nome=dados.nome.strip(),
        email=dados.email.lower().strip(),
        senha_hash=hash_password(dados.senha),
        role=role_enum,
        empresa_id=dados.empresa_id
    )
    db.add(user)
    db.flush()
    if not db.query(models.UserEmpresa).filter_by(user_id=user.id, empresa_id=dados.empresa_id).first():
        db.add(models.UserEmpresa(user_id=user.id, empresa_id=dados.empresa_id, role=role_enum))
    db.flush()
    registrar_atividade(db, empresa_id=dados.empresa_id, modulo="USUARIO", acao="CRIAR", descricao=f"Criou usuário '{user.nome}' ({user.email}) - {user.role.value}", entidade="User", entidade_id=user.id, entidade_nome=user.nome, user_id=criado_por_id, user_nome=criado_por_nome, detalhes={"email": user.email, "role": user.role.value}, ip=ip, commit=False)
    db.commit()
    db.refresh(user)
    emit(str(dados.empresa_id), "usuario:created", data={"id": str(user.id), "nome": user.nome, "email": user.email, "role": str(user.role.value)})
    return user

def _get_empresas_do_user(db: Session, user: models.User):
    vinculos = db.query(models.UserEmpresa).filter(models.UserEmpresa.user_id == user.id).all()
    if not vinculos and getattr(user, 'empresa_id', None):
        novo = models.UserEmpresa(user_id=user.id, empresa_id=user.empresa_id, role=to_role_enum(user.role))
        db.add(novo)
        db.commit()
        vinculos=[novo]

    empresas_resumo = []
    for v in vinculos:
        emp = get_empresa_completa(db, v.empresa_id)
        empresas_resumo.append(schemas.EmpresaResumo(
            id=v.empresa_id,
            nome=emp.nome_fantasia if emp else f"Loja {str(v.empresa_id)[:8]}",
            nome_fantasia=emp.nome_fantasia if emp else None,
            nif=emp.nif if emp else None,
            logo_url=emp.logo_url if emp else None,
            role=to_role_enum(v.role)
        ))
    return empresas_resumo, vinculos

def autenticar(db: Session, dados: schemas.UserLogin, ip: str | None = None):
    email_clean = dados.email.lower().strip()
    user = db.query(models.User).filter(models.User.email.ilike(email_clean)).first()
    if not user:
        raise HTTPException(401, "Email ou senha inválidos")
    if not verify_password(dados.senha, user.senha_hash):
        raise HTTPException(401, "Email ou senha inválidos")
    if not user.ativo:
        raise HTTPException(403, "Usuário desativado")

    empresas_resumo, vinculos = _get_empresas_do_user(db, user)
    if not vinculos:
        raise HTTPException(403, "Usuário sem empresa vinculada")

    if len(vinculos)==1:
        v=vinculos[0]
        token=create_access_token({"sub": str(user.id), "empresa_id": str(v.empresa_id), "role": to_role_enum(v.role).value})
        empresa_completa = get_empresa_completa(db, v.empresa_id)
        registrar_atividade(db, empresa_id=v.empresa_id, modulo="AUTH", acao="LOGIN", descricao=f"Login - {user.nome} ({user.email})", entidade="User", entidade_id=user.id, entidade_nome=user.nome, user_id=user.id, user_nome=user.nome, ip=ip, commit=True)
        return {
            "access_token": token,
            "user": user,
            "empresas": empresas_resumo,
            "empresa": empresa_completa,
            "temp_token": None,
            "empresa_id": str(v.empresa_id)
        }

    temp=create_temp_token(str(user.id))
    return {"access_token": None, "temp_token": temp, "user": user, "empresas": empresas_resumo, "empresa": None}

def selecionar_empresa(db: Session, dados: schemas.SelectEmpresaRequest, ip: str | None = None):
    if not dados.temp_token:
        raise HTTPException(401, "Sessão expirada, faça login novamente")
    try:
        payload=jwt.decode(dados.temp_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type")!="temp_select":
            raise HTTPException(401, "Token inválido")
        user_id=uuid.UUID(payload.get("sub"))
    except Exception:
        raise HTTPException(401, "Token expirado, faça login novamente")

    vinculo=db.query(models.UserEmpresa).filter(models.UserEmpresa.user_id==user_id, models.UserEmpresa.empresa_id==dados.empresa_id).first()
    if not vinculo:
        raise HTTPException(403, "Sem acesso a essa loja")
    user=db.query(models.User).filter(models.User.id==user_id).first()
    if not user:
        raise HTTPException(404, "Usuário não encontrado")

    token=create_access_token({"sub": str(user.id), "empresa_id": str(vinculo.empresa_id), "role": to_role_enum(vinculo.role).value})
    empresa_completa = get_empresa_completa(db, vinculo.empresa_id)
    registrar_atividade(db, empresa_id=vinculo.empresa_id, modulo="AUTH", acao="SELECIONAR_EMPRESA", descricao=f"Selecionou empresa {vinculo.empresa_id} - {user.nome}", entidade="User", entidade_id=user.id, entidade_nome=user.nome, user_id=user.id, user_nome=user.nome, ip=ip, commit=True)
    return {"access_token": token, "user": user, "empresas": None, "empresa": empresa_completa, "temp_token": None, "empresa_id": str(vinculo.empresa_id)}
