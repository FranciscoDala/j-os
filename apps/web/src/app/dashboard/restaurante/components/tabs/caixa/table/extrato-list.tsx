"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const fmt = (v: number) => Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const cleanDesc = (desc: string) => {
    if (!desc) return "";
    return desc.replace(/^[^:]+:\s*/, "").trim() || desc;
};

const formatFull = (iso: string) => {
    if (!iso) return "--";
    try {
        return new Date(iso).toLocaleString('pt-PT', { timeZone: 'Africa/Luanda', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
};

export function ExtratoList({ movimentos, selectedDate, statusCaixa }: { movimentos: any[], selectedDate: string, statusCaixa?: any }) {
    const [page, setPage] = useState(1);
    const perPage = 12;
    const totalPages = Math.max(1, Math.ceil(movimentos.length / perPage));
    const paginados = useMemo(() => movimentos.slice((page - 1) * perPage, page * perPage), [movimentos, page]);
    const showPagination = movimentos.length > perPage;

    return (
        <div className="w-full bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col">

            {/* HEADER */}
            <div className="bg-white m-[6px] rounded-[18px] p-3 flex justify-between items-center border border-black/5 shrink-0">
                <div>
                    <p className="font-black text-[13px] leading-none text-black">
                        EXTRATO • {movimentos.length}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-1 font-bold">
                        {selectedDate.split('-').reverse().join('/')}
                    </p>
                </div>
                {statusCaixa?.caixa_atual?.aberto_por_nome && (
                    <div className="text-right max-w-[160px]">
                        <p className="text-[10px] font-black tracking-widest text-zinc-500 leading-none">
                            {statusCaixa.aberto? 'ABERTO' : 'FECHADO'}
                        </p>
                        <p className="text-[10px] font-bold text-zinc-700 mt-1 leading-tight truncate">
                            {statusCaixa.caixa_atual.aberto_por_nome}
                        </p>
                        <p className="text-[9px] text-zinc-500 leading-tight">
                            {formatFull(statusCaixa.caixa_atual.aberto_em)}
                        </p>
                    </div>
                )}
            </div>

            {/* LISTA */}
            <div className="bg-white m-[6px] mt-0 rounded-[18px] border border-black/5 overflow-hidden flex flex-col flex-1">
                <div className="flex text-[10px] tracking-widest text-zinc-500 px-3 py-2.5 border-b border-black/10 shrink-0">
                    <span className="flex-1">DESCRIÇÃO</span>
                    <span className="w-[60px] text-center">TIPO</span>
                    <span className="w-[90px] text-right">VALOR</span>
                </div>

                <div className="flex-1">
                    {!movimentos.length? (
                        <p className="text-center text-[12px] text-gray-400 py-16">Sem movimentos em {selectedDate.split('-').reverse().join('/')}</p>
                    ) : (
                        paginados.map((m: any) => {
                            const isPos = Number(m.valor) > 0;
                            const responsavel = m.criado_por_nome || m.aberto_por_nome || m.usuario_nome || "";
                            return (
                                <div key={m.id} className="flex items-center px-3 py-3 border-b border-dashed border-black/10 last:border-0 hover:bg-zinc-50/50">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="text-[13px] font-medium text-black leading-[16px] break-words">{cleanDesc(m.descricao)}</p>
                                        <p className="text-[9px] text-gray-500 leading-none mt-1.5 flex items-center gap-1.5 flex-wrap">
                                            <span>{formatFull(m.criado_em || m.data)}</span>
                                            {responsavel && (
                                                <>
                                                    <span className="w-1 h-1 bg-zinc-300 rounded-full inline-block" />
                                                    <span className="font-bold text-zinc-700">Resp: {responsavel}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                    <span className={`w-[60px] shrink-0 text-center text-[10px] font-black capitalize ${isPos? 'text-[#0CC06B]' : 'text-[#E53935]'}`}>
                                        {String(m.tipo).toLowerCase()}
                                    </span>
                                    <span className={`w-[90px] shrink-0 text-right text-[13px] font-bold ${isPos? 'text-[#0CC06B]' : 'text-[#E53935]'}`}>
                                        {fmt(Number(m.valor))}
                                    </span>
                                </div>
                            )
                        })
                    )}
                </div>

                {showPagination && (
                    <div className="flex justify-between items-center px-3 h-[48px] border-t bg-white shrink-0">
                        <span className="text-[11px] font-bold text-zinc-500">{page}/{totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-zinc-200 active:scale-95">
                                <ChevronLeft size={14} />
                            </button>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-zinc-200 active:scale-95">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
