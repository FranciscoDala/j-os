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
    const token = typeof window!== "undefined"? (localStorage.getItem("access_token") || localStorage.getItem("token")) : null;
    const empresa_id = typeof window!== "undefined"? localStorage.getItem("empresa_id") : null;
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (empresa_id) h["X-Empresa-ID"] = empresa_id;
    return h;
}
function getEmpresaId() { return typeof window!== "undefined"? localStorage.getItem("empresa_id") : null; }

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

    const [modoMesa, setModoMesa] = useState(false);
    const [mesasOcupadas, setMesasOcupadas] = useState<any[]>([]);
    const [loadingMesas, setLoadingMesas] = useState(false);
    const [mesaSelecionada, setMesaSelecionada] = useState<any>(null);
    const [vendaMesa, setVendaMesa] = useState<any>(null);
    const [mesaParaFechar, setMesaParaFechar] = useState<any>(null);

    const pushToast = (msg: string, type: Toast["type"] = "info") => {
        const id = Date.now().toString() + Math.random().toString().slice(2);
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id!== id)), 4000);
    };

    useEffect(() => {
        const saved = localStorage.getItem("venda_modo_mesa");
        if (saved === "1") setModoMesa(true);
    }, []);
    useEffect(() => {
        localStorage.setItem("venda_modo_mesa", modoMesa? "1" : "0");
        if (!modoMesa) { setMesaSelecionada(null); setVendaMesa(null); setMesaParaFechar(null); setActiveCat("All"); }
    }, [modoMesa]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.key === "/" &&!(e.target instanceof HTMLInputElement)) || (e.ctrlKey && e.key.toLowerCase() === "k")) {
                e.preventDefault(); setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50);
            }
            if (e.key === "Escape" && showSearch) { setShowSearch(false); setSearchV(""); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showSearch]);
    useEffect(() => { if (showSearch) searchRef.current?.focus(); }, [showSearch]);

    useEffect(() => {
        const fetchReal = async () => {
            setLoadingProd(true);
            try {
                const qs = new URLSearchParams({ skip: "0", limit: "100", search: searchV });
                const r = await fetch(`${API_BASE}/?${qs}`, { headers: getAuthHeaders() as any, cache: "no-store" as any });
                const data = await r.json();
                if (r.ok) setDbProducts((data.items || []).filter((p: any) => p.ativo!== false));
            } catch { } setLoadingProd(false);
        };
        fetchReal();
    }, [searchV]);

    useEffect(() => {
        const fetchCats = async () => {
            try { const r = await fetch(`${API_BASE}/categorias/lista`, { headers: getAuthHeaders() as any, cache: "no-store" as any }); if (r.ok) setCatsDb(await r.json()); } catch { }
        }; fetchCats();
    }, []);

    const fetchMesasOcupadas = useCallback(async () => {
        if (!modoMesa) return;
        const empresaId = getEmpresaId(); if (!empresaId) return;
        setLoadingMesas(true);
        try {
            const r = await fetch(`${MESAS_API}/${empresaId}?status=OCUPADA`, { headers: getAuthHeaders() as any, cache: "no-store" as any });
            if (r.ok) setMesasOcupadas(await r.json());
        } catch { } setLoadingMesas(false);
    }, [modoMesa]);

    useEffect(() => { if (modoMesa && activeCat === "Mesas") fetchMesasOcupadas(); }, [modoMesa, activeCat, fetchMesasOcupadas]);

    const selecionarMesa = async (mesa: any) => {
        setMesaSelecionada(mesa);
        setCart([]);
        setMesaParaFechar(null);
        setVendaMesa(null);

        if (mesa.venda_atual_id) {
            try {
                const r = await fetch(`${VENDAS_API}/${mesa.venda_atual_id}`, { headers: getAuthHeaders() as any });
                if (r.ok) setVendaMesa(await r.json());
            } catch { }
            pushToast(`Mesa ${mesa.numero} selecionada`, "success");
            return;
        }

        try {
            const rList = await fetch(`${VENDAS_API}/`, { headers: getAuthHeaders() as any });
            if (rList.ok) {
                const vendas = await rList.json();
                const v = vendas.find((x: any) => x.mesa_id === mesa.id && x.status === "ABERTA");
                if (v) {
                    mesa.venda_atual_id = v.id;
                    setMesaSelecionada({...mesa });
                    setVendaMesa(v);
                    pushToast(`Mesa ${mesa.numero} recuperada`, "success");
                    return;
                }
            }
            pushToast(`Mesa ${mesa.numero} ocupada mas sem comanda. Libere em Mesas > Liberar`, "error");
        } catch { }
    };

    useEffect(() => {
        const onProdutoUpdate = (e: any) => { const p = e.detail; if (!p?.id) return; setDbProducts(prev => prev.map(x => x.id === p.id? {...x,...p } : x)); };
        window.addEventListener("produto:update" as any, onProdutoUpdate);
        return () => window.removeEventListener("produto:update" as any, onProdutoUpdate);
    }, []);

    const cats = modoMesa? ["All", "Mesas",...catsDb] : ["All",...catsDb];
    const getStockState = (p: any) => { if (!p.controlar_stock) return "ok"; const atual = Number(p.stock_atual?? 0); if (atual <= 0) return "zero"; if (atual <= 5) return "low"; return "ok"; };
    const add = (p: any) => {
        const state = getStockState(p); if (state === "zero") { pushToast(`Sem stock: "${p.nome}"`, "error"); return; }
        const ex = cart.find((c) => c.id === p.id);
        if (ex) setCart(cart.map((c) => (c.id === p.id? {...c, qtd: c.qtd + 1 } : c)));
        else setCart([...cart, { id: p.id, name: p.nome, price: Number(p.preco_venda) || 0, img: p.imagem_url? `${API_URL}${p.imagem_url}` : "", qtd: 1 }]);
    };
    const getQty = (id: string) => cart.find((c) => c.id === id)?.qtd || 0;
    const total = cart.reduce((s, i) => s + i.price * i.qtd, 0);
    const recebidoNum = recebido? parseFloat(recebido) : 0;
    const handleCalc = (val: string) => {
        if (val === "C") setRecebido(""); else if (val === "DEL") setRecebido((s) => s.slice(0, -1));
        else if (val === "00") { if (recebido!== "") setRecebido((s) => s + "00"); }
        else if (val === ".") { if (!recebido.includes(".")) setRecebido((s) => (s === ""? "0." : s + ".")); }
        else { setRecebido((s) => (s + val).slice(0, 10)); }
    };

    // 1. ADICIONAR NA MESA - CORRIGIDO PARA NÃO USAR NULL
    const adicionarNaMesa = async () => {
        if (!mesaSelecionada || cart.length === 0) return;
        const vendaId = mesaSelecionada.venda_atual_id || vendaMesa?.id;
        if (!vendaId) {
            pushToast(`Mesa ${mesaSelecionada.numero} sem venda válida. Libere e ocupe de novo`, "error");
            return;
        }
        setFinalizando(true);
        try {
            const r = await fetch(`${VENDAS_API}/${vendaId}/itens`, {
                method: "POST",
                headers: { "Content-Type": "application/json",...getAuthHeaders() as any },
                body: JSON.stringify({ itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })) })
            });
            const txt = await r.text();
            let data: any = {}; try { data = JSON.parse(txt); } catch { data = { detail: txt }; }
            if (!r.ok) throw new Error(data.detail || "Erro ao adicionar na mesa");
            pushToast(`Mesa ${mesaSelecionada.numero} +Kz ${total.toLocaleString("de-DE")}`, "success");
            setCart([]); setMesaSelecionada(null); setVendaMesa(null); setActiveCat("Mesas"); fetchMesasOcupadas();
        } catch (e: any) { pushToast(e.message, "error"); }
        finally { setFinalizando(false); }
    };

    // 2. FINALIZAR BALCÃO
    const finalizarBalcao = async () => {
        if (cart.length === 0) return;
        if (forma === "dinheiro" && recebidoNum < total) { pushToast("Valor insuficiente", "error"); return; }
        setFinalizando(true);
        try {
            const payload = { itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })), forma_pagamento: forma.toUpperCase(), dinheiro_recebido: forma === "dinheiro"? recebidoNum : total, mesa_id: null, modo: "balcao" };
            const r = await fetch(`${VENDAS_API}/`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any }, body: JSON.stringify(payload) });
            const data = await r.json(); if (!r.ok) throw new Error(data.detail || "Erro");
            setUltimaVenda(data); setShowPay(false); setShowConfirm(true);
        } catch (e: any) { pushToast(e.message, "error"); }
        finally { setFinalizando(false); }
    };

    // 3. FECHAR MESA - COM FALLBACK
    const fecharContaMesa = async () => {
        const mesa = mesaParaFechar;
        const vendaId = mesa?.venda_atual_id || vendaMesa?.id;
        if (!vendaId) { pushToast("Mesa sem venda para fechar", "error"); return; }
        setFinalizando(true);
        try {
            const r = await fetch(`${VENDAS_API}/${vendaId}/fechar`, {
                method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any },
                body: JSON.stringify({ forma_pagamento: forma.toUpperCase(), dinheiro_recebido: recebidoNum || 0 })
            });
            const txt = await r.text(); let data: any = {}; try { data = JSON.parse(txt); } catch { data = { detail: txt }; }
            if (!r.ok) throw new Error(data.detail || "Erro ao fechar");
            const win = window.open("", "_blank", "width=320,height=600");
            if (win) {
                const itensHtml = (data.itens || []).map((i: any) => `<tr><td>${i.produto_nome || i.nome} x${i.quantidade}</td><td style="text-align:right">Kz ${Number(i.subtotal || 0).toLocaleString("de-DE")}</td></tr>`).join("");
                win.document.write(`<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%}</style></head><body><div class="center bold">FATURA MESA ${mesa.numero}<br/>#${data.numero || ""}</div><div class="line"></div><table>${itensHtml}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${Number(data.total || 0).toLocaleString("de-DE")}</td></tr></table><script>window.print();window.close();</script></body></html>`);
                win.document.close();
            }
            pushToast(`Mesa ${mesa.numero} fechada!`, "success");
            setCart([]); setMesaSelecionada(null); setMesaParaFechar(null); setShowPay(false); fetchMesasOcupadas();
        } catch (e: any) { pushToast(e.message, "error"); }
        finally { setFinalizando(false); }
    };

    const imprimirContaParcial = async (mesa: any) => {
        const vendaId = mesa.venda_atual_id || vendaMesa?.id;
        if (!vendaId) { pushToast("Mesa sem venda", "error"); return; }
        try {
            const r = await fetch(`${VENDAS_API}/${vendaId}`, { headers: getAuthHeaders() as any });
            let venda = vendaMesa; if (r.ok) venda = await r.json();
            const consumo = Number(venda?.total || mesa.venda_total || 0);
            const pendente = mesaSelecionada?.id === mesa.id? total : 0;
            const win = window.open("", "_blank", "width=320,height=600"); if (!win) return;
            const itensHtml = (venda?.itens || []).map((i: any) => `<tr><td>${i.produto_nome || i.nome} x${i.quantidade}</td><td style="text-align:right">Kz ${Number(i.subtotal || 0).toLocaleString("de-DE")}</td></tr>`).join("");
            win.document.write(`<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px}.line{border-top:1px dashed #000;margin:8px 0}</style></head><body><div style="text-align:center;font-weight:bold">CONTA PARCIAL Mesa ${mesa.numero}</div><div class="line"></div><table>${itensHtml}</table><div class="line"></div><div>Consumo: Kz ${consumo.toLocaleString("de-DE")}${pendente > 0? `<br/>Pendente: Kz ${pendente.toLocaleString("de-DE")}` : ""}<br/>Total: Kz ${(consumo + pendente).toLocaleString("de-DE")}</div><script>window.print();window.close();</script></body></html>`);
            win.document.close();
        } catch { pushToast("Erro ao imprimir", "error"); }
    };

    const imprimirFatura = () => {
        const win = window.open("", "_blank", "width=320,height=600"); if (!win) return;
        win.document.write(`<html><body><table>${cart.map(i => `<tr><td>${i.name} x${i.qtd}</td><td>Kz ${(i.price * i.qtd).toLocaleString("de-DE")}</td></tr>`).join("")}</table><script>window.print();window.close();</script></body></html>`); win.document.close();
    };
    const aposVenda = (comRecibo: boolean) => { if (comRecibo) imprimirFatura(); setShowConfirm(false); setShowPay(false); setCart([]); setRecebido(""); setUltimaVenda(null); };
    const filteredByCat = activeCat === "All"? dbProducts : activeCat === "Mesas"? [] : dbProducts.filter((p) => (p.categoria || "").toLowerCase() === activeCat.toLowerCase());
    const totalFechamento = Number(mesaParaFechar?.venda_total || mesaParaFechar?.total || vendaMesa?.total || 0) + (mesaParaFechar?.id === mesaSelecionada?.id? total : 0);

    return (
        <div className="h-full w-full flex flex-col bg-[#F5F7FB] overflow-hidden relative">
            <Toasts toasts={toasts} setToasts={setToasts} />
            <div className="h-[48px] px-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-black/5 shrink-0">
                <div className="flex items-center gap-2"><span className="text-[11px] font-black">Modo Mesas</span>
                    <button onClick={() => setModoMesa(!modoMesa)} className={`w-[44px] h-[26px] rounded-full p-0.5 flex items-center transition-all ${modoMesa? "bg-black" : "bg-zinc-300"}`}><div className={`w-5 h-5 rounded-full bg-white shadow transition-all ${modoMesa? "translate-x-[18px]" : "translate-x-0"}`} /></button>
                </div>
                <button onClick={onClose} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center"><X size={16} /></button>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                <ProdutosSection dbProducts={dbProducts} filteredByCat={filteredByCat} loadingProd={loadingProd} cats={cats} activeCat={activeCat} setActiveCat={setActiveCat} searchV={searchV} setSearchV={setSearchV} showSearch={showSearch} setShowSearch={setShowSearch} searchRef={searchRef} getQty={getQty} getStockState={getStockState} add={add} modoMesa={modoMesa} mesasOcupadas={mesasOcupadas} loadingMesas={loadingMesas} mesaSelecionada={mesaSelecionada} onSelectMesa={selecionarMesa} fetchMesas={fetchMesasOcupadas} cart={cart} cartTotal={total} onFecharMesa={(m: any) => { setMesaParaFechar(m); setRecebido(String(Number(m.venda_total || m.total || 0) + (m.id === mesaSelecionada?.id? total : 0))); setShowPay(true); }} onImprimirConta={imprimirContaParcial} />
                <CarrinhoSection cart={cart} total={total} forma={forma} setForma={setForma} setShowPay={setShowPay} setRecebido={setRecebido} mesaSelecionada={mesaSelecionada} onAddMesa={adicionarNaMesa} onLimparMesa={() => { setMesaSelecionada(null); setCart([]); }} finalizando={finalizando} />
            </div>
            <PayModal showPay={showPay} setShowPay={(v: boolean) => { if (!v) setMesaParaFechar(null); setShowPay(v); }} total={mesaParaFechar? totalFechamento : total} forma={forma} recebido={recebido} recebidoNum={recebidoNum} troco={recebidoNum - (mesaParaFechar? totalFechamento : total)} handleCalc={handleCalc} setShowConfirm={mesaParaFechar? fecharContaMesa : finalizarBalcao} loading={finalizando} isMesa={!!mesaParaFechar} mesaNumero={mesaParaFechar?.numero} />
            <ConfirmModal showConfirm={showConfirm} setShowConfirm={setShowConfirm} total={total} forma={forma} troco={recebidoNum - total} imprimirFatura={() => aposVenda(true)} onSemRecibo={() => aposVenda(false)} vendaNumero={ultimaVenda?.numero} />
        </div>
    );
}
