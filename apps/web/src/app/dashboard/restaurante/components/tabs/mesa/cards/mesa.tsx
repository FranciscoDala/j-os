"use client";
import { Users, Clock, Receipt, MapPin } from "lucide-react";

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
        <div className={`group relative w-full h-[250px] sm:h-[265px] md:h-[272px] rounded-[18px] md:rounded-[22px] overflow-hidden border shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] md:hover:-translate-y-0.5 transition-all duration-300 flex flex-col ${cfg.cardBg} ${cfg.border}`}>

            <div className={`relative w-full h-[118px] sm:h-[128px] md:h-[138px] overflow-hidden flex items-center justify-center ${cfg.topBg} shrink-0`}>
                <div className="flex flex-col items-center">
                    <span className="text-[36px] sm:text-[40px] md:text-[44px] font-black tracking-tight text-[#1A1A1A] leading-none">{m.numero}</span>
                    <span className="mt-1 text-[10px] md:text-[11px] font-black tracking-widest opacity-60">MESA</span>
                    <div className="mt-2 flex items-center gap-1.5">
                        <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold bg-white/80 backdrop-blur px-2 py-0.5 rounded-full">
                            <MapPin size={10} />{m.zona || "Salão"}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold bg-white/80 backdrop-blur px-2 py-0.5 rounded-full">
                            <Users size={10} />{m.capacidade}
                        </span>
                    </div>
                </div>
                <span className={`absolute top-2 left-2 text-[7px] md:text-[8px] font-black px-2 md:px-2.5 py-1 rounded-full tracking-widest shadow-sm ${cfg.badge}`}>
                    {cfg.label}
                </span>
                {m.status === "OCUPADA" && (
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#C62828] rounded-full animate-pulse border-2 border-white shadow" />
                )}
            </div>

            <div className="px-3 md:px-3.5 py-2.5 md:py-3 flex flex-col flex-1">
                <h3 className="font-black text-[12px] md:text-[13px] leading-[1.15] text-[#1E1E1E] line-clamp-1">
                    MESA {m.numero}
                </h3>

                <div className="mt-1.5 flex items-center gap-1 flex-wrap min-h-[18px]">
                    {m.status === "OCUPADA"? (
                        <>
                            <span className="text-[8px] md:text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock size={10} />{min} min
                            </span>
                            <span className="text-[8px] md:text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full">
                                {m.pessoas_atual || 1}p • {m.garcom_nome?.split(" ")[0] || "Garçom"}
                            </span>
                        </>
                    ) : m.status === "LIVRE"? (
                        <span className="text-[8px] md:text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full">
                            Pronta • {m.capacidade} lugares
                        </span>
                    ) : m.status === "SUJA"? (
                        <span className="text-[8px] md:text-[9px] font-bold text-[#8A8A8A] bg-zinc-100 px-2 py-0.5 rounded-full">
                            Aguardando limpeza
                        </span>
                    ) : (
                        <span className="text-[8px] md:text-[9px] font-bold text-[#8C6A45] bg-[#A67C52]/15 px-2 py-0.5 rounded-full">
                            Reservada • {m.reserva_nome || "Cliente"}
                        </span>
                    )}
                </div>

                <p className="mt-2 text-[10px] leading-[1.3] text-[#7A7A7A] line-clamp-2 min-h-[26px] hidden sm:block">
                    {m.status === "OCUPADA"
                       ? hasConsumo
                           ? `${total.toLocaleString("de-DE")} Kz em consumo`
                            : "Sem consumo ainda"
                        : `${m.zona || "Salão principal"} • ${m.capacidade} pessoas`}
                </p>

                <div className="mt-auto pt-2 md:pt-3 flex items-end justify-between gap-2">
                    <div className="leading-none">
                        <p className={`text-[14px] md:text-[15px] font-black tracking-tight ${cfg.price}`}>
                            {hasConsumo? total.toLocaleString("de-DE") : "—"}
                            {hasConsumo && <span className="text-[10px]">Kz</span>}
                        </p>
                        <p className="text-[8px] md:text-[9px] font-bold text-[#9A9A9A] mt-1 flex items-center gap-1">
                            + {hasConsumo? "Consumo" : cfg.label}
                        </p>
                    </div>

                    {m.status === "LIVRE" && (
                        <button onClick={() => onOcupar(m)} className="h-[30px] md:h-[30px] px-4 rounded-full bg-[#FFC91A] hover:bg-[#FFB800] text-black text-[11px] font-black shadow-sm transition-colors shrink-0 active:scale-95">
                            Ocupar
                        </button>
                    )}
                    {m.status === "OCUPADA" && hasConsumo && (
                        <button onClick={() => onComanda(m)} className="h-[32px] px-3.5 rounded-full bg-black text-white text-[10px] font-black flex items-center gap-1 hover:bg-zinc-800 shrink-0 active:scale-95">
                            <Receipt size={11} /> Fechar
                        </button>
                    )}
                    {m.status === "OCUPADA" &&!hasConsumo && (
                        <button onClick={() => onComanda(m)} className="h-[30px] px-4 rounded-full bg-[#FFC91A] hover:bg-[#FFB800] text-black text-[11px] font-black shrink-0 active:scale-95">
                            Comanda
                        </button>
                    )}
                    {m.status === "SUJA" && (
                        <button onClick={() => onLimpar(m)} className="h-[30px] px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black shrink-0 active:scale-95">
                            Limpar
                        </button>
                    )}
                    {m.status === "RESERVADA" && (
                        <button onClick={() => onOcupar(m)} className="h-[30px] px-4 rounded-full bg-[#A67C52] hover:bg-[#8C6A45] text-white text-[10px] font-black shrink-0 active:scale-95">
                            Check-in
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
