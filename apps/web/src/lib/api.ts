export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const BASE = `${API_URL}/api/v1`;
export const WS_URL = API_URL.replace(/^http/, "ws") + "/api/v1/realtime/ws";

async function apiFetch(path: string, options: RequestInit = {}) {
    const token = typeof window!== 'undefined'? localStorage.getItem("access_token") : null;
    const headers: any = { "Content-Type": "application/json",...(options.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, {...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (res.status === 401 && typeof window!== 'undefined' &&!window.location.pathname.includes("/login")) {
            // não limpa se for o próprio login falhando
            if (!path.includes("/auth/login")) {
                localStorage.removeItem("access_token");
                window.location.href = "/login";
            }
        }
        // joga erro com message legivel
        throw new Error(data.detail || data.msg || `Erro ${res.status}`);
    }
    return data;
}

// CAIXA, PRODUTOS, etc... mantém os seus
export const getCaixaStatus = () => apiFetch("/caixa/status");
export const getCaixaAberto = () => apiFetch("/caixa/status");
export const abrirCaixa = (payload: { saldo_inicial: number }) => apiFetch("/caixa/abrir", { method: "POST", body: JSON.stringify(payload) });
export const forcarAberturaCaixa = (payload: { saldo_inicial: number, motivo: string }) => apiFetch("/caixa/forcar-abertura", { method: "POST", body: JSON.stringify(payload) });
export const fecharCaixaApi = (saldo_informado: number) => apiFetch("/caixa/fechar", { method: "POST", body: JSON.stringify({ saldo_informado }) });
export const getCaixaExtrato = () => apiFetch("/caixa/extrato");
export const criarSangria = (payload: { valor: number; motivo: string }) => apiFetch("/caixa/sangria", { method: "POST", body: JSON.stringify(payload) });
export const criarSuprimento = (payload: { valor: number; motivo: string }) => apiFetch("/caixa/suprimento", { method: "POST", body: JSON.stringify(payload) });
export const getProdutos = (q?: string) => apiFetch(`/products/${q? `?q=${q}` : ''}`);
export const getProduto = (id: string) => apiFetch(`/products/${id}`);
export const getAtividades = (params?: any) => { const qs = params? `?${new URLSearchParams(params).toString()}` : ''; return apiFetch(`/atividade/${qs}`); };
export const login = (payload: any) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(payload) });
export const selectEmpresa = (payload: any) => apiFetch("/auth/select-empresa", { method: "POST", body: JSON.stringify(payload) });
export const getMe = () => apiFetch("/auth/me");

// FIX PRINCIPAL
export const loginApi = async (email: string, senha: string) => {
  const data = await login({ email: email.toLowerCase().trim(), senha });
  if (typeof window!== 'undefined') {
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("token", data.access_token);
    }
    if (data.temp_token) localStorage.setItem("temp_token", data.temp_token);
    if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
    if (data.empresas) localStorage.setItem("empresas", JSON.stringify(data.empresas));
    const empresaId = data.empresa_id || data.empresas?.[0]?.id || data.user?.empresa_id;
    if (empresaId) localStorage.setItem("empresa_id", String(empresaId));
  }
  return data;
};
