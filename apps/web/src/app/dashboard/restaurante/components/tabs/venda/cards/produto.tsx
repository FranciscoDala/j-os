"use client";
import { Search, SlidersHorizontal, X, Clock, Users } from "lucide-react";
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
};

function minutesSince(iso?: string) {
    if (!iso) return "-";
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}min`;
}

export function ProdutosSection({ filteredByCat, loadingProd, cats, activeCat, setActiveCat, searchV, setSearchV, showSearch, setShowSearch, searchRef, getQty, getStockState, add, modoMesa, mesasOcupadas, loadingMesas, mesaSelecionada, onSelectMesa }: Props) {
    const isMesasCat = activeCat === "Mesas";

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F5F7FB] p-3 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center shrink-0">
                        {!showSearch? (
                            <button onClick={() => setShowSearch(true)} className="w-9 h-9 bg-white border border-black/5 rounded-full flex items-center justify-center hover:border-black/20 shadow-sm group">
                                <Search size={16} className="text-gray-500 group-hover:text-black" />
                            </button>
                        ) : (
                            <div className="relative w-[300px]">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input ref={searchRef} value={searchV} onChange={e => setSearchV(e.target.value)} onBlur={() => { if (!searchV) setShowSearch(false) }} placeholder="Buscar..." className="w-full h-9 bg-white rounded-full pl-9 pr-9 text-[12px] outline-none border border-black/10 shadow-sm" />
                                <button onClick={() => { setSearchV(""); setShowSearch(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/5 rounded-full flex items-center justify-center"><X size={12} /></button>
                            </div>
                        )}
                    </div>
                    <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {cats.map(c => <button key={c} onClick={() => setActiveCat(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] border shrink-0 font-bold ${activeCat === c? "bg-black text-white border-black" : "bg-white text-gray-600 border-black/5"}`}>{c === "Mesas"? `🍽️ Mesas (${mesasOcupadas.length})` : c}</button>)}
                        <button className="w-9 h-9 rounded-full bg-white border border-black/5 flex items-center justify-center shrink-0"><SlidersHorizontal size={14} /></button>
                    </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-3">
                    <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar flex-1">
                        {cats.map(c => <button key={c} onClick={() => setActiveCat(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] border shrink-0 font-bold ${activeCat === c? "bg-black text-white border-black" : "bg-white text-gray-600 border-black/5"}`}>{c === "Mesas"? `Mesas (${mesasOcupadas.length})` : c}</button>)}
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
                        {isMesasCat? (loadingMesas? "..." : `${mesasOcupadas.length} ocupadas`) : (loadingProd? "..." : `${filteredByCat.length} produtos`)}
                    </span>
                </div>
            </div>

            {isMesasCat? (
                loadingMesas? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">{[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-[22px] p-3 h-[132px] animate-pulse" />)}</div>
                ) : mesasOcupadas.length === 0? (
                    <div className="py-20 text-center border border-dashed rounded-[22px] bg-white"><p className="font-black text-[13px]">Nenhuma mesa ocupada</p><p className="text-[11px] text-gray-500 mt-1">Ocupe uma mesa na tab Mesas primeiro</p></div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {mesasOcupadas.map((m: any) => {
                            const selected = mesaSelecionada?.id === m.id;
                            return (
                                <button key={m.id} onClick={() => onSelectMesa(m)} className={`text-left rounded-[22px] p-4 border-2 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all ${selected? "bg-black text-white border-black scale-[1.02]" : "bg-white border-white hover:border-[#A67C52]"}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`font-black text-[16px] ${selected? "text-white" : "text-black"}`}>{m.numero}</span>
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${selected? "bg-white text-black" : "bg-amber-100 text-amber-800"}`}>OCUPADA</span>
                                    </div>
                                    <p className={`text-[11px] font-bold mt-1 ${selected? "text-white/70" : "text-gray-500"}`}>{m.zona} • <span className="inline-flex items-center gap-1"><Users size={11} />{m.pessoas_atual}</span> • <span className="inline-flex items-center gap-1"><Clock size={11} />{minutesSince(m.ocupada_em)}</span></p>
                                    <div className={`mt-3 rounded-full px-3 py-1.5 flex justify-between items-center ${selected? "bg-white/10" : "bg-[#FFFBF7] border border-[#F5E6D3]"}`}>
                                        <span className={`text-[10px] font-bold ${selected? "text-white/60" : "text-gray-500"}`}>CONSUMO</span>
                                        <span className={`text-[13px] font-black ${selected? "text-white" : "text-black"}`}>Kz {Number(m.venda_total || m.total_consumo || 0).toLocaleString("de-DE")}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )
            ) : loadingProd? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-[22px] p-3 h-[198px] animate-pulse" />)}</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-3.5">
                    {filteredByCat.map(p => {
                        const qty = getQty(p.id); const stockState = getStockState(p); const isZero = stockState === "zero"; const isLow = stockState === "low"; const atual = Number(p.stock_atual?? 0);
                        return (
                            <div key={p.id} onDoubleClick={() =>!isZero && add(p)} onClick={() => { if (window.innerWidth < 768 &&!isZero) add(p) }} className={`group relative rounded-[22px] p-2.5 pt-3 pb-3.5 shadow flex flex-col items-center text-center transition-all w-full select-none ${isZero? "bg-[#FFF5F5] border-2 border-red-200 opacity-80" : isLow? "bg-[#FFFBEB] border-2 border-amber-300" : "bg-white border border-white hover:shadow-[0_14px_36px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 cursor-pointer"}`}>
                                {qty > 0 && <div className="absolute top-2.5 right-2.5 z-20 bg-black text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white">{qty}</div>}
                                <div className="relative w-[118px] h-[118px] shrink-0"><div className="w-full h-full rounded-full p-[3px] bg-[#F5E6D3]"><img src={getImgUrl(p.imagem_url)} className="w-full h-full rounded-full object-cover" alt={p.nome} /></div>{p.controlar_stock && <div className={`absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white ${isZero? "bg-red-500 text-white" : isLow? "bg-amber-400 text-black" : "bg-[#A67C52] text-white"}`}>{atual}</div>}</div>
                                <h3 className="mt-2.5 font-black text-[12px] leading-[1.15] line-clamp-2">{p.nome}</h3>
                                <p className="mt-1 text-[10px] text-[#6B6B6B] line-clamp-2 h-[28px]">{p.descricao || p.categoria}</p>
                                <div className={`mt-2.5 text-white rounded-full px-4 py-[4px] flex items-baseline gap-0.5 ${isZero? "bg-gray-400" : isLow? "bg-amber-500" : "bg-[#A67C52]"}`}><span className="text-[8px] font-bold">Kz</span><span className="text-[12.5px] font-black">{Number(p.preco_venda).toLocaleString('en-US')}</span></div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
