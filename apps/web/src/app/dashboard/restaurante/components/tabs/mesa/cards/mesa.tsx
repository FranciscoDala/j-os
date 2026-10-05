"use client";
import { Users, Clock, Receipt, Sparkles, MapPin } from "lucide-react";

const statusStyles: any = {
    LIVRE: {
        wrap: "bg-white border border-white",
        borderBg: "bg-[#C8E6C9]",
        qtyBg: "bg-black text-white",
        priceBg: "bg-black",
        badge: null,
        dot: "bg-[#2E7D32]",
    },
    OCUPADA: {
        wrap: "bg-white border-2 border-black shadow-[0_0_0_1px_black]",
        borderBg: "bg-black",
        qtyBg: "bg-[#C62828] text-white",
        priceBg: "bg-[#C62828]",
        badge: "OCUPADA",
        dot: "bg-[#C62828]",
    },
    RESERVADA: {
        wrap: "bg-[#FFFBEB] border-2 border-amber-200",
        borderBg: "bg-[#F5E6D3]",
        qtyBg: "bg-[#A67C52] text-white",
        priceBg: "bg-[#A67C52]",
        badge: "RESERVA",
        dot: "bg-[#A67C52]",
    },
    SUJA: {
        wrap: "bg-[#FAFAFA] border border-zinc-200",
        borderBg: "bg-zinc-200",
        qtyBg: "bg-zinc-600 text-white",
        priceBg: "bg-zinc-600",
        badge: "SUJA",
        dot: "bg-zinc-400",
    },
};

export function MesaCard({ m, onOcupar, onComanda, onLimpar, onLiberar, onDetalhe }: any) {
    const s = statusStyles[m.status] || statusStyles.LIVRE;
    const min = m.aberta_em? Math.floor((Date.now() - new Date(m.aberta_em).getTime()) / 60000) : 0;
    const total = Number(m.venda_total || 0);
    const isOcupada = m.status === "OCUPADA";

    return (
        <div className={`group relative rounded-[24px] p-2.5 pt-3 pb-3.5 md:p-3 md:pt-3.5 md:pb-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:shadow-[0_14px_36px_rgba(0,0,0,0.12)] hover:-translate-y-[2px] transition-all duration-300 w-full select-none ${s.wrap}`}>

            {/* CIRCULO IGUAL AO PRODUTO - 122px */}
            <div className="relative w-[122px] h-[122px] md:w-[118px] md:h-[118px] shrink-0">
                <div className={`w-full h-full rounded-full p-[3px] shadow-inner ${s.borderBg}`}>
                    <div className={`w-full h-full rounded-full flex flex-col items-center justify-center ${isOcupada? "bg-black text-white" : "bg-[#FFFBF7] text-black"}`}>
                        <span className="font-black text-[28px] leading-none tracking-tight">{m.numero}</span>
                        <span className="text-[9px] font-black tracking-widest opacity-60 mt-1">MESA</span>
                    </div>
                </div>

                {/* Qty capacidade - igual qty stock */}
                <div className={`absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white z-10 ${s.qtyBg}`}>
                    {m.capacidade}
                </div>

                {/* Badge OCUPADA / RESERVA / SUJA - igual BAIXO / ESGOTADO */}
                {s.badge && (
                    <div className={`absolute top-[36px] -left-1 z-10 text-[8px] font-black px-2.5 py-1 rounded-full shadow-sm border border-white ${isOcupada? "bg-[#C62828] text-white" : s.badge === "SUJA"? "bg-zinc-600 text-white" : "bg-[#A67C52] text-white"}`}>
                        {s.badge}
                    </div>
                )}

                {/* Dot pulsando */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${s.dot} ${isOcupada? "animate-pulse" : ""}`} />
            </div>

            <h3 className="mt-3 font-black text-[12px] leading-[1.15] tracking-tight w-full">MESA {m.numero}</h3>

            <p className="mt-1 text-[10px] leading-[1.15] text-[#6B6B6B] font-bold w-full flex items-center justify-center gap-1">
                <MapPin size={10} /> {m.zona || "Salão"} • <Users size={10} /> {m.pessoas_atual || m.capacidade} lug
            </p>

            {isOcupada? (
                <div className="mt-2.5 w-full flex flex-col items-center gap-1">
                    <span className="text-[9px] font-black tracking-widest opacity-50 flex items-center gap-1"><Clock size={10} /> {min} MIN • {m.pessoas_atual || 1}p • {m.garcom_nome?.split(" ")[0] || "Garçom"}</span>
                    <div className={`text-white rounded-full px-4 py-[5px] flex items-baseline gap-0.5 shadow-sm ${s.priceBg}`}>
                        <span className="text-[8px] font-bold opacity-80">Kz</span>
                        <span className="text-[12px] font-black tracking-wide">{total.toLocaleString("de-DE")}</span>
                    </div>
                    {total === 0 && <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-black text-white tracking-widest mt-1">SEM CONSUMO</span>}
                </div>
            ) : (
                <div className="mt-2.5 flex items-center gap-1 text-[10px] font-bold opacity-60">
                    <div className="w-5 h-5 rounded-full bg-black/5 flex items-center justify-center"><Sparkles size={10} /></div>
                    <span>{m.status === "SUJA"? "Aguardando limpeza" : m.status === "RESERVADA"? `Reservada • ${m.reserva_nome || "Cliente"}` : `Pronta • ${m.capacidade} lugares`}</span>
                </div>
            )}

            {/* Actions - mesma altura do produto */}
            <div className="mt-3 w-full grid grid-cols-2 gap-1.5">
                {m.status === "LIVRE" && (
                    <>
                        <button onClick={() => onOcupar(m)} className="h-8 rounded-full bg-black text-white text-[10px] font-black tracking-widest hover:bg-zinc-800 active:scale-95 transition-all">OCUPAR</button>
                        <button onClick={() => onDetalhe(m)} className="h-8 rounded-full bg-white border border-black/10 text-[10px] font-bold hover:bg-zinc-50">Detalhes</button>
                    </>
                )}
                {m.status === "OCUPADA" && (
                    <>
                        <button onClick={() => onComanda(m)} className="h-8 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center gap-1 hover:bg-zinc-800"><Receipt size={12} /> COMANDA</button>
                        <button onClick={() => onLiberar(m)} className="h-8 rounded-full bg-white border border-black/10 text-[10px] font-bold">Liberar</button>
                    </>
                )}
                {m.status === "SUJA" && <button onClick={() => onLimpar(m)} className="col-span-2 h-8 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-widest">LIMPAR MESA</button>}
                {m.status === "RESERVADA" && <>
                    <button onClick={() => onOcupar(m)} className="h-8 rounded-full bg-[#A67C52] text-white text-[10px] font-black">CHECK-IN</button>
                    <button onClick={() => onDetalhe(m)} className="h-8 rounded-full bg-white border text-[10px] font-bold">Detalhes</button>
                </>}
            </div>
        </div>
    );
}
