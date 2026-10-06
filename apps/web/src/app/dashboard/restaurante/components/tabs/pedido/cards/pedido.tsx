"use client";
import { Clock, Check, X, FileText } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

export const getImgUrl = (url?: string) => {
    if (!url) return FALLBACK_IMG;
    if (url.startsWith("blob:") || url.startsWith("http")) return url;
    if (url.startsWith("/media")) return `${API_URL}${url}`;
    return url;
};

function timeAgo(iso: string) {
    if (!iso) return "";
    const diffMs = Date.now() - new Date(iso).getTime();
    if (diffMs < 0) return "agora";

    const sec = Math.floor(diffMs / 1000);
    if (sec < 30) return "agora";
    if (sec < 60) return `há ${sec}s`;

    const min = Math.floor(sec / 60);
    if (min < 60) return min === 1 ? "há 1min" : `há ${min}min`;

    const h = Math.floor(min / 60);
    const m = min % 60;
    const d = Math.floor(h / 24);

    // até 6h mostra hora + min: há 1h 22min
    if (h < 6) {
        if (m === 0) return h === 1 ? "há 1h" : `há ${h}h`;
        return `há ${h}h ${m}min`;
    }
    if (h < 24) return h === 1 ? "há 1h" : `há ${h}h`;

    if (d === 1) return "ontem";
    if (d < 7) return `há ${d}d`;

    return new Date(iso).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
}

function safeKz(v: any) {
    const n = Number(v ?? 0);
    return isNaN(n) ? "0" : n.toLocaleString('de-DE');
}

export function PedidoCard({ p, onAtender, onRecusar, onDetalhe }: any) {
    const total = p.total_estimado ?? p.total ?? p.valor_total ?? 0;
    const itens = p.itens || [];
    const firstImg = itens[0]?.imagem_url || itens[0]?.imagem;

    return (
        <div className="group relative w-full min-h-[272px] rounded-[22px] overflow-hidden bg-[#FFFEFB] border border-[#F3E9DF] shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col">

            <div className="relative w-full h-[138px] bg-[#FFEAA6] overflow-hidden shrink-0">
                <img
                    src={getImgUrl(firstImg)}
                    alt="pedido"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                />
                <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-md">
                    MESA {p.mesa_numero}
                </span>
                <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="bg-white/90 backdrop-blur text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow">
                        <Clock size={10} />{timeAgo(p.created_at)}
                    </span>
                    <button onClick={() => onDetalhe(p)} className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
                        <FileText size={11} />
                    </button>
                </div>
            </div>

            {/* padding bottom real aqui */}
            <div className="px-3.5 pt-3 pb-4 flex flex-col flex-1 bg-[#FFFEFB]">
                <h3 className="font-black text-[13px] leading-[1.15] text-[#1E1E1E] line-clamp-1">
                    {p.cliente_nome || "Cliente"}
                </h3>

                <div className="mt-1.5 flex items-center gap-1 flex-wrap min-h-[18px]">
                    <span className="text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full">
                        {itens.length} itens
                    </span>
                    <span className="text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full">
                        Mesa {p.mesa_numero}
                    </span>
                </div>

                <p className="mt-2 text-[10px] leading-[1.3] text-[#7A7A7A] line-clamp-2 min-h-[26px]">
                    {itens.slice(0, 2).map((it: any) => `${it.quantidade}x ${it.produto_nome || it.nome || "Produto"}`).join(" • ")}
                </p>

                <div className="mt-auto pt-3 flex items-end justify-between gap-2">
                    <div className="leading-none pb-0.5">
                        <p className="text-[15px] font-black text-[#EBA500] tracking-tight">
                            <span className="text-[10px]">Kz </span>{safeKz(total)}
                        </p>
                        <p className="text-[9px] font-bold text-[#9A9A9A] mt-1">
                            + {itens.length} itens • {timeAgo(p.created_at)}
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => onRecusar(p)} className="w-[30px] h-[30px] rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center">
                            <X size={12} strokeWidth={3} />
                        </button>
                        <button onClick={() => onAtender(p)} className="h-[30px] px-4 rounded-full bg-black text-white text-[11px] font-black flex items-center gap-1">
                            <Check size={12} /> Atender
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
