"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { ProdutosSection } from "./cards/produto";
import { Toasts, PayModal, ConfirmModal } from "./modals/venda";
import { PedidosQrPendentes } from "../../../../../../components/venda/pedidos/PedidosQrPendentes";

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
    const [pedidoQrAtivo, setPedidoQrAtivo] = useState<any>(null);
    const PEDIDOS_QR_API = `${API_URL}/api/v1/pedidos-qr`;

    const pushToast = (msg: string, type: Toast["type"] = "info") => {
        const id = Date.now().toString() + Math.random().toString().slice(2);
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id!== id)), 4000);
    };

    useEffect(() => {
        const raw = localStorage.getItem("atender_mesa_qr");
        if (!raw) return;
        try {
            const dados = JSON.parse(raw);
            setPedidoQrAtivo(dados);
            setModoMesa(true);
            localStorage.setItem("venda_modo_mesa", "1");
            (async () => {
                const empresaId = getEmpresaId();
                if (!empresaId) return;
                const r = await fetch(`${MESAS_API}/${empresaId}`, { headers: getAuthHeaders() as any });
                if (r.ok) {
                    const mesas = await r.json();
                    const mesa = mesas.find((m: any) => m.id === dados.mesa_id || m.numero === dados.mesa_numero || m.id === dados.mesa?.id || m.numero === dados.mesa?.numero);
                    if (mesa) {
                        await selecionarMesa(mesa);
                        if (dados.itens?.length) {
                            setTimeout(() => {
                                const cartItens = dados.itens.map((it: any) => ({
                                    id: it.produto_id || it.produto?.id || it.id,
                                    name: it.produto_nome || it.nome,
                                    price: Number(it.preco_unit || it.preco || it.preco_venda || 0),
                                    img: "",
                                    qtd: Number(it.quantidade || 1)
                                }));
                                setCart(cartItens);
                                pushToast(`MESA ${mesa.numero} - ${dados.cliente_nome} carregado`, "success");
                            }, 400);
                        }
                    }
                }
            })();
        } catch { }
    }, []);

    useEffect(() => { const saved = localStorage.getItem("venda_modo_mesa"); if (saved === "1") setModoMesa(true); }, []);
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
        setMesaSelecionada(mesa); setCart([]); setMesaParaFechar(null); setVendaMesa(null);
        if (mesa.venda_atual_id) {
            try {
                const r = await fetch(`${VENDAS_API}/${mesa.venda_atual_id}`, { headers: getAuthHeaders() as any });
                if (r.ok) { const v = await r.json(); if (v.status === "ABERTA") { setVendaMesa(v); pushToast(`Mesa ${mesa.numero} - Kz ${Number(v.total || 0).toLocaleString("de-DE")}`, "info"); return; } }
            } catch { }
        }
        try {
            const rList = await fetch(`${VENDAS_API}/`, { headers: getAuthHeaders() as any });
            if (rList.ok) { const vendas = await rList.json(); const v = vendas.find((x: any) => x.mesa_id === mesa.id && x.status === "ABERTA"); if (v) { setMesaSelecionada({...mesa, venda_atual_id: v.id }); setVendaMesa(v); pushToast(`Mesa ${mesa.numero} selecionada`, "success"); return; } }
        } catch { }
        pushToast(`Mesa ${mesa.numero} pronta para lançar`, "success");
    };

    useEffect(() => {
        const onProdutoUpdate = (e: any) => { const p = e.detail; if (!p?.id) return; setDbProducts(prev => prev.map(x => x.id === p.id? {...x,...p } : x)); };
        window.addEventListener("produto:update" as any, onProdutoUpdate);
        const onMesaUpdate = () => { if (modoMesa) fetchMesasOcupadas(); };
        window.addEventListener("mesa:update" as any, onMesaUpdate);
        return () => { window.removeEventListener("produto:update" as any, onProdutoUpdate); window.removeEventListener("mesa:update" as any, onMesaUpdate); };
    }, [modoMesa, fetchMesasOcupadas]);

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

    const adicionarNaMesa = async () => {
        if (!mesaSelecionada || cart.length === 0) return;
        const vendaId = mesaSelecionada.venda_atual_id || vendaMesa?.id;
        setFinalizando(true);
        try {
            if (!vendaId) {
                const rCreate = await fetch(`${VENDAS_API}/`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any }, body: JSON.stringify({ mesa_id: mesaSelecionada.id, itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })), dinheiro_recebido: 0, forma_pagamento: "DINHEIRO", pessoas: mesaSelecionada.pessoas_atual || 1, modo: "mesa" }) });
                const txt = await rCreate.text(); let data: any = {}; try { data = JSON.parse(txt); } catch { data = { detail: txt }; } if (!rCreate.ok) throw new Error(data.detail || "Erro ao criar comanda");
                if (pedidoQrAtivo) { const idQr = pedidoQrAtivo.id || pedidoQrAtivo.pedido_id; await fetch(`${PEDIDOS_QR_API}/${idQr}/aprovar`, { method: "POST", headers: getAuthHeaders() as any }); window.dispatchEvent(new CustomEvent("pedido-qr:aprovado", { detail: { id: idQr } })); localStorage.removeItem("atender_mesa_qr"); setPedidoQrAtivo(null); }
                pushToast(`Mesa ${mesaSelecionada.numero} aberta +Kz ${total.toLocaleString("de-DE")}`, "success"); setCart([]); setMesaSelecionada(null); setVendaMesa(null); setActiveCat("Mesas"); fetchMesasOcupadas(); return;
            }
            const r = await fetch(`${VENDAS_API}/${vendaId}/itens`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any }, body: JSON.stringify({ itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })) }) });
            const txt = await r.text(); let data: any = {}; try { data = JSON.parse(txt); } catch { data = { detail: txt }; } if (!r.ok) throw new Error(data.detail || "Erro ao adicionar na mesa");
            if (pedidoQrAtivo) { const idQr = pedidoQrAtivo.id || pedidoQrAtivo.pedido_id; await fetch(`${PEDIDOS_QR_API}/${idQr}/aprovar`, { method: "POST", headers: getAuthHeaders() as any }); window.dispatchEvent(new CustomEvent("pedido-qr:aprovado", { detail: { id: idQr } })); localStorage.removeItem("atender_mesa_qr"); setPedidoQrAtivo(null); }
            pushToast(`Mesa ${mesaSelecionada.numero} +Kz ${total.toLocaleString("de-DE")}`, "success"); setCart([]); setMesaSelecionada(null); setVendaMesa(null); setActiveCat("Mesas"); fetchMesasOcupadas();
        } catch (e: any) { pushToast(e.message, "error"); } finally { setFinalizando(false); }
    };

    const finalizarBalcao = async () => {
        if (cart.length === 0) return; if (forma === "dinheiro" && recebidoNum < total) { pushToast("Valor insuficiente", "error"); return; }
        setFinalizando(true);
        try {
            const payload = { itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })), forma_pagamento: forma.toUpperCase(), dinheiro_recebido: forma === "dinheiro"? recebidoNum : total, mesa_id: null, modo: "balcao" };
            const r = await fetch(`${VENDAS_API}/`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any }, body: JSON.stringify(payload) });
            const txt = await r.text(); let data: any = {}; try { data = JSON.parse(txt) } catch { data = { detail: txt } }; if (!r.ok) throw new Error(data.detail || "Erro");
            setUltimaVenda(data); setShowPay(false); setShowConfirm(true);
        } catch (e: any) { pushToast(e.message, "error"); } finally { setFinalizando(false); }
    };

    const fecharContaMesa = async () => {
        const mesa = mesaParaFechar; const vendaId = mesa?.venda_atual_id || vendaMesa?.id || mesaSelecionada?.venda_atual_id;
        if (!vendaId) { pushToast("Mesa sem venda para fechar", "error"); return; }
        setFinalizando(true);
        try {
            const r = await fetch(`${VENDAS_API}/${vendaId}/fechar`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any }, body: JSON.stringify({ forma_pagamento: forma.toUpperCase(), dinheiro_recebido: recebidoNum || 0 }) });
            const txt = await r.text(); let data: any = {}; try { data = JSON.parse(txt); } catch { data = { detail: txt }; } if (!r.ok) throw new Error(data.detail || "Erro ao fechar");
            setUltimaVenda({...data, mesa_numero: mesa.numero }); setShowPay(false); setShowConfirm(true); pushToast(`Mesa ${mesa.numero} fechada!`, "success");
        } catch (e: any) { pushToast(e.message, "error"); } finally { setFinalizando(false); }
    };

    const imprimirContaParcial = async (mesa: any) => {
        const vendaId = mesa.venda_atual_id || vendaMesa?.id; if (!vendaId) { pushToast("Mesa sem consumo ainda", "info"); return; }
        try {
            const r = await fetch(`${VENDAS_API}/${vendaId}`, { headers: getAuthHeaders() as any }); let venda = vendaMesa; if (r.ok) venda = await r.json();
            const consumo = Number(venda?.total || mesa.venda_total || 0); const pendente = mesaSelecionada?.id === mesa.id? total : 0;
            const win = window.open("", "_blank", "width=320,height=600"); if (!win) return;
            const itensHtml = (venda?.itens || []).map((i: any) => `<tr><td>${i.nome_produto || i.produto_nome} x${i.quantidade}</td><td style="text-align:right">Kz ${Number(i.total || 0).toLocaleString("de-DE")}</td></tr>`).join("");
            win.document.write(`<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px}.line{border-top:1px dashed #000;margin:8px 0}</style></head><body><div style="text-align:center;font-weight:bold">CONTA PARCIAL Mesa ${mesa.numero}</div><div class="line"></div><table>${itensHtml}</table><div class="line"></div><div>Consumo: Kz ${consumo.toLocaleString("de-DE")}${pendente > 0? `<br/>Pendente: Kz ${pendente.toLocaleString("de-DE")}` : ""}<br/>Total: Kz ${(consumo + pendente).toLocaleString("de-DE")}</div><script>window.print();window.close();</script></body></html>`); win.document.close();
        } catch { pushToast("Erro ao imprimir", "error"); }
    };

    const imprimirFaturaFinal = () => {
        const v = ultimaVenda; if (!v) return; const win = window.open("", "_blank", "width=320,height=600"); if (!win) return;
        const isMesa =!!v.mesa_numero ||!!mesaParaFechar; const itens = v.itens || cart;
        const itensHtml = itens.map((i: any) => { const nome = i.nome_produto || i.produto_nome || i.nome || i.name; const qtd = i.quantidade || i.qtd; const tot = i.total || i.subtotal || (i.price * i.qtd) || 0; return `<tr><td>${nome} x${qtd}</td><td style="text-align:right">Kz ${Number(tot).toLocaleString("de-DE")}</td></tr>`; }).join("");
        const totalFinal = Number(v.total || total).toLocaleString("de-DE"); const titulo = isMesa? `FATURA MESA ${v.mesa_numero || mesaParaFechar?.numero || ""}` : `FATURA #${v.numero || ""}`;
        win.document.write(`<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%}</style></head><body><div class="center bold">${titulo}<br/>#${v.numero || ""}</div><div class="line"></div><table>${itensHtml}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${totalFinal}</td></tr></table><script>window.print();</script></body></html>`); win.document.close();
    };

    const aposVenda = (comRecibo: boolean) => {
        if (comRecibo) imprimirFaturaFinal(); setShowConfirm(false); setShowPay(false); setCart([]); setRecebido(""); setUltimaVenda(null); setMesaSelecionada(null); setMesaParaFechar(null); setVendaMesa(null); if (mesaParaFechar) fetchMesasOcupadas();
    };

    const filteredByCat = activeCat === "All"? dbProducts : activeCat === "Mesas"? [] : dbProducts.filter((p) => (p.categoria || "").toLowerCase() === activeCat.toLowerCase());
    const totalFechamento = Number(mesaParaFechar?.venda_total || mesaParaFechar?.total || vendaMesa?.total || 0) + (mesaParaFechar?.id === mesaSelecionada?.id? total : 0);

    return (
        <div className="h-full w-full flex flex-col bg-[#EDEBE6] overflow-hidden relative" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            <Toasts toasts={toasts} setToasts={setToasts} />
            <div className="h-[52px] px-3 flex items-center justify-between shrink-0">
                <div className="bg-white rounded-full h-9 px-1.5 flex items-center gap-2 border border-[#E2EADF]">
                    <span className="text-[11px] font-bold px-2">Modo Mesas</span>
                    <button onClick={() => setModoMesa(!modoMesa)} className={`w-[38px] h-[24px] rounded-full p-0.5 flex items-center transition-all ${modoMesa? "bg-black" : "bg-[#E5E1D8]"}`}><div className={`w-5 h-5 rounded-full bg-white shadow transition-all ${modoMesa? "translate-x-[14px]" : "translate-x-0"}`} /></button>
                </div>
                <button onClick={onClose} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center"><X size={14} /></button>
            </div>

            {/* SEM BG, SEM PADDING EXTRA NA SEÇÃO PRODUTOS */}
            <div className="flex-1 flex flex-col lg:flex-row gap-3 px-3 pb-3 overflow-hidden min-h-0">
                {/* PRODUTOS - SEM BG */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {modoMesa && <div className="mb-3 shrink-0"><PedidosQrPendentes onAprovado={() => { fetchMesasOcupadas(); }} /></div>}
                    <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
                        <ProdutosSection dbProducts={dbProducts} filteredByCat={filteredByCat} loadingProd={loadingProd} cats={cats} activeCat={activeCat} setActiveCat={setActiveCat} searchV={searchV} setSearchV={setSearchV} showSearch={showSearch} setShowSearch={setShowSearch} searchRef={searchRef} getQty={getQty} getStockState={getStockState} add={add} modoMesa={modoMesa} mesasOcupadas={mesasOcupadas} loadingMesas={loadingMesas} mesaSelecionada={mesaSelecionada} onSelectMesa={selecionarMesa} fetchMesas={fetchMesasOcupadas} cart={cart} cartTotal={total} onFecharMesa={(m: any) => { setMesaParaFechar(m); setRecebido(String(Number(m.venda_total || m.total || 0) + (m.id === mesaSelecionada?.id? total : 0))); setShowPay(true); }} onImprimirConta={imprimirContaParcial} />
                    </div>
                </div>

                {/* CARRINHO - SÓ BORDAS, SEM DIV EXTRA DE BG */}
                <div className="lg:w-[360px] h-full shrink-0 flex flex-col bg-white rounded-[16px] border border-[#E2EADF] overflow-hidden">
                    <div className="shrink-0 px-4 h-[44px] flex items-center justify-between border-b border-[#E2EADF]">
                        <p className="text-[12px] font-bold">Seu pedido</p>
                        <span className="w-6 h-6 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cart.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 flex flex-col gap-2 min-h-0">
                        {cart.map((item: any, idx: number) => (
                            <div key={`${item.id}-${idx}`} className="flex justify-between items-start px-3 py-2.5 rounded-[10px] border border-[#E8EFE6]">
                                <div className="pr-2 min-w-0"><p className="text-[11px] font-semibold truncate max-w-[160px]">{item.name}</p><p className="text-[10px] text-[#9A9A9A]">x{item.qtd}</p></div>
                                <span className="text-[11px] font-bold shrink-0">Kz {(item.price * item.qtd).toLocaleString("de-DE")}</span>
                            </div>
                        ))}
                    </div>

                    <div className="shrink-0 border-t border-[#E2EADF] p-3 flex flex-col gap-2 sticky bottom-0 bg-white">
                        <div className="flex items-center justify-between border border-[#E2EADF] rounded-[10px] px-3 h-9">
                            <select value={forma} onChange={(e) => setForma(e.target.value as any)} className="flex-1 bg-transparent text-[11px] font-bold outline-none">
                                <option value="dinheiro">Dinheiro</option>
                                <option value="transferencia">Transferência</option>
                                <option value="tpa">TPA</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] text-[#8A8A8A]">Total</span>
                            <span className="text-[13px] font-black">Kz {total.toLocaleString("de-DE")}</span>
                        </div>
                        {mesaSelecionada? (
                            <div className="flex gap-2">
                                <button onClick={() => { setMesaSelecionada(null); setCart([]); setVendaMesa(null); }} className="flex-1 h-9 rounded-full border border-[#E2EADF] text-[11px] font-bold">Limpar</button>
                                <button onClick={adicionarNaMesa} disabled={finalizando || cart.length === 0} className="flex-[2] h-9 rounded-full bg-black text-white text-[11px] font-bold disabled:opacity-50" style={{ paddingTop: '2px', paddingBottom: '2px' }}>{finalizando? "..." : `Lançar Mesa ${mesaSelecionada.numero}`}</button>
                            </div>
                        ) : (
                            <button onClick={() => { setRecebido(String(total)); setShowPay(true); }} disabled={cart.length === 0} className="w-full h-9 rounded-full bg-black text-white text-[11px] font-bold disabled:opacity-40" style={{ paddingTop: '2px', paddingBottom: '2px' }}>Finalizar - Kz {total.toLocaleString("de-DE")}</button>
                        )}
                    </div>
                </div>
            </div>

            <PayModal showPay={showPay} setShowPay={(v: boolean) => { if (!v) setMesaParaFechar(null); setShowPay(v); }} total={mesaParaFechar? totalFechamento : total} forma={forma} recebido={recebido} recebidoNum={recebidoNum} troco={recebidoNum - (mesaParaFechar? totalFechamento : total)} handleCalc={handleCalc} setShowConfirm={mesaParaFechar? fecharContaMesa : finalizarBalcao} loading={finalizando} isMesa={!!mesaParaFechar} mesaNumero={mesaParaFechar?.numero} />
            <ConfirmModal showConfirm={showConfirm} setShowConfirm={setShowConfirm} total={mesaParaFechar? totalFechamento : total} forma={forma} troco={recebidoNum - (mesaParaFechar? totalFechamento : total)} imprimirFatura={() => aposVenda(true)} onSemRecibo={() => aposVenda(false)} vendaNumero={ultimaVenda?.numero} isMesa={!!mesaParaFechar} mesaNumero={ultimaVenda?.mesa_numero || mesaParaFechar?.numero} />
            <style jsx global>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
        </div>
    );
}
