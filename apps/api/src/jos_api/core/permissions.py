from fastapi import HTTPException

# Permissões explícitas, não é is_admin
PERMISSIONS = {
    "dono": ["*"], # Dono da Jenath pode tudo
    "gerente_restaurante": ["restaurante:*", "financeiro:read_own"],
    "garcom": ["restaurante:pedido:create", "restaurante:pedido:read"],
    "vigilante": ["seguranca:ronda:create", "seguranca:ocorrencia:create"],
    "rh": ["rh:*", "financeiro:read_own"],
}

def check_permission(user_role: str, required: str):
    perms = PERMISSIONS.get(user_role, [])
    if "*" in perms: return True
    if required in perms or f"{required.split(':')[0]}:*" in perms:
        return True
    raise HTTPException(status_code=403, detail=f"Sem permissão: {required}")
