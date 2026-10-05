"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { ProdutosSection } from "./cards/produto";
import { CarrinhoSection } from "./carrinho/carrinho";
import { Toasts, PayModal, ConfirmModal } from "./modals/venda";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const API_BASE = `${API_URL}/api/v1/produtos`;
const VENDAS_API = `${API_URL}/api/v1/vendas`;
const MESAS_API = `${API_URL}/api/v1/mesas`;

type Toast = { id: string; msg: string; type: "success" | "error" | "info" | "warning" };

function getAuthHeaders() {
    const token = typeof window !== "undefined" ? (localStorage.getItem("access_token") || localStorage.getItem("token")) : null;
    const empresa_id = typeof window !== "undefined" ? localStorage.getItem("empresa_id") : null;
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (empresa_id) h["X-Empresa-ID"] = empresa_id;
    return h;
}
function getEmpresaId() {
    return typeof window !== "undefined" ? localStorage.getItem("empresa_id") : null;
}

export function VendasTab({ onClose }: { onClose: () => void }) {
    const [activeCat, setActiveCat] = useState("All");
    const [searchV, setSearchV] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const [dbProducts, setDbProducts] = useState<any[]>([]);
    const [catsDb, setCatsDb] = useState<string[]>([]);
    const [loadingProd, setLoadingProd] = useState(true);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [showPay, setShowPay] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [recebido, setRecebido] = useState("");
    const [forma, setForma] = useState<"dinheiro" | "transferencia" | "tpa">("dinheiro");
    const [finalizando, setFinalizando] = useState(false);
    const [ultimaVenda, setUltimaVenda] = useState<any>(null);

    // --- MODO MESAS (OPCIONAL) ---
    const [modoMesa, setModoMesa] = useState(false);
    const [mesasOcupadas, setMesasOcupadas] = useState<any[]>([]);
    const [loadingMesas, setLoadingMesas] = useState(false);
    const [mesaSelecionada, setMesaSelecionada] = useState<any>(null);
    const [vendaMesa, setVendaMesa] = useState<any>(null);

    const pushToast = (msg: string, type: Toast["type"] = "info") => {
        const id = Date.now().toString() + Math.random().toString().slice(2);
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
    };

    // persistir modo mesa
    useEffect(() => {
        const saved = localStorage.getItem("venda_modo_mesa");
        if (saved === "1") setModoMesa(true);
    }, []);
    useEffect(() => {
        localStorage.setItem("venda_modo_mesa", modoMesa ? "1" : "0");
        if (!modoMesa) {
            setMesaSelecionada(null);
            setVendaMesa(null);
            setActiveCat("All");
        }
    }, [modoMesa]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.key === "/" && !(e.target instanceof HTMLInputElement)) || (e.ctrlKey && e.key.toLowerCase() === "k")) {
                e.preventDefault(); setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50);
            }
            if (e.key === "Escape" && showSearch) { setShowSearch(false); setSearchV(""); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showSearch]);

    useEffect(() => { if (showSearch) searchRef.current?.focus(); }, [showSearch]);

    // produtos
    useEffect(() => {
        const fetchReal = async () => {
            setLoadingProd(true);
            try {
                const qs = new URLSearchParams({ skip: "0", limit: "100", search: searchV });
                const r = await fetch(`${API_BASE}/?${qs}`, { headers: getAuthHeaders() as any, cache: "no-store" as any });
                const data = await r.json();
                if (r.ok) setDbProducts((data.items || []).filter((p: any) => p.ativo !== false));
                else if (r.status === 403) pushToast("Empresa não autorizada", "error");
            } catch { }
            setLoadingProd(false);
        };
        fetchReal();
    }, [searchV]);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const r = await fetch(`${API_BASE}/categorias/lista`, { headers: getAuthHeaders() as any, cache: "no-store" as any });
                if (r.ok) setCatsDb(await r.json());
            } catch { }
        };
        fetchCats();
    }, []);

    // buscar mesas ocupadas só quando modo ativo e na categoria Mesas
    const fetchMesasOcupadas = useCallback(async () => {
        if (!modoMesa) return;
        const empresaId = getEmpresaId();
        if (!empresaId) return;
        setLoadingMesas(true);
        try {
            const r = await fetch(`${MESAS_API}/${empresaId}?status=OCUPADA`, { headers: getAuthHeaders() as any, cache: "no-store" as any });
            if (r.ok) {
                const data = await r.json();
                setMesasOcupadas(data);
            }
        } catch { }
        setLoadingMesas(false);
    }, [modoMesa]);

    useEffect(() => {
        if (modoMesa && activeCat === "Mesas") fetchMesasOcupadas();
    }, [modoMesa, activeCat, fetchMesasOcupadas]);

    // selecionar mesa -> carregar comanda
    const selecionarMesa = async (mesa: any) => {
        setMesaSelecionada(mesa);
        setCart([]);
        setVendaMesa(null);
        if (!mesa.venda_atual_id) {
            pushToast(`Mesa ${mesa.numero} sem venda ativa`, "info");
            return;
        }
        try {
            const empresaId = getEmpresaId();
            const r = await fetch(`${VENDAS_API}/${empresaId}/${mesa.venda_atual_id}`, { headers: getAuthHeaders() as any });
            if (r.ok) {
                const venda = await r.json();
                setVendaMesa(venda);
                const itensCart = (venda.itens || []).map((it: any) => ({
                    id: it.produto_id,
                    name: it.produto_nome || it.nome,
                    price: Number(it.preco_unitario || it.preco || 0),
                    img: "",
                    qtd: Number(it.quantidade || 1),
                }));
                setCart(itensCart);
                pushToast(`Comanda da Mesa ${mesa.numero} carregada`, "success");
            }
        } catch { pushToast("Erro ao carregar comanda", "error"); }
    };

    // REALTIME
    useEffect(() => {
        const onProdutoUpdate = (e: any) => {
            const p = e.detail;
            if (!p?.id) return;
            setDbProducts(prev => prev.map(x => x.id === p.id ? { ...x, ...p, stock_atual: p.stock_atual ?? p.quantidade ?? x.stock_atual } : x));
        };
        window.addEventListener("produto:update" as any, onProdutoUpdate);
        return () => window.removeEventListener("produto:update" as any, onProdutoUpdate);
    }, []);

    const cats = modoMesa ? ["All", "Mesas", ...catsDb] : ["All", ...catsDb];
    const getStockState = (p: any) => {
        if (!p.controlar_stock) return "ok";
        const atual = Number(p.stock_atual ?? 0);
        const minimo = Number(p.stock_minimo ?? 0);
        if (atual <= 0) return "zero";
        if (atual <= minimo || atual <= 5) return "low";
        return "ok";
    };

    const add = (p: any) => {
        const state = getStockState(p);
        const atual = Number(p.stock_atual ?? 0);
        const qtyInCart = cart.find(c => c.id === p.id)?.qtd || 0;
        if (state === "zero") { pushToast(`Sem stock: "${p.nome}" esgotado`, "error"); return; }
        if (p.controlar_stock && qtyInCart >= atual) { pushToast(`Stock insuficiente: só ${atual} un.`, "warning"); return; }
        const ex = cart.find((c) => c.id === p.id);
        if (ex) setCart(cart.map((c) => (c.id === p.id ? { ...c, qtd: c.qtd + 1 } : c)));
        else setCart([...cart, { id: p.id, name: p.nome, price: Number(p.preco_venda) || 0, img: p.imagem_url ? `${API_URL}${p.imagem_url}` : "", qtd: 1 }]);
    };

    const getQty = (id: string) => cart.find((c) => c.id === id)?.qtd || 0;
    const total = cart.reduce((s, i) => s + i.price * i.qtd, 0);
    const recebidoNum = recebido ? parseFloat(recebido) : 0;
    const troco = recebidoNum - total;

    const handleCalc = (val: string) => {
        if (val === "C") setRecebido("");
        else if (val === "DEL") setRecebido((s) => s.slice(0, -1));
        else if (val === "00") { if (recebido !== "") setRecebido((s) => s + "00"); }
        else if (val === ".") { if (!recebido.includes(".")) setRecebido((s) => (s === "" ? "0." : s + ".")); }
        else { setRecebido((s) => (s + val).slice(0, 10)); }
    };

    const finalizarVenda = async () => {
        if (cart.length === 0) return;
        if (forma === "dinheiro" && recebidoNum < total) { pushToast("Valor insuficiente", "error"); return; }
        setFinalizando(true);
        const empresaId = getEmpresaId();
        if (!empresaId) { pushToast("Sem empresa_id", "error"); setFinalizando(false); return; }
        try {
            let r: Response;
            if (mesaSelecionada) {
                // TENTA 2 ROTAS POSSÍVEIS - seu backend usa uma delas
                const payloadItens = { itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })) };
                // 1ª tentativa: /vendas/{empresa}/mesa/{mesa_id}/adicionar
                r = await fetch(`${VENDAS_API}/${empresaId}/mesa/${mesaSelecionada.id}/adicionar-itens`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...getAuthHeaders() as any },
                    body: JSON.stringify(payloadItens)
                });
                if (r.status === 404 || r.status === 405) {
                    // fallback: /vendas/{empresa}/{venda_id}/itens
                    r = await fetch(`${VENDAS_API}/${empresaId}/${mesaSelecionada.venda_atual_id}/itens`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", ...getAuthHeaders() as any },
                        body: JSON.stringify(payloadItens)
                    });
                }
                if (r.status === 404 || r.status === 405) {
                    // ultimo fallback: PUT na venda
                    r = await fetch(`${VENDAS_API}/${empresaId}/${mesaSelecionada.venda_atual_id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", ...getAuthHeaders() as any },
                        body: JSON.stringify({ itens_adicionar: payloadItens.itens })
                    });
                }
            } else {
                // BALCÃO - CORRETO É COM empresaId NA URL
                const payload = {
                    itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })),
                    forma_pagamento: forma.toUpperCase(),
                    dinheiro_recebido: forma === "dinheiro" ? recebidoNum : total,
                    mesa_id: null,
                };
                r = await fetch(`${VENDAS_API}/${empresaId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...getAuthHeaders() as any },
                    body: JSON.stringify(payload)
                });
            }
            const text = await r.text();
            console.log("VENDA RESPONSE:", r.status, text);
            let data: any = {};
            try { data = JSON.parse(text); } catch { data = { detail: text }; }
            if (!r.ok) throw new Error(data.detail || `Erro ${r.status}`);

            if (mesaSelecionada) {
                pushToast(`Mesa ${mesaSelecionada.numero} atualizada!`, "success");
                setCart([]); setMesaSelecionada(null); setVendaMesa(null);
                setActiveCat("Mesas");
                fetchMesasOcupadas();
            } else {
                setUltimaVenda(data); setShowPay(false); setShowConfirm(true);
            }
            setDbProducts(prev => prev.map(p => {
                const inCart = cart.find(c => c.id === p.id);
                if (inCart && p.controlar_stock) return { ...p, stock_atual: Number(p.stock_atual || 0) - inCart.qtd };
                return p;
            }));
        } catch (e: any) {
            console.error(e);
            pushToast(e.message, "error");
        }
        finally { setFinalizando(false); }
    };

    const fecharContaMesa = async () => {
        if (!mesaSelecionada?.venda_atual_id) return;
        setFinalizando(true);
        try {
            const empresaId = getEmpresaId();
            // sua rota de fechar pode ser /fechar ou /finalizar
            let r = await fetch(`${VENDAS_API}/${empresaId}/${mesaSelecionada.venda_atual_id}/fechar`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getAuthHeaders() as any },
                body: JSON.stringify({ forma_pagamento: forma.toUpperCase(), dinheiro_recebido: recebidoNum || total })
            });
            if (r.status === 404) {
                r = await fetch(`${VENDAS_API}/${empresaId}/${mesaSelecionada.venda_atual_id}/finalizar`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...getAuthHeaders() as any },
                    body: JSON.stringify({ forma_pagamento: forma.toUpperCase() })
                });
            }
            const data = await r.json();
            if (!r.ok) throw new Error(data.detail || "Erro ao fechar");
            pushToast(`Conta Mesa ${mesaSelecionada.numero} fechada`, "success");
            setCart([]); setMesaSelecionada(null); setShowPay(false); fetchMesasOcupadas();
        } catch (e: any) { pushToast(e.message, "error"); }
        finally { setFinalizando(false); }
    };

    const imprimirFatura = () => {
        const win = window.open("", "_blank", "width=320,height=600");
        if (!win) return;
        const vendaNum = ultimaVenda?.numero ? ` #${ultimaVenda.numero}` : "";
        const html = `<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px;color:#000}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%}td{padding:2px 0}</style></head><body><div class="center bold">RESTAURANTE JENATH${vendaNum}</div><div class="line"></div><table>${cart.map(i => `<tr><td>${i.name} x${i.qtd}</td><td style="text-align:right">Kz ${(i.price * i.qtd).toLocaleString("de-DE")}</td></tr>`).join("")}</table><div class="line"></div><div class="center">Obrigado!</div><script>window.print();window.close();</script></body></html>`;
        win.document.write(html); win.document.close();
    };

    const aposVenda = (comRecibo: boolean) => {
        if (comRecibo) imprimirFatura();
        setShowConfirm(false); setShowPay(false); setCart([]); setRecebido(""); setUltimaVenda(null);
    };

    const filteredByCat = activeCat === "All" ? dbProducts : activeCat === "Mesas" ? [] : dbProducts.filter((p) => (p.categoria || "").toLowerCase() === activeCat.toLowerCase());

    return (
        <div className="h-full w-full flex flex-col bg-[#F5F7FB] overflow-hidden relative">
            <Toasts toasts={toasts} setToasts={setToasts} />
            <div className="h-[48px] px-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-black/5 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black">Modo Mesas</span>
                    <button onClick={() => setModoMesa(!modoMesa)} className={`w-[44px] h-[26px] rounded-full p-0.5 flex items-center transition-all ${modoMesa ? "bg-black" : "bg-zinc-300"}`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow transition-all ${modoMesa ? "translate-x-[18px]" : "translate-x-0"}`} />
                    </button>
                </div>
                <button onClick={onClose} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center active:scale-95 hover:bg-zinc-800"><X size={16} /></button>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                <ProdutosSection
                    dbProducts={dbProducts} filteredByCat={filteredByCat} loadingProd={loadingProd}
                    cats={cats} activeCat={activeCat} setActiveCat={setActiveCat}
                    searchV={searchV} setSearchV={setSearchV} showSearch={showSearch} setShowSearch={setShowSearch} searchRef={searchRef}
                    getQty={getQty} getStockState={getStockState} add={add}
                    modoMesa={modoMesa} mesasOcupadas={mesasOcupadas} loadingMesas={loadingMesas}
                    mesaSelecionada={mesaSelecionada} onSelectMesa={selecionarMesa} fetchMesas={fetchMesasOcupadas}
                />
                <CarrinhoSection
                    cart={cart} total={total} forma={forma} setForma={setForma} setShowPay={setShowPay} setRecebido={setRecebido}
                    mesaSelecionada={mesaSelecionada} onFecharConta={fecharContaMesa} onLimparMesa={() => { setMesaSelecionada(null); setCart([]); setVendaMesa(null); }}
                />
            </div>
            <PayModal showPay={showPay} setShowPay={setShowPay} total={total} forma={forma} recebido={recebido} recebidoNum={recebidoNum} troco={troco} handleCalc={handleCalc} setShowConfirm={mesaSelecionada ? fecharContaMesa : finalizarVenda} loading={finalizando} isMesa={!!mesaSelecionada} />
            <ConfirmModal showConfirm={showConfirm} setShowConfirm={setShowConfirm} total={total} forma={forma} troco={troco} imprimirFatura={() => aposVenda(true)} onSemRecibo={() => aposVenda(false)} vendaNumero={ultimaVenda?.numero} />
            <style jsx>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
        </div>
    );
}
