"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

const getImgUrl = (url?: string) => {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith("blob:")) return url;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/media")) return `${API_URL}${url}`;
  return url;
};

export function AdminDeleteModal({ open, onOpenChange, loja, onConfirm, deleting }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open ||!loja ||!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#FAF6F1]/80 backdrop-blur-[14px] flex items-center justify-center p-4">
      <div className="w-full max-w-[340px] bg-white rounded-[28px] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-[80px] h-[80px] rounded-full p-[3px] bg-[#FFE0E0]">
          <img
            src={getImgUrl(loja?.logo_url)}
            onError={(e: any) => (e.currentTarget.src = FALLBACK_IMG)}
            className="w-full h-full rounded-full object-cover bg-white"
            alt=""
          />
        </div>

        <h3 className="mt-3 font-black text-[13px] break-words line-clamp-2 max-w-[240px]">
          {loja?.nome_fantasia}
        </h3>

        <p className="mt-1 text-[10px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2.5 py-1 rounded-full">
          {loja?.tipo} • {loja?.nif || "NIF —"}
        </p>

        <p className="mt-3 text-[11px] text-[#7A7A7A] leading-[1.4]">
          Tem certeza que deseja apagar?<br />
          <span className="font-bold text-[#1E1E1E]">Essa ação é irreversível.</span>
        </p>

        {loja?.dono?.nome && (
          <div className="mt-3 w-full bg-[#F8F3EB] rounded-[12px] px-3 py-2 flex items-center gap-2 text-left border border-[#F0E6D9]/50">
            <div className="w-7 h-7 rounded-full bg-[#2F4A8A] text-white flex items-center justify-center text-[10px] font-black shrink-0">
              {loja.dono.nome[0]}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black truncate">{loja.dono.nome}</p>
              <p className="text-[9px] text-zinc-500 truncate">{loja.dono.email}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-5 w-full">
          <button
            onClick={() => onOpenChange(false)}
            disabled={deleting}
            className="flex-1 h-10 bg-white border border-[#E8DCCF] rounded-full flex items-center justify-center hover:bg-[#F5F0E9] transition-colors active:scale-95 disabled:opacity-50"
          >
            <X size={16} />
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 h-10 bg-[#C62828] text-white rounded-full flex items-center justify-center hover:bg-[#B71C1C] transition-colors gap-1.5 font-black text-[12px] active:scale-95 disabled:opacity-50"
          >
            {deleting? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            {deleting? "..." : "Apagar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
