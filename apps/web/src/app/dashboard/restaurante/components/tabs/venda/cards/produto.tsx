"use client";
import { Search, SlidersHorizontal, X, Clock, Users, Printer, Receipt, Ban, AlertTriangle, Check, Package } from "lucide-react";
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

function getStockDetail(p: any) {
    if (!p.controlar_stock) return { key: "ok", label: "Livre", badge: "bg-[#2E7D32] text-white" };
    const atual = Number(p.stock_atual?? 0);
    const min = Number(p.stock_minimo?? 5);
    if (atual <= 0) return { key: "zero", label: "SEM STOCK", badge: "bg-[#C62828] text-white" };
    if (atual <= min) return { key: "low", label: `BAIXO: ${atual}`, badge: "bg-[#EF6C00] text-white" };
    return { key: "ok", label: `${atual} em stock`, badge: "bg-[#2E7D32] text-white" };
}

export function ProdutosSection({ filteredByCat, loadingProd, cats, activeCat, setActiveCat, searchV, setSearchV, showSearch, setShowSearch, searchRef, getQty, getStockState, add, mesasOcupadas, loadingMesas, mesaSelecionada, onSelectMesa, cart, cartTotal, onFecharMesa, onImprimirConta }: Props) {
    const isMesasCat = activeCat === "Mesas";

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F5F7FB] p-3 md:p-5
            [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* header cats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center shrink-0">
                        {!showSearch? (
                            <button onClick={() => setShowSearch(true)} className="w-10 h-10 bg-white border border-[#E8DCCF] rounded-full flex items-center justify-center shadow-sm hover:border-black transition-all"><Search size={16} className="text-zinc-500" /></button>
                        ) : (
                            <div className="relative w-[300px]">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input ref={searchRef} value={searchV} onChange={e => setSearchV(e.target.value)} onBlur={() => { if (!searchV) setShowSearch(false) }} placeholder="Buscar produto..." className="w-full h-10 bg-white rounded-full pl-9 pr-9 text-[12px] font-bold outline-none border border-[#E8DCCF] shadow-sm focus:border-black" />
                                <button onClick={() => { setSearchV(""); setShowSearch(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center"><X size={12} /></button>
                            </div>
                        )}
                    </div>
                    <div className="hidden md:flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {cats.map(c => <button key={c} onClick={() => setActiveCat(c)} className={`whitespace-nowrap px-4 h-10 rounded-full text-[11px] border font-black tracking-wide transition-all ${activeCat === c? "bg-black text-white border-black shadow-md" : "bg-white text-zinc-600 border-[#E8DCCF] hover:border-black"}`}>{c === "Mesas"? `🍽️ Mesas (${mesasOcupadas.length})` : c}</button>)}
                        <button className="w-10 h-10 rounded-full bg-white border border-[#E8DCCF] flex items-center justify-center shrink-0"><SlidersHorizontal size={14} /></button>
                    </div>
                </div>
                <span className="text-[11px] text-zinc-500 font-black tracking-widest whitespace-nowrap">{isMesasCat? `${mesasOcupadas.length} OCUPADAS` : `${filteredByCat.length} PRODUTOS`}</span>
            </div>

            {/* MOBILE cats */}
            <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {cats.map(c => <button key={c} onClick={() => setActiveCat(c)} className={`whitespace-nowrap px-4 h-9 rounded-full text-[11px] border font-black shrink-0 ${activeCat === c? "bg-black text-white border-black" : "bg-white border-[#E8DCCF]"}`}>{c === "Mesas"? `Mesas (${mesasOcupadas.length})` : c}</button>)}
            </div>

            {isMesasCat? (
                loadingMesas? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-[24px] h-[184px] animate-pulse border" />)}</div> :
                mesasOcupadas.length === 0? <div className="py-20 text-center border border-dashed border-[#E8DCCF] rounded-[24px] bg-white"><p className="font-black text-[13px]">Nenhuma mesa ocupada</p><p className="text-[11px] opacity-60 font-bold mt-1">Ocupe mesas na aba Mesas</p></div> :
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {mesasOcupadas.map((m: any) => {
                        const isSelected = mesaSelecionada?.id === m.id;
                        const consumoAtual = Number(m.venda_total || m.total_consumo || m.total || 0);
                        const pendente = isSelected? cartTotal : 0;
                        const totalPreview = consumoAtual + pendente;

                        return (
                            <div key={m.id} className={`group relative rounded-[24px] border p-4 shadow-sm hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:-translate-y-[2px] transition-all duration-300 ${isSelected? "bg-black text-white border-black" : "bg-white border-[#E8DCCF] hover:bg-[#FFFBF5]"}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-[13px] shadow-md ${isSelected? "bg-white text-black" : "bg-black text-white"}`}>{m.numero}</div>
                                        <div>
                                            <h3 className="font-black text-[15px] leading-none tracking-tight">MESA {m.numero}</h3>
                                            <p className={`text-[10px] font-bold mt-1 flex items-center gap-1.5 ${isSelected? "text-white/60" : "text-zinc-500"}`}><span>{m.zona || "Salão"}</span>• <Users size={11} />{m.pessoas_atual} • <Clock size={11} />{minutesSince(m.aberta_em || m.ocupada_em)}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full tracking-widest ${isSelected? "bg-white text-black" : "bg-[#C62828] text-white"}`}>OCUPADA</span>
                                </div>

                                <div className={`mt-4 rounded-[16px] p-3 border ${isSelected? "bg-white/10 border-white/10" : "bg-[#FFFBF7] border-[#F5E6D3]"}`}>
                                    <div className="flex justify-between text-[10px] font-black tracking-widest opacity-60"><span>CONSUMO</span><span>Kz {consumoAtual.toLocaleString("de-DE")}</span></div>
                                    {isSelected && pendente > 0 && <div className="flex justify-between text-[10px] font-black text-amber-400 mt-1.5"><span>+ PENDENTE</span><span>Kz {pendente.toLocaleString("de-DE")}</span></div>}
                                    <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-dashed border-black/10">
                                        <span className="text-[11px] font-black tracking-widest">TOTAL</span>
                                        <span className="text-[18px] font-black tracking-tight">Kz {totalPreview.toLocaleString("de-DE")}</span>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <button onClick={() => onImprimirConta(m)} className={`h-10 rounded-full flex items-center justify-center gap-1.5 text-[11px] font-bold border transition-all ${isSelected? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-white border-black/10 text-black hover:bg-zinc-50"}`}>
                                        <Receipt size={14} /> Conta
                                    </button>
                                    <button onClick={() => onSelectMesa(m)} className={`h-10 rounded-full text-[11px] font-black tracking-widest transition-all ${isSelected? "bg-white text-black" : "bg-black text-white hover:bg-zinc-800"}`}>
                                        {isSelected? "SELECIONADA" : "SELECIONAR"}
                                    </button>
                                </div>
                                <button onClick={() => onFecharMesa(m)} className="w-full mt-2 h-11 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-black text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]">
                                    <Printer size={14} /> FECHAR • Kz {totalPreview.toLocaleString("de-DE")}
                                </button>
                            </div>
                        )
                    })}
                </div>
            ) : (
                loadingProd? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-[24px] h-[210px] animate-pulse border border-[#E8DCCF]" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredByCat.map((p: any) => {
                            const qty = getQty(p.id);
                            const stock = getStockDetail(p);
                            const disabled = getStockState(p) === "zero";
                            return (
                                <div
                                    key={p.id}
                                    onDoubleClick={() =>!disabled && add(p)}
                                    onClick={() => { if (window.innerWidth < 768 &&!disabled) add(p) }}
                                    className={`group relative rounded-[24px] border p-3 shadow-sm hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] hover:-translate-y-[2px] transition-all duration-300 flex flex-col
                                    ${stock.key === "zero"? "border-[#FFCDD2] bg-[#FFEBEE]" : stock.key === "low"? "border-[#FFE0B2] bg-[#FFF3E0]" : "bg-white border-[#E8DCCF] hover:bg-[#FFFBF5]"}`}
                                >
                                    {qty > 0 && <div className="absolute top-3 right-3 bg-black text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center shadow-md z-10">{qty}</div>}

                                    <div className="relative w-full aspect-square rounded-[18px] overflow-hidden bg-[#F5F5F4] border border-black/5">
                                        <img src={getImgUrl(p.imagem_url)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                        <div className={`absolute top-2 left-2 text-[8px] px-2 py-1 rounded-full font-black tracking-widest shadow flex items-center gap-1 ${stock.badge}`}>
                                            {stock.key === "zero" && <Ban size={10} />}
                                            {stock.key === "low" && <AlertTriangle size={10} />}
                                            {stock.key === "ok" && <Check size={10} />}
                                            {stock.label}
                                        </div>
                                        {disabled && (
                                            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                                                <span className="bg-black text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest">ESGOTADO</span>
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="mt-3 px-1 font-black text-[12px] leading-tight line-clamp-2 min-h-[32px]">{p.nome}</h3>
                                    <div className="mt-auto pt-3 px-1 flex items-center justify-between">
                                        <div className="text-[14px] font-black tracking-tight">Kz {Number(p.preco_venda).toLocaleString('de-DE')}</div>
                                        <button
                                            disabled={disabled}
                                            onClick={(e) => { e.stopPropagation(); add(p); }}
                                            className={`h-8 px-3 rounded-full text-[10px] font-black tracking-widest transition-all
                                            ${disabled? "bg-zinc-200 text-zinc-400 cursor-not-allowed" : "bg-black text-white hover:bg-zinc-800 active:scale-95"}`}
                                        >
                                            {disabled? "SEM" : "+ ADD"}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )
            )}
        </div>
    );
}
