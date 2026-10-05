"use client";
import { Search, SlidersHorizontal, X, Clock, Users, Printer, Receipt } from "lucide-react";
import { RefObject } from "react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
export const getImgUrl = (url?: string) => {
    if (!url) return FALLBACK_IMG;
    if (url.startsWith("blob:")) return url;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/media")) return `${API_URL}${url}`;
    return url;
};

type Props = {
    dbProducts: any[]; filteredByCat: any[]; loadingProd: boolean; cats: string[]; activeCat: string; setActiveCat: (v: string) => void;
    searchV: string; setSearchV: (v: string) => void; showSearch: boolean; setShowSearch: (v: boolean) => void; searchRef: RefObject<HTMLInputElement | null>;
    getQty: (id: string) => number; getStockState: (p: any) => string; add: (p: any) => void;
    modoMesa: boolean; mesasOcupadas: any[]; loadingMesas: boolean; mesaSelecionada: any; onSelectMesa: (m: any) => void; fetchMesas: () => void;
    cart: any[]; cartTotal: number; onFecharMesa: (mesa: any) => void; onImprimirConta: (mesa: any) => void;
};

function minutesSince(iso?: string) {
    if (!iso) return "-";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}min`;
}

export function ProdutosSection({ filteredByCat, loadingProd, cats, activeCat, setActiveCat, searchV, setSearchV, showSearch, setShowSearch, searchRef, getQty, getStockState, add, mesasOcupadas, loadingMesas, mesaSelecionada, onSelectMesa, cart, cartTotal, onFecharMesa, onImprimirConta }: Props) {
    const isMesasCat = activeCat === "Mesas";

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F5F7FB] p-3 md:p-5">
            {/* header cats igual */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center shrink-0">
                        {!showSearch? (
                            <button onClick={() => setShowSearch(true)} className="w-9 h-9 bg-white border rounded-full flex items-center justify-center shadow-sm"><Search size={16} className="text-gray-500" /></button>
                        ) : (
                            <div className="relative w-[300px]">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input ref={searchRef} value={searchV} onChange={e => setSearchV(e.target.value)} onBlur={() => { if (!searchV) setShowSearch(false) }} placeholder="Buscar..." className="w-full h-9 bg-white rounded-full pl-9 pr-9 text-[12px] outline-none border shadow-sm" />
                                <button onClick={() => { setSearchV(""); setShowSearch(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/5 rounded-full flex items-center justify-center"><X size={12} /></button>
                            </div>
                        )}
                    </div>
                    <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {cats.map(c => <button key={c} onClick={() => setActiveCat(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] border shrink-0 font-bold ${activeCat === c? "bg-black text-white border-black" : "bg-white text-gray-600 border-black/5"}`}>{c === "Mesas"? `🍽️ Mesas (${mesasOcupadas.length})` : c}</button>)}
                        <button className="w-9 h-9 rounded-full bg-white border flex items-center justify-center shrink-0"><SlidersHorizontal size={14} /></button>
                    </div>
                </div>
                <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">{isMesasCat? `${mesasOcupadas.length} ocupadas` : `${filteredByCat.length} produtos`}</span>
            </div>

            {isMesasCat? (
                loadingMesas? <div className="grid grid-cols-2 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-[22px] h-[180px] animate-pulse" />)}</div> :
                mesasOcupadas.length === 0? <div className="py-20 text-center border border-dashed rounded-[22px] bg-white"><p className="font-black text-[13px]">Nenhuma mesa ocupada</p></div> :
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {mesasOcupadas.map((m: any) => {
                        const isSelected = mesaSelecionada?.id === m.id;
                        const consumoAtual = Number(m.venda_total || m.total_consumo || m.total || 0);
                        const pendente = isSelected? cartTotal : 0;
                        const totalPreview = consumoAtual + pendente;

                        return (
                            <div key={m.id} className={`rounded-[22px] p-4 border-2 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all ${isSelected? "bg-black text-white border-black" : "bg-white border-white"}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-black text-[18px] leading-none">{m.numero}</h3>
                                        <p className={`text-[11px] font-bold mt-1 flex items-center gap-2 ${isSelected? "text-white/60" : "text-gray-500"}`}><span>{m.zona}</span>• <Users size={11} />{m.pessoas_atual} • <Clock size={11} />{minutesSince(m.ocupada_em)}</p>
                                    </div>
                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${isSelected? "bg-white text-black" : "bg-amber-100 text-amber-800"}`}>OCUPADA</span>
                                </div>

                                <div className={`mt-4 rounded-[14px] p-3 ${isSelected? "bg-white/10" : "bg-[#FFFBF7] border border-[#F5E6D3]"}`}>
                                    <div className="flex justify-between text-[10px] font-bold opacity-60"><span>CONSUMO</span><span>Kz {consumoAtual.toLocaleString("de-DE")}</span></div>
                                    {isSelected && pendente > 0 && <div className="flex justify-between text-[10px] font-bold text-amber-400 mt-1"><span>+ PENDENTE</span><span>Kz {pendente.toLocaleString("de-DE")}</span></div>}
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-black/10">
                                        <span className="text-[11px] font-black">TOTAL</span>
                                        <span className="text-[16px] font-black">Kz {totalPreview.toLocaleString("de-DE")}</span>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <button onClick={() => onImprimirConta(m)} className={`h-10 rounded-full flex items-center justify-center gap-1.5 text-[11px] font-bold border ${isSelected? "bg-white/10 border-white/20 text-white" : "bg-white border-black/10 text-black"}`}>
                                        <Receipt size={14} /> Ver Conta
                                    </button>
                                    <button onClick={() => onSelectMesa(m)} className={`h-10 rounded-full text-[11px] font-bold ${isSelected? "bg-white text-black" : "bg-[#A67C52] text-white"}`}>
                                        {isSelected? "Selecionada" : "Selecionar"}
                                    </button>
                                </div>
                                <button onClick={() => onFecharMesa(m)} className="w-full mt-2 h-11 rounded-full bg-[#16A34A] text-white font-black text-[12px] flex items-center justify-center gap-2">
                                    <Printer size={14} /> Fechar Mesa • Kz {totalPreview.toLocaleString("de-DE")}
                                </button>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredByCat.map(p => {
                        const qty = getQty(p.id); const atual = Number(p.stock_atual?? 0);
                        return (
                            <div key={p.id} onDoubleClick={() => add(p)} onClick={() => { if (window.innerWidth < 768) add(p) }} className="bg-white rounded-[22px] p-2.5 shadow flex flex-col items-center text-center cursor-pointer">
                                {qty > 0 && <div className="absolute top-2.5 right-2.5 bg-black text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center">{qty}</div>}
                                <div className="w-[118px] h-[118px] rounded-full p-[3px] bg-[#F5E6D3]"><img src={getImgUrl(p.imagem_url)} className="w-full h-full rounded-full object-cover" alt="" /></div>
                                <h3 className="mt-2.5 font-black text-[12px] line-clamp-2">{p.nome}</h3>
                                <div className="mt-2.5 bg-[#A67C52] text-white rounded-full px-4 py-[4px] text-[12.5px] font-black">Kz {Number(p.preco_venda).toLocaleString('en-US')}</div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
