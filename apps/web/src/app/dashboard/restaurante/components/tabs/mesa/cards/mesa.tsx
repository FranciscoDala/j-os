"use client";
import { Users, Clock, Receipt, Sparkles, MapPin, Lock, Ban } from "lucide-react";

const statusStyles: any = {
    LIVRE: {
        wrap: "border border-[#C8E6C9] bg-[#F1F8E9] hover:bg-white",
        badge: "bg-[#2E7D32] text-white",
        dot: "bg-[#2E7D32]",
        num: "bg-black text-white",
        consumoBg: "bg-white/60 border-[#C8E6C9]",
    },
    OCUPADA: {
        wrap: "border border-[#FFE0B2] bg-white hover:bg-[#FFFBF5]",
        badge: "bg-[#C62828] text-white",
        dot: "bg-[#C62828]",
        num: "bg-black text-white",
        consumoBg: "bg-[#FFF8F0] border-[#F5E6D3]",
    },
    RESERVADA: {
        wrap: "border border-[#FFE0B2] bg-[#FFF8F0] hover:bg-[#FFECB3]/40",
        badge: "bg-[#A67C52] text-white",
        dot: "bg-[#A67C52]",
        num: "bg-[#A67C52] text-white",
        consumoBg: "bg-[#A67C52]/10 border-[#A67C52]/20",
    },
    SUJA: {
        wrap: "border border-[#E0E0E0] bg-[#FAFAFA] hover:bg-white",
        badge: "bg-zinc-500 text-white",
        dot: "bg-zinc-400",
        num: "bg-zinc-600 text-white",
        consumoBg: "bg-zinc-100 border-zinc-200",
    },
};

