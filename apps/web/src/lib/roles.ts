// src/lib/roles.ts
export const ROLE_LABEL: Record<string, string> = {
    dono: "Dono",
    gerente_restaurante: "Gerente",
    operador_caixa: "Operador de Caixa",
    caixa: "Caixa",
    garcom: "Garçom",
    vigilante: "Vigilante",
    rh: "RH",
    funcionario: "Funcionário"
};

// Quem pode ver o que - Sincronizado com backend permissions.py
export const ROLE_PERMISSIONS: Record<string, string[]> = {
    dono: ["*"],
    gerente_restaurante: ["entidade:read", "entidade:create", "produto:*", "venda:*", "caixa:*"],
    operador_caixa: ["entidade:read", "produto:read", "produto:create", "venda:create", "venda:read", "caixa:read", "caixa:manage"],
    caixa: ["venda:create", "caixa:read"],
    garcom: ["venda:create", "produto:read"],
    funcionario: ["produto:read", "venda:create"]
};

export function can(role: string, permission: string): boolean {
    const r = (role || "").toLowerCase();
    const perms = ROLE_PERMISSIONS[r] || [];
    if (perms.includes("*")) return true;
    if (perms.includes(permission)) return true;
    // wildcard check ex: produto:*
    const [mod] = permission.split(":");
    return perms.some(p => p === `${mod}:*` || p.startsWith(`${mod}:`));
}

export function normalizeRole(role: string): string {
    return (role || "funcionario").toLowerCase();
}
