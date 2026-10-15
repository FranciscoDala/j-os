"use client";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

export const getImgUrl = (url?: string) => {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  if (url.startsWith("/media")) return `${API_URL}${url}`;
  return url;
};

export function AdminEmpresaCard({ emp, onEnter, onEdit, onDelete }: any) {
  return (
    <div className="group relative w-full h-full min-h-[220px] rounded-[20px] border border-[#F0E6D9] bg-white shadow-sm hover:shadow-md transition-all flex flex-col">
      <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 z-20">
        <button onClick={() => onEdit(emp)} className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-[10px]">✎</button>
        <button onClick={() => onDelete(emp)} className="w-8 h-8 bg-white border shadow rounded-full flex items-center justify-center text-[10px]">🗑</button>
      </div>

      <div className="w-full h-[120px] shrink-0 bg-[#FFFBF0] rounded-t-[20px] border-b border-[#F5EEE5] flex items-center justify-center p-2 overflow-hidden">
        <img src={getImgUrl(emp.logo_url)} alt={emp.nome_fantasia} className="max-w-full max-h-full object-contain" />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-black text-[13px] line-clamp-1">{emp.nome_fantasia}</h3>
        <div className="mt-2 flex gap-1.5"><span className="text-[9px] font-bold bg-[#F5F0E9] px-2.5 py-1 rounded-full">{emp.tipo}</span><span className="text-[9px] font-bold bg-[#F5F0E9] px-2.5 py-1 rounded-full">{emp.nif || "500876654"}</span></div>
        <div className="mt-3 bg-[#F8F3EB] rounded-[10px] px-3 py-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#2F4A8A] text-white flex items-center justify-center text-[10px] font-black">{emp.dono?.nome?.[0] || "A"}</div>
          <div className="min-w-0"><p className="text-[10px] font-black truncate">{emp.dono?.nome || "Admin"}</p><p className="text-[8px] text-zinc-500 truncate">{emp.dono?.email}</p></div>
        </div>
        <div className="mt-auto pt-4 flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">{emp.created_at? new Date(emp.created_at).toLocaleDateString() : ""}</span>
          <button onClick={() => onEnter(emp)} className="h-8 px-4 rounded-full bg-[#FFC91A] text-black text-[11px] font-black">Entrar</button>
        </div>
      </div>
    </div>
  );
}
