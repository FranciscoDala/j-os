"use client";
import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { AlertTriangle, Ban, ShoppingBag, X, Search, QrCode, Clock3, Hourglass, Users } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200";
const getImgUrl = (url?: string) => {
    if (!url) return FALLBACK_IMG;
    if (url.startsWith("blob:")) return url;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/media")) return `${API_URL}${url}`;
    return url;
};

function PedirMesaInner() {
    const { empresaId, mesaNumero } = useParams() as { empresaId: string, mesaNumero: string };
    const searchParams = useSearchParams();
    const router = useRouter();
    const tokenParam = searchParams.get('t') || searchParams.get('token') || "";

    const [produtos, setProdutos] = useState<any[]>([]);
    const [cats, setCats] = useState<string[]>([]);
    const [catAtiva, setCatAtiva] = useState("All");
    const [nome, setNome] = useState("");
    const [tel, setTel] = useState("");
    const [cart, setCart] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [erroModal, setErroModal] = useState("");
    const [buscaOpen, setBuscaOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [expirado, setExpirado] = useState(false);

    const [bloqueada, setBloqueada] = useState(false);
    const [clienteBloqueio, setClienteBloqueio] = useState("");
    const [mesaQrToken, setMesaQrToken] = useState(tokenParam);
    const [mesaData, setMesaData] = useState<any>(null);

    const [pos, setPos] = useState({ x: 20, y: 400 });
    const dragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });
    const lastTap = useRef<{ id: string, time: number } | null>(null);

    const onTouchStart = (e: any) => {
        dragging.current = true;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        offset.current = { x: cx - pos.x, y: cy - pos.y };
    };
    const onTouchMove = (e: any) => {
        if (!dragging.current) return;
        const cx = e.touches ? e.touches[0].clientX : e.clientX;
        const cy = e.touches ? e.touches[0].clientY : e.clientY;
        setPos({ x: cx - offset.current.x, y: cy - offset.current.y });
    };
    const onTouchEnd = () => { dragging.current = false; };

    useEffect(() => {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
        }
    }, []);

    const fetchCardapio = useCallback(async (isPolling = false) => {
        if (!empresaId || !mesaNumero) return;
        const effectiveToken = mesaQrToken || tokenParam;
        const url = `${API_URL}/api/v1/public/${empresaId}/cardapio?mesa=${mesaNumero}&t=${effectiveToken}`;
        try {
            const r = await fetch(url);
            const text = await r.text();
            let data: any = {};
            try { data = JSON.parse(text); } catch { }
            if (r.status === 410) throw new Error("EXPIRADO");
            if (!r.ok) throw new Error(data.detail || "Cardápio não encontrado");
            if (data.mesa && data.mesa.token_valido === false) throw new Error("EXPIRADO");

            // pega token que o backend tem (importante pro modo grupo)
            if (data.mesa?.qr_token) {
                setMesaQrToken(data.mesa.qr_token);
            }
            setMesaData(data.mesa || null);

            setProdutos(data.produtos || []);
            if (!isPolling) {
                setCats(["All", ...(data.categorias || [])]);
            }

            if (data.mesa?.bloqueada && !data.mesa?.venda_atual_id) {
                // só trava se for primeiro pedido pendente
                setBloqueada(true);
                setClienteBloqueio(data.mesa.cliente_bloqueio || data.mesa.cliente_atual || "alguém");
            } else {
                setBloqueada(false);
                if (!data.mesa?.ocupada_por_outro) setClienteBloqueio("");
            }

            setLoading(false);
            return data;
        } catch (e: any) {
            if (e.message === "EXPIRADO" || e.message.toLowerCase().includes("expirou") || e.message.toLowerCase().includes("fechada")) {
                setExpirado(true);
            } else {
                if (!isPolling) setErroModal(e.message);
            }
            setLoading(false);
        }
    }, [empresaId, mesaNumero, tokenParam, mesaQrToken]);

    useEffect(() => {
        fetchCardapio(false);
    }, [fetchCardapio]);

    useEffect(() => {
        if (!bloqueada && !enviado) return;
        const interval = setInterval(() => {
            fetchCardapio(true).then(d => {
                if (d && !d.mesa?.bloqueada && enviado) {
                    setEnviado(false);
                }
                if (d && d.mesa?.ocupada_por_outro && d.mesa?.bloqueada === false) {
                    // liberou pra grupo
                    setBloqueada(false);
                }
            });
        }, 4000);
        return () => clearInterval(interval);
    }, [bloqueada, enviado, fetchCardapio]);

    const getStockState = (p: any) => {
        if (p.controlar_stock === false) return "ok";
        if (!p.controlar_stock) return "ok";
        const atual = Number(p.stock_atual ?? 0);
        const minimo = Number(p.stock_minimo ?? 0);
        if (atual <= 0) return "zero";
        if (atual <= minimo || atual <= 5) return "low";
        return "ok";
    };

    const add = (p: any) => {
        const state = getStockState(p);
        if (state === "zero" || p.ativo === false) return;
        setCart(prev => {
            const ex = prev.find(c => c.id === p.id);
            if (ex) return prev.map(c => c.id === p.id ? { ...c, qtd: c.qtd + 1 } : c);
            return [...prev, { id: p.id, nome: p.nome, preco: Number(p.preco || p.preco_venda), qtd: 1 }];
        });
    };
    const remove = (id: string) => setCart(cart.filter(c => c.id !== id));

    const handleCardTap = (p: any) => {
        const now = Date.now();
        if (lastTap.current && lastTap.current.id === p.id && now - lastTap.current.time < 350) {
            add(p);
            lastTap.current = null;
        } else {
            lastTap.current = { id: p.id, time: now };
        }
    };

    const total = cart.reduce((s, i) => s + i.preco * i.qtd, 0);
    const filtradosBase = catAtiva === "All" ? produtos : produtos.filter(p => p.categoria === catAtiva);
    const filtrados = query ? filtradosBase.filter(p => p.nome.toLowerCase().includes(query.toLowerCase())) : filtradosBase;
    const mesaLabel = String(mesaNumero || "").toUpperCase();

    const enviar = async () => {
        if (!nome.trim()) { setErroModal("Digite seu nome para o garçom te chamar"); return; }
        if (cart.length === 0) { setErroModal("Toque 2x nos pratos para adicionar"); return; }
        if (enviando) return; // trava duplo clique
        setEnviando(true);
        try {
            const effectiveToken = mesaQrToken || tokenParam;
            // FILTRA DUPLICADO SEM SOMAR - mantém qtd original
            const seen = new Set<string>();
            const itensUnicos = cart.filter(c => {
                if (seen.has(c.id)) return false;
                seen.add(c.id);
                return true;
            }).map(c => ({ produto_id: c.id, quantidade: c.qtd }));

            if (itensUnicos.length === 0) {
                setErroModal("Toque 2x nos pratos para adicionar");
                setEnviando(false);
                return;
            }

            const r = await fetch(`${API_URL}/api/v1/public/${empresaId}/pedido`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mesa_numero: mesaLabel, qr_token: effectiveToken, cliente_nome: nome.trim(), cliente_telefone: tel.trim() || null, itens: itensUnicos })
            });
            const txt = await r.text();
            if (r.status === 410) throw new Error("EXPIRADO");
            if (r.status === 423) {
                try { const j = JSON.parse(txt); setErroModal(j.detail); } catch { setErroModal(txt); }
                setBloqueada(true);
                await fetchCardapio(true);
                return;
            }
            if (!r.ok) {
                try { const j = JSON.parse(txt); throw new Error(j.detail || txt); }
                catch (e: any) {
                    if (e.message && e.message !== txt) throw e;
                    throw new Error(txt);
                }
            }
            setEnviado(true);
            setCart([]);
            setBloqueada(true);
            await fetchCardapio(true);
        } catch (e: any) {
            if (e.message === "EXPIRADO" || e.message.toLowerCase().includes("expirou")) setExpirado(true);
            else setErroModal(e.message);
        } finally { setEnviando(false); }
    };

    if (expirado) return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#F0F9FF] p-6">
            <div className="bg-white/90 backdrop-blur-xl rounded-[24px] p-6 shadow-[0_20px_60px_rgba(14,165,233,0.15)] border border-white max-w-[340px] w-full text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-sky-200">
                    <QrCode size={22} className="text-sky-600" />
                </div>
                <h1 className="font-black text-[13px] text-zinc-900 leading-tight">Mesa {mesaLabel} encerrada</h1>
                <p className="text-[11px] text-zinc-500 mt-2 leading-[1.4]">Este link expirou porque a conta foi fechada ou a mesa foi liberada.</p>
                <div className="mt-4 bg-sky-50 border border-sky-100 rounded-xl p-2.5 flex items-center gap-2 text-left">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm"><Clock3 size={14} className="text-sky-600" /></div>
                    <div><p className="text-[11px] font-bold text-zinc-800">O que fazer?</p><p className="text-[10px] text-zinc-500">Escaneie novamente o QR</p></div>
                </div>
            </div>
        </div>
    );

    // MESA OCUPADA POR OUTRO ANTES DE APROVAR - SUGERE MESAS LIVRES
    if (mesaData?.ocupada_por_outro) return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#F0F9FF] p-6 text-center">
            <div className="bg-white rounded-[24px] p-6 shadow-[0_20px_60px_rgba(14,165,233,0.15)] max-w-[360px] w-full border border-white">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200">
                    <Users size={22} className="text-orange-600" />
                </div>
                <h1 className="font-black text-[13px] text-zinc-900 leading-tight">Mesa {mesaLabel} ocupada</h1>
                <p className="text-[11px] text-zinc-600 mt-2 leading-[1.4]">Essa mesa está com pedido de <b>{mesaData.cliente_atual || clienteBloqueio}</b> aguardando aprovação do garçom.</p>
                <p className="text-[10px] text-zinc-400 mt-2">Procure outra mesa livre ou aguarde liberar.</p>

                {mesaData.mesas_livres && mesaData.mesas_livres.length > 0 && (
                    <div className="mt-5 text-left">
                        <p className="text-[10px] font-black text-zinc-700 mb-2">Mesas livres agora:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {mesaData.mesas_livres.map((m: any) => (
                                <button
                                    key={m.numero}
                                    onClick={() => router.push(`/pedir/${empresaId}/${m.numero}`)}
                                    className="bg-[#F5F7FB] hover:bg-black hover:text-white border border-zinc-100 rounded-xl p-2.5 transition-all active:scale-[0.97]"
                                >
                                    <p className="font-black text-[12px]">{m.numero}</p>
                                    <p className="text-[9px] opacity-70">{m.capacidade}p {m.zona ? `• ${m.zona}` : ''}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-5 bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center gap-2.5 text-left">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Clock3 size={14} className="text-orange-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[11px] font-bold text-zinc-800">Dica</p>
                        <p className="text-[10px] text-zinc-500">Se você é do mesmo grupo, aguarde o garçom aprovar que todos poderão pedir junto</p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (bloqueada) return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#F0F9FF] p-6 text-center">
            <div className="bg-white rounded-[24px] p-6 shadow-[0_20px_60px_rgba(14,165,233,0.15)] max-w-[340px] w-full border border-white">
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 animate-pulse">
                    <Hourglass size={22} className="text-amber-600" />
                </div>
                <h1 className="font-black text-[13px] text-zinc-900 leading-tight">Pedido em análise</h1>
                <p className="text-[11px] text-zinc-600 mt-2 leading-[1.4]">Mesa <b>{mesaLabel}</b> aguardando garçom aprovar o pedido de <b>{clienteBloqueio || nome || "você"}</b>.</p>
                <p className="text-[10px] text-zinc-400 mt-2">Depois que aprovar, você e seus amigos poderão mandar vários pedidos juntos na mesma conta.</p>
                <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2.5 text-left">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Clock3 size={14} className="text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[11px] font-bold text-zinc-800">Atualizando automaticamente</p>
                        <p className="text-[10px] text-zinc-500">Vamos liberar assim que aprovar</p>
                    </div>
                    <div className="w-5 h-5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-[9px] text-zinc-400 mt-4">Token: {(mesaQrToken || tokenParam || "").slice(0, 8)}... válido para esta ocupação</p>
            </div>
        </div>
    );

    if (enviado) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0F9FF] p-6 text-center">
            <div className="bg-white rounded-[16px] p-6 shadow-xl max-w-[320px] w-full border border-sky-100">
                <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3 text-[14px]">✓</div>
                <h1 className="font-black text-[12px]">Pedido enviado!</h1>
                <p className="text-[11px] text-zinc-500 mt-1">Mesa {mesaLabel} - o garçom já recebeu</p>
                <p className="text-[9px] text-zinc-400 mt-2">Aguardando aprovação para liberar novos pedidos...</p>
                <button onClick={() => { setEnviado(false); fetchCardapio(true); }} className="mt-4 w-full bg-black text-white rounded-full h-9 text-[11px] font-bold">Atualizar status</button>
            </div>
        </div>
    );
    if (loading) return <div className="p-8 text-center text-[11px] font-bold">Carregando cardápio...</div>;

    return (
        <div className="h-[100dvh] flex flex-col bg-[#F5F7FB] overflow-hidden">
            <style>{`
       .hide-scrollbar::-webkit-scrollbar{display:none}
       .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
          input, textarea, select {
            font-size: 16px!important;
            -webkit-text-size-adjust: 100%;
          }
       .input-visual {
            font-size: 11px!important;
          }
          @supports (-webkit-touch-callout: none) {
            input, textarea, select {
              font-size: 16px!important;
            }
          }
          html { touch-action: manipulation; }
            `}</style>

            <div className="bg-white border-b shrink-0 z-20">
                <div className="p-3 pb-2">
                    <div className="flex items-center justify-between">
                        <h1 className="font-black text-[12px]">MESA {mesaLabel} {mesaData?.venda_atual_id ? <span className="bg-emerald-100 text-emerald-700 text-[8px] px-2 py-0.5 rounded-full ml-1">ABERTA • GRUPO</span> : null}</h1>
                        <span className="bg-black text-white text-[8px] font-bold px-2.5 py-1 rounded-full">QR • PEDIDO NA MESA</span>
                    </div>
                    <div className="mt-2.5 flex gap-2 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
                        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome*"
                            className="input-visual min-w-[100%] snap-center bg-[#F5F7FB] rounded-full px-4 h-9 font-bold outline-none focus:ring-2 focus:ring-sky-400"
                            style={{ fontSize: '16px' }} />
                        <input value={tel} onChange={e => setTel(e.target.value)} placeholder="WhatsApp"
                            className="input-visual min-w-[100%] snap-center bg-[#F5F7FB] rounded-full px-4 h-9 outline-none focus:ring-2 focus:ring-sky-400"
                            style={{ fontSize: '16px' }} />
                    </div>
                    <p className="text-[9px] text-zinc-400 mt-1.5 ml-1">← arraste para o lado →</p>
                </div>
                <div className="flex gap-2 overflow-auto px-3 py-2 hide-scrollbar">
                    {cats.map(c => <button key={c} onClick={() => setCatAtiva(c)} className={`px-3 h-7 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all ${catAtiva === c ? "bg-black text-white border-black" : "bg-white"}`}>{c}</button>)}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-3">
                <div className="grid grid-cols-2 gap-3 pb-[120px]">
                    {filtrados.map(p => {
                        const stockState = getStockState(p);
                        const isZero = stockState === "zero";
                        const isLow = stockState === "low";
                        const atual = Number(p.stock_atual ?? 0);
                        const controlsStock = p.controlar_stock === true;
                        const cartItem = cart.find(c => c.id === p.id);
                        const isSelected = !!cartItem;

                        let borderBg = isZero ? "bg-red-200" : isLow ? "bg-amber-200" : "bg-[#F5E6D3]";
                        let qtyCircleBg = isZero ? "bg-[#C62828] text-white" : isLow ? "bg-[#EF6C00] text-white" : "bg-black text-white";
                        let priceBg = isZero ? "bg-zinc-400" : isLow ? "bg-[#A67C52]" : "bg-black";
                        let cardWrap = isZero ? "bg-[#FFF5F5] border-2 border-red-200" : isLow ? "bg-[#FFFBEB] border-2 border-amber-200" : "bg-white border border-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]";

                        if (isSelected) {
                            cardWrap = "bg-sky-50/80 backdrop-blur-xl border-2 border-sky-300 shadow-[0_12px_32px_rgba(14,165,233,0.18)]";
                            borderBg = "bg-sky-200";
                            priceBg = "bg-sky-500";
                        }

                        return (
                            <div key={p.id} onClick={() => !isZero && handleCardTap(p)} className={`group relative rounded-[16px] p-2.5 pt-3 pb-3 flex flex-col items-center text-center w-full select-none cursor-pointer transition-all ${cardWrap} ${isZero ? "opacity-60 pointer-events-none" : "active:scale-[0.97]"}`}>
                                {isSelected && (
                                    <button onClick={(e) => { e.stopPropagation(); remove(p.id); }} className="absolute top-2 right-2 w-6 h-6 bg-white/90 backdrop-blur border border-sky-200 text-sky-600 rounded-full flex items-center justify-center shadow-md z-20">
                                        <X size={10} strokeWidth={3} />
                                    </button>
                                )}
                                <div className="relative w-[84px] h-[84px] shrink-0">
                                    <div className={`w-full h-full rounded-full p-[2px] shadow-inner ${borderBg}`}>
                                        <img src={getImgUrl(p.imagem_url || p.imagem)} onError={(e) => (e.currentTarget.src = FALLBACK_IMG)} className={`w-full h-full rounded-full object-cover ${isZero ? "grayscale" : ""}`} alt={p.nome} />
                                    </div>
                                    {controlsStock && (
                                        <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-white shadow-md ${qtyCircleBg}`}>
                                            {atual}
                                        </div>
                                    )}
                                    {isLow && !isZero && <div className="absolute top-[28px] -left-1 bg-[#FFE0B2] text-[#A65C00] text-[7px] font-bold px-2 py-0.5 rounded-full border border-white flex gap-0.5"><AlertTriangle size={8} /> BAIXO</div>}
                                    {isZero && <div className="absolute top-[28px] -left-1 bg-[#C62828] text-white text-[7px] font-bold px-2 py-0.5 rounded-full border border-white flex gap-0.5"><Ban size={8} /> ESGOTADO</div>}
                                    {isSelected && <div className="absolute bottom-0 right-0 bg-sky-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full border-2 border-white">{cartItem.qtd}x</div>}
                                </div>
                                <h3 className={`mt-2.5 font-bold text-[11px] leading-[1.1] line-clamp-2 min-h-[26px] px-1 ${isSelected ? "text-sky-900" : "text-black"}`}>{p.nome}</h3>
                                <p className={`mt-1 text-[9px] font-bold h-[20px] line-clamp-2 px-1 ${isSelected ? "text-sky-700/70" : "text-[#6B6B6B]"}`}>{p.categoria}</p>
                                <div className={`mt-2 rounded-full px-3 py-1 flex gap-0.5 shadow-sm ${priceBg} text-white`}>
                                    <span className="text-[7px] font-bold opacity-80">Kz</span><span className="text-[11px] font-bold">{Number(p.preco || p.preco_venda).toLocaleString('de-DE')}</span>
                                </div>
                                {isZero && <span className="mt-1.5 text-[8px] font-bold text-red-500">Sem stock</span>}
                                {isSelected && <span className="mt-1.5 text-[8px] font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">No carrinho</span>}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div onMouseDown={onTouchStart} onMouseMove={onTouchMove} onMouseUp={onTouchEnd} onMouseLeave={onTouchEnd} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ left: pos.x, top: pos.y }} className="fixed z-40 w-11 h-11 bg-white/70 backdrop-blur-xl rounded-full flex items-center justify-center shadow-xl border border-white/60 cursor-grab touch-none">
                <button onClick={() => setBuscaOpen(true)} className="w-9 h-9 bg-black rounded-full flex items-center justify-center"><Search size={14} className="text-white" strokeWidth={2.5} /></button>
            </div>

            {buscaOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-3 pt-[20%]">
                    <div className="bg-white rounded-[16px] w-full max-w-[340px] p-3 shadow-2xl">
                        <div className="flex items-center gap-2 bg-[#F5F7FB] rounded-full px-3 h-9">
                            <Search size={14} className="text-zinc-400" />
                            <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar prato..."
                                className="flex-1 bg-transparent outline-none font-bold input-visual"
                                style={{ fontSize: '16px' }} />
                            <button onClick={() => { setQuery(""); setBuscaOpen(false) }} className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center"><X size={10} /></button>
                        </div>
                        <button onClick={() => setBuscaOpen(false)} className="mt-2.5 w-full bg-black text-white rounded-full h-9 font-bold text-[11px]">Ver {filtrados.length} resultados</button>
                    </div>
                </div>
            )}

            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t p-3 rounded-t-[16px] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] z-30">
                    <div className="flex justify-between text-[11px] font-bold"><span className="flex items-center gap-1"><ShoppingBag size={12} /> {cart.reduce((s, i) => s + i.qtd, 0)} itens</span><span>Kz {total.toLocaleString('de-DE')}</span></div>
                    <button disabled={enviando} onClick={enviar} className="mt-2 w-full bg-sky-500 text-white rounded-full h-9 font-bold text-[11px]" style={{ paddingTop: '2px', paddingBottom: '2px' }}>{enviando ? "Enviando..." : `Enviar pedido • Kz ${total.toLocaleString('de-DE')}`}</button>
                </div>
            )}

            {erroModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[16px] p-5 max-w-[300px] w-full shadow-2xl"><p className="text-[11px] text-zinc-600">{erroModal}</p><button onClick={() => setErroModal("")} className="mt-4 w-full bg-black text-white rounded-full h-9 font-bold text-[11px]">Entendi</button></div>
                </div>
            )}
        </div>
    );
}

export default function PedirMesaPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-[11px]">Carregando...</div>}>
            <PedirMesaInner />
        </Suspense>
    );
}
