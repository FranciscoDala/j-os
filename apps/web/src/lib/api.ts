export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const BASE = `${API_URL}/api/v1`;

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
        throw data; // joga o objeto inteiro pra pegar code
    }
    return data;
}

// CAIXA - CORRIGIDO (singular /caixa)
export const getCaixaStatus = () => apiFetch("/caixa/status");
export const getCaixaAberto = () => apiFetch("/caixa/status"); // teu /aberto não existe, usa status
export const abrirCaixa = (payload: { saldo_inicial: number }) => apiFetch("/caixa/abrir", { method: "POST", body: JSON.stringify(payload) });
export const forcarAberturaCaixa = (payload: { saldo_inicial: number, motivo: string }) => apiFetch("/caixa/forcar-abertura", { method: "POST", body: JSON.stringify(payload) });
export const fecharCaixaApi = (saldo_informado: number) => apiFetch("/caixa/fechar", { method: "POST", body: JSON.stringify({ saldo_informado }) });
export const getCaixaExtrato = () => apiFetch("/caixa/extrato"); // sem id, pega do aberto
export const criarSangria = (payload: { valor: number; motivo: string }) => apiFetch("/caixa/sangria", { method: "POST", body: JSON.stringify(payload) });
export const criarSuprimento = (payload: { valor: number; motivo: string }) => apiFetch("/caixa/suprimento", { method: "POST", body: JSON.stringify(payload) });
