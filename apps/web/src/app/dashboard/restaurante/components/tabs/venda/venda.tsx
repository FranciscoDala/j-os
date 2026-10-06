"use client";
import { useState, useEffect, useRef } from "react";
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

    const [mesaSelecionada, setMesaSelecionada] = useState<any>(null);
    const [vendaMesa, setVendaMesa] = useState<any>(null);
    const [pedidoQrAtivo, setPedidoQrAtivo] = useState<any>(null);
    const [mostrarCatalogoExtra, setMostrarCatalogoExtra] = useState(false);
    const PEDIDOS_QR_API = `${API_URL}/api/v1/pedidos-qr`;
    const qrProcessadoRef = useRef<string | null>(null);

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
            const idQr = dados.id || dados.pedido_id;
            if (qrProcessadoRef.current === idQr) return;
            qrProcessadoRef.current = idQr;
            setPedidoQrAtivo(dados);
            setMostrarCatalogoExtra(false);
            (async () => {
                const empresaId = getEmpresaId();
                if (!empresaId) return;
                const r = await fetch(`${MESAS_API}/${empresaId}`, { headers: getAuthHeaders() as any });
                if (r.ok) {
                    const mesas = await r.json();
                    const mesa = mesas.find((m: any) => m.id === dados.mesa_id || m.numero === dados.mesa_numero || m.id === dados.mesa?.id || m.numero === dados.mesa?.numero);
                    if (mesa) {
                        setMesaSelecionada(mesa);
                        setVendaMesa(mesa.venda_atual_id? { id: mesa.venda_atual_id } : null);
                        if (dados.itens?.length) {
                            const cartItens = dados.itens.map((it: any) => ({
                                id: it.produto_id || it.produto?.id || it.id,
                                name: it.produto_nome || it.nome,
                                price: Number(it.preco_unit || it.preco || it.preco_venda || 0),
                                img: "", qtd: Number(it.quantidade || 1), origem: "qr" as const
                            }));
                            setCart(cartItens);
                            pushToast(`MESA ${mesa.numero} - ${dados.cliente_nome} • ${cartItens.length} itens`, "success");
                        }
                    }
                }
            })();
        } catch { }
    }, []);

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

    const cats = ["All",...catsDb];
    const getStockState = (p: any) => { if (!p.controlar_stock) return "ok"; const atual = Number(p.stock_atual?? 0); if (atual <= 0) return "zero"; if (atual <= 5) return "low"; return "ok"; };
    const add = (p: any) => {
        const state = getStockState(p);
        if (state === "zero") { pushToast(`Sem stock: "${p.nome}"`, "error"); return; }
        const ex = cart.find((c) => c.id === p.id);
        if (ex) setCart(cart.map((c) => (c.id === p.id? {...c, qtd: c.qtd + 1 } : c)));
        else setCart([...cart, { id: p.id, name: p.nome, price: Number(p.preco_venda) || 0, img: p.imagem_url? `${API_URL}${p.imagem_url}` : "", qtd: 1, origem: pedidoQrAtivo? "extra" : "balcao" }]);
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
        if (!mesaSelecionada || cart.length === 0 || finalizando) return;
        const vendaId = mesaSelecionada.venda_atual_id || vendaMesa?.id;
        setFinalizando(true);
        try {
            if (!vendaId) {
                const rCreate = await fetch(`${VENDAS_API}/`, {
                    method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any },
                    body: JSON.stringify({ mesa_id: mesaSelecionada.id, itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })), dinheiro_recebido: 0, forma_pagamento: "DINHEIRO", pessoas: mesaSelecionada.pessoas_atual || 1, modo: "mesa" })
                });
                const txt = await rCreate.text(); let data: any = {}; try { data = JSON.parse(txt); } catch { data = { detail: txt }; }
                if (!rCreate.ok) throw new Error(data.detail || "Erro ao criar comanda");
                if (pedidoQrAtivo) {
                    const idQr = pedidoQrAtivo.id || pedidoQrAtivo.pedido_id;
                    await fetch(`${PEDIDOS_QR_API}/${idQr}/aprovar`, { method: "POST", headers: getAuthHeaders() as any });
                    window.dispatchEvent(new CustomEvent("pedido-qr:aprovado", { detail: { id: idQr } }));
                    localStorage.removeItem("atender_mesa_qr"); setPedidoQrAtivo(null); qrProcessadoRef.current = null; setMostrarCatalogoExtra(false);
                }
                pushToast(`Mesa ${mesaSelecionada.numero} +Kz ${total.toLocaleString("de-DE")}`, "success");
                setCart([]); setMesaSelecionada(null); setVendaMesa(null); setActiveCat("All"); return;
            }
            const r = await fetch(`${VENDAS_API}/${vendaId}/itens`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any }, body: JSON.stringify({ itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })) }) });
            const txt = await r.text(); let data: any = {}; try { data = JSON.parse(txt); } catch { data = { detail: txt }; }
            if (!r.ok) throw new Error(data.detail || "Erro ao adicionar na mesa");
            if (pedidoQrAtivo) {
                const idQr = pedidoQrAtivo.id || pedidoQrAtivo.pedido_id;
                await fetch(`${PEDIDOS_QR_API}/${idQr}/aprovar`, { method: "POST", headers: getAuthHeaders() as any });
                window.dispatchEvent(new CustomEvent("pedido-qr:aprovado", { detail: { id: idQr } }));
                localStorage.removeItem("atender_mesa_qr"); setPedidoQrAtivo(null); qrProcessadoRef.current = null; setMostrarCatalogoExtra(false);
            }
            pushToast(`Mesa ${mesaSelecionada.numero} +Kz ${total.toLocaleString("de-DE")}`, "success");
            setCart([]); setMesaSelecionada(null); setVendaMesa(null); setActiveCat("All");
        } catch (e: any) { pushToast(e.message, "error"); } finally { setFinalizando(false); }
    };

    const finalizarBalcao = async () => {
        if (cart.length === 0) return;
        if (forma === "dinheiro" && recebidoNum < total) { pushToast("Valor insuficiente", "error"); return; }
        setFinalizando(true);
        try {
            const payload = { itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })), forma_pagamento: forma.toUpperCase(), dinheiro_recebido: forma === "dinheiro"? recebidoNum : total, mesa_id: null, modo: "balcao" };
            const r = await fetch(`${VENDAS_API}/`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any }, body: JSON.stringify(payload) });
            const txt = await r.text(); let data: any = {}; try { data = JSON.parse(txt) } catch { data = { detail: txt } }; if (!r.ok) throw new Error(data.detail || "Erro");
            setUltimaVenda(data); setShowPay(false); setShowConfirm(true);
        } catch (e: any) { pushToast(e.message, "error"); } finally { setFinalizando(false); }
    };

    const imprimirFaturaFinal = () => {
        const v = ultimaVenda; if (!v) return;
        const win = window.open("", "_blank", "width=320,height=600"); if (!win) return;
        const itens = v.itens || cart;
        const itensHtml = itens.map((i: any) => { const nome = i.nome_produto || i.produto_nome || i.nome || i.name; const qtd = i.quantidade || i.qtd; const tot = i.total || i.subtotal || (i.price * i.qtd) || 0; return `<tr><td>${nome} x${qtd}</td><td style="text-align:right">Kz ${Number(tot).toLocaleString("de-DE")}</td></tr>`; }).join("");
        const totalFinal = Number(v.total || total).toLocaleString("de-DE");
        win.document.write(`<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%}</style></head><body><div class="center bold">FATURA #${v.numero || ""}<br/>#${v.numero || ""}</div><div class="line"></div><table>${itensHtml}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${totalFinal}</td></tr></table><script>window.print();</script></body></html>`);
        win.document.close();
    };
    const aposVenda = (comRecibo: boolean) => { if (comRecibo) imprimirFaturaFinal(); setShowConfirm(false); setShowPay(false); setCart([]); setRecebido(""); setUltimaVenda(null); setMesaSelecionada(null); setVendaMesa(null); };

    const produtosDoPedidoIds = pedidoQrAtivo?.itens?.map((it:any)=> it.produto_id || it.produto?.id) || [];
    const produtosFiltradosQr = pedidoQrAtivo? dbProducts.filter((p:any)=> produtosDoPedidoIds.includes(p.id)).length > 0? dbProducts.filter((p:any)=> produtosDoPedidoIds.includes(p.id)) : pedidoQrAtivo.itens.map((it:any)=>({ id: it.produto_id || it.id, nome: it.produto_nome || it.nome, preco_venda: it.preco_unit || it.preco || 0, categoria: "Pedido QR", imagem_url: it.produto_imagem_url || null, controlar_stock: false, _qtd_pedido: it.quantidade })) : [];
    const filteredByCatBase = activeCat === "All"? dbProducts : dbProducts.filter((p) => (p.categoria || "").toLowerCase() === activeCat.toLowerCase());
    const filteredByCat = pedidoQrAtivo &&!mostrarCatalogoExtra? produtosFiltradosQr : filteredByCatBase;

    return (
        <div className="h-full w-full flex flex-col bg-[#EDEBE6] overflow-hidden relative" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            <Toasts toasts={toasts} setToasts={setToasts} />
            <div className="h-[52px] px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    {mesaSelecionada? (<div className="bg-white rounded-full px-4 h-9 flex items-center text-[11px] font-bold shadow-[0_1px_6px_rgba(0,0,0,0.05)]">Mesa {mesaSelecionada.numero} {pedidoQrAtivo? `• ${pedidoQrAtivo.cliente_nome||''}` : ''}</div>) : (<div className="bg-white rounded-full px-4 h-9 flex items-center text-[11px] font-bold shadow-[0_1px_6px_rgba(0,0,0,0.05)]">Venda Balcão</div>)}
                </div>
                <button onClick={onClose} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center shadow-sm active:scale-[0.96]"><X size={14} /></button>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-[14px] p-[14px] pt-0 overflow-hidden min-h-0">
                {/* SEM BG E SEM PADDING - LIVRE */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    <ProdutosSection dbProducts={dbProducts} filteredByCat={filteredByCat} loadingProd={loadingProd} cats={cats} activeCat={activeCat} setActiveCat={setActiveCat} searchV={searchV} setSearchV={setSearchV} showSearch={showSearch} setShowSearch={setShowSearch} searchRef={searchRef} getQty={getQty} getStockState={getStockState} add={add} modoMesa={false} mesasOcupadas={[]} loadingMesas={false} mesaSelecionada={null} onSelectMesa={()=>{}} fetchMesas={()=>{}} cart={cart} cartTotal={total} onFecharMesa={()=>{}} onImprimirConta={()=>{}} pedidoQrAtivo={pedidoQrAtivo} mostrarCatalogoExtra={mostrarCatalogoExtra} setMostrarCatalogoExtra={setMostrarCatalogoExtra} />
                </div>
                <div className="lg:w-[340px] shrink-0 overflow-hidden bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col">
                    <CarrinhoSection cart={cart} total={total} forma={forma} setForma={setForma} setShowPay={setShowPay} setRecebido={setRecebido} mesaSelecionada={mesaSelecionada} onAddMesa={adicionarNaMesa} onLimparMesa={() => { if(pedidoQrAtivo){ localStorage.removeItem("atender_mesa_qr"); setPedidoQrAtivo(null); qrProcessadoRef.current = null; setMostrarCatalogoExtra(false); } setMesaSelecionada(null); setCart([]); setVendaMesa(null); }} finalizando={finalizando} pedidoQrAtivo={pedidoQrAtivo} />
                </div>
            </div>
            <PayModal showPay={showPay} setShowPay={setShowPay} total={total} forma={forma} recebido={recebido} recebidoNum={recebidoNum} troco={recebidoNum - total} handleCalc={handleCalc} setShowConfirm={finalizarBalcao} loading={finalizando} isMesa={false} mesaNumero={null} />
            <ConfirmModal showConfirm={showConfirm} setShowConfirm={setShowConfirm} total={total} forma={forma} troco={recebidoNum - total} imprimirFatura={() => aposVenda(true)} onSemRecibo={() => aposVenda(false)} vendaNumero={ultimaVenda?.numero} isMesa={false} mesaNumero={null} />
        </div>
    );
}
