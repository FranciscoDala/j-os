"use client";
import { MapPin, Users, Clock, Receipt, Sparkles } from "lucide-react";
const statusStyles: any = {
    LIVRE: { wrap: "border-[#C8E6C9] bg-[#F1F8E9]", badge: "bg-[#2E7D32] text-white" },
    OCUPADA: { wrap: "border-[#FFCDD2] bg-[#FFEBEE]", badge: "bg-[#C62828] text-white" },
    RESERVADA: { wrap: "border-[#FFE0B2] bg-[#FFF3E0]", badge: "bg-[#EF6C00] text-white" },
    SUJA: { wrap: "border-[#E0E0E0] bg-[#FAFAFA]", badge: "bg-zinc-500 text-white" },
};
export function MesaCard({ m, onOcupar, onComanda, onLimpar, onLiberar, onDetalhe }: any) {
    const s = statusStyles[m.status] || statusStyles.LIVRE;
    const min = m.aberta_em ? Math.floor((Date.now() - new Date(m.aberta_em).getTime()) / 60000) : 0;
    return (
        <div className={`group rounded-[22px] border p-4 shadow-sm hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] transition-all ${s.wrap}`}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-black text-[12px]">{m.numero}</div>
                    <div><div className="font-black text-[13px] leading-none">Mesa {m.numero}</div><div className="text-[10px] font-bold opacity-60 mt-0.5">{m.zona}</div></div>
                </div>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black tracking-wider ${s.badge}`}>{m.status}</span>
            </div>
            <div className="mt-3.5 space-y-1.5">
                <div className="flex items-center gap-3 text-[11px] font-bold opacity-70"><span className="flex items-center gap-1"><Users size={12} />{m.capacidade} lug</span><span className="flex items-center gap-1"><Sparkles size={12} />{m.pessoas_atual || 0} p</span></div>
                {m.status === "OCUPADA" && <div className="flex items-center gap-1 text-[11px] font-bold text-red-600"><Clock size={12} />{min} min aberta • Garçom {m.garcom_nome || "-"}</div>}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
                {m.status === "LIVRE" && <><button onClick={() => onOcupar(m)} className="h-9 rounded-full bg-black text-white text-[11px] font-black hover:bg-zinc-800">OCUPAR</button><button onClick={() => onDetalhe(m)} className="h-9 rounded-full bg-white border border-[#E8DCCF] text-[11px] font-bold">Detalhes</button></>}
                {m.status === "OCUPADA" && <><button onClick={() => onComanda(m)} className="h-9 rounded-full bg-black text-white text-[11px] font-black flex items-center justify-center gap-1"><Receipt size={12} />COMANDA</button><button onClick={() => onLiberar(m)} className="h-9 rounded-full bg-white border border-[#E8DCCF] text-[11px] font-bold">Liberar</button></>}
                {m.status === "SUJA" && <button onClick={() => onLimpar(m)} className="col-span-2 h-9 rounded-full bg-emerald-600 text-white text-[11px] font-black">LIMPAR MESA</button>}
                {m.status === "RESERVADA" && <><button onClick={() => onOcupar(m)} className="h-9 rounded-full bg-[#A67C52] text-white text-[11px] font-black">CHECK-IN</button><button onClick={() => onDetalhe(m)} className="h-9 rounded-full bg-white border text-[11px] font-bold">Detalhes</button></>}
            </div>
        </div>
    );
}
