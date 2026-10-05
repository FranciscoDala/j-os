"use client";
import { Users, Clock, Receipt, Sparkles, MapPin, ChefHat } from "lucide-react";

const statusStyles: any = {
    LIVRE: { wrap: "border-[#C8E6C9] bg-[#F1F8E9] hover:bg-[#E8F5E9]", badge: "bg-[#2E7D32] text-white", circle: "bg-[#2E7D32]" },
    OCUPADA: { wrap: "border-[#FFCDD2] bg-[#FFEBEE] hover:bg-[#FFCDD2]/60", badge: "bg-[#C62828] text-white", circle: "bg-[#C62828]" },
    RESERVADA: { wrap: "border-[#FFE0B2] bg-[#FFF3E0] hover:bg-[#FFECB3]", badge: "bg-[#EF6C00] text-white", circle: "bg-[#EF6C00]" },
    SUJA: { wrap: "border-[#E0E0E0] bg-[#FAFAFA]", badge: "bg-zinc-500 text-white", circle: "bg-zinc-400" },
};

export function MesaCard({ m, onOcupar, onComanda, onLimpar, onLiberar, onDetalhe }: any) {
    const s = statusStyles[m.status] || statusStyles.LIVRE;
    const min = m.aberta_em ? Math.floor((Date.now() - new Date(m.aberta_em).getTime()) / 60000) : 0;
    const total = Number(m.venda_total || 0);

    return (
        <div className={`group relative rounded-[24px] border p-4 shadow-sm hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] hover:-translate-y-[2px] transition-all duration-300 ${s.wrap}`}>
            {/* Top */}
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center font-black text-[13px] shadow-md">
                            {m.numero}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${s.circle}`} />
                    </div>
                    <div>
                        <div className="font-black text-[14px] leading-none tracking-tight">MESA {m.numero}</div>
                        <div className="text-[10px] font-bold opacity-60 mt-1 flex items-center gap-1">
                            <MapPin size={10} /> {m.zona || "Salão"} • {m.capacidade} lug
                        </div>
                    </div>
                </div>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black tracking-widest shadow-sm ${s.badge}`}>
                    {m.status}
                </span>
            </div>

            {/* Middle */}
            <div className="mt-4">
                {m.status === "OCUPADA" ? (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-700">
                                <Clock size={12} /> {min} min • <Users size={12} /> {m.pessoas_atual || 1}p
                            </span>
                            <span className="text-[10px] font-bold opacity-50">{m.garcom_nome || ""}</span>
                        </div>
                        <div className="flex items-end justify-between mt-1">
                            <div className="text-[20px] font-black tracking-tight leading-none">
                                Kz {total.toLocaleString("de-DE")}
                            </div>
                            {total === 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/10">
                                    SEM CONSUMO
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-[11px] font-bold opacity-70">
                        <span className="flex items-center gap-1"><Users size={12} />{m.capacidade} lugares</span>
                        <span className="flex items-center gap-1"><Sparkles size={12} />Pronta</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
                {m.status === "LIVRE" && (
                    <>
                        <button onClick={() => onOcupar(m)} className="h-10 rounded-full bg-black text-white text-[11px] font-black tracking-widest hover:bg-zinc-800 active:scale-95 transition-all">
                            OCUPAR
                        </button>
                        <button onClick={() => onDetalhe(m)} className="h-10 rounded-full bg-white border border-black/10 text-[11px] font-bold hover:bg-white">
                            Detalhes
                        </button>
                    </>
                )}
                {m.status === "OCUPADA" && (
                    <>
                        <button onClick={() => onComanda(m)} className="h-10 rounded-full bg-black text-white text-[11px] font-black flex items-center justify-center gap-1.5 hover:bg-zinc-800 active:scale-95 transition-all">
                            <Receipt size={13} /> COMANDA
                        </button>
                        <button onClick={() => onLiberar(m)} className="h-10 rounded-full bg-white border border-black/10 text-[11px] font-bold hover:bg-zinc-50">
                            Liberar
                        </button>
                    </>
                )}
                {m.status === "SUJA" && (
                    <button onClick={() => onLimpar(m)} className="col-span-2 h-10 rounded-full bg-emerald-600 text-white text-[11px] font-black tracking-widest hover:bg-emerald-700">
                        LIMPAR MESA
                    </button>
                )}
                {m.status === "RESERVADA" && (
                    <>
                        <button onClick={() => onOcupar(m)} className="h-10 rounded-full bg-[#A67C52] text-white text-[11px] font-black">CHECK-IN</button>
                        <button onClick={() => onDetalhe(m)} className="h-10 rounded-full bg-white border text-[11px] font-bold">Detalhes</button>
                    </>
                )}
            </div>
        </div>
    );
}
