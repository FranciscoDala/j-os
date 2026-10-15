"use client";
import { MapPin, Phone, Mail, Crown, CheckCircle, XCircle, Calendar, Pencil, Trash2 } from "lucide-react";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=200";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
export const getImgUrl = (url?: string) => {
    if (!url) return FALLBACK_IMG;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    if (url.startsWith("/media")) return `${API_URL}${url}`;
    return url;
};
export function AdminEmpresaCard({ emp, onEnter, onEdit, onDelete }: any) {
    const isOn =!!emp.whatsapp_conectado;
    return (
        <div className="group relative w-full rounded-[22px] overflow-hidden border border-[#F3E9DF] bg-[#FFFEFB] shadow-sm hover:shadow-md transition-all flex flex-col">
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 z-20">
                <button onClick={() => onEdit(emp)} className="w-9 h-9 bg-black/90 text-white rounded-full flex items-center justify-center"><Pencil size={14} /></button>
                <button onClick={() => onDelete(emp)} className="w-9 h-9 bg-white border rounded-full flex items-center justify-center hover:text-red-600"><Trash2 size={14} /></button>
            </div>
            <div className={`h-[138px] flex items-center justify-center ${isOn? "bg-[#FFEAA6]" : "bg-[#F3E9DF]"}`}>
                <img src={getImgUrl(emp.logo_url)} onError={(e: any) => e.currentTarget.src = FALLBACK_IMG} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="px-3.5 py-3 flex flex-col flex-1">
                <h3 className="font-black text-[13px] line-clamp-2 min-h-[31px]">{emp.nome_fantasia}</h3>
                <div className="mt-1.5 flex gap-1"><span className="text-[9px] font-bold bg-[#F5F0E9] px-2 py-0.5 rounded-full">{emp.tipo}</span><span className="text-[9px] bg-[#F5F0E9] px-2 py-0.5 rounded-full">{emp.nif || "Sem NIF"}</span></div>
                <div className="mt-2 bg-[#F5F0E9] rounded-[12px] px-2.5 py-2 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#2F4A8A] text-white flex items-center justify-center font-black text-[10px]">{emp.dono?.nome?.[0] || "D"}</div>
                    <div className="overflow-hidden"><p className="text-[10px] font-black truncate flex items-center gap-1"><Crown size={10} className="text-amber-500" />{emp.dono?.nome || "Sem dono"}</p><p className="text-[8px] text-[#8A8A8A] truncate">{emp.dono?.email}</p></div>
                </div>
                <div className="mt-auto pt-3 flex justify-between items-end"><p className="text-[11px] font-black flex items-center gap-1"><Calendar size={10} />{emp.created_at? new Date(emp.created_at).toLocaleDateString() : "-"}</p><button onClick={() => onEnter(emp)} className="h-[30px] px-4 rounded-full bg-[#FFC91A] text-black text-[11px] font-black">Entrar</button></div>
            </div>
        </div>
    )
}
