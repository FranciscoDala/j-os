export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const BASE = `${API_URL}/api/v1`;
export const WS_URL = API_URL.replace(/^http/, "ws") + "/api/v1/realtime/ws";

function getAuthHeaders(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    const empresa_id = localStorage.getItem("empresa_id");
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (empresa_id) h["X-Empresa-ID"] = empresa_id;
    return h;
}

async function apiFetch(path: string, options: RequestInit = {}) {
    const headers: any = {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...(options.headers || {})
    };
    // se for FormData, deixa o browser setar Content-Type
    if (options.body instanceof FormData) delete headers["Content-Type"];

    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.includes("/login")) {
            if (!path.includes("/auth/login")) {
                localStorage.removeItem("access_token");
                localStorage.removeItem("token");
                window.location.href = "/login";
            }
        }
        // erro 403 de empresa errada mostra msg clara
        throw new Error(data.detail || data.msg || `Erro ${res.status}`);
    }
    return data;
}

// CAIXA
export const getCaixaStatus = () => apiFetch("/caixa/status");
export const getCaixaAberto = () => apiFetch("/caixa/status");
export const abrirCaixa = (payload: { saldo_inicial: number }) => apiFetch("/caixa/abrir", { method: "POST", body: JSON.stringify(payload) });
export const forcarAberturaCaixa = (payload: { saldo_inicial: number, motivo: string }) => apiFetch("/caixa/forcar-abertura", { method: "POST", body: JSON.stringify(payload) });
export const fecharCaixaApi = (saldo_informado: number) => apiFetch("/caixa/fechar", { method: "POST", body: JSON.stringify({ saldo_informado }) });
export const getCaixaExtrato = () => apiFetch("/caixa/extrato");
export const criarSangria = (payload: { valor: number; motivo: string }) => apiFetch("/caixa/sangria", { method: "POST", body: JSON.stringify(payload) });
export const criarSuprimento = (payload: { valor: number; motivo: string }) => apiFetch("/caixa/suprimento", { method: "POST", body: JSON.stringify(payload) });

// PRODUTOS - usa rota certa /produtos (não /products)
export const getProdutos = (q?: string) => {
    const qs = q ? `?search=${encodeURIComponent(q)}` : '';
    return apiFetch(`/produtos/${qs}`);
}
export const getProduto = (id: string) => apiFetch(`/produtos/${id}`);
export const getProdutosCategorias = () => apiFetch(`/produtos/categorias/lista`);

// OUTROS
export const getAtividades = (params?: any) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch(`/atividade/${qs}`);
};
export const login = (payload: any) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(payload) });
export const selectEmpresa = (payload: any) => apiFetch("/auth/select-empresa", { method: "POST", body: JSON.stringify(payload) });
export const getMe = () => apiFetch("/auth/me");

// FIX PRINCIPAL - nunca grava empresa errada
export const loginApi = async (email: string, senha: string) => {
    const data = await login({ email: email.toLowerCase().trim(), senha });
    if (typeof window !== 'undefined') {
        if (data.access_token) {
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("token", data.access_token);
        }
        if (data.temp_token) localStorage.setItem("temp_token", data.temp_token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        if (data.empresas) localStorage.setItem("empresas", JSON.stringify(data.empresas));

        // só seta empresa_id se vier do backend, não inventa
        const empresaId = data.empresa_id || data.empresas?.[0]?.id || data.user?.empresa_id;
        if (empresaId) {
            localStorage.setItem("empresa_id", String(empresaId));
        }
    }
    return data;
};

export const selectEmpresaApi = async (empresa_id: string) => {
    const data = await selectEmpresa({ empresa_id });
    if (typeof window !== 'undefined' && data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("empresa_id", String(empresa_id));
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    }
    return data;
};
