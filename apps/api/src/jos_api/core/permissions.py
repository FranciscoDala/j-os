from fastapi import HTTPException, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional
import uuid

# ajusta esses 2 imports conforme seu projeto
from jos_api.db.session import get_db
from jos_api.core.deps import get_current_user
from jos_api.modules.auth.models import User, UserEmpresa

PERMISSIONS = {
    "dono": ["*"],
    "gerente_restaurante": ["restaurante:*", "financeiro:*", "rh:read", "seguranca:read"],
    "operador_caixa": [
        "restaurante:caixa:abrir", "restaurante:caixa:fechar", "restaurante:caixa:read", "restaurante:caixa:read_own",
        "restaurante:caixa:movimento:create", "restaurante:caixa:movimento:read",
        "restaurante:venda:create", "restaurante:venda:read", "restaurante:venda:read_own", "restaurante:venda:update_own",
        "restaurante:pedido:read", "restaurante:cliente:read", "restaurante:cliente:create",
        "restaurante:produto:read", "restaurante:entidade:read", "financeiro:read_own",
    ],
    "caixa": [
        "restaurante:caixa:abrir", "restaurante:caixa:fechar", "restaurante:caixa:read", "restaurante:caixa:read_own",
        "restaurante:caixa:movimento:create", "restaurante:caixa:movimento:read",
        "restaurante:venda:create", "restaurante:venda:read", "restaurante:venda:read_own", "restaurante:venda:update_own",
        "restaurante:pedido:read", "restaurante:cliente:read", "restaurante:cliente:create",
        "restaurante:produto:read", "restaurante:entidade:read", "financeiro:read_own",
    ],
    "garcom": ["restaurante:pedido:create", "restaurante:pedido:read", "restaurante:pedido:read_own", "restaurante:pedido:update_own", "restaurante:produto:read", "restaurante:mesa:read", "restaurante:cliente:read", "restaurante:entidade:read"],
    "vigilante": ["seguranca:ronda:create", "seguranca:ronda:read_own", "seguranca:ocorrencia:create", "seguranca:ocorrencia:read"],
    "rh": ["rh:*", "financeiro:read_own", "restaurante:entidade:read", "restaurante:entidade:create", "restaurante:entidade:update"],
    "funcionario": ["restaurante:pedido:read", "restaurante:produto:read"],
}

NO_DELETE_ROLES = {"operador_caixa", "caixa", "garcom", "vigilante", "funcionario", "rh"}

# classe simples que o resto do sistema usa como perfil
class PerfilData:
    def __init__(self, empresa_id: uuid.UUID, role: str, user_id: uuid.UUID):
        self.empresa_id = empresa_id
        self.role = role
        self.user_id = user_id

def get_perfil_data(
    db: Session = Depends(get_db),
    user_data: dict = Depends(get_current_user),
    x_empresa_id: Optional[str] = Header(default=None, alias="X-Empresa-ID"),
):
    user_id = user_data.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token sem sub")

    try:
        uid = uuid.UUID(str(user_id))
    except:
        raise HTTPException(status_code=401, detail="ID de usuário inválido")

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # 1. Se frontend mandou X-Empresa-ID, valida
    if x_empresa_id and x_empresa_id.strip():
        try:
            eid = uuid.UUID(x_empresa_id.strip())
        except:
            raise HTTPException(status_code=400, detail="X-Empresa-ID inválido")

        # dono pode ter empresa_id direto no User
        if user.empresa_id == eid:
            return PerfilData(empresa_id=eid, role=user.role_slug, user_id=user.id)

        # verifica vínculo em user_empresas
        vinc = db.query(UserEmpresa).filter(
            UserEmpresa.user_id == user.id,
            UserEmpresa.empresa_id == eid
        ).first()
        if vinc:
            role = vinc.role.value if hasattr(vinc.role, 'value') else str(vinc.role)
            return PerfilData(empresa_id=eid, role=role.lower(), user_id=user.id)

        raise HTTPException(status_code=403, detail=f"Empresa {eid} não pertence ao usuário")

    # 2. Fallback sem header: usa o que tem
    # prioridade: user.empresa_id > primeiro vínculo > erro
    if user.empresa_id:
        return PerfilData(empresa_id=user.empresa_id, role=user.role_slug, user_id=user.id)

    vinc = db.query(UserEmpresa).filter(UserEmpresa.user_id == user.id).order_by(UserEmpresa.created_at.desc()).first()
    if vinc:
        role = vinc.role.value if hasattr(vinc.role, 'value') else str(vinc.role)
        return PerfilData(empresa_id=vinc.empresa_id, role=role.lower(), user_id=user.id)

    raise HTTPException(status_code=403, detail="Usuário sem empresa vinculada")

def precisa_modulo(modulo: str):
    def _check(perfil: PerfilData = Depends(get_perfil_data)):
        if perfil.role and perfil.role.lower() == "dono":
            return perfil
        return perfil
    return _check

def check_permission(user_role: str, required: str, owner_id: Optional[str] = None, current_user_id: Optional[str] = None, resource_status: Optional[str] = None):
    role = (user_role or "funcionario").lower()
    perms = PERMISSIONS.get(role, [])
    if "*" in perms:
        return True
    if role in NO_DELETE_ROLES and ":delete" in required:
        raise HTTPException(status_code=403, detail=f"{role} não pode apagar registros")
    if "_own" in required and owner_id and current_user_id and str(owner_id)!= str(current_user_id):
        raise HTTPException(status_code=403, detail="Só pode editar seus próprios registros")
    if resource_status and resource_status.upper() in ["FECHADA", "FECHADO", "FINALIZADA", "CANCELADA"] and role in {"operador_caixa", "caixa", "garcom"}:
        raise HTTPException(status_code=403, detail=f"Não pode editar com status {resource_status}")
    if required in perms:
        return True
    module = required.split(":")[0] if ":" in required else required
    if f"{module}:*" in perms:
        return True
    parts = required.split(":")
    if len(parts) >= 2 and f"{parts[0]}:{parts[1]}:*" in perms:
        return True
    raise HTTPException(status_code=403, detail=f"Sem permissão: {required} para {role}")
