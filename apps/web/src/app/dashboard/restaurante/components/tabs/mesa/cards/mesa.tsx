"use client";
import { Users, Clock, Receipt, MapPin, Ban } from "lucide-react";

const statusConfig: any = {
    LIVRE: {
        topBg: "bg-[#D6F0D6] from-[#E8F8E9] to-[#C8E6C9]",
        badge: "bg-[#2E7D32] text-white",
        price: "text-[#2E7D32]",
        border: "border-[#C8E6C9]",
        cardBg: "bg-[#F8FFF8]",
        label: "LIVRE",
    },
    OCUPADA: {
        topBg: "bg-[#FFEAA6] from-[#FFF3C0] to-[#FFD86A]",
        badge: "bg-[#C62828] text-white",
        price: "text-[#EBA500]",
        border: "border-amber-200",
        cardBg: "bg-[#FFFEFB]",
        label: "OCUPADA",
    },
    RESERVADA: {
        topBg: "bg-[#F5E6D3] from-[#FFF8F0] to-[#E8DCCF]",
        badge: "bg-[#A67C52] text-white",
        price: "text-[#A67C52]",
        border: "border-[#E8DCCF]",
        cardBg: "bg-[#FFFBF5]",
        label: "RESERVADA",
    },
    SUJA: {
        topBg: "bg-[#EEEEEE] from-[#F5F5F5] to-[#E0E0E0]",
        badge: "bg-zinc-500 text-white",
        price: "text-zinc-500",
        border: "border-zinc-200",
        cardBg: "bg-[#FAFAFA]",
        label: "SUJA",
    },
};

