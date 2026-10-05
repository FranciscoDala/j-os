"use client";
import { useState } from "react";
export function MesaOcuparModal({ open, mesa, onClose, onConfirm, saving }: any) {
    const [pessoas, setPessoas] = useState(2);
    if (!open || !mesa) return null;
    return (<div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-[24px] w-full max-w-[360px] p-6 border"><h3 className="font-black text-[15px]">Ocupar Mesa {mesa.numero}</h3><div className="mt-4"><label className="text-[10px] font-black tracking-widest opacity-60">QUANTAS PESSOAS?</label><div className="flex items-center gap-3 mt-2"><button onClick={() => setPessoas(Math.max(1, pessoas - 1))} className="w-11 h-11 rounded-full border font-black">-</button><span className="flex-1 text-center font-black text-[20px]">{pessoas}</span><button onClick={() => setPessoas(Math.min(20, pessoas + 1))} className="w-11 h-11 rounded-full bg-black text-white font-black">+</button></div></div><div className="flex gap-2 mt-6"><button onClick={onClose} className="flex-1 h-11 rounded-full border text-[12px] font-bold">Cancelar</button><button onClick={() => onConfirm(pessoas)} disabled={saving} className="flex-1 h-11 rounded-full bg-black text-white text-[12px] font-black">{saving ? "..." : "Confirmar"}</button></div></div></div>);
}
