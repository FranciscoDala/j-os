"use client";
import { AlertTriangle, Banknote, TrendingDown, X } from "lucide-react";

type Props = {
    open: boolean;
    title: string;
    desc: string;
    type: "black" | "green" | "red";
    onClose: () => void;
    onConfirm: () => void;
};

export function JConfirm({ open, title, desc, type, onClose, onConfirm }: Props) {
    if (!open) return null;

    const iconBg = type === "green"? "bg-[#0CC06B]" : type === "red"? "bg-[#E53935]" : "bg-black";
    const Icon = type === "green"? Banknote : type === "red"? TrendingDown : AlertTriangle;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={onClose} />
            <div className="relative w-full max-w-[360px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">

                <div className="bg-white m-[6px] rounded-[18px] p-5">
                    <div className={`w-10 h-10 rounded-full ${iconBg} text-white flex items-center justify-center mb-3`}>
                        <Icon size={18} />
                    </div>
                    <h3 className="font-black text-[18px] leading-none text-black">{title}</h3>
                    <p className="text-[12px] text-zinc-600 mt-2 leading-[16px]">{desc}</p>
                </div>

                <div className="p-3 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-white border border-black/10 rounded-full py-3.5 text-[12px] font-bold hover:bg-zinc-50 active:scale-[0.98]"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => { onClose(); onConfirm(); }}
                        className={`flex-1 text-white rounded-full py-3.5 text-[12px] font-bold active:scale-[0.98] ${iconBg} hover:opacity-90`}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
