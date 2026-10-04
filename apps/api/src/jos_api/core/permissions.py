from fastapi import HTTPException
from typing import Optional

PERMISSIONS = {
    "dono": ["*"],
    "gerente_restaurante": ["restaurante:*", "financeiro:*", "rh:*", "seguranca:*"],
    "operador_caixa": [
        "restaurante:caixa:abrir", "restaurante:caixa:fechar",
        "restaurante:caixa:read", "restaurante:caixa:read_own",
        "restaurante:caixa:movimento:create", "restaurante:caixa:movimento:read",
        "restaurante:venda:create", "restaurante:venda:read",
        "restaurante:venda:read_own", "restaurante:venda:update_own",
        "restaurante:pedido:read", "restaurante:pedido:create",
        "restaurante:cliente:read", "restaurante:cliente:create",
        "restaurante:produto:read",
        "restaurante:produto:create", # permite operador criar produto rápido no caixa
        "restaurante:entidade:read",
        "financeiro:read_own",
    ],
    "caixa": [
        "restaurante:caixa:abrir", "restaurante:caixa:fechar",
        "restaurante:caixa:read", "restaurante:caixa:read_own",
        "restaurante:caixa:movimento:create", "restaurante:caixa:movimento:read",
        "restaurante:venda:create", "restaurante:venda:read",
        "restaurante:pedido:read",
        "restaurante:cliente:read", "restaurante:cliente:create",
        "restaurante:produto:read",
        "restaurante:entidade:read",
        "financeiro:read_own",
    ],
    "garcom": [
        "restaurante:pedido:create", "restaurante:pedido:read",
        "restaurante:produto:read", "restaurante:mesa:read",
        "restaurante:cliente:read", "restaurante:entidade:read"
    ],
    "vigilante": ["seguranca:ronda:create", "seguranca:ocorrencia:create"],
    "rh": ["rh:*", "restaurante:entidade:*", "financeiro:read"],
    "funcionario": ["restaurante:pedido:read", "restaurante:produto:read", "restaurante:entidade:read"],
}

NO_DELETE_ROLES = {"operador_caixa", "caixa", "garcom", "vigilante", "funcionario", "rh"}

def check_permission(user_role: str, required: str, owner_id: Optional[str] = None, current_user_id: Optional[str] = None, resource_status: Optional[str] = None):
    role = (user_role or "funcionario").lower()
    perms = PERMISSIONS.get(role, PERMISSIONS["funcionario"])

    if "*" in perms:
        return True

    if role in NO_DELETE_ROLES and ":delete" in required:
        raise HTTPException(status_code=403, detail=f"{role} não pode apagar registros")

    if required in perms:
        return True

    # wildcard restaurante:*
    module = required.split(":")[0] if ":" in required else required
    if f"{module}:*" in perms:
        return True

    parts = required.split(":")
    if len(parts) >= 2 and f"{parts[0]}:{parts[1]}:*" in perms:
        return True

    raise HTTPException(status_code=403, detail=f"Sem permissão: {required} para {role}")
