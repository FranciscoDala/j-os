export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function loginApi(email: string, senha: string) {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.detail || "Login invalido");
    }

    return data as {
        access_token: string | null;
        temp_token: string | null;
        token_type: string;
        empresas: { id: string; nome: string; role: string }[] | null;
        user: any;
    };
}

export async function selectEmpresaApi(temp_token: string, empresa_id: string) {
    const res = await fetch(`${API_URL}/api/v1/auth/select-empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_token, empresa_id }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.detail || "Erro ao selecionar empresa");
    }

    return data as {
        access_token: string;
        token_type: string;
        user: any;
    };
}
