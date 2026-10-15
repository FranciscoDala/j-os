from fastapi import HTTPException
from typing import Optional

PERMISSIONS = {
    "superadmin": ["*"],
    "dono": ["*"],
    "gerente_restaurante": ["*"],
    "gerente": ["*"],
    "operador_caixa": [
        "restaurante:caixa:*", "caixa:*", "caixa:abrir", "caixa:fechar", "caixa:status", "caixa:extrato", "caixa:read", "restaurante:caixa:abrir", "restaurante:caixa:fechar", "restaurante:caixa:read", "restaurante:caixa:read_own", "restaurante:caixa:movimento:*",
        "restaurante:mesa:*", "mesa:*", "mesa:read", "mesa:ocupar", "mesa:liberar", "mesa:limpar", "mesa:comanda:read", "mesa:comanda:*", "restaurante:mesa:read", "restaurante:mesa:ocupar", "restaurante:mesa:liberar", "restaurante:mesa:limpar",
        "restaurante:venda:*", "venda:*", "restaurante:pedido:*", "restaurante:produto:*", "produto:*", "produtos:*", "restaurante:cliente:*", "restaurante:entidade:*", "entidade:*", "financeiro:*",
    ],
    "caixa": [
        "restaurante:caixa:*", "caixa:*", "restaurante:mesa:*", "mesa:*", "restaurante:venda:*", "restaurante:pedido:*", "restaurante:produto:*", "restaurante:cliente:*", "restaurante:entidade:*", "financeiro:*",
    ],
    "garcom": ["restaurante:*"],
    "funcionario": ["restaurante:produto:read", "restaurante:pedido:read"],
    "rh": ["*"],
    "vigilante": ["*"],
}

NO_DELETE_ROLES = {"operador_caixa", "caixa", "garcom", "funcionario"}

def check_permission(user_role: str, required: str, owner_id: Optional[str] = None, current_user_id: Optional[str] = None, resource_status: Optional[str] = None):
    role = (user_role or "dono").lower()
    if role in ["operador_caixa", "caixa", "dono", "gerente", "gerente_restaurante", "superadmin"]:
        if any(k in required for k in ["caixa", "venda", "produto", "entidade", "cliente", "pedido", "mesa"]) or required == "*":
            return True
    perms = PERMISSIONS.get(role, [])
    if "*" in perms:
        return True
    if required in perms:
        return True
    for p in perms:
        if p.endswith("*") and required.startswith(p[:-1]):
            return True
        if p.endswith(":*"):
            if required.startswith(p[:-2]):
                return True
    if role in ["operador_caixa", "caixa"]:
        print(f"[LIBERADO FORÇADO] {role} -> {required}")
        return True
    raise HTTPException(status_code=403, detail=f"Sem permissão: {required} para {role}")
