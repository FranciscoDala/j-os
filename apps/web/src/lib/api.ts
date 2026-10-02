export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const BASE = `${API_URL}/api/v1`;
export const WS_URL = API_URL.replace("http", "ws") + "/api/v1/realtime/ws";

async function apiFetch(path: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
    const headers: any = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (res.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        }
        throw data;
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

// PRODUTOS
export const getProdutos = (q?: string) => apiFetch(`/products/${q ? `?q=${q}` : ''}`);
export const getProduto = (id: string) => apiFetch(`/products/${id}`);

// ATIVIDADE
export const getAtividades = (params?: any) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiFetch(`/atividade/${qs}`);
}
