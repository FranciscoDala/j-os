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
    return (
        <div className="group relative bg-white rounded-[24px] md:rounded-[22px] p-3 pt-4 pb-4 md:p-3.5 md:pt-4 md:pb-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-white flex flex-col items-center text-center hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => onEdit(p)} className="w-8 h-8 md:w-8 md:h-8 bg-black/80 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-black shadow-lg"><Pencil size={13} /></button>
                <button onClick={() => onDelete(p)} className="w-8 h-8 md:w-8 md:h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"><Trash2 size={13} /></button>
            </div>

            <div className="w-[110px] h-[110px] md:w-[96px] md:h-[96px] rounded-full p-[3px] bg-[#F5E6D3] shadow-inner shrink-0">
                <img src={getImgUrl(p.imagem_url)} onError={(e) => (e.currentTarget.src = FALLBACK_IMG)} className="w-full h-full rounded-full object-cover" alt={p.nome} />
            </div>

            <h3 className="mt-3 md:mt-3 font-black text-[13px] md:text-[12.5px] leading-[1.15] text-black tracking-tight w-full px-1.5 break-words whitespace-normal line-clamp-2 min-h-[28px] md:min-h-[28px] flex items-start justify-center">{p.nome}</h3>
            <p className="mt-1 text-[10px] md:text-[10px] leading-[1.2] text-[#6B6B6B] h-[26px] md:h-[24px] w-full px-2 break-words whitespace-normal overflow-hidden text-ellipsis line-clamp-2">
                {p.descricao || p.categoria || p.codigo}
            </p>

            <div className="mt-2.5 md:mt-3 bg-[#A67C52] text-white rounded-full px-4 md:px-4 py-[4px] md:py-[4px] flex items-baseline gap-0.5 shadow-sm">
                <span className="text-[9px] md:text-[9px] font-bold opacity-90">$</span>
                <span className="text-[13px] md:text-[13px] font-black tracking-wide">{Number(p.preco_venda).toLocaleString('en-US')}</span>
            </div>

            {!p.ativo && <span className="mt-1.5 text-[8px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-bold">INATIVO</span>}
        </div>
    )
}
