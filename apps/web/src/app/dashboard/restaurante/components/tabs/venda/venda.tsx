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
    const [fecharMesaAtiva, setFecharMesaAtiva] = useState<any>(null);
    const [mostrarCatalogoExtra, setMostrarCatalogoExtra] = useState(false);
    const PEDIDOS_QR_API = `${API_URL}/api/v1/pedidos-qr`;
    const qrProcessadoRef = useRef<string | null>(null);
    const adicionandoRef = useRef(false);

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
            setFecharMesaAtiva(null);
            setMostrarCatalogoExtra(false);
            setCart([]);
            (async () => {
                const empresaId = getEmpresaId();
                if (!empresaId) return;
                const r = await fetch(`${MESAS_API}/${empresaId}`, { headers: getAuthHeaders() as any });
                if (r.ok) {
                    const mesas = await r.json();
                    const mesa = mesas.find((m: any) => m.id === dados.mesa_id || m.numero === dados.mesa_numero);
                    if (mesa) {
                        setMesaSelecionada(mesa);
                        setVendaMesa(mesa.venda_atual_id? { id: mesa.venda_atual_id } : null);
                        if (dados.itens?.length) {
                            const cartItens = dados.itens.map((it: any) => ({
                                id: it.produto_id || it.produto?.id || it.id,
                                name: it.produto_nome || it.nome,
                                price: Number(it.preco_unit || it.preco || it.preco_venda || 0),
                                img: "",
                                qtd: Number(it.quantidade || 1),
                                origem: "qr" as const
                            }));
                            setCart(cartItens);
                        }
                    }
                }
            })();
        } catch { }
    }, []);

    useEffect(() => {
        const raw = localStorage.getItem("fechar_mesa");
        if (!raw) return;
        try {
            const dados = JSON.parse(raw);
            setFecharMesaAtiva(dados);
            setPedidoQrAtivo(null);
            setMesaSelecionada({ id: dados.mesa_id, numero: dados.mesa_numero, venda_atual_id: dados.venda_id });
            setMostrarCatalogoExtra(false);
            setCart([]);
            (async () => {
                try {
                    const r = await fetch(`${VENDAS_API}/${dados.venda_id}`, { headers: getAuthHeaders() as any, cache: "no-store" as any });
                    const venda = await r.json();
                    if (!r.ok) throw new Error(venda.detail || "Erro ao buscar venda");
                    setVendaMesa(venda);
                    const cartItens = (venda.itens || []).map((it: any) => ({
                        id: it.produto_id,
                        name: it.nome_produto || it.produto_nome || it.nome,
                        price: Number(it.preco_unit || 0),
                        img: "",
                        qtd: Number(it.quantidade || 1),
                        origem: "mesa" as const,
                    }));
                    setCart(cartItens);
                } catch (e: any) { pushToast(e.message, "error"); }
            })();
        } catch { }
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.key === "/" &&!(e.target instanceof HTMLInputElement)) || (e.ctrlKey && e.key.toLowerCase() === "k")) {
                e.preventDefault(); setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 80);
            }
            if (e.key === "Escape" && showSearch) { setShowSearch(false); setSearchV(""); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showSearch]);

    useEffect(() => { if (showSearch) setTimeout(() => searchRef.current?.focus(), 50); }, [showSearch]);

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
            try { const r = await fetch(`${API_BASE}/categorias/lista`, { headers: getAuthHeaders() as any }); if (r.ok) setCatsDb(await r.json()); } catch { }
        }; fetchCats();
    }, []);

    const cats = ["All",...catsDb];
    const getStockState = (p: any) => { if (!p.controlar_stock) return "ok"; const atual = Number(p.stock_atual?? 0); if (atual <= 0) return "zero"; if (atual <= 5) return "low"; return "ok"; };

    const add = (p: any) => {
        if (fecharMesaAtiva) return;
        const state = getStockState(p);
        if (state === "zero") { pushToast(`Sem stock: "${p.nome}"`, "error"); return; }
        setCart(prev => {
            const ex = prev.find((c) => c.id === p.id);
            if (ex) return prev.map((c) => (c.id === p.id? {...c, qtd: c.qtd + 1 } : c));
            return [...prev, { id: p.id, name: p.nome, price: Number(p.preco_venda) || 0, img: p.imagem_url? `${API_URL}${p.imagem_url}` : "", qtd: 1, origem: pedidoQrAtivo? "extra" : "balcao" }];
        });
    };

    const removerDoCarrinho = (id: string) => {
        if (fecharMesaAtiva) return;
        setCart(prev => prev.filter((c: any) => c.id!== id));
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

    // NOVO FLUXO: SE TEM pedidoQrAtivo, SÓ CHAMA APROVAR. BACKEND CRIA A VENDA.
    const adicionarNaMesa = async () => {
        if (!mesaSelecionada || cart.length === 0 || finalizando || adicionandoRef.current) return;
        adicionandoRef.current = true;
        setFinalizando(true);
        try {
            // CASO QR - CLIENTE NÃO PODE ADD DIRETO, SÓ GARÇOM APROVANDO
            if (pedidoQrAtivo) {
                const idQr = pedidoQrAtivo.id || pedidoQrAtivo.pedido_id;
                const itensQr = cart.filter((c:any)=> c.origem === "qr");
                const itensExtra = cart.filter((c:any)=> c.origem === "extra");

                // 1. APROVA - backend cria venda com itensQr
                const rAprovar = await fetch(`${PEDIDOS_QR_API}/${idQr}/aprovar`, { method: "POST", headers: getAuthHeaders() as any });
                const txtA = await rAprovar.text(); let dataA:any={}; try{ dataA=JSON.parse(txtA);}catch{ dataA={detail:txtA};}
                if (!rAprovar.ok) throw new Error(dataA.detail || "Erro ao aprovar pedido QR");
                const vendaId = dataA.venda_id || mesaSelecionada.venda_atual_id || vendaMesa?.id;

                // 2. SE TEM EXTRA ADICIONADO PELO GARÇOM, ADICIONA NA MESMA VENDA
                if (itensExtra.length > 0 && vendaId) {
                    const seen = new Set<string>();
                    const itensUnicosExtra = itensExtra.filter((c:any)=>{ if(seen.has(c.id)) return false; seen.add(c.id); return true; }).map((c:any)=>({ produto_id: c.id, quantidade: Number(c.qtd||1) }));
                    if (itensUnicosExtra.length > 0) {
                        await fetch(`${VENDAS_API}/${vendaId}/itens`, { method:"POST", headers:{"Content-Type":"application/json",...getAuthHeaders() as any}, body: JSON.stringify({ itens: itensUnicosExtra }) });
                    }
                }

                window.dispatchEvent(new CustomEvent("pedido-qr:aprovado", { detail: { id: idQr } }));
                localStorage.removeItem("atender_mesa_qr");
                pushToast(`Mesa ${mesaSelecionada.numero} • Pedido aprovado`, "success");
                setCart([]); setMesaSelecionada(null); setVendaMesa(null); setPedidoQrAtivo(null); qrProcessadoRef.current=null; setActiveCat("All");
                return;
            }

            // CASO MESA NORMAL (SEM QR) - FLUXO ANTIGO
            const vendaId = mesaSelecionada.venda_atual_id || vendaMesa?.id;
            const seen = new Set<string>();
            const itensUnicos = cart.filter((c:any)=>{ if(seen.has(c.id)) return false; seen.add(c.id); return true; }).map((c:any)=>({ produto_id: c.id, quantidade: Number(c.qtd||1) }));

            if (!vendaId) {
                const rCreate = await fetch(`${VENDAS_API}/`, { method:"POST", headers:{"Content-Type":"application/json",...getAuthHeaders() as any}, body: JSON.stringify({ mesa_id: mesaSelecionada.id, itens: itensUnicos, dinheiro_recebido:0, forma_pagamento:"DINHEIRO", pessoas: mesaSelecionada.pessoas_atual||1, modo:"mesa" }) });
                if (!rCreate.ok) throw new Error(await rCreate.text());
                pushToast(`Mesa ${mesaSelecionada.numero} • ${itensUnicos.length} itens`, "success");
                setCart([]); setMesaSelecionada(null); setVendaMesa(null); setActiveCat("All");
                return;
            }
            const r = await fetch(`${VENDAS_API}/${vendaId}/itens`, { method:"POST", headers:{"Content-Type":"application/json",...getAuthHeaders() as any}, body: JSON.stringify({ itens: itensUnicos }) });
            if (!r.ok) throw new Error(await r.text());
            pushToast(`Mesa ${mesaSelecionada.numero} • ${itensUnicos.length} itens`, "success");
            setCart([]); setMesaSelecionada(null); setVendaMesa(null); setActiveCat("All");

        } catch (e: any) { pushToast(e.message, "error"); } finally {
            setFinalizando(false);
            setTimeout(() => { adicionandoRef.current = false; }, 1200);
        }
    };

    const finalizarBalcao = async () => {
        if (cart.length === 0 || adicionandoRef.current) return;
        if (forma === "dinheiro" && recebidoNum < total) { pushToast("Valor insuficiente", "error"); return; }
        adicionandoRef.current = true;
        setFinalizando(true);
        try {
            const seen = new Set<string>();
            const itensUnicos = cart.filter((c: any) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; }).map(c => ({ produto_id: c.id, quantidade: c.qtd }));
            const payload = { itens: itensUnicos, forma_pagamento: forma.toUpperCase(), dinheiro_recebido: forma === "dinheiro"? recebidoNum : total, mesa_id: null, modo: "balcao" };
            const r = await fetch(`${VENDAS_API}/`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any }, body: JSON.stringify(payload) });
            const txt = await r.text(); let data: any = {}; try { data = JSON.parse(txt) } catch { data = { detail: txt } }; if (!r.ok) throw new Error(data.detail || "Erro");
            setUltimaVenda(data); setShowPay(false); setShowConfirm(true);
        } catch (e: any) { pushToast(e.message, "error"); } finally { setFinalizando(false); setTimeout(() => { adicionandoRef.current = false; }, 1000); }
    };

    const fecharMesaFinal = async () => {
        if (!fecharMesaAtiva || cart.length === 0) return;
        if (forma === "dinheiro" && recebidoNum < total) { pushToast("Valor insuficiente", "error"); return; }
        setFinalizando(true);
        try {
            const vendaId = fecharMesaAtiva.venda_id;
            const r = await fetch(`${VENDAS_API}/${vendaId}/fechar`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any }, body: JSON.stringify({ forma_pagamento: forma.toUpperCase(), dinheiro_recebido: forma === "dinheiro"? recebidoNum : total }) });
            const txt = await r.text(); let data: any = {}; try { data = JSON.parse(txt) } catch { data = { detail: txt } }
            if (!r.ok) throw new Error(data.detail || "Erro ao fechar mesa");
            setUltimaVenda({...data, mesa_numero: fecharMesaAtiva.mesa_numero }); setShowPay(false); setShowConfirm(true); localStorage.removeItem("fechar_mesa"); window.dispatchEvent(new CustomEvent("mesa:update"));
        } catch (e: any) { pushToast(e.message, "error"); } finally { setFinalizando(false); }
    };

    const imprimirFaturaFinal = () => {
        const v = ultimaVenda; if (!v) return;
        const win = window.open("", "_blank", "width=320,height=600"); if (!win) return;
        const itens = v.itens || cart;
        const itensHtml = itens.map((i: any) => { const nome = i.nome_produto || i.produto_nome || i.nome || i.name; const qtd = i.quantidade || i.qtd; const tot = i.total || i.subtotal || (i.price * i.qtd) || 0; return `<tr><td>${nome} x${qtd}</td><td style="text-align:right">Kz ${Number(tot).toLocaleString("de-DE")}</td></tr>`; }).join("");
        const totalFinal = Number(v.total || total).toLocaleString("de-DE");
        win.document.write(`<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%}</style></head><body><div class="center bold">FATURA #${v.numero || ""}<br/>MESA ${v.mesa_numero || fecharMesaAtiva?.mesa_numero || ""}</div><div class="line"></div><table>${itensHtml}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${totalFinal}</td></tr></table><script>window.print();</script></body></html>`);
        win.document.close();
    };
    const aposVenda = (comRecibo: boolean) => {
        if (comRecibo) imprimirFaturaFinal();
        setShowConfirm(false); setShowPay(false); setCart([]); setRecebido(""); setUltimaVenda(null); setMesaSelecionada(null); setVendaMesa(null); setPedidoQrAtivo(null); setFecharMesaAtiva(null); localStorage.removeItem("atender_mesa_qr"); localStorage.removeItem("fechar_mesa"); qrProcessadoRef.current = null; adicionandoRef.current = false;
    };
    const cancelarTudo = () => {
        localStorage.removeItem("atender_mesa_qr"); localStorage.removeItem("fechar_mesa");
        setPedidoQrAtivo(null); setFecharMesaAtiva(null); qrProcessadoRef.current = null; setMesaSelecionada(null); setCart([]); setVendaMesa(null); adicionandoRef.current = false;
    };

    const produtosDoPedidoIds = pedidoQrAtivo?.itens?.map((it: any) => it.produto_id || it.produto?.id) || [];
    const produtosFiltradosQr = pedidoQrAtivo? dbProducts.filter((p: any) => produtosDoPedidoIds.includes(p.id)).length > 0? dbProducts.filter((p: any) => produtosDoPedidoIds.includes(p.id)) : pedidoQrAtivo.itens.map((it: any) => ({ id: it.produto_id || it.id, nome: it.produto_nome || it.nome, preco_venda: it.preco_unit || it.preco || 0, categoria: "Pedido QR", imagem_url: it.produto_imagem_url || null, controlar_stock: false })) : [];
    const filteredByCatBase = activeCat === "All"? dbProducts : dbProducts.filter((p) => (p.categoria || "").toLowerCase() === activeCat.toLowerCase());
    const filteredByCat = fecharMesaAtiva? [] : (pedidoQrAtivo &&!mostrarCatalogoExtra? produtosFiltradosQr : filteredByCatBase);
    const modoFecharMesa =!!fecharMesaAtiva;
    const isMesa =!!mesaSelecionada;

    return (
        <div className="h-full w-full flex flex-col bg-[#EDEBE6] overflow-hidden relative" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            <Toasts toasts={toasts} setToasts={setToasts} />
            <div className="h-[56px] px-4 flex items-center justify-between shrink-0 border-b border-[#026135a0] bg-[#EDEBE6]">
                <h1 className="text-[20px] font-black tracking-tight text-black leading-none">{fecharMesaAtiva? `Fechar Mesa ${fecharMesaAtiva.mesa_numero}` : mesaSelecionada? `Mesa ${mesaSelecionada.numero}` : "Balcão"}</h1>
                <button onClick={onClose} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center shadow-sm active:scale-[0.96]"><X size={14} /></button>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row gap-4 px-4 pb-4 pt-3 overflow-hidden min-h-0">
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {modoFecharMesa? (
                        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-8 text-center bg-white rounded-[18px] border border-dashed">
                            <p className="font-black text-[14px]">Mesa {fecharMesaAtiva.mesa_numero} • {cart.length} itens</p>
                            <p className="text-[12px] text-zinc-500 mt-1 font-bold">Conferindo consumo • Não é permitido adicionar produtos</p>
                            <p className="text-[30px] font-black text-[#2F4A8A] mt-4">Kz {total.toLocaleString("de-DE")}</p>
                        </div>
                    ) : (
                        <ProdutosSection dbProducts={dbProducts} filteredByCat={filteredByCat} loadingProd={loadingProd} cats={cats} activeCat={activeCat} setActiveCat={setActiveCat} searchV={searchV} setSearchV={setSearchV} showSearch={showSearch} setShowSearch={setShowSearch} searchRef={searchRef} getQty={getQty} getStockState={getStockState} add={add} modoMesa={false} mesasOcupadas={[]} loadingMesas={false} mesaSelecionada={null} onSelectMesa={() => { }} fetchMesas={() => { }} cart={cart} cartTotal={total} onFecharMesa={() => { }} onImprimirConta={() => { }} pedidoQrAtivo={pedidoQrAtivo} mostrarCatalogoExtra={mostrarCatalogoExtra} setMostrarCatalogoExtra={setMostrarCatalogoExtra} />
                    )}
                </div>
                <div className="w-full lg:w-[340px] shrink-0 overflow-hidden bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col h-[42dvh] lg:h-full">
                    <CarrinhoSection cart={cart} total={total} forma={forma} setForma={setForma} setShowPay={setShowPay} setRecebido={setRecebido} mesaSelecionada={mesaSelecionada} onAddMesa={adicionarNaMesa} onLimparMesa={cancelarTudo} finalizando={finalizando} pedidoQrAtivo={pedidoQrAtivo} fecharMesaAtiva={fecharMesaAtiva} onRemoveItem={removerDoCarrinho} />
                </div>
            </div>
            <PayModal showPay={showPay} setShowPay={setShowPay} total={total} forma={forma} recebido={recebido} recebidoNum={recebidoNum} troco={recebidoNum - total} handleCalc={handleCalc} setShowConfirm={modoFecharMesa? fecharMesaFinal : finalizarBalcao} loading={finalizando} isMesa={isMesa || modoFecharMesa} mesaNumero={fecharMesaAtiva?.mesa_numero || mesaSelecionada?.numero || null} />
            <ConfirmModal showConfirm={showConfirm} setShowConfirm={setShowConfirm} total={total} forma={forma} troco={recebidoNum - total} imprimirFatura={() => aposVenda(true)} onSemRecibo={() => aposVenda(false)} vendaNumero={ultimaVenda?.numero} isMesa={!!fecharMesaAtiva || isMesa} mesaNumero={ultimaVenda?.mesa_numero || fecharMesaAtiva?.mesa_numero || mesaSelecionada?.numero || null} />
        </div>
    );
}
