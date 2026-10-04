"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Loader2 } from "lucide-react";

export function DeleteConfirmModal({ open, setOpen, entidade, onConfirm, loading }: any) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!open ||!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] w-screen h-screen bg-[#FAF6F1]/80 backdrop-blur-[14px] flex items-center justify-center p-4">
            <div className="w-full max-w-[360px] bg-white rounded-[22px] border shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-5 space-y-4">
                <div className="flex justify-between items-center">
                    <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center"><Trash2 size={18} /></div>
                    <button onClick={() => setOpen(false)} className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center"><X size={14} /></button>
                </div>
                <div>
                    <h3 className="font-black text-[14px]">Apagar {entidade?.nome}?</h3>
                    <p className="text-[11px] opacity-60 mt-1 leading-tight">Essa ação vai desativar o registro. Você pode reativar depois no banco se precisar.</p>
                </div>
                <div className="flex gap-2 justify-end">
                    <button onClick={() => setOpen(false)} className="px-5 py-2.5 rounded-full border text-[11px] font-black">Cancelar</button>
                    <button onClick={onConfirm} disabled={loading} className="px-5 py-2.5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center gap-2">
                        {loading? <Loader2 size={14} className="animate-spin" /> : null} Apagar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