export function MesaCard({ m, onOcupar, onComanda, onLimpar, onLiberar, onDetalhe }: any) {
    const cfg = statusConfig[m.status] || statusConfig.LIVRE;
    const min = m.aberta_em? Math.floor((Date.now() - new Date(m.aberta_em).getTime()) / 60000) : 0;
    const total = Number(m.venda_total || m.total_consumo || 0);
    const hasConsumo = total > 0;

    return (
        <div className={`group relative w-full rounded-[22px] overflow-hidden border shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col ${cfg.cardBg} ${cfg.border}`}>
            {/* TOPO - igual sorvete */}
            <div className={`relative w-full h-[132px] bg-gradient-to-br ${cfg.topBg} flex items-center justify-center overflow-hidden`}>
                <div className="flex flex-col items-center">
                    <span className="text-[44px] font-black tracking-tight text-[#1A1A1A] leading-none">{m.numero}</span>
                    <span className="mt-1 text-[11px] font-black tracking-widest opacity-60">MESA</span>
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-white/80 backdrop-blur px-2 py-0.5 rounded-full"><MapPin size={10} />{m.zona || "Salão"}</span>
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-white/80 backdrop-blur px-2 py-0.5 rounded-full"><Users size={10} />{m.capacidade}</span>
                    </div>
                </div>
                <span className={`absolute top-2.5 left-2.5 text-[8px] font-black px-2.5 py-1 rounded-full tracking-widest shadow-sm ${cfg.badge}`}>{cfg.label}</span>
                {m.status === "OCUPADA" && <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#C62828] rounded-full animate-pulse border-2 border-white shadow" />}
            </div>

            {/* INFO */}
            <div className="px-3.5 py-3 flex flex-col flex-1">
                <h3 className="font-black text-[13px] leading-[1.1] text-[#1E1E1E]">MESA {m.numero}</h3>

                <div className="mt-1.5 flex items-center gap-1 flex-wrap min-h-[18px]">
                    {m.status === "OCUPADA"? (
                        <>
                            <span className="text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} />{min} min</span>
                            <span className="text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full">{m.pessoas_atual || 1}p • {m.garcom_nome?.split(" ")[0] || "Garçom"}</span>
                        </>
                    ) : m.status === "LIVRE"? (
                        <span className="text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full">Pronta • {m.capacidade} lugares</span>
                    ) : m.status === "SUJA"? (
                        <span className="text-[9px] font-bold text-[#8A8A8A] bg-zinc-100 px-2 py-0.5 rounded-full">Aguardando limpeza</span>
                    ) : (
                        <span className="text-[9px] font-bold text-[#8C6A45] bg-[#A67C52]/15 px-2 py-0.5 rounded-full">Reservada • {m.reserva_nome || "Cliente"}</span>
                    )}
                </div>

                <div className="mt-2.5 min-h-[28px]">
                    {m.status === "OCUPADA"? (
                        <p className="text-[10px] leading-[1.2] text-[#8A8A8A] truncate">{hasConsumo? `${total.toLocaleString("de-DE")} Kz em consumo` : "Sem consumo ainda"}</p>
                    ) : (
                        <p className="text-[10px] leading-[1.2] text-[#8A8A8A] truncate">{m.zona || "Salão principal"} • {m.capacidade} pessoas</p>
                    )}
                    {m.status === "OCUPADA" && hasConsumo && <p className="text-[10px] font-medium text-[#8A8A8A] mt-0.5">Garçom: {m.garcom_nome?.split(" ")[0] || "—"}</p>}
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                    <div className="leading-none">
                        <div className="w-4 h-0.5 bg-[#FFC91A] rounded-full mb-1" />
                        <p className={`text-[14px] font-black tracking-tight ${cfg.price}`}>
                            {hasConsumo? `${total.toLocaleString("de-DE")}` : "—"} {hasConsumo && <span className="text-[10px]">Kz</span>}
                        </p>
                        <p className="text-[9px] font-bold text-[#9A9A9A] mt-0.5">+ {hasConsumo? "Consumo" : cfg.label}</p>
                    </div>

                    {m.status === "LIVRE" && (
                        <button onClick={() => onOcupar(m)} className="h-[30px] px-4 rounded-full bg-[#FFC91A] hover:bg-[#FFB800] text-black text-[11px] font-black shadow-sm transition-colors">Ocupar</button>
                    )}
                    {m.status === "OCUPADA" && hasConsumo && (
                        <button onClick={() => onComanda(m)} className="h-[30px] px-3.5 rounded-full bg-black text-white text-[10px] font-black flex items-center gap-1 hover:bg-zinc-800"><Receipt size={11} /> Fechar</button>
                    )}
                    {m.status === "OCUPADA" &&!hasConsumo && (
                        <button onClick={() => onComanda(m)} className="h-[30px] px-4 rounded-full bg-[#FFC91A] hover:bg-[#FFB800] text-black text-[11px] font-black">Comanda</button>
                    )}
                    {m.status === "SUJA" && (
                        <button onClick={() => onLimpar(m)} className="h-[30px] px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black">Limpar</button>
                    )}
                    {m.status === "RESERVADA" && (
                        <button onClick={() => onOcupar(m)} className="h-[30px] px-4 rounded-full bg-[#A67C52] hover:bg-[#8C6A45] text-white text-[10px] font-black">Check-in</button>
                    )}
                </div>

                {/* segunda linha pra ocupar com 2 btns */}
                {m.status === "LIVRE" && (
                    <div className="mt-2 flex justify-end">
                        <button onClick={() => onDetalhe(m)} className="text-[10px] font-bold text-[#8A8A8A] hover:text-black underline-offset-2 hover:underline">Detalhes</button>
                    </div>
                )}
                {m.status === "OCUPADA" &&!hasConsumo && (
                    <div className="mt-2 flex justify-end">
                        <button onClick={() => onLiberar(m)} className="text-[10px] font-bold text-[#8A8A8A] hover:text-red-500 flex items-center gap-1"><Ban size={10} />Liberar</button>
                    </div>
                )}
            </div>
        </div>
    );
}

// CustomSelect mantido, já compacto
"use client";
import { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
export function CustomSelect({ value, onChange, options, labelMap }: any) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    return (
        <div ref={ref} className={`relative ${open? "z-[60]" : "z-0"} w-full`}>
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 h-[42px] text-[11px] font-black text-left flex items-center justify-between shadow-sm outline-none hover:border-[#A67C52] transition-all">
                <span className="truncate">{labelMap[value] || value}</span><ChevronDown size={14} className={`shrink-0 ml-2 transition-transform ${open? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[100] p-1.5">
                    <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-0.5">
                        {options.map((opt: string) => (<button key={opt} onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-full text-[11px] font-bold transition-all ${value === opt? "bg-black text-white" : "bg-white hover:bg-[#F5E6D3]"}`}>{labelMap[opt] || opt}</button>))}
                    </div>
                </div>
            )}
        </div>
    )
}
