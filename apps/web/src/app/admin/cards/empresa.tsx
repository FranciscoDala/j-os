"use client";
import { MapPin, Phone, Mail, Crown, CheckCircle, XCircle, Calendar, Building2 } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=200";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
export const getImgUrl = (url?: string) => {
    if (!url) return FALLBACK_IMG;
    if (url.startsWith("blob:")) return url;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/media")) return `${API_URL}${url}`;
    return url;
};

type Props = {
    emp: any;
    onEnter?: (emp: any) => void;
    onDetails?: (emp: any) => void;
}

export function AdminEmpresaCard({ emp, onEnter, onDetails }: Props) {
    const isWhatsappOn =!!emp.whatsapp_conectado;
    const isVerified =!!emp.nif_verified;

    // cores iguais ao produto card
    const topBg = isWhatsappOn? "bg-[#FFEAA6]" : "bg-[#F3E9DF]";
    const cardBorder = isWhatsappOn? "border-amber-200" : "border-[#F3E9DF]";
    const cardBg = "bg-[#FFFEFB]";

    const tags = [emp.tipo, emp.city].filter(Boolean).slice(0, 2);

    return (
        <div className={`group relative w-full rounded-[18px] md:rounded-[22px] overflow-hidden border shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] md:hover:-translate-y-0.5 transition-all duration-300 flex flex-col ${cardBg} ${cardBorder}`}>

            {/* TOP - logo */}
            <div className={`relative w-full h-[120px] sm:h-[128px] md:h-[138px] overflow-hidden flex items-center justify-center ${topBg}`}>
                <img
                    src={getImgUrl(emp.logo_url)}
                    onError={(e) => (e.currentTarget.src = FALLBACK_IMG)}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    alt={emp.nome_fantasia}
                />

                {/* badge NIF */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white z-10 ${isVerified? "bg-black text-white" : "bg-white text-zinc-400"}`}>
                        {isVerified? <CheckCircle size={12} /> : <XCircle size={12} />}
                    </div>
                </div>

                {/* badge whatsapp */}
                <div className={`absolute bottom-2 left-2 text-[7px] md:text-[8px] font-black px-2 py-0.5 rounded-full border border-white flex items-center gap-0.5 shadow ${isWhatsappOn? "bg-[#FFE0B2] text-[#A65C00]" : "bg-zinc-200 text-zinc-500"}`}>
                    {isWhatsappOn? "WHATSAPP ON" : "OFF"}
                </div>

                {/* badge superadmin */}
                <div className="absolute top-2 right-2 bg-black text-white text-[8px] font-black px-2 py-1 rounded-full shadow-md">
                    LOJA
                </div>
            </div>

            <div className="px-3 md:px-3.5 py-2.5 md:py-3 flex flex-col flex-1">
                {/* nome */}
                <h3 className="font-black text-[12px] md:text-[13px] leading-[1.2] text-[#1E1E1E] line-clamp-2 break-words min-h-[28px] md:min-h-[31px]">
                    {emp.nome_fantasia}
                </h3>

                {/* tags */}
                <div className="mt-1.5 flex items-center gap-1 flex-wrap min-h-[18px]">
                    {tags.map((t: any, i: number) => (
                        <span key={i} className="text-[8px] md:text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full truncate max-w-[70px]">
                            {String(t)}
                        </span>
                    ))}
                    <span className="text-[8px] md:text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full">
                        {emp.nif || "Sem NIF"}
                    </span>
                </div>

                {/* DONO - no estilo descrição */}
                <div className="mt-2 bg-[#F5F0E9] rounded-[12px] px-2.5 py-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#2F4A8A] text-white flex items-center justify-center font-black text-[10px] overflow-hidden shrink-0">
                        {emp.dono?.avatar_url? <img src={getImgUrl(emp.dono.avatar_url)} className="w-full h-full object-cover" /> : (emp.dono?.nome?.[0] || "D")}
                    </div>
                    <div className="overflow-hidden leading-none">
                        <p className="text-[10px] font-black text-[#1E1E1E] truncate flex items-center gap-1"><Crown size={10} className="text-amber-500" /> {emp.dono?.nome || "Sem dono"}</p>
                        <p className="text-[8px] text-[#8A8A8A] truncate mt-1 flex items-center gap-1"><Mail size={8} /> {emp.dono?.email || "—"}</p>
                    </div>
                </div>

                {/* detalhes */}
                <div className="mt-2 space-y-1 min-h-[26px]">
                    {emp.phone && <p className="text-[9px] text-[#7A7A7A] flex items-center gap-1 truncate"><Phone size={10} /> {emp.phone}</p>}
                    {emp.address && <p className="text-[9px] text-[#7A7A7A] flex items-center gap-1 truncate"><MapPin size={10} /> {emp.address}{emp.city? ` - ${emp.city}` : ''}</p>}
                </div>

                <div className="mt-auto pt-2.5 md:pt-3 flex items-end justify-between gap-2">
                    <div className="leading-none">
                        <p className="text-[11px] md:text-[12px] font-black text-[#1E1E1E] tracking-tight flex items-center gap-1">
                            <Calendar size={10} className="text-[#8A8A8A]" /> {emp.created_at? new Date(emp.created_at).toLocaleDateString() : "-"}
                        </p>
                        <p className="text-[8px] md:text-[9px] font-bold text-[#9A9A9A] mt-1">{emp.email || "Sem email"}</p>
                    </div>
                    <button onClick={() => onEnter?.(emp)} className="h-[30px] px-4 rounded-full bg-[#FFC91A] hover:bg-[#FFB800] text-black text-[11px] font-black shadow-sm transition-colors shrink-0 active:scale-95">
                        Entrar
                    </button>
                </div>
            </div>
        </div>
    )
}
