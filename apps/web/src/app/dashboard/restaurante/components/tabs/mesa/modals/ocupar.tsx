"use client";
import { useState } from "react";

export function MesaOcuparModal({ open, mesa, onClose, onConfirm, saving }: any) {
    const [pessoas, setPessoas] = useState(mesa?.capacidade || 2);
    if (!open || !mesa) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[22px] w-full max-w-[360px] p-6 border border-[#E8DCCF]">
                <h3 className="font-black text-[14px]">Ocupar Mesa {mesa.numero}</h3>
                <p className="text-[11px] opacity-60 font-bold mt-1">{mesa.zona} • cap {mesa.capacidade}</p>
                <div className="mt-4 space-y-3">
                    <div>
                        <label className="text-[10px] font-black tracking-widest">PESSOAS</label>
                        <input type="number" min={1} max={20} value={pessoas} onChange={e => setPessoas(Number(e.target.value))} className="w-full mt-1 h-11 rounded-full border border-[#E8DCCF] px-4 text-[12px] font-bold" />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={onClose} className="flex-1 h-11 rounded-full border border-[#E8DCCF] text-[12px] font-bold">Cancelar</button>
                        <button onClick={() => onConfirm(pessoas)} disabled={saving} className="flex-1 h-11 rounded-full bg-black text-white text-[12px] font-black disabled:opacity-50">{saving ? "..." : "Ocupar"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
