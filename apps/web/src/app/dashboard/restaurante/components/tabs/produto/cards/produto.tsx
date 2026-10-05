"use client";
import { Pencil, Trash2, Plus, Ban, AlertTriangle, Check } from "lucide-react";

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
    p: any;
    onEdit?: (p: any) => void;
    onDelete?: (p: any) => void;
    onAdd?: (p: any) => void; // PDV
    cartQty?: number; // qty no carrinho PDV
}

export function ProdutoCard({ p, onEdit, onDelete, onAdd, cartQty = 0 }: Props) {
    const getStockState = () => {
        if (!p.controlar_stock) return "ok";
        const atual = Number(p.stock_atual?? 0);
        const minimo = Number(p.stock_minimo?? 0);
        if (atual <= 0) return "zero";
        if (atual <= minimo || atual <= 5) return "low";
        return "ok";
    };

    const stockState = getStockState();
    const isZero = stockState === "zero";
    const isLow = stockState === "low";
    const atual = Number(p.stock_atual?? 0);

    // regras originais mantidas
    const borderBg = isZero? "bg-red-200" : isLow? "bg-amber-200" : "bg-[#F5E6D3]";
    const qtyCircleBg = isZero? "bg-[#C62828] text-white" : isLow? "bg-[#EF6C00] text-white" : "bg-black text-white";
    const priceBg = isZero? "bg-zinc-400" : isLow? "bg-[#A67C52]" : "bg-black";
    const cardWrap = isZero? "bg-[#FFF5F5] border-2 border-red-200" : isLow? "bg-[#FFFBEB] border-2 border-amber-200" : "bg-white border border-white";

    const isPDV =!!onAdd;

    return (
        <div
            onDoubleClick={() =>!isZero && onAdd?.(p)}
            onClick={() => { if (isPDV && window.innerWidth < 768 &&!isZero) onAdd?.(p) }}
            className={`
            group relative rounded-[24px] p-2.5 pt-3 pb-3.5 md:p-3 md:pt-3.5 md:pb-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:shadow-[0_14px_36px_rgba(0,0,0,0.12)] hover:-translate-y-[2px] transition-all duration-300 overflow-hidden w-full select-none cursor-pointer
            ${cardWrap}
        `}>
            {/* Ações gestão */}
            {!isPDV && (
                <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                    <button onClick={(e) => { e.stopPropagation(); onEdit?.(p); }} className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 shadow-lg"><Pencil size={12} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(p); }} className="w-8 h-8 bg-white border border-black/10 rounded-full flex items-center justify-center hover:bg-red-50 shadow-lg"><Trash2 size={12} /></button>
                </div>
            )}

            {/* QTY carrinho PDV */}
            {isPDV && cartQty > 0 && (
                <div className="absolute top-2.5 right-2.5 bg-black text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center shadow-md z-20">
                    {cartQty}
                </div>
            )}

            <div className="relative w-[122px] h-[122px] md:w-[118px] md:h-[118px] shrink-0">
                <div className={`w-full h-full rounded-full p-[3px] shadow-inner ${borderBg}`}>
                    <img src={getImgUrl(p.imagem_url)} onError={(e) => (e.currentTarget.src = FALLBACK_IMG)} className={`w-full h-full rounded-full object-cover ${isZero? "grayscale" : "group-hover:scale-[1.03]"} transition-transform duration-500`} alt={p.nome} />
                </div>

                {p.controlar_stock && (
                    <div className={`absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white z-10 ${qtyCircleBg}`}>
                        {atual}
                    </div>
                )}

                {isLow &&!isZero && (
                    <div className="absolute top-[36px] -left-1 z-10 bg-[#FFE0B2] text-[#A65C00] text-[8px] font-black px-2.5 py-1 rounded-full shadow-sm border border-white flex items-center gap-0.5">
                        <AlertTriangle size={10} /> BAIXO
                    </div>
                )}
                {isZero && (
                    <div className="absolute top-[36px] -left-1 z-10 bg-[#C62828] text-white text-[8px] font-black px-2.5 py-1 rounded-full shadow-sm border border-white flex items-center gap-0.5">
                        <Ban size={10} /> ESGOTADO
                    </div>
                )}
            </div>

            <h3 className="mt-3 font-black text-[12px] leading-[1.15] text-black tracking-tight w-full px-1.5 break-words line-clamp-2 min-h-[30px]">{p.nome}</h3>

            <p className="mt-1 text-[10px] leading-[1.15] text-[#6B6B6B] font-bold w-full px-2 h-[26px] line-clamp-2 overflow-hidden">
                {p.descricao || p.categoria || p.codigo}
            </p>

            <div className="mt-3 flex items-center gap-2">
                <div className={`text-white rounded-full px-4 py-[5px] flex items-baseline gap-0.5 shadow-sm ${priceBg}`}>
                    <span className="text-[8px] font-bold opacity-80">Kz</span>
                    <span className="text-[12px] font-black tracking-wide">{Number(p.preco_venda).toLocaleString('de-DE')}</span>
                </div>
                {isPDV && (
                    <button
                        disabled={isZero}
                        onClick={(e) => { e.stopPropagation(); onAdd?.(p); }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isZero? "bg-zinc-200 text-zinc-400 cursor-not-allowed" : "bg-black text-white hover:bg-zinc-800 active:scale-95 shadow-md"}`}
                    >
                        <Plus size={14} strokeWidth={3} />
                    </button>
                )}
            </div>

            {!p.ativo && <span className="mt-2 text-[8px] px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 font-black tracking-widest">INATIVO</span>}
        </div>
    )
}
