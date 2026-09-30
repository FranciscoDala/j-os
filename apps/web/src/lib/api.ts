export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const BASE = `${API_URL}/api/v1`;

// Helper central - usa access_token salvo
async function apiFetch(path: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
    const headers: any = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        // se token expirou, joga pro login
        if (res.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        }
        throw new Error(data.detail || `Erro ${res.status}`);
    }
    return data;
}

// AUTH
export async function loginApi(email: string, senha: string) {
    const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Login invalido");
    return data as {
        access_token: string | null;
        temp_token: string | null;
        token_type: string;
        empresas: { id: string; nome: string; role: string }[] | null;
        user: any;
    };
}

export async function selectEmpresaApi(temp_token: string, empresa_id: string) {
    const res = await fetch(`${BASE}/auth/select-empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temp_token, empresa_id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Erro ao selecionar empresa");
    return data as {
        access_token: string;
        token_type: string;
        user: any;
    };
}

// MESA
export const getMesas = () => apiFetch("/mesas/");
export const criarMesaApi = (payload: { numero: string; capacidade: number }) =>
    apiFetch("/mesas/", { method: "POST", body: JSON.stringify(payload) });
export const getComandaMesa = (mesaId: string) => apiFetch(`/mesas/${mesaId}/comanda`);

// PRODUTO
export const getProdutos = () => apiFetch("/produtos/");
export const getProduto = (id: string) => apiFetch(`/produtos/${id}`);

// VENDA / PDV / RESTAURANTE
export const getVendas = () => apiFetch("/vendas/");
export const getVenda = (id: string) => apiFetch(`/vendas/${id}`);
export const criarVenda = (payload: any) => apiFetch("/vendas/", { method: "POST", body: JSON.stringify(payload) });
export const addItemComanda = (vendaId: string, payload: { produto_id: string; quantidade: number; observacao?: string }) =>
    apiFetch(`/vendas/${vendaId}/itens`, { method: "POST", body: JSON.stringify(payload) });
export const fecharComanda = (vendaId: string, dinheiro_recebido: number) =>
    apiFetch(`/vendas/${vendaId}/fechar?dinheiro_recebido=${dinheiro_recebido}`, { method: "POST" });
export const cancelarVenda = (vendaId: string) => apiFetch(`/vendas/${vendaId}/cancelar`, { method: "POST" });
export const transferirMesa = (vendaId: string, nova_mesa_id: string) =>
    apiFetch(`/vendas/${vendaId}/transferir`, { method: "POST", body: JSON.stringify({ nova_mesa_id }) });

// COZINHA / KDS
export const getCozinha = () => apiFetch("/vendas/cozinha/pendentes");
export const updateItemStatus = (vendaId: string, itemId: string, status: string) =>
    apiFetch(`/vendas/${vendaId}/itens/${itemId}/status`, { method: "PUT", body: JSON.stringify({ status }) });

// CAIXA
export const getCaixaAberto = () => apiFetch("/caixas/aberto");
export const abrirCaixa = (payload: { saldo_inicial: number }) => apiFetch("/caixas/abrir", { method: "POST", body: JSON.stringify(payload) });
export const fecharCaixa = (payload: any) => apiFetch("/caixas/fechar", { method: "POST", body: JSON.stringify(payload) });
export const getCaixaExtrato = (caixaId: string) => apiFetch(`/caixas/${caixaId}/extrato`);
export const criarMovimentoCaixa = (payload: { tipo: string; valor: number; descricao: string }) =>
    apiFetch("/caixas/movimento", { method: "POST", body: JSON.stringify(payload) });

// ATIVIDADE
export const getAtividades = () => apiFetch("/atividades/");
