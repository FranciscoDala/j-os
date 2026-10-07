"use client";
import { Trash2 } from "lucide-react";

export function MesaDeleteModal({ open, mesa, saving, onClose, onConfirm }: any) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
            <div className="relative w-full max-w-[360px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
                <div className="bg-white m-[6px] rounded-[18px] p-5">
                    <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center mb-3"><Trash2 size={18} /></div>
                    <h3 className="font-black text-[18px] leading-none">Apagar mesa?</h3>
                    <p className="text-[12px] text-zinc-600 mt-2">Tens a certeza que queres apagar a <span className="font-black text-black">MESA {mesa?.numero}</span>?</p>
                </div>
                <div className="p-3 flex gap-2">
                    <button onClick={onClose} className="flex-1 bg-white border border-black/10 rounded-full py-3.5 text-[12px] font-bold">Cancelar</button>
                    <button onClick={onConfirm} disabled={saving} className="flex-1 bg-black text-white rounded-full py-3.5 text-[12px] font-bold disabled:opacity-50">{saving? "..." : "Apagar"}</button>
                </div>
            </div>
        </div>
    );
}
