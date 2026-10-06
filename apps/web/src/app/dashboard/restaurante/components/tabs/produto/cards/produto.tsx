"use client";
import { Pencil, Trash2, Plus, Ban, AlertTriangle } from "lucide-react";

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
    onAdd?: (p: any) => void;
    cartQty?: number;
}

export function ProdutoCard({ p, onEdit, onDelete, onAdd, cartQty = 0 }: Props) {
    const getStockState = () => {
        if (!p.controlar_stock) return "ok";
        const atual = Number(p.stock_atual ?? 0);
        const minimo = Number(p.stock_minimo ?? 0);
        if (atual <= 0) return "zero";
        if (atual <= minimo || atual <= 5) return "low";
        return "ok";
    };
    const stockState = getStockState();
    const isZero = stockState === "zero";
    const isLow = stockState === "low";
    const atual = Number(p.stock_atual ?? 0);

    // REGRAS ORIGINAIS MANTIDAS
    const topBg = isZero ? "bg-[#FFE0E0]" : isLow ? "bg-[#FFF1CC]" : "bg-[#FFEAA6]";
    const cardBorder = isZero ? "border-red-200" : isLow ? "border-amber-200" : "border-[#F3E9DF]";
    const cardBg = isZero ? "bg-[#FFF5F5]" : isLow ? "bg-[#FFFBEB]" : "bg-[#FFFEFB]";
    const qtyBg = isZero ? "bg-[#C62828] text-white" : isLow ? "bg-[#EF6C00] text-white" : "bg-black text-white";
    const isPDV = !!onAdd;

    // tags tipo Vegan / Gluten free
    const tags = [p.categoria, p.tipo === "RESTAURANT_DISH" ? "Prato" : p.tipo].filter(Boolean).slice(0, 3);

    return (
        <div
            onDoubleClick={() => !isZero && onAdd?.(p)}
            onClick={() => { if (isPDV && window.innerWidth < 768 && !isZero) onAdd?.(p) }}
            className={`group relative w-full rounded-[22px] overflow-hidden border shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col ${cardBg} ${cardBorder}`}
        >
            {/* QTY CARRINHO PDV */}
            {isPDV && cartQty > 0 && (
                <div className="absolute top-2.5 right-2.5 bg-black text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md z-20">
                    {cartQty}
                </div>
            )}
            {/* GESTÃO */}
            {!isPDV && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={(e) => { e.stopPropagation(); onEdit?.(p); }} className="w-7 h-7 bg-black/80 text-white rounded-full flex items-center justify-center hover:bg-black shadow"><Pencil size={11} /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(p); }} className="w-7 h-7 bg-white border rounded-full flex items-center justify-center hover:bg-red-50 shadow"><Trash2 size={11} /></button>
                </div>
            )}

            {/* IMAGEM - igual sorvete, menor */}
            <div className={`relative w-full h-[138px] overflow-hidden flex items-center justify-center ${topBg}`}>
                <img
                    src={getImgUrl(p.imagem_url)}
                    onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                    className={`w-full h-full object-cover ${isZero ? "grayscale opacity-70" : "group-hover:scale-[1.03]"} transition-transform duration-500`}
                    alt={p.nome}
                />
                {/* stock qty canto */}
                {p.controlar_stock && (
                    <div className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white z-10 ${qtyBg}`}>
                        {atual}
                    </div>
                )}
                {isLow && !isZero && (
                    <div className="absolute bottom-2 left-2 bg-[#FFE0B2] text-[#A65C00] text-[8px] font-black px-2 py-0.5 rounded-full border border-white flex items-center gap-0.5 shadow">
                        <AlertTriangle size={10} /> BAIXO
                    </div>
                )}
                {isZero && (
                    <div className="absolute bottom-2 left-2 bg-[#C62828] text-white text-[8px] font-black px-2 py-0.5 rounded-full border border-white flex items-center gap-0.5 shadow">
                        <Ban size={10} /> ESGOTADO
                    </div>
                )}
            </div>

            {/* INFO - igual Vanilla ice cream */}
            <div className="px-3.5 py-3 flex flex-col flex-1">
                
                <h3 className="font-black text-[13px] leading-[1.2] text-[#1E1E1E] line-clamp-2 break-words whitespace-normal min-h-[31px]">
                    {p.nome}
                </h3>

                <div className="mt-1.5 flex items-center gap-1 flex-wrap min-h-[18px]">
                    {tags.length > 0 ? tags.map((t, i) => (
                        <span key={i} className="text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full truncate max-w-[70px]">{String(t)}</span>
                    )) : <span className="text-[9px] text-[#8A8A8A]">{p.codigo || "—"}</span>}
                </div>

                <p className="mt-2 text-[10px] leading-[1.3] text-[#7A7A7A] line-clamp-2 min-h-[26px]">
                    {p.descricao || p.categoria || "Sem descrição"}
                </p>

                {/* PREÇO + BOTÃO */}
                <div className="mt-3 flex items-end justify-between gap-2">
                    <div className="leading-none">
                        <p className="text-[15px] font-black text-[#EBA500] tracking-tight">
                            <span className="text-[10px]">Kz </span>{Number(p.preco_venda || 0).toLocaleString('de-DE')}
                        </p>
                        <p className="text-[9px] font-bold text-[#9A9A9A] mt-1 flex items-center gap-1">
                            + {isZero ? "Esgotado" : p.controlar_stock ? `${atual} stock` : "Disponível"}
                        </p>
                    </div>

                    {isPDV ? (
                        <button
                            disabled={isZero}
                            onClick={(e) => { e.stopPropagation(); onAdd?.(p); }}
                            className={`h-[30px] px-4 rounded-full text-[11px] font-black shadow-sm transition-all shrink-0 ${isZero ? "bg-zinc-200 text-zinc-400 cursor-not-allowed" : "bg-[#FFC91A] hover:bg-[#FFB800] text-black"}`}
                        >
                            Add
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit?.(p); }}
                            className="h-[30px] px-4 rounded-full bg-[#FFC91A] hover:bg-[#FFB800] text-black text-[11px] font-black shadow-sm transition-colors shrink-0"
                        >
                            Detalhes
                        </button>
                    )}
                </div>

                {!p.ativo && <span className="mt-2 text-[8px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-black w-fit">INATIVO</span>}
            </div>
        </div>
    )
}
