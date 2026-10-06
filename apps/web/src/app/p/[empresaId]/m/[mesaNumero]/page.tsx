"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AlertTriangle, Ban, ShoppingBag, X, Search, QrCode, Clock3, Sparkles } from "lucide-react";

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
    const token = searchParams.get('t') || searchParams.get('token') || "";

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
    const [pos, setPos] = useState({ x: 16, y: 420 });
    const dragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });
    const lastTap = useRef<{id:string, time:number} | null>(null);

    const onTouchStart = (e: any) => {
        dragging.current = true;
        const cx = e.touches? e.touches[0].clientX : e.clientX;
        const cy = e.touches? e.touches[0].clientY : e.clientY;
        offset.current = { x: cx - pos.x, y: cy - pos.y };
    };
    const onTouchMove = (e: any) => {
        if (!dragging.current) return;
        const cx = e.touches? e.touches[0].clientX : e.clientX;
        const cy = e.touches? e.touches[0].clientY : e.clientY;
        setPos({ x: cx - offset.current.x, y: cy - offset.current.y });
    };
    const onTouchEnd = () => { dragging.current = false; };

    useEffect(() => {
        if (!empresaId ||!mesaNumero) return;
        const url = `${API_URL}/api/v1/public/${empresaId}/cardapio?mesa=${mesaNumero}&t=${token}`;
        fetch(url)
     .then(async r => {
            const text = await r.text();
            let data: any = {};
            try { data = JSON.parse(text); } catch {}
            if (r.status === 410) throw new Error("EXPIRADO");
            if (!r.ok) throw new Error(data.detail || "Cardápio não encontrado");
            return data;
        })
     .then(d => {
            if (d.mesa && d.mesa.token_valido === false) throw new Error("EXPIRADO");
            setProdutos(d.produtos || []);
            setCats(["All",...(d.categorias || [])]);
            setLoading(false);
        })
     .catch(e => {
            if (e.message === "EXPIRADO" || e.message.toLowerCase().includes("expirou") || e.message.toLowerCase().includes("fechada")) setExpirado(true);
            else setErroModal(e.message);
            setLoading(false);
        });
    }, [empresaId, mesaNumero, token]);

    const getStockState = (p: any) => {
        if (p.controlar_stock === false) return "ok";
        if (!p.controlar_stock) return "ok";
        const atual = Number(p.stock_atual?? 0);
        const minimo = Number(p.stock_minimo?? 0);
        if (atual <= 0) return "zero";
        if (atual <= minimo || atual <= 5) return "low";
        return "ok";
    };

    const add = (p: any) => {
        const state = getStockState(p);
        if (state === "zero" || p.ativo === false) return;
        const ex = cart.find(c => c.id === p.id);
        if (ex) setCart(cart.map(c => c.id === p.id? {...c, qtd: c.qtd + 1} : c));
        else setCart([...cart, { id: p.id, nome: p.nome, preco: Number(p.preco || p.preco_venda), qtd: 1 }]);
    };
    const remove = (id: string) => setCart(cart.filter(c => c.id!== id));

    const handleCardTap = (p: any) => {
        const now = Date.now();
        if (lastTap.current && lastTap.current.id === p.id && now - lastTap.current.time < 350) {
            add(p); lastTap.current = null;
        } else lastTap.current = { id: p.id, time: now };
    };

    const total = cart.reduce((s,i)=>s+i.preco*i.qtd,0);
    const filtradosBase = catAtiva === "All"? produtos : produtos.filter(p => p.categoria === catAtiva);
    const filtrados = query? filtradosBase.filter(p => p.nome.toLowerCase().includes(query.toLowerCase())) : filtradosBase;
    const mesaLabel = String(mesaNumero || "").toUpperCase();

    const enviar = async () => {
        if (!nome.trim()) { setErroModal("Digite seu nome para o garçom te chamar"); return; }
        if (cart.length === 0) { setErroModal("Toque 2x nos pratos para adicionar"); return; }
        setEnviando(true);
        try {
            const r = await fetch(`${API_URL}/api/v1/public/${empresaId}/pedido`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mesa_numero: mesaLabel, qr_token: token, cliente_nome: nome.trim(), cliente_telefone: tel.trim() || null, itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })) })
            });
            const txt = await r.text();
            if (r.status === 410) throw new Error("EXPIRADO");
            if (!r.ok) { try { const j = JSON.parse(txt); throw new Error(j.detail || txt); } catch { throw new Error(txt); } }
            setEnviado(true); setCart([]);
        } catch (e:any) {
            if (e.message === "EXPIRADO" || e.message.toLowerCase().includes("expirou")) setExpirado(true);
            else setErroModal(e.message);
        } finally { setEnviando(false); }
    };

    if (expirado) return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#EDEBE6] p-6" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            <div className="bg-white rounded-[16px] p-6 max-w-[340px] w-full text-center">
                <div className="w-14 h-14 bg-[#EDEBE6] rounded-full flex items-center justify-center mx-auto mb-4"><QrCode size={22}/></div>
                <h1 className="font-bold text-[13px]">Mesa {mesaLabel} encerrada</h1>
                <p className="text-[11px] text-zinc-500 mt-2 leading-[1.4]">Este link expirou porque a conta foi fechada.</p>
                <div className="mt-4 bg-[#F8F7F5] rounded-[12px] p-3 flex items-center gap-2 text-left">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center"><Clock3 size={14}/></div>
                    <div><p className="text-[11px] font-bold">O que fazer?</p><p className="text-[10px] text-zinc-500">Escaneie novamente o QR</p></div>
                </div>
            </div>
        </div>
    );

    if (enviado) return (
        <div className="min-h-screen flex items-center justify-center bg-[#EDEBE6] p-6 text-center" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            <div className="bg-white rounded-[16px] p-6 max-w-[320px] w-full"><div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3">✓</div><h1 className="font-bold text-[13px]">Pedido enviado!</h1><p className="text-[11px] text-zinc-500 mt-1">Mesa {mesaLabel} - garçom notificado</p><button onClick={() => setEnviado(false)} className="mt-5 w-full bg-black text-white rounded-full h-9 text-[11px] font-bold">Fazer outro</button></div>
        </div>
    );
    if (loading) return <div className="min-h-[100dvh] bg-[#EDEBE6] p-10 text-center text-[11px] font-bold">Carregando cardápio...</div>;

    return (
        <div className="h-[100dvh] flex flex-col bg-[#EDEBE6] overflow-hidden" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            <style>{`
          .hide-scrollbar::-webkit-scrollbar{display:none}
          .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
            input,textarea,select{font-size:11px!important}
            `}</style>

            {/* HEADER SEM BG AZUL/BRANCO CHAPADO */}
            <div className="shrink-0 z-20 px-3 pt-3">
                <div className="flex items-center justify-between">
                    <div className="bg-white rounded-full h-8 px-3 flex items-center gap-2">
                        <h1 className="font-bold text-[11px]">MESA {mesaLabel}</h1>
                        <span className="bg-black text-white text-[8px] font-bold px-2 py-0.5 rounded-full">QR</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-medium">{filtrados.length} pratos</span>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar snap-x">
                    <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome*" className="min-w-[100%] snap-center bg-white rounded-full px-4 h-9 text-[11px] font-bold outline-none" />
                    <input value={tel} onChange={e=>setTel(e.target.value)} placeholder="WhatsApp (opcional)" className="min-w-[100%] snap-center bg-white rounded-full px-4 h-9 text-[11px] outline-none" />
                </div>
                <div className="flex gap-2 overflow-auto py-3 hide-scrollbar">
                    {cats.map(c => <button key={c} onClick={()=>setCatAtiva(c)} className={`px-3 h-7 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all ${catAtiva===c?"bg-black text-white border-black":"bg-white border-white"}`}>{c}</button>)}
                </div>
            </div>

            {/* GRID SEM BG */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-3 pb-3">
                <div className="grid grid-cols-2 gap-3 pb-[120px]">
                    {filtrados.map(p => {
                        const stockState = getStockState(p);
                        const isZero = stockState === "zero";
                        const isLow = stockState === "low";
                        const atual = Number(p.stock_atual?? 0);
                        const controlsStock = p.controlar_stock === true;
                        const cartItem = cart.find(c=>c.id===p.id);
                        const isSelected =!!cartItem;

                        let cardWrap = "bg-white";
                        if (isZero) cardWrap = "bg-[#FFF5F5] border border-red-200 opacity-70";
                        if (isLow &&!isZero) cardWrap = "bg-[#FFFBEB] border border-amber-200";
                        if (isSelected) cardWrap = "bg-black text-white";

                        return (
                            <div key={p.id} onClick={()=>!isZero && handleCardTap(p)} className={`relative rounded-[16px] p-2.5 flex flex-col items-center text-center select-none cursor-pointer transition-all ${cardWrap} ${isZero?"pointer-events-none":"active:scale-[0.98]"}`}>
                                {isSelected && (
                                    <button onClick={(e)=>{ e.stopPropagation(); remove(p.id); }} className="absolute top-2 right-2 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center z-20"><X size={10} strokeWidth={3}/></button>
                                )}
                                <div className="relative w-[84px] h-[84px]">
                                    <div className="w-full h-full rounded-full p-[2px] bg-[#EDEBE6]"><img src={getImgUrl(p.imagem_url || p.imagem)} onError={(e)=>(e.currentTarget.src=FALLBACK_IMG)} className={`w-full h-full rounded-full object-cover ${isZero?"grayscale":""}`} alt={p.nome} /></div>
                                    {controlsStock && <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border border-white ${isSelected?"bg-white text-black":"bg-black text-white"}`}>{atual}</div>}
                                    {isLow &&!isZero && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-800 text-[7px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><AlertTriangle size={8}/> BAIXO</div>}
                                    {isZero && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[7px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"><Ban size={8}/> ESGOTADO</div>}
                                    {isSelected && <div className="absolute bottom-0 right-0 bg-white text-black text-[8px] font-bold px-2 py-0.5 rounded-full">{cartItem.qtd}x</div>}
                                </div>
                                <h3 className="mt-2.5 font-bold text-[11px] leading-[1.1] line-clamp-2 min-h-[24px]">{p.nome}</h3>
                                <p className={`mt-1 text-[9px] h-[22px] line-clamp-2 ${isSelected?"text-zinc-300":"text-zinc-500"}`}>{p.categoria}</p>
                                <div className={`mt-2 rounded-full px-3 py-1 flex gap-0.5 ${isSelected?"bg-white text-black":"bg-black text-white"}`}>
                                    <span className="text-[7px] font-bold">Kz</span><span className="text-[11px] font-bold">{Number(p.preco || p.preco_venda).toLocaleString('de-DE')}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* BUSCA FLUTUANTE PEQUENA */}
            <div onMouseDown={onTouchStart} onMouseMove={onTouchMove} onMouseUp={onTouchEnd} onMouseLeave={onTouchEnd} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ left: pos.x, top: pos.y }} className="fixed z-40 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] touch-none">
                <button onClick={()=>setBuscaOpen(true)} className="w-9 h-9 bg-black rounded-full flex items-center justify-center"><Search size={14} className="text-white"/></button>
            </div>

            {buscaOpen && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-3 pt-[18%]">
                    <div className="bg-white rounded-[16px] w-full max-w-[340px] p-3">
                        <div className="flex items-center gap-2 bg-[#EDEBE6] rounded-full px-3 h-9">
                            <Search size={14} className="text-zinc-400"/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar prato..." className="flex-1 bg-transparent outline-none text-[11px] font-bold" />
                            <button onClick={()=>{setQuery(""); setBuscaOpen(false)}} className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center"><X size={10}/></button>
                        </div>
                        <button onClick={()=>setBuscaOpen(false)} className="mt-3 w-full bg-black text-white rounded-full h-9 font-bold text-[11px]">Ver {filtrados.length} resultados</button>
                    </div>
                </div>
            )}

            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[16px] p-3 z-30">
                    <div className="flex justify-between text-[11px] font-bold"><span className="flex items-center gap-1"><ShoppingBag size={12}/> {cart.reduce((s,i)=>s+i.qtd,0)} itens</span><span>Kz {total.toLocaleString('de-DE')}</span></div>
                    <button disabled={enviando} onClick={enviar} className="mt-2 w-full bg-black text-white rounded-full h-9 font-bold text-[11px]" style={{ paddingTop: '2px', paddingBottom: '2px' }}>{enviando? "Enviando..." : `Enviar pedido • Kz ${total.toLocaleString('de-DE')}`}</button>
                </div>
            )}

            {erroModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[16px] p-5 max-w-[300px] w-full"><p className="text-[11px] font-medium">{erroModal}</p><button onClick={()=>setErroModal("")} className="mt-4 w-full bg-black text-white rounded-full h-9 font-bold text-[11px]">Entendi</button></div>
                </div>
            )}
        </div>
    );
}

export default function PedirMesaPage() {
    return (
        <Suspense fallback={<div className="min-h-[100dvh] bg-[#EDEBE6] p-10 text-center text-[11px] font-bold">Carregando...</div>}>
            <PedirMesaInner />
        </Suspense>
    );
}
