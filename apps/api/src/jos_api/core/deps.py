from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, Dict, Any
from jos_api.db.session import get_db
from jos_api.modules.auth.models import User, UserEmpresa, RoleEnum
from jos_api.core.config import settings

security = HTTPBearer()

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
    x_empresa_id: Optional[str] = Header(default=None, alias="X-Empresa-ID")
) -> User:
    token = creds.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(status_code=401, detail="Token inválido")
        user_id = UUID(sub)
        empresa_id_str = payload.get("empresa_id")
        # Frontend pode forçar empresa via header
        if x_empresa_id and x_empresa_id.strip():
            empresa_id_str = x_empresa_id.strip()
        empresa_id = UUID(empresa_id_str) if empresa_id_str else None
        role_token = payload.get("role")
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    if not user.ativo:
        raise HTTPException(status_code=403, detail="Usuário desativado")

    if empresa_id:
        vinc = db.query(UserEmpresa).filter(
            UserEmpresa.user_id == user.id,
            UserEmpresa.empresa_id == empresa_id
        ).first()
        if not vinc and str(user.empresa_id)!= str(empresa_id):
            # Dono pode não ter vínculo N:N ainda
            if user.role!= RoleEnum.DONO and getattr(user, 'role_slug', 'funcionario')!= 'dono':
                raise HTTPException(status_code=403, detail="Sem acesso a essa empresa")

    setattr(user, "empresa_id_token", empresa_id)
    setattr(user, "role_token", role_token)
    setattr(user, "token_payload", payload)
    return user

def get_perfil_atual(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Dict[str, Any]:
    from jos_api.modules.entidades.models import Entidade
    from jos_api.modules.empresa.perfis_models import Perfil

    empresa_id = getattr(current_user, 'empresa_id_token', None)

    # Dono absoluto sempre passa
    if current_user.role == RoleEnum.DONO:
        return {"perfil": None, "permissoes": {"all": True, "modulos": ["*"], "acoes": ["*"]}, "empresa_id": empresa_id or current_user.empresa_id, "entidade": None, "role": "dono"}

    if not empresa_id:
        raise HTTPException(status_code=400, detail="Token sem empresa - faça login novamente")

    # Verifica se tem vínculo de DONO nessa empresa específica
    vinc_dono = db.query(UserEmpresa).filter_by(user_id=current_user.id, empresa_id=empresa_id, role=RoleEnum.DONO).first()
    if vinc_dono:
        return {"perfil": None, "permissoes": {"all": True, "modulos": ["*"], "acoes": ["*"]}, "empresa_id": empresa_id, "entidade": None, "role": "dono"}

    entidade = db.query(Entidade).filter(
        Entidade.user_id == current_user.id,
        Entidade.empresa_id == empresa_id,
        Entidade.tipo == "FUNCIONARIO"
    ).first()

    if not entidade or not entidade.perfil_id:
        role_token = getattr(current_user, 'role_token', None)
        if role_token == 'dono':
            return {"perfil": None, "permissoes": {"all": True, "modulos": ["*"], "acoes": ["*"]}, "empresa_id": empresa_id, "entidade": None, "role": "dono"}
        raise HTTPException(status_code=403, detail="Sem perfil definido - contate o RH")

    perfil = db.query(Perfil).filter(Perfil.id == entidade.perfil_id).first()
    if not perfil:
        raise HTTPException(status_code=403, detail="Perfil não encontrado")

    return {"perfil": perfil, "permissoes": perfil.permissoes or {}, "empresa_id": empresa_id, "entidade": entidade, "role": getattr(perfil, 'role_equivalente', 'funcionario')}

def precisa_modulo(modulo: str):
    def guard(perfil_data=Depends(get_perfil_atual)):
        perms = perfil_data["permissoes"]
        if perms.get("all"):
            return perfil_data
        modulos = perms.get("modulos", [])
        if "*" in modulos or modulo in modulos or "all" in modulos:
            return perfil_data
        raise HTTPException(status_code=403, detail=f"Acesso negado: seu perfil não tem acesso ao módulo {modulo}")
    return guard

def precisa_permissao(acao: str):
    """NOVO PADRÃO CORRETO - usa acao do tipo restaurante:entidade:read"""
    def guard(perfil_data=Depends(get_perfil_atual)):
        perms = perfil_data["permissoes"]
        if perms.get("all"):
            return perfil_data

        acoes = perms.get("acoes", [])
        # Se o perfil tem * ou restaurante:* ou restaurante:entidade:*
        if "*" in acoes or acao in acoes:
            return perfil_data

        # check por wildcard de módulo: restaurante:*
        partes = acao.split(":")
        if len(partes) >= 2:
            if f"{partes[0]}:*" in acoes or f"{partes[0]}:{partes[1]}:*" in acoes:
                return perfil_data

        # Fallback para PERMISSIONS antigo baseado no role_equivalente
        from jos_api.core.permissions import check_permission
        role = perfil_data.get("role", "funcionario")
        check_permission(role, acao) # lança 403 se não tiver
        return perfil_data
    return guard

def precisa_caixa_aberto(db: Session = Depends(get_db), perfil_data=Depends(get_perfil_atual)):
    from jos_api.modules.caixa.models import Caixa, CaixaStatus
    empresa_id = perfil_data.get("empresa_id")
    if not empresa_id:
        raise HTTPException(status_code=400, detail="Sem empresa vinculada")
    caixa = db.query(Caixa).filter(Caixa.empresa_id == empresa_id, Caixa.status == CaixaStatus.ABERTO).order_by(Caixa.aberto_em.desc()).first()
    if not caixa:
        raise HTTPException(status_code=400, detail="Caixa fechado. Abra o caixa para vender.")
    return caixa
