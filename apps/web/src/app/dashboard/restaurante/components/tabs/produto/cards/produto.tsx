"use client";
import { Pencil, Trash2 } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

const getImgUrl = (url?: string) => {
    if (!url) return FALLBACK_IMG;
    if (url.startsWith("blob:")) return url;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/media")) return `${API_URL}${url}`;
    return url;
};

type Props = {
    p: any;
    onEdit: (p: any) => void;
    onDelete: (p: any) => void;
}

export function ProdutoCard({ p, onEdit, onDelete }: Props) {
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

    const borderBg = isZero? "bg-red-200" : isLow? "bg-amber-200" : "bg-[#F5E6D3]";
    const qtyCircleBg = isZero? "bg-red-500 text-white" : isLow? "bg-amber-400 text-black" : "bg-[#A67C52] text-white";

    return (
        <div className={`
            group relative rounded-[22px] p-3 pt-4 pb-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:shadow-[0_14px_36px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden
            w-full min-h-[250px]
            ${isZero? "bg-[#FFF5F5] border-2 border-red-200" : isLow? "bg-[#FFFBEB] border-2 border-amber-300" : "bg-white border border-white"}
        `}>
            <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button onClick={() => onEdit(p)} className="w-8 h-8 bg-black/80 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-black shadow-lg"><Pencil size={13} /></button>
                <button onClick={() => onDelete(p)} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"><Trash2 size={13} /></button>
            </div>

            <div className="relative w-[140px] h-[140px] shrink-0">
                <div className={`w-full h-full rounded-full p-[4px] shadow-inner ${borderBg}`}>
                    <img src={getImgUrl(p.imagem_url)} onError={(e) => (e.currentTarget.src = FALLBACK_IMG)} className={`w-full h-full rounded-full object-cover ${isZero? "grayscale" : ""}`} alt={p.nome} />
                </div>

                {p.controlar_stock && (
                    <div className={`absolute -top-1 -left-1 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shadow-md border-2 border-white z-10 ${qtyCircleBg}`}>
                        {atual}
                    </div>
                )}

                {isLow &&!isZero && (
                    <div className="absolute top-[32px] -left-1 z-10 bg-[#FDE68A] text-black text-[9px] font-black px-3 py-1 rounded-full shadow-sm border border-white">
                        BAIXO
                    </div>
                )}
                {isZero && (
                    <div className="absolute top-[32px] -left-1 z-10 bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-sm border border-white">
                        ESGOTADO
                    </div>
                )}
            </div>

            <h3 className="mt-3 font-black text-[13px] leading-[1.15] text-black tracking-tight w-full px-2 break-words line-clamp-2">{p.nome}</h3>

            <p className="mt-1 text-[11px] leading-[1.15] text-[#6B6B6B] w-full px-2 h-[28px] line-clamp-2 overflow-hidden">
                {p.descricao || p.categoria || p.codigo}
            </p>

            <div className={`mt-3 text-white rounded-full px-4 py-[5px] flex items-baseline gap-0.5 shadow-sm ${isZero? "bg-gray-400" : isLow? "bg-amber-500" : "bg-[#A67C52]"}`}>
                <span className="text-[9px] font-bold opacity-90">Kz</span>
                <span className="text-[13px] font-black tracking-wide">{Number(p.preco_venda).toLocaleString('en-US')}</span>
            </div>

            {!p.ativo && <span className="mt-1.5 text-[7px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-bold">INATIVO</span>}
        </div>
    )
}
