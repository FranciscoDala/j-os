"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Minus, AlertTriangle, Ban, ShoppingBag, X } from "lucide-react";

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
    const [obs, setObs] = useState<{[k:string]: string}>({});
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [erroModal, setErroModal] = useState("");

    useEffect(() => {
        if (!empresaId) return;
        fetch(`${API_URL}/api/v1/public/${empresaId}/cardapio`)
          .then(r => { if (!r.ok) throw new Error("Cardápio não encontrado"); return r.json(); })
          .then(d => {
                // backend agora retorna stock pra usar mesma regra do ProdutoCard
                setProdutos(d.produtos || []);
                setCats(["All",...(d.categorias || [])]);
                setLoading(false);
            })
          .catch(e => { setErroModal(e.message); setLoading(false); });
    }, [empresaId]);

    const getStockState = (p: any) => {
        if (p.controlar_stock === false) return "ok";
        // se backend não mandar stock, usa o disponivel
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
    const remove = (id: string) => {
        const ex = cart.find(c => c.id === id);
        if (!ex) return;
        if (ex.qtd > 1) setCart(cart.map(c => c.id === id? {...c, qtd: c.qtd - 1} : c));
        else setCart(cart.filter(c => c.id!== id));
    };

    const total = cart.reduce((s,i)=>s+i.preco*i.qtd,0);
    const filtrados = catAtiva === "All"? produtos : produtos.filter(p => p.categoria === catAtiva);
    const mesaLabel = String(mesaNumero).toUpperCase();

    const enviar = async () => {
        if (!nome.trim()) { setErroModal("Digite seu nome para identificar o pedido na mesa"); return; }
        if (cart.length === 0) { setErroModal("Adicione pelo menos 1 item"); return; }
        setEnviando(true);
        try {
            const r = await fetch(`${API_URL}/api/v1/public/${empresaId}/pedido`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mesa_numero: mesaLabel,
                    cliente_nome: nome.trim(),
                    cliente_telefone: tel.trim() || null,
                    itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd, observacao: obs[c.id] || null }))
                })
            });
            const txt = await r.text();
            if (!r.ok) {
                try { const j = JSON.parse(txt); throw new Error(j.detail || txt); } catch { throw new Error(txt); }
            }
            setEnviado(true); setCart([]);
        } catch (e:any) { setErroModal(e.message); } finally { setEnviando(false); }
    };

    if (enviado) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-6 text-center">
            <div className="bg-white rounded-[24px] p-8 shadow-xl max-w-[340px] w-full">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                <h1 className="font-black text-[18px]">Pedido enviado!</h1>
                <p className="text-[13px] text-zinc-500 mt-2">Mesa {mesaLabel} já está ativa. Aguarde o garçom confirmar, seu pedido já foi pra cozinha.</p>
                <button onClick={() => setEnviado(false)} className="mt-6 w-full bg-black text-white rounded-full py-3 font-bold">Fazer outro pedido</button>
            </div>
        </div>
    );

    if (loading) return <div className="p-10 text-center text-[13px]">Carregando cardápio da mesa {mesaLabel}...</div>;

    return (
        <div className="min-h-screen bg-[#F5F7FB] pb-[180px]">
            {/* HEADER J-OS */}
            <div className="bg-white border-b sticky top-0 z-20">
                <div className="p-4 pb-3">
                    <div className="flex items-center justify-between">
                        <h1 className="font-black text-[16px] tracking-tight">MESA {mesaLabel}</h1>
                        <span className="bg-black text-white text-[10px] font-black px-3 py-1 rounded-full">QR • PEDIDO NA MESA</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 font-bold">Seu pedido cai direto no painel do garçom</p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Seu nome*" className="bg-[#F5F7FB] rounded-full px-4 py-3 text-[13px] font-bold outline-none focus:ring-2 focus:ring-black" />
                        <input value={tel} onChange={e=>setTel(e.target.value)} placeholder="WhatsApp" className="bg-[#F5F7FB] rounded-full px-4 py-3 text-[13px] outline-none" />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 overflow-auto px-4 py-3 no-scrollbar sticky top-[112px] z-10 bg-[#F5F7FB]">
                {cats.map(c => <button key={c} onClick={()=>setCatAtiva(c)} className={`px-4 py-2 rounded-full text-[12px] font-black whitespace-nowrap border transition-all ${catAtiva===c?"bg-black text-white border-black":"bg-white"}`}>{c}</button>)}
            </div>

            <div className="grid grid-cols-2 gap-3 px-3">
                {filtrados.map(p => {
                    const stockState = getStockState(p);
                    const isZero = stockState === "zero";
                    const isLow = stockState === "low";
                    const atual = Number(p.stock_atual?? 0);
                    const noCart = cart.find(c=>c.id===p.id);

                    const borderBg = isZero? "bg-red-200" : isLow? "bg-amber-200" : "bg-[#F5E6D3]";
                    const qtyCircleBg = isZero? "bg-[#C62828] text-white" : isLow? "bg-[#EF6C00] text-white" : "bg-black text-white";
                    const priceBg = isZero? "bg-zinc-400" : isLow? "bg-[#A67C52]" : "bg-black";
                    const cardWrap = isZero? "bg-[#FFF5F5] border-2 border-red-200" : isLow? "bg-[#FFFBEB] border-2 border-amber-200" : "bg-white border border-white";

                    return (
                        <div key={p.id} className={`group relative rounded-[24px] p-2.5 pt-3 pb-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col items-center text-center transition-all duration-300 w-full ${cardWrap} ${isZero?"opacity-70":""}`}>
                            <div className="relative w-[112px] h-[112px] shrink-0">
                                <div className={`w-full h-full rounded-full p-[3px] shadow-inner ${borderBg}`}>
                                    <img src={getImgUrl(p.imagem_url || p.imagem)} onError={(e)=>(e.currentTarget.src=FALLBACK_IMG)} className={`w-full h-full rounded-full object-cover ${isZero?"grayscale":""} transition-transform`} alt={p.nome} />
                                </div>
                                {p.controlar_stock!== false && p.stock_atual!== undefined && (
                                    <div className={`absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white z-10 ${qtyCircleBg}`}>
                                        {atual}
                                    </div>
                                )}
                                {isLow &&!isZero && (
                                    <div className="absolute top-[36px] -left-1 z-10 bg-[#FFE0B2] text-[#A65C00] text-[8px] font-black px-2.5 py-1 rounded-full shadow-sm border border-white flex items-center gap-0.5"><AlertTriangle size={10}/> BAIXO</div>
                                )}
                                {isZero && (
                                    <div className="absolute top-[36px] -left-1 z-10 bg-[#C62828] text-white text-[8px] font-black px-2.5 py-1 rounded-full shadow-sm border border-white flex items-center gap-0.5"><Ban size={10}/> ESGOTADO</div>
                                )}
                                {noCart && (
                                    <div className="absolute top-2 right-2 bg-black text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center shadow-md z-20">{noCart.qtd}</div>
                                )}
                            </div>

                            <h3 className="mt-3 font-black text-[12px] leading-[1.15] text-black tracking-tight w-full px-1.5 line-clamp-2 min-h-[30px]">{p.nome}</h3>
                            <p className="mt-1 text-[10px] text-[#6B6B6B] font-bold w-full px-2 h-[26px] line-clamp-2 overflow-hidden">{p.descricao || p.categoria}</p>

                            <div className="mt-3 flex items-center gap-2">
                                <div className={`text-white rounded-full px-4 py-[5px] flex items-baseline gap-0.5 shadow-sm ${priceBg}`}>
                                    <span className="text-[8px] font-bold opacity-80">Kz</span>
                                    <span className="text-[12px] font-black">{Number(p.preco || p.preco_venda).toLocaleString('de-DE')}</span>
                                </div>
                                {noCart? (
                                    <div className="flex items-center gap-1 bg-zinc-900 text-white rounded-full px-1 py-1">
                                        <button onClick={()=>remove(p.id)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><Minus size={12}/></button>
                                        <span className="text-[11px] font-black w-4 text-center">{noCart.qtd}</span>
                                        <button onClick={()=>add(p)} className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-black"><Plus size={12} strokeWidth={3}/></button>
                                    </div>
                                ) : (
                                    <button disabled={isZero} onClick={()=>add(p)} className={`w-8 h-8 rounded-full flex items-center justify-center ${isZero?"bg-zinc-200 text-zinc-400":"bg-black text-white active:scale-95 shadow-md"}`}><Plus size={14} strokeWidth={3}/></button>
                                )}
                            </div>
                            {isZero && <span className="mt-2 text-[9px] font-black text-red-500">Sem stock</span>}
                            {isLow &&!isZero && <span className="mt-2 text-[9px] font-black text-[#A65C00]">Só {atual} restante(s)</span>}
                        </div>
                    )
                })}
            </div>

            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] z-30">
                    <div className="flex justify-between text-[12px] font-bold"><span className="flex items-center gap-1"><ShoppingBag size={14}/> {cart.reduce((s,i)=>s+i.qtd,0)} itens</span><span className="font-black">Kz {total.toLocaleString('de-DE')}</span></div>
                    <button disabled={enviando} onClick={enviar} className="mt-3 w-full bg-[#16A34A] text-white rounded-full py-3.5 font-black text-[14px] disabled:bg-zinc-300">
                        {enviando? "Enviando..." : `Enviar pedido • Kz ${total.toLocaleString('de-DE')}`}
                    </button>
                </div>
            )}

            {erroModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-[20px] p-6 max-w-[320px] w-full shadow-2xl">
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center"><AlertTriangle className="text-amber-600" size={20}/></div>
                            <button onClick={()=>setErroModal("")} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center"><X size={14}/></button>
                        </div>
                        <h3 className="font-black text-[14px] mt-4">Atenção</h3>
                        <p className="text-[13px] text-zinc-600 mt-2 leading-[1.4]">{erroModal}</p>
                        <button onClick={()=>setErroModal("")} className="mt-5 w-full bg-black text-white rounded-full py-3 font-black text-[13px]">Entendi</button>
                    </div>
                </div>
            )}
        </div>
    );
}
