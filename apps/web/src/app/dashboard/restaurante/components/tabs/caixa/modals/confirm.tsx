"use client";
import { AlertTriangle } from "lucide-react";

export function JConfirm({ open, title, desc, type, onClose, onConfirm }: { open: boolean, title: string, desc: string, type: "black" | "green" | "red", onClose: ()=>void, onConfirm: ()=>void }) {
    if (!open) return null;
    const accent = type === "green"? "bg-[#0CC06B]" : type === "red"? "bg-[#E53935]" : "bg-black";
    const iconBg = type === "green"? "bg-[#0CC06B]/10 text-[#0CC06B]" : type === "red"? "bg-[#E53935]/10 text-[#E53935]" : "bg-black/5 text-black";
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-[360px] bg-white rounded-[24px] border p-6 shadow-xl">
                <div className={`absolute top-0 left-6 right-6 h-[3px] rounded-full ${accent}`} />
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${iconBg}`}><AlertTriangle size={18} /></div>
                <h3 className="text-black font-black text-[13px] uppercase">{title}</h3>
                <p className="text-gray-500 text-[11px] mt-2">{desc}</p>
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button onClick={onClose} className="h-[42px] rounded-full bg-[#F5F7FB] border text-black font-black text-[11px]">CANCELAR</button>
                    <button onClick={()=>{ onClose(); onConfirm(); }} className={`h-[42px] rounded-full text-white font-black text-[11px] ${accent}`}>CONFIRMAR</button>
                </div>
            </div>
        </div>
    )
}
