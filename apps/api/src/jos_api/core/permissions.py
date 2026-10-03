from fastapi import HTTPException
from typing import Optional

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
    "rh": ["rh:*", "financeiro:read_own", "restaurante:entidade:read"],
    "funcionario": ["restaurante:pedido:read", "restaurante:produto:read"],
}

NO_DELETE_ROLES = {"operador_caixa", "caixa", "garcom", "vigilante", "funcionario"}

def check_permission(user_role: str, required: str, owner_id: Optional[str] = None, current_user_id: Optional[str] = None, resource_status: Optional[str] = None):
    perms = PERMISSIONS.get(user_role, [])
    if "*" in perms:
        return True
    if user_role in NO_DELETE_ROLES and ":delete" in required:
        raise HTTPException(status_code=403, detail=f"{user_role} não pode apagar registros")
    if "_own" in required and owner_id and current_user_id and owner_id!= current_user_id:
        raise HTTPException(status_code=403, detail="Só pode editar seus próprios registros")
    if resource_status and resource_status.upper() in ["FECHADA", "FECHADO", "FINALIZADA", "CANCELADA"] and user_role in {"operador_caixa", "caixa", "garcom"}:
        raise HTTPException(status_code=403, detail=f"Não pode editar com status {resource_status}")

    if required in perms:
        return True
    module = required.split(":")[0] if ":" in required else required
    if f"{module}:*" in perms:
        return True
    parts = required.split(":")
    if len(parts) >= 2 and f"{parts[0]}:{parts[1]}:*" in perms:
        return True
    raise HTTPException(status_code=403, detail=f"Sem permissão: {required} para {user_role}")
