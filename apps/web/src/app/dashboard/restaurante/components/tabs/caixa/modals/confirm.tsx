"use client";
import { AlertTriangle } from "lucide-react";

export function JConfirm({ open, title, desc, type, onClose, onConfirm }: { open: boolean, title: string, desc: string, type: "black" | "green" | "red", onClose: () => void, onConfirm: () => void }) {
    if (!open) return null;
    const accent = type === "green" ? "bg-[#0CC06B]" : type === "red" ? "bg-[#E53935]" : "bg-black";
    const iconBg = type === "green" ? "bg-[#0CC06B]/10 text-[#0CC06B]" : type === "red" ? "bg-[#E53935]/10 text-[#E53935]" : "bg-black text-white";
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={onClose} />
            <div className="relative w-full max-w-[360px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-[6px] animate-in fade-in zoom-in-95">
                <div className="bg-white rounded-[18px] border border-black/5 p-5 overflow-hidden relative">
                    <div className={`absolute top-0 left-6 right-6 h-[3px] rounded-full ${accent}`} />
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${iconBg}`}><AlertTriangle size={18} /></div>
                    <h3 className="text-black font-black text-[13px] uppercase leading-tight">{title}</h3>
                    <p className="text-zinc-500 text-[11px] font-bold mt-2 leading-snug">{desc}</p>
                    <div className="grid grid-cols-2 gap-2 mt-5">
                        <button onClick={onClose} className="h-11 rounded-full bg-white border border-black/10 text-black font-black text-[11px] hover:bg-zinc-50 active:scale-[0.98] transition-all">CANCELAR</button>
                        <button onClick={() => { onClose(); onConfirm(); }} className={`h-11 rounded-full text-white font-black text-[11px] active:scale-[0.98] transition-all ${accent} hover:opacity-90`}>CONFIRMAR</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
