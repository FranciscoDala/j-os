"use client";
import { MapPin, Users, Clock } from "lucide-react";

const statusColor: any = {
    LIVRE: "border-[#C8E6C9] bg-[#F1F8E9]",
    OCUPADA: "border-[#FFCDD2] bg-[#FFEBEE]",
    RESERVADA: "border-[#FFE0B2] bg-[#FFF3E0]",
    SUJA: "border-[#E0E0E0] bg-[#FAFAFA]",
};

export function MesaCard({ m, onOcupar, onComanda, onLimpar, onDetalhe, onLiberar }: any) {
    const min = m.aberta_em ? Math.floor((Date.now() - new Date(m.aberta_em).getTime()) / 60000) : 0;
    return (
        <div className={`rounded-[22px] border p-4 shadow-sm hover:shadow-md transition-all ${statusColor[m.status] || "bg-white border-[#E8DCCF]"}`}>
            <div className="flex justify-between items-start">
                <div className="font-black text-[15px]">Mesa {m.numero}</div>
                <span className="text-[9px] px-2.5 py-1 rounded-full bg-black text-white font-black tracking-wider">{m.status}</span>
            </div>
            <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-70">
                    <MapPin size={12} /> {m.zona} • <Users size={12} /> {m.capacidade} • {m.pessoas_atual || 0}p
                </div>
                {m.status === "OCUPADA" && <div className="flex items-center gap-1 text-[11px] font-bold text-red-600"><Clock size={12} /> {min} min</div>}
                {m.venda_atual_id && <div className="text-[10px] font-bold opacity-60 truncate">#{String(m.venda_atual_id).slice(0, 8)}</div>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
                {m.status === "LIVRE" && <button onClick={() => onOcupar(m)} className="h-8 rounded-full bg-black text-white text-[10px] font-black">OCUPAR</button>}
                {m.status === "OCUPADA" && (
                    <>
                        <button onClick={() => onComanda(m)} className="h-8 rounded-full bg-white border border-black text-black text-[10px] font-black">COMANDA</button>
                        <button onClick={() => onLiberar(m)} className="h-8 rounded-full bg-white border border-[#E8DCCF] text-[10px] font-bold">LIBERAR</button>
                    </>
                )}
                {m.status === "SUJA" && <button onClick={() => onLimpar(m)} className="h-8 rounded-full bg-emerald-600 text-white text-[10px] font-black">LIMPAR</button>}
                {m.status === "RESERVADA" && <button onClick={() => onOcupar(m)} className="h-8 rounded-full bg-[#A67C52] text-white text-[10px] font-black">CHECK-IN</button>}
                {m.status === "LIVRE" && <button onClick={() => onDetalhe(m)} className="h-8 rounded-full bg-white border border-[#E8DCCF] text-[10px] font-bold">Detalhes</button>}
            </div>
        </div>
    );
}
