from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from uuid import UUID
from jos_api.db.session import get_db
from jos_api.modules.auth.models import User
from jos_api.core.config import settings

security = HTTPBearer()

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = creds.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(401, "Token inválido")
        user_id = UUID(sub)
        empresa_id_str = payload.get("empresa_id")
        empresa_id = UUID(empresa_id_str) if empresa_id_str else None
        role_token = payload.get("role")
    except (JWTError, ValueError, TypeError):
        raise HTTPException(401, "Token inválido ou expirado")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, "Usuário não encontrado")
    if not user.ativo:
        raise HTTPException(403, "Usuário desativado")

    # Injeta dados do token no objeto pra usar nos guards
    setattr(user, "empresa_id_token", empresa_id)
    setattr(user, "role_token", role_token)
    setattr(user, "token_payload", payload)
    return user

def require_role(role: str):
    """Guard antigo - mantém compatibilidade"""
    def checker(current_user: User = Depends(get_current_user)):
        # DONO sempre passa
        if current_user.role.value == "DONO":
            return current_user
        # Checa role do token (que é o role da empresa atual) ou role global
        role_atual = getattr(current_user, "role_token", None) or current_user.role.value
        if role_atual != role:
            raise HTTPException(403, "Sem permissão")
        return current_user
    return checker

# NOVO - GUARD POR PERFIL/MODULO
def get_perfil_atual(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from jos_api.modules.entidades.models import Entidade
    from jos_api.modules.empresa.perfis_models import Perfil
    from jos_api.modules.auth.models import UserEmpresa, RoleEnum

    empresa_id = getattr(current_user, 'empresa_id_token', None)
    if not empresa_id:
        # fallback pra quem ainda tem token antigo sem empresa
        if current_user.role.value == "DONO":
            return {"perfil": None, "permissoes": {"all": True}, "empresa_id": getattr(current_user, 'empresa_id', None), "entidade": None}
        raise HTTPException(400, "Token sem empresa - faça login novamente")

    # Se é DONO em user_empresas, libera tudo
    vinc_dono = db.query(UserEmpresa).filter_by(user_id=current_user.id, empresa_id=empresa_id, role=RoleEnum.DONO).first()
    if vinc_dono:
        return {"perfil": None, "permissoes": {"all": True}, "empresa_id": empresa_id, "entidade": None}

    entidade = db.query(Entidade).filter(
        Entidade.user_id == current_user.id,
        Entidade.empresa_id == empresa_id,
        Entidade.tipo == "FUNCIONARIO"
    ).first()

    if not entidade or not entidade.perfil_id:
        raise HTTPException(403, "Sem perfil definido - contate o RH")

    perfil = db.query(Perfil).filter(Perfil.id == entidade.perfil_id).first()
    if not perfil:
        raise HTTPException(403, "Perfil não encontrado")

    return {"perfil": perfil, "permissoes": perfil.permissoes, "empresa_id": empresa_id, "entidade": entidade}

def precisa_modulo(modulo: str):
    def guard(perfil_data=Depends(get_perfil_atual)):
        perms = perfil_data["permissoes"]
        if perms.get("all"):
            return perfil_data
        if modulo not in perms.get("modulos", []):
            raise HTTPException(403, f"Acesso negado: seu perfil não tem acesso a {modulo}")
        return perfil_data
    return guard
