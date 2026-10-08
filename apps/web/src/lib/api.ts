export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const BASE = `${API_URL}/api/v1`;

// WSS - corrige http->ws e https->wss
export const WS_URL = API_URL.replace(/^https/, "wss").replace(/^http/, "ws") + "/api/v1/realtime/ws";

import type { Empresa } from "./types";

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
    const headers: any = { "Content-Type": "application/json",...getAuthHeaders(),...(options.headers || {}) };
    if (options.body instanceof FormData) delete headers["Content-Type"];
    const res = await fetch(`${BASE}${path}`, {...options, headers, cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.msg || `Erro ${res.status}`);
    return data;
}

// CAIXA
export const getCaixaStatus = () => apiFetch("/caixa/status");
export const abrirCaixa = (payload: { saldo_inicial: number }) => apiFetch("/caixa/abrir", { method: "POST", body: JSON.stringify(payload) });
export const forcarAberturaCaixa = (payload: { saldo_inicial: number, motivo: string }) => apiFetch("/caixa/forcar-abertura", { method: "POST", body: JSON.stringify(payload) });
export const fecharCaixaApi = (saldo_informado: number) => apiFetch("/caixa/fechar", { method: "POST", body: JSON.stringify({ saldo_informado }) });
export const getCaixaExtrato = () => apiFetch("/caixa/extrato");
export const criarSangria = (payload: { valor: number; motivo: string }) => apiFetch("/caixa/sangria", { method: "POST", body: JSON.stringify(payload) });
export const criarSuprimento = (payload: { valor: number; motivo: string }) => apiFetch("/caixa/suprimento", { method: "POST", body: JSON.stringify(payload) });

// PRODUTOS
export const getProdutos = (q?: string) => apiFetch(`/produtos/${q? `?search=${encodeURIComponent(q)}` : ''}`);
export const getProduto = (id: string) => apiFetch(`/produtos/${id}`);
export const getProdutosCategorias = () => apiFetch(`/produtos/categorias/lista`);

// ATIVIDADE
export const getAtividades = (params?: any) => apiFetch(`/atividade/${params? `?${new URLSearchParams(params).toString()}` : ''}`);

// AUTH
export const login = (payload: any) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(payload) });
export const selectEmpresa = (payload: any) => apiFetch("/auth/select-empresa", { method: "POST", body: JSON.stringify(payload) });
export const getMe = () => apiFetch("/auth/me");
export const getEmpresa = (id: string): Promise<Empresa> => apiFetch(`/empresas/${id}`);

// ENTIDADES
export const getEntidades = (empresa_id: string, tipo?: string) => apiFetch(`/entidades/${empresa_id}${tipo? `?tipo=${tipo}` : ''}`);
export const getPerfis = (empresa_id: string) => apiFetch(`/entidades/${empresa_id}/perfis`);

// STORAGE
export const getEmpresaData = (): Empresa | null => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem("empresa_data") || "null"); } catch { return null; }
};
export const setEmpresaData = (empresa: Empresa) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem("empresa_data", JSON.stringify(empresa));
    window.dispatchEvent(new CustomEvent("empresa:updated", { detail: empresa }));
};

export const loginApi = async (email: string, senha: string) => {
    const data = await login({ email: email.toLowerCase().trim(), senha });
    if (typeof window!== 'undefined') {
        if (data.access_token) { localStorage.setItem("access_token", data.access_token); localStorage.setItem("token", data.access_token); }
        if (data.temp_token) localStorage.setItem("temp_token", data.temp_token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        if (data.empresas) localStorage.setItem("empresas", JSON.stringify(data.empresas));
        if (data.empresa) setEmpresaData(data.empresa as Empresa);
        const empresaId = data.empresa_id || data.empresa?.id || data.empresas?.[0]?.id || data.user?.empresa_id;
        if (empresaId) localStorage.setItem("empresa_id", String(empresaId));
        if (data.access_token) localStorage.removeItem("temp_token");
    }
    return data;
};

export const selectEmpresaApi = async (empresa_id: string) => {
    const temp_token = typeof window!== 'undefined'? localStorage.getItem("temp_token") : null;
    if (!temp_token) throw new Error("Sessão expirada, faça login novamente");
    const data = await selectEmpresa({ empresa_id, temp_token });
    if (typeof window!== 'undefined' && data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("empresa_id", String(empresa_id));
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        if (data.empresa) setEmpresaData(data.empresa as Empresa);
        localStorage.removeItem("temp_token");
        localStorage.removeItem("empresas");
    }
    return data;
};
