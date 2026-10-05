"use client";
import { Users, Clock, Receipt, Sparkles, MapPin } from "lucide-react";

const statusStyles: any = {
    LIVRE: {
        wrap: "border-[#C8E6C9] bg-[#F1F8E9] hover:bg-white",
        badge: "bg-[#2E7D32] text-white",
        dot: "bg-[#2E7D32]",
        num: "bg-black text-white",
    },
    OCUPADA: {
        wrap: "border-black bg-white hover:bg-[#FFFBF5] shadow-[0_0_0_1px_black]",
        badge: "bg-[#C62828] text-white",
        dot: "bg-[#C62828]",
        num: "bg-black text-white",
    },
    RESERVADA: {
        wrap: "border-[#E8DCCF] bg-[#FFF3E0] hover:bg-[#FFECB3]",
        badge: "bg-[#A67C52] text-white",
        dot: "bg-[#A67C52]",
        num: "bg-[#A67C52] text-white",
    },
    SUJA: {
        wrap: "border-[#E0E0E0] bg-[#FAFAFA] hover:bg-white",
        badge: "bg-zinc-600 text-white",
        dot: "bg-zinc-400",
        num: "bg-zinc-600 text-white",
    },
};

export function MesaCard({ m, onOcupar, onComanda, onLimpar, onLiberar, onDetalhe }: any) {
    const s = statusStyles[m.status] || statusStyles.LIVRE;
    const min = m.aberta_em ? Math.floor((Date.now() - new Date(m.aberta_em).getTime()) / 60000) : 0;
    const total = Number(m.venda_total || 0);

    return (
        <div className={`group relative rounded-[24px] border p-4 flex flex-col hover:shadow-[0_16px_40px_rgba(0,0,0,0.14)] hover:-translate-y-[2px] transition-all duration-300 ${s.wrap}`}>
            {/* Header */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-[48px] h-[48px] rounded-full flex items-center justify-center font-black text-[14px] shadow-[0_6px_16px_rgba(0,0,0,0.18)] ${s.num}`}>
                            {m.numero}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-white ${s.dot} ${m.status === "OCUPADA" ? "animate-pulse" : ""}`} />
                    </div>
                    <div>
                        <div className="font-black text-[14px] leading-none tracking-tight">MESA {m.numero}</div>
                        <div className="text-[10px] font-bold opacity-60 mt-1.5 flex items-center gap-1.5">
                            <span className="flex items-center gap-1"><MapPin size={10} />{m.zona || "Salão"}</span>
                            <span className="w-1 h-1 rounded-full bg-black/20" />
                            <span className="flex items-center gap-1"><Users size={10} />{m.capacidade}</span>
                        </div>
                    </div>
                </div>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black tracking-widest shadow-sm ${s.badge}`}>
                    {m.status}
                </span>
            </div>

            {/* Body - OCUPADA com destaque */}
            <div className="mt-4 flex-1">
                {m.status === "OCUPADA" ? (
                    <div className="rounded-[18px] bg-[#FFF8F0] border border-[#F5E6D3] p-3.5">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest opacity-60">
                                <Clock size={11} /> {min} MIN ABERTA
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold opacity-70">
                                <Users size={10} /> {m.pessoas_atual || 1}p • {m.garcom_nome?.split(" ")[0] || "Garçom"}
                            </span>
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                            <div>
                                <div className="text-[10px] font-black tracking-widest opacity-40">CONSUMO</div>
                                <div className="text-[22px] font-black tracking-tight leading-none mt-1">
                                    Kz {total.toLocaleString("de-DE")}
                                </div>
                            </div>
                            {total === 0 ? (
                                <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-black text-white">SEM CONSUMO</span>
                            ) : (
                                <span className="text-[10px] font-bold opacity-60 flex items-center gap-1"><Sparkles size={11} />ativa</span>
                            )}
                        </div>
                    </div>
                ) : m.status === "LIVRE" ? (
                    <div className="flex items-center gap-2 text-[11px] font-bold opacity-50 px-1 py-1">
                        <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center"><Sparkles size={11} /></div>
                        Pronta para ocupar • {m.capacidade} lugares
                    </div>
                ) : m.status === "SUJA" ? (
                    <div className="rounded-[14px] bg-zinc-100 border border-dashed px-3 py-2.5 text-[11px] font-bold opacity-60">
                        Aguardando limpeza
                    </div>
                ) : (
                    <div className="rounded-[14px] bg-[#A67C52]/10 border border-[#A67C52]/20 px-3 py-2.5 text-[11px] font-bold text-[#A67C52]">
                        Reservada • {m.reserva_nome || "Cliente"}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                {m.status === "LIVRE" && (
                    <>
                        <button onClick={() => onOcupar(m)} className="h-11 rounded-full bg-black text-white text-[11px] font-black tracking-widest hover:bg-zinc-800 active:scale-[0.97] transition-all shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
                            OCUPAR
                        </button>
                        <button onClick={() => onDetalhe(m)} className="h-11 rounded-full bg-white border border-black/10 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.97] transition-all">
                            Detalhes
                        </button>
                    </>
                )}
                {m.status === "OCUPADA" && (
                    <>
                        <button onClick={() => onComanda(m)} className="h-11 rounded-full bg-black text-white text-[11px] font-black tracking-widest flex items-center justify-center gap-1.5 hover:bg-zinc-800 active:scale-[0.97] transition-all shadow-md">
                            <Receipt size={13} /> COMANDA
                        </button>
                        <button onClick={() => onLiberar(m)} className="h-11 rounded-full bg-white border border-black/10 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.97] transition-all">
                            Liberar
                        </button>
                    </>
                )}
                {m.status === "SUJA" && (
                    <button onClick={() => onLimpar(m)} className="col-span-2 h-11 rounded-full bg-emerald-600 text-white text-[11px] font-black tracking-widest hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-md">
                        LIMPAR MESA
                    </button>
                )}
                {m.status === "RESERVADA" && (
                    <>
                        <button onClick={() => onOcupar(m)} className="h-11 rounded-full bg-[#A67C52] text-white text-[11px] font-black tracking-widest shadow-md hover:bg-[#8C6A45] active:scale-[0.97] transition-all">
                            CHECK-IN
                        </button>
                        <button onClick={() => onDetalhe(m)} className="h-11 rounded-full bg-white border border-black/10 text-[11px] font-bold">Detalhes</button>
                    </>
                )}
            </div>
        </div>
    );
}
