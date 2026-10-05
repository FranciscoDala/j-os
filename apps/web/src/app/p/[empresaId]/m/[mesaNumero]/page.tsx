"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Ban, ShoppingBag, X, Search, Trash2 } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200";
const getImgUrl = (url?: string) => {
    if (!url) return FALLBACK_IMG;
    if (url.startsWith("blob:")) return url;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/media")) return `${API_URL}${url}`;
    return url;
};

export default function PedirMesaPage() {
    const { empresaId, mesaNumero } = useParams() as { empresaId: string, mesaNumero: string };
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
    const [pos, setPos] = useState({ x: 20, y: 400 });
    const dragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });
    const lastTap = useRef<{id:string, time:number} | null>(null);

    const onTouchStart = (e: any) => {
        dragging.current = true;
        const clientX = e.touches? e.touches[0].clientX : e.clientX;
        const clientY = e.touches? e.touches[0].clientY : e.clientY;
        offset.current = { x: clientX - pos.x, y: clientY - pos.y };
    };
    const onTouchMove = (e: any) => {
        if (!dragging.current) return;
        const clientX = e.touches? e.touches[0].clientX : e.clientX;
        const clientY = e.touches? e.touches[0].clientY : e.clientY;
        setPos({ x: clientX - offset.current.x, y: clientY - offset.current.y });
    };
    const onTouchEnd = () => { dragging.current = false; };

    useEffect(() => {
        if (!empresaId) return;
        fetch(`${API_URL}/api/v1/public/${empresaId}/cardapio`)
        .then(r => { if (!r.ok) throw new Error("Cardápio não encontrado"); return r.json(); })
        .then(d => { setProdutos(d.produtos || []); setCats(["All",...(d.categorias || [])]); setLoading(false); })
        .catch(e => { setErroModal(e.message); setLoading(false); });
    }, [empresaId]);

    const getStockState = (p: any) => {
        if (p.controlar_stock === false) return "ok";
        if (p.stock_atual === undefined && p.disponivel === false) return "zero";
        if (p.stock_atual === undefined) return "ok";
        const atual = Number(p.stock_atual?? 0);
        const minimo = Number(p.stock_minimo?? 5);
        if (atual <= 0) return "zero";
        if (atual <= minimo) return "low";
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

    // duplo clique desktop + duplo toque mobile
    const handleCardTap = (p: any) => {
        const now = Date.now();
        if (lastTap.current && lastTap.current.id === p.id && now - lastTap.current.time < 300) {
            add(p);
            lastTap.current = null;
        } else {
            lastTap.current = { id: p.id, time: now };
        }
    };

    const total = cart.reduce((s,i)=>s+i.preco*i.qtd,0);
    const filtradosBase = catAtiva === "All"? produtos : produtos.filter(p => p.categoria === catAtiva);
    const filtrados = query? filtradosBase.filter(p => p.nome.toLowerCase().includes(query.toLowerCase())) : filtradosBase;
    const mesaLabel = String(mesaNumero).toUpperCase();

    const enviar = async () => {
        if (!nome.trim()) { setErroModal("Digite seu nome"); return; }
        if (cart.length === 0) { setErroModal("Toque 2x nos produtos para adicionar"); return; }
        setEnviando(true);
        try {
            const r = await fetch(`${API_URL}/api/v1/public/${empresaId}/pedido`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mesa_numero: mesaLabel, cliente_nome: nome.trim(), cliente_telefone: tel.trim() || null, itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })) })
            });
            const txt = await r.text();
            if (!r.ok) { try { const j = JSON.parse(txt); throw new Error(j.detail || txt); } catch { throw new Error(txt); } }
            setEnviado(true); setCart([]);
        } catch (e:any) { setErroModal(e.message); } finally { setEnviando(false); }
    };

    if (enviado) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-6 text-center">
            <div className="bg-white rounded-[24px] p-8 shadow-xl max-w-[340px] w-full"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">✓</div><h1 className="font-black text-[18px]">Pedido enviado!</h1><p className="text-[13px] text-zinc-500 mt-2">Mesa {mesaLabel}</p><button onClick={() => setEnviado(false)} className="mt-6 w-full bg-black text-white rounded-full py-3 font-bold">Fazer outro</button></div>
        </div>
    );
    if (loading) return <div className="p-10 text-center text-[13px]">Carregando...</div>;

    return (
        <div className="h-[100dvh] flex flex-col bg-[#F5F7FB] overflow-hidden">
            <style>{`
              .hide-scrollbar::-webkit-scrollbar{display:none}
              .hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
               input, textarea, select { font-size: 16px!important; }
            `}</style>

            <div className="bg-white border-b shrink-0 z-20">
                <div className="p-4 pb-3">
                    <div className="flex items-center justify-between">
                        <h1 className="font-black text-[16px]">MESA {mesaLabel}</h1>
                        <span className="bg-black text-white text-[10px] font-black px-3 py-1 rounded-full">QR • PEDIDO NA MESA</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        {/* FIX ZOOM iOS: text-[16px] */}
                        <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome*" className="bg-[#F5F7FB] rounded-full px-4 py-3 text-[16px] font-bold outline-none focus:ring-2 focus:ring-black" />
                        <input value={tel} onChange={e=>setTel(e.target.value)} placeholder="WhatsApp" className="bg-[#F5F7FB] rounded-full px-4 py-3 text-[16px] outline-none focus:ring-2 focus:ring-black" />
                    </div>
                </div>
                <div className="flex gap-2 overflow-auto px-4 py-3 hide-scrollbar">
                    {cats.map(c => <button key={c} onClick={()=>setCatAtiva(c)} className={`px-4 py-2 rounded-full text-[12px] font-black whitespace-nowrap border ${catAtiva===c?"bg-black text-white border-black":"bg-white"}`}>{c}</button>)}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto hide-scrollbar px-3 py-3">
                <p className="text-[11px] text-zinc-400 font-bold px-1 pb-2 text-center">Toque 2x no prato para adicionar • Pratos escuros = já no carrinho</p>
                <div className="grid grid-cols-2 gap-3 pb-[140px]">
                    {filtrados.map(p => {
                        const stockState = getStockState(p);
                        const isZero = stockState === "zero";
                        const isLow = stockState === "low";
                        const atual = Number(p.stock_atual?? 0);
                        const cartItem = cart.find(c=>c.id===p.id);
                        const isSelected =!!cartItem;

                        // cores base
                        let borderBg = isZero? "bg-red-200" : isLow? "bg-amber-200" : "bg-[#F5E6D3]";
                        let qtyCircleBg = isZero? "bg-[#C62828] text-white" : isLow? "bg-[#EF6C00] text-white" : "bg-black text-white";
                        let priceBg = isZero? "bg-zinc-400" : isLow? "bg-[#A67C52]" : "bg-black";
                        let cardWrap = isZero? "bg-[#FFF5F5] border-2 border-red-200" : isLow? "bg-[#FFFBEB] border-2 border-amber-200" : "bg-white border border-white";

                        // SE JA ADD -> MUDA COR
                        if (isSelected) {
                            cardWrap = "bg-[#111] border-2 border-[#111] text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)]";
                            borderBg = "bg-white/10";
                            priceBg = "bg-white text-black";
                        }

                        return (
                            <div
                                key={p.id}
                                onDoubleClick={()=>!isZero && add(p)}
                                onClick={()=>!isZero && handleCardTap(p)}
                                className={`group relative rounded-[24px] p-2.5 pt-3 pb-3.5 flex flex-col items-center text-center w-full select-none cursor-pointer transition-all duration-300 ${cardWrap} ${isZero?"opacity-60 pointer-events-none":"active:scale-[0.97]"}`}
                            >
                                {/* BTN REMOVER SÓ APARECE QUANDO SELECIONADO */}
                                {isSelected && (
                                    <button onClick={(e)=>{ e.stopPropagation(); remove(p.id); }} className="absolute top-2.5 right-2.5 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-lg z-20 hover:bg-red-50">
                                        <X size={14} strokeWidth={3}/>
                                    </button>
                                )}

                                <div className="relative w-[112px] h-[112px] shrink-0">
                                    <div className={`w-full h-full rounded-full p-[3px] shadow-inner ${borderBg}`}>
                                        <img src={getImgUrl(p.imagem_url || p.imagem)} onError={(e)=>(e.currentTarget.src=FALLBACK_IMG)} className={`w-full h-full rounded-full object-cover ${isZero?"grayscale":""} ${isSelected?"opacity-90":""}`} alt={p.nome} />
                                    </div>
                                    {p.stock_atual!== undefined &&!isSelected && <div className={`absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white ${qtyCircleBg}`}>{atual}</div>}
                                    {isLow &&!isZero &&!isSelected && <div className="absolute top-[36px] -left-1 bg-[#FFE0B2] text-[#A65C00] text-[8px] font-black px-2.5 py-1 rounded-full border border-white flex gap-0.5"><AlertTriangle size={10}/> BAIXO</div>}
                                    {isZero && <div className="absolute top-[36px] -left-1 bg-[#C62828] text-white text-[8px] font-black px-2.5 py-1 rounded-full border border-white flex gap-0.5"><Ban size={10}/> ESGOTADO</div>}
                                    {isSelected && <div className="absolute bottom-0 right-0 bg-[#16A34A] text-white text-[10px] font-black px-2.5 py-1 rounded-full border-2 border-white">{cartItem.qtd}x</div>}
                                </div>

                                <h3 className={`mt-3 font-black text-[12px] leading-[1.15] line-clamp-2 min-h-[30px] px-1.5 ${isSelected?"text-white":"text-black"}`}>{p.nome}</h3>
                                <p className={`mt-1 text-[10px] font-bold h-[26px] line-clamp-2 px-2 ${isSelected?"text-zinc-300":"text-[#6B6B6B]"}`}>{p.categoria}</p>

                                <div className={`mt-3 rounded-full px-4 py-[5px] flex gap-0.5 shadow-sm ${priceBg}`}>
                                    <span className="text-[8px] font-bold opacity-80">Kz</span><span className="text-[12px] font-black">{Number(p.preco || p.preco_venda).toLocaleString('de-DE')}</span>
                                </div>
                                {isZero && <span className="mt-2 text-[9px] font-black text-red-500">Sem stock</span>}
                                {isSelected && <span className="mt-2 text-[9px] font-black text-[#4ADE80]">• No carrinho - toque no X para remover</span>}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* SEARCH FLUTUANTE */}
            <div onMouseDown={onTouchStart} onMouseMove={onTouchMove} onMouseUp={onTouchEnd} onMouseLeave={onTouchEnd} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ left: pos.x, top: pos.y }} className="fixed z-40 w-14 h-14 bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl border border-white/20 cursor-grab active:cursor-grabbing touch-none">
                <button onClick={()=>setBuscaOpen(true)} className="w-12 h-12 bg-white rounded-full flex items-center justify-center"><Search size={20} className="text-black" strokeWidth={2.5}/></button>
            </div>

            {buscaOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-[20%]">
                    <div className="bg-white rounded-[20px] w-full max-w-[380px] p-4 shadow-2xl">
                        <div className="flex items-center gap-2 bg-[#F5F7FB] rounded-full px-4 py-3">
                            <Search size={18} className="text-zinc-400"/>
                            <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar prato..." className="flex-1 bg-transparent outline-none text-[16px] font-bold" />
                            <button onClick={()=>{setQuery(""); setBuscaOpen(false)}} className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center"><X size={14}/></button>
                        </div>
                        <button onClick={()=>setBuscaOpen(false)} className="mt-3 w-full bg-black text-white rounded-full py-3 font-black text-[16px]">Ver {filtrados.length} resultados</button>
                    </div>
                </div>
            )}

            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] z-30">
                    <div className="flex justify-between text-[12px] font-bold"><span className="flex items-center gap-1"><ShoppingBag size={14}/> {cart.reduce((s,i)=>s+i.qtd,0)} itens</span><span>Kz {total.toLocaleString('de-DE')}</span></div>
                    <button disabled={enviando} onClick={enviar} className="mt-3 w-full bg-[#16A34A] text-white rounded-full py-3.5 font-black text-[16px]">{enviando? "Enviando..." : `Enviar pedido • Kz ${total.toLocaleString('de-DE')}`}</button>
                </div>
            )}

            {erroModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-6">
                    <div className="bg-white rounded-[20px] p-6 max-w-[320px] w-full shadow-2xl"><p className="text-[16px] text-zinc-600">{erroModal}</p><button onClick={()=>setErroModal("")} className="mt-5 w-full bg-black text-white rounded-full py-3 font-black text-[16px]">Entendi</button></div>
                </div>
            )}
        </div>
    );
}
