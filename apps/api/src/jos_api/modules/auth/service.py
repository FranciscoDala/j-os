from sqlalchemy.orm import Session
from. import models, schemas
from.models import RoleEnum
from jos_api.core.security import verify_password, hash_password, create_access_token, create_temp_token
from fastapi import HTTPException
from jose import jwt
from jos_api.core.config import settings
import uuid
from jos_api.modules.atividade.service import registrar_atividade

def _try_broadcast(empresa_id, payload):
    try:
        from jos_api.core.realtime import manager
        import asyncio
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.broadcast(str(empresa_id), payload))
    except:
        pass

def to_role_enum(role) -> RoleEnum:
    if isinstance(role, RoleEnum): return role
    try: return RoleEnum(str(role).upper())
    except: return RoleEnum.FUNCIONARIO

def criar_usuario(db: Session, dados: schemas.UserCreate, criado_por_id: uuid.UUID | None = None, criado_por_nome: str = "Sistema", ip: str | None = None):
    if db.query(models.User).filter(models.User.email == dados.email).first():
        raise HTTPException(400, "Email já cadastrado")
    user = models.User(nome=dados.nome, email=dados.email, senha_hash=hash_password(dados.senha), role=to_role_enum(dados.role), empresa_id=dados.empresa_id)
    db.add(user); db.flush()
    if not db.query(models.UserEmpresa).filter_by(user_id=user.id, empresa_id=dados.empresa_id).first():
        db.add(models.UserEmpresa(user_id=user.id, empresa_id=dados.empresa_id, role=to_role_enum(dados.role)))
    db.flush()
    registrar_atividade(db, empresa_id=dados.empresa_id, modulo="USUARIO", acao="CRIAR", descricao=f"Criou usuário '{user.nome}' ({user.email}) - {user.role.value}", entidade="User", entidade_id=user.id, entidade_nome=user.nome, user_id=criado_por_id, user_nome=criado_por_nome, detalhes={"email": user.email, "role": user.role.value}, ip=ip, commit=False)
    db.commit(); db.refresh(user)
    _try_broadcast(dados.empresa_id, {"type": "USUARIO_CRIADO", "user": {"id": str(user.id), "nome": user.nome, "email": user.email, "role": str(user.role.value)}})
    return user

def _get_empresas_do_user(db: Session, user: models.User):
    vinculos = db.query(models.UserEmpresa).filter(models.UserEmpresa.user_id == user.id).all()
    if not vinculos and getattr(user, 'empresa_id', None):
        novo = models.UserEmpresa(user_id=user.id, empresa_id=user.empresa_id, role=to_role_enum(user.role))
        db.add(novo); db.commit(); vinculos=[novo]
    empresas_resumo = []
    for v in vinculos:
        empresas_resumo.append(schemas.EmpresaResumo(id=v.empresa_id, nome=f"Loja {str(v.empresa_id)[:8]}", role=to_role_enum(v.role)))
    return empresas_resumo, vinculos

def autenticar(db: Session, dados: schemas.UserLogin, ip: str | None = None):
    user = db.query(models.User).filter(models.User.email==dados.email).first()
    if not user or not verify_password(dados.senha, user.senha_hash):
        raise HTTPException(401, "Email ou senha inválidos")
    if not user.ativo: raise HTTPException(403, "Usuário desativado")
    empresas_resumo, vinculos = _get_empresas_do_user(db, user)
    if not vinculos: raise HTTPException(403, "Usuário sem empresa")
    if len(vinculos)==1:
        v=vinculos[0]
        token=create_access_token({"sub": str(user.id), "empresa_id": str(v.empresa_id), "role": to_role_enum(v.role).value})
        registrar_atividade(db, empresa_id=v.empresa_id, modulo="AUTH", acao="LOGIN", descricao=f"Login - {user.nome} ({user.email})", entidade="User", entidade_id=user.id, entidade_nome=user.nome, user_id=user.id, user_nome=user.nome, ip=ip, commit=True)
        return {"access_token": token, "user": user, "empresas": empresas_resumo, "temp_token": None}
    temp=create_temp_token(str(user.id))
    return {"access_token": None, "temp_token": temp, "user": user, "empresas": empresas_resumo}

def selecionar_empresa(db: Session, dados: schemas.SelectEmpresaRequest, ip: str | None = None):
    try:
        payload=jwt.decode(dados.temp_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type")!="temp_select": raise HTTPException(401, "Token inválido")
        user_id=uuid.UUID(payload.get("sub"))
    except: raise HTTPException(401, "Token expirado")
    vinculo=db.query(models.UserEmpresa).filter(models.UserEmpresa.user_id==user_id, models.UserEmpresa.empresa_id==dados.empresa_id).first()
    if not vinculo: raise HTTPException(403, "Sem acesso a essa loja")
    user=db.query(models.User).filter(models.User.id==user_id).first()
    if not user: raise HTTPException(404, "Usuário não encontrado")
    token=create_access_token({"sub": str(user.id), "empresa_id": str(vinculo.empresa_id), "role": to_role_enum(vinculo.role).value})
    registrar_atividade(db, empresa_id=vinculo.empresa_id, modulo="AUTH", acao="SELECIONAR_EMPRESA", descricao=f"Selecionou empresa {vinculo.empresa_id} - {user.nome}", entidade="User", entidade_id=user.id, entidade_nome=user.nome, user_id=user.id, user_nome=user.nome, ip=ip, commit=True)
    return {"access_token": token, "user": user, "empresas": None, "temp_token": None}