export function MesaCard({ m, onOcupar, onComanda, onLimpar, onLiberar, onDetalhe }: any) {
    const s = statusStyles[m.status] || statusStyles.LIVRE;
    const min = m.aberta_em? Math.floor((Date.now() - new Date(m.aberta_em).getTime()) / 60000) : 0;
    const total = Number(m.venda_total || m.total_consumo || 0);
    const hasConsumo = total > 0;

    return (
        <div className={`group relative rounded-[24px] p-4 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] hover:-translate-y-[1px] transition-all duration-300 ${s.wrap}`}>
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center font-black text-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.12)] ${s.num}`}>
                            {m.numero}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${s.dot} ${m.status === "OCUPADA"? "animate-pulse" : ""}`} />
                    </div>
                    <div>
                        <div className="font-black text-[13px] leading-none tracking-tight">MESA {m.numero}</div>
                        <div className="text-[10px] font-bold opacity-60 mt-1.5 flex items-center gap-1.5">
                            <span className="flex items-center gap-1"><MapPin size={10} />{m.zona || "Salão"}</span>
                            <span className="w-1 h-1 rounded-full bg-black/20" />
                            <span className="flex items-center gap-1"><Users size={10} />{m.capacidade}</span>
                        </div>
                    </div>
                </div>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black tracking-widest ${s.badge}`}>
                    {m.status}
                </span>
            </div>

            {/* Body */}
            <div className="mt-4 flex-1">
                {m.status === "OCUPADA"? (
                    <div className={`rounded-[18px] border p-3.5 ${s.consumoBg} ${hasConsumo? "border-amber-200" : ""}`}>
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest opacity-50">
                                <Clock size={11} /> {min} MIN
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold opacity-60">
                                <Users size={10} /> {m.pessoas_atual || 1}p • {m.garcom_nome?.split(" ")[0] || "Garçom"}
                            </span>
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                            <div>
                                <div className="text-[9px] font-black tracking-widest opacity-40">CONSUMO</div>
                                <div className="text-[20px] font-black tracking-tight leading-none mt-1">
                                    Kz {total.toLocaleString("de-DE")}
                                </div>
                            </div>
                            {total === 0? (
                                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-black/10 text-black/60">SEM CONSUMO</span>
                            ) : (
                                <span className="text-[10px] font-bold opacity-50 flex items-center gap-1"><Sparkles size={11} />ativa</span>
                            )}
                        </div>
                    </div>
                ) : m.status === "LIVRE"? (
                    <div className="flex items-center gap-2 text-[11px] font-bold opacity-50 px-1 py-2">
                        <div className="w-6 h-6 rounded-full bg-black/[0.06] flex items-center justify-center"><Sparkles size={11} /></div>
                        Pronta para ocupar • {m.capacidade} lugares
                    </div>
                ) : m.status === "SUJA"? (
                    <div className="rounded-[14px] bg-zinc-100 border border-dashed border-zinc-200 px-3 py-2.5 text-[11px] font-bold opacity-60">
                        Aguardando limpeza
                    </div>
                ) : (
                    <div className="rounded-[14px] bg-[#A67C52]/10 border border-[#A67C52]/15 px-3 py-2.5 text-[11px] font-bold text-[#8C6A45]">
                        Reservada • {m.reserva_nome || "Cliente"}
                    </div>
                )}
            </div>

            {/* Actions - TRAVADO */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                {m.status === "LIVRE" && (
                    <>
                        <button onClick={() => onOcupar(m)} className="h-10 rounded-full bg-black text-white text-[11px] font-black tracking-widest hover:bg-zinc-800 active:scale-[0.98] transition-all">
                            OCUPAR
                        </button>
                        <button onClick={() => onDetalhe(m)} className="h-10 rounded-full bg-white border border-black/10 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.98] transition-all">
                            Detalhes
                        </button>
                    </>
                )}
                {m.status === "OCUPADA" && (
                    <>
                        {hasConsumo? (
                            <>
                                <button onClick={() => onComanda(m)} className="col-span-2 h-11 rounded-full bg-[#16A34A] text-white text-[11px] font-black tracking-widest flex items-center justify-center gap-1.5 hover:bg-[#15803D] active:scale-[0.97] transition-all shadow-[0_6px_16px_rgba(22,163,74,0.3)]">
                                    <Receipt size={14} /> Fechar Conta • Kz {total.toLocaleString("de-DE")}
                                </button>
                                <div className="col-span-2 flex items-center justify-center gap-1.5 py-1">
                                    {/*
                                    <Lock size={10} className="text-red-400" />
                                    <span className="text-[8px] font-black tracking-widest text-red-500/70">LIBERAR BLOQUEADO - TEM CONSUMO</span>*/}
                                </div>
                            </>
                        ) : (
                            <>
                                <button onClick={() => onComanda(m)} className="h-10 rounded-full bg-black text-white text-[11px] font-black tracking-widest flex items-center justify-center gap-1.5 hover:bg-zinc-800 active:scale-[0.98] transition-all">
                                    <Receipt size={13} /> COMANDA
                                </button>
                                <button onClick={() => onLiberar(m)} className="h-10 rounded-full bg-white border border-black/10 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.98] transition-all flex items-center justify-center gap-1">
                                    <Ban size={12} /> Liberar
                                </button>
                            </>
                        )}
                    </>
                )}
                {m.status === "SUJA" && (
                    <button onClick={() => onLimpar(m)} className="col-span-2 h-10 rounded-full bg-emerald-600 text-white text-[11px] font-black tracking-widest hover:bg-emerald-700 active:scale-[0.98] transition-all">
                        LIMPAR MESA
                    </button>
                )}
                {m.status === "RESERVADA" && (
                    <>
                        <button onClick={() => onOcupar(m)} className="h-10 rounded-full bg-[#A67C52] text-white text-[11px] font-black tracking-widest hover:bg-[#8C6A45] active:scale-[0.98] transition-all">
                            CHECK-IN
                        </button>
                        <button onClick={() => onDetalhe(m)} className="h-10 rounded-full bg-white border border-black/10 text-[11px] font-bold hover:bg-zinc-50">Detalhes</button>
                    </>
                )}
            </div>
        </div>
    );
}
