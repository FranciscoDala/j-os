"use client";
import { Clock, Check, X, FileText } from "lucide-react";
import { useState } from "react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

export const getImgUrl = (url?: string) => {
    if (!url) return FALLBACK_IMG;
    if (url.startsWith("blob:") || url.startsWith("http")) return url;
    if (url.startsWith("/media")) return `${API_URL}${url}`;
    return url;
};

function parseDateUTC(iso: string): Date {
    if (!iso) return new Date();
    if (iso.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(iso) || iso.includes("+")) {
        return new Date(iso);
    }
    return new Date(iso + "Z");
}

function timeAgo(iso: string) {
    if (!iso) return "";
    const d = parseDateUTC(iso);
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) return "agora";
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "agora";
    const min = Math.floor(sec / 60);
    if (min < 60) return min === 1? "há 1min" : `há ${min}min`;
    const h = Math.floor(min / 60);
    if (h < 24) return h === 1? "há 1h" : `há ${h}h`;
    const days = Math.floor(h / 24);
    if (days === 1) return "ontem";
    if (days < 7) return `há ${days}d`;
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
}

function safeKz(v: any) {
    const n = Number(v?? 0);
    return isNaN(n)? "0" : n.toLocaleString('de-DE');
}

export function PedidoCard({ p, onAtender, onRecusar, onDetalhe }: any) {
    const [loadingAtender, setLoadingAtender] = useState(false);
    const total = p.total_estimado?? p.total?? p.valor_total?? 0;
    const itens = p.itens || [];
    const first = itens[0] || {};
    const rawImg = first.produto_imagem_url || first.imagem_url || first.imagem || first.produto_imagem || first.produto?.imagem_url || first.produto?.imagem || first.product?.imagem_url || p.produto_imagem_url || null;
    const firstImg = getImgUrl(rawImg);

    const handleAtender = async () => {
        if (loadingAtender) return;
        setLoadingAtender(true);
        onAtender(p);
        setTimeout(()=> setLoadingAtender(false), 1000);
    };

    return (
        <div className="group relative w-full min-h-[250px] sm:min-h-[265px] md:min-h-[272px] rounded-[18px] md:rounded-[22px] overflow-hidden bg-[#FFFEFB] border border-[#F3E9DF] shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] md:hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
            <div className="relative w-full h-[118px] sm:h-[128px] md:h-[138px] bg-[#FFEAA6] overflow-hidden shrink-0">
                <img src={firstImg} alt={first.produto_nome || first.nome || "pedido"} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" onError={(e) => (e.currentTarget.src = FALLBACK_IMG)} />
                <span className="absolute top-2 left-2 bg-black text-white text-[8px] md:text-[9px] font-black px-2 md:px-2.5 py-1 rounded-full shadow-md">MESA {p.mesa_numero}</span>
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <span className="bg-white/90 backdrop-blur text-[8px] md:text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow"><Clock size={10} />{timeAgo(p.created_at)}</span>
                    <button onClick={() => onDetalhe(p)} className="w-9 h-9 md:w-10 md:h-10 bg-black text-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.25)] border border-white/20 hover:bg-zinc-800 active:scale-95 transition-all">
                        <FileText size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                </div>
                {itens.length > 1 && <span className="absolute bottom-2 right-2 bg-white/90 backdrop-blur text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full shadow">+{itens.length - 1}</span>}
            </div>
            <div className="px-3 md:px-3.5 pt-3 pb-3 md:pb-4 flex flex-col flex-1 bg-[#FFFEFB]">
                <h3 className="font-black text-[12px] md:text-[13px] leading-[1.2] text-[#1E1E1E] line-clamp-2 break-words whitespace-normal min-h-[28px] md:min-h-[31px]">{p.cliente_nome || "Cliente"}</h3>
                <div className="mt-1.5 flex items-center gap-1 flex-wrap min-h-[18px]">
                    <span className="text-[8px] md:text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full">{itens.length} itens</span>
                    <span className="text-[8px] md:text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full">Mesa {p.mesa_numero}</span>
                </div>
                <p className="mt-2 text-[10px] leading-[1.3] text-[#7A7A7A] line-clamp-2 min-h-[26px] hidden sm:block">{itens.slice(0, 2).map((it: any) => `${it.quantidade}x ${it.produto_nome || it.nome || "Produto"}`).join(" • ")}</p>
                <div className="mt-auto pt-3 flex items-end justify-between gap-2">
                    <div className="leading-none pb-0.5">
                        <p className="text-[14px] md:text-[15px] font-black text-[#EBA500] tracking-tight"><span className="text-[10px]">Kz </span>{safeKz(total)}</p>
                        <p className="text-[8px] md:text-[9px] font-bold text-[#9A9A9A] mt-1">+ {itens.length} itens</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => onRecusar(p)} className="w-[32px] h-[32px] md:w-[30px] md:h-[30px] rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center hover:bg-red-100 active:scale-95"><X size={12} strokeWidth={3} /></button>
                        <button disabled={loadingAtender} onClick={handleAtender} className="h-[32px] md:h-[30px] px-4 rounded-full bg-black text-white text-[11px] font-black flex items-center gap-1 hover:bg-zinc-800 active:scale-95 disabled:opacity-50"><Check size={12} /> {loadingAtender? "..." : "Atender"}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
