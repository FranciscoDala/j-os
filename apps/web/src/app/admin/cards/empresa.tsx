"use client";
import { Pencil, Trash2, Crown, MapPin, Mail, Phone, Calendar, ShieldCheck } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

export const getImgUrl = (url?: string) => {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  if (url.startsWith("/media")) return `${API_URL}${url}`;
  return url;
};

type Props = {
  emp: any;
  onEdit: (emp: any) => void;
  onDelete: (emp: any) => void;
}

export function AdminEmpresaCard({ emp, onEdit, onDelete }: Props) {
  const tags = [emp.tipo, emp.nif].filter(Boolean).slice(0, 2);
  const donoNome = emp.dono?.nome || "Sem dono";
  const donoEmail = emp.dono?.email || "—";

  return (
    <div className="group relative w-full rounded-[18px] md:rounded-[22px] overflow-hidden border border-[#F3E9DF] bg-[#FFFEFB] shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] md:hover:-translate-y-0.5 transition-all duration-300 flex flex-col">

      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button onClick={(e) => { e.stopPropagation(); onEdit(emp); }} className="w-9 h-9 bg-black/90 text-white rounded-full flex items-center justify-center hover:bg-black shadow-[0_4px_12px_rgba(0,0,0,0.25)] border border-white/10 active:scale-95" aria-label="Editar">
          <Pencil size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(emp); }} className="w-9 h-9 bg-white border border-black/10 rounded-full flex items-center justify-center hover:bg-red-50 text-black hover:text-red-600 shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:scale-95" aria-label="Apagar">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="relative w-full h-[120px] sm:h-[128px] md:h-[138px] overflow-hidden flex items-center justify-center bg-[#FFFBF0]">
        <img src={getImgUrl(emp.logo_url)} onError={(e: any) => (e.currentTarget.src = FALLBACK_IMG)} className="w-full h-full object-contain p-4 group-hover:scale-[1.03] transition-transform duration-500" alt={emp.nome_fantasia} />
        <div className="absolute top-2 left-2 bg-black text-white text-[8px] font-black px-2.5 py-1 rounded-full tracking-widest border border-white/20 shadow flex items-center gap-1">
          <ShieldCheck size={10} /> {emp.tipo || "LOJA"}
        </div>
      </div>

      <div className="px-3 md:px-3.5 py-2.5 md:py-3 flex flex-col flex-1">
        <h3 className="font-black text-[12px] md:text-[13px] leading-[1.2] text-[#1E1E1E] line-clamp-2 break-words min-h-[28px] md:min-h-[31px]">{emp.nome_fantasia}</h3>

        <div className="mt-1.5 flex items-center gap-1 flex-wrap min-h-[18px]">
          {tags.map((t: any, i: number) => (
            <span key={i} className="text-[8px] md:text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full truncate max-w-[90px]">{String(t)}</span>
          ))}
        </div>

        <div className="mt-2.5 bg-[#F8F3EB] rounded-[12px] px-3 py-2.5 flex items-center gap-2.5 border border-[#F0E6D9]/50">
          <div className="w-8 h-8 rounded-full bg-[#2F4A8A] text-white flex items-center justify-center font-black text-[11px] shrink-0 overflow-hidden border-2 border-white shadow-sm">
            {emp.dono?.avatar_url? <img src={getImgUrl(emp.dono.avatar_url)} className="w-full h-full object-cover" alt="" /> : donoNome[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black truncate flex items-center gap-1 text-[#1E1E1E]"><Crown size={10} className="text-amber-500 shrink-0" />{donoNome}</p>
            <p className="text-[9px] text-[#9A9A9A] truncate flex items-center gap-1"><Mail size={10} className="shrink-0" />{donoEmail}</p>
          </div>
        </div>

        <div className="mt-2 hidden sm:flex flex-col gap-1">
          {(emp.city || emp.address) && <p className="text-[9px] text-[#7A7A7A] flex items-center gap-1 truncate"><MapPin size={10} className="shrink-0" />{emp.city || ""}{emp.address? ` • ${emp.address}` : ""}</p>}
          {(emp.phone || emp.email) && <p className="text-[9px] text-[#7A7A7A] flex items-center gap-1 truncate"><Phone size={10} className="shrink-0" />{emp.phone || emp.email}</p>}
        </div>

        <div className="mt-auto pt-2.5 md:pt-3 flex items-center justify-between gap-2">
          <p className="text-[10px] font-black text-[#1E1E1E] flex items-center gap-1"><Calendar size={10} />{emp.created_at? new Date(emp.created_at).toLocaleDateString() : "—"}</p>
          <p className="text-[8px] font-bold text-[#9A9A9A] bg-[#F5F0E9] px-2 py-1 rounded-full">ID: {String(emp.id).slice(0, 8)}</p>
        </div>
      </div>
    </div>
  );
}
