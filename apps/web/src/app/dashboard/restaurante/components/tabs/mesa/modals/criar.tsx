"use client";
import { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

const ZONAS = ["Salão", "Varanda", "VIP", "Bar", "Terraço"];

function CustomSelect({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    return (
        <div ref={ref} className="relative w-full">
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 h-9 text-[11px] font-bold flex items-center justify-between hover:border-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all">
                <span>{value}</span>
                <ChevronDown size={14} className={`ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[16px] border border-[#E8DCCF] shadow-[0_16px_32px_rgba(0,0,0,0.18)] z-[999] overflow-hidden p-1 max-h-[160px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {ZONAS.map(z => (
                        <button key={z} type="button" onClick={() => { onChange(z); setOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-full text-[11px] font-bold transition-all ${value === z ? "bg-black text-white" : "hover:bg-[#F5E6D3]"}`}>{z}</button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function MesaModal({ open, onClose, numero, setNumero, capacidade, setCapacidade, zonaNew, setZonaNew, onCreate, saving, isEditing }: any) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
            <div className="relative w-full max-w-[380px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col animate-in fade-in zoom-in-95 overflow-visible">

                {/* HEADER */}
                <div className="bg-white m-[6px] rounded-[18px] p-3 flex justify-between items-start border border-black/5 shrink-0">
                    <div>
                        <p className="font-black text-[13px] leading-none text-black">
                            {isEditing ? `MESA ${numero}` : "NOVA MESA"}
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-1 font-bold">
                            {isEditing ? "Altere os dados da mesa" : "Crie uma nova mesa para o salão"}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95">
                        <X size={14} />
                    </button>
                </div>

                {/* FORM - SEM overflow-hidden AQUI */}
                <div className="bg-white m-[6px] mt-0 rounded-[18px] p-4 border border-black/5 flex flex-col overflow-visible">
                    <div className="space-y-3 overflow-visible">
                        <div>
                            <p className="text-[8px] font-black tracking-widest text-zinc-500 mb-1 ml-1">NÚMERO DA MESA</p>
                            <input value={numero} onChange={e => setNumero(e.target.value.toUpperCase())} placeholder="M01" className="w-full h-9 rounded-full border border-[#E8DCCF] px-4 text-[11px] font-black outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 overflow-visible">
                            <div>
                                <p className="text-[8px] font-black tracking-widest text-zinc-500 mb-1 ml-1">CAPACIDADE</p>
                                <input type="number" value={capacidade} onChange={e => setCapacidade(Number(e.target.value))} className="w-full h-9 rounded-full border border-[#E8DCCF] px-4 text-[11px] font-bold outline-none focus:border-black focus:ring-1 focus:ring-black transition-all" />
                            </div>
                            <div className="overflow-visible">
                                <p className="text-[8px] font-black tracking-widest text-zinc-500 mb-1 ml-1">ZONA</p>
                                <CustomSelect value={zonaNew} onChange={setZonaNew} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-5">
                        <button onClick={onClose} className="flex-1 bg-white border border-black/10 rounded-full py-3 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.98] transition-all">Cancelar</button>
                        <button onClick={onCreate} disabled={saving} className="flex-1 bg-black text-white rounded-full py-3 text-[11px] font-black disabled:opacity-50 hover:bg-zinc-800 active:scale-[0.98] transition-all">{saving ? "..." : isEditing ? "Salvar" : "Criar"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
