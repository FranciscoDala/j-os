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
        <div className="bg-white rounded-[16px] border overflow-hidden">
            <div className="flex justify-between items-center px-4 h-[42px] border-b bg-zinc-50/50">
                <h3 className="font-black text-[11px] tracking-widest">EXTRATO • {movimentos.length} • {selectedDate.split('-').reverse().join('/')}</h3>
                {statusCaixa?.caixa_atual?.aberto_por_nome && (
                    <span className="text-[10px] font-bold text-zinc-600">
                        {statusCaixa.aberto? 'Aberto' : 'Fechado'} por: {statusCaixa.caixa_atual.aberto_por_nome} • {formatFull(statusCaixa.caixa_atual.aberto_em)}
                    </span>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#FAFAFA] border-b">
                            <th className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 py-2">Descrição</th>
                            <th className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 py-2">Tipo</th>
                            <th className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 py-2 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!movimentos.length? (
                            <tr><td colSpan={3} className="text-[12px] text-gray-400 text-center py-10">Sem movimentos em {selectedDate.split('-').reverse().join('/')}</td></tr>
                        ) : paginados.map((m: any) => {
                            const isPos = Number(m.valor) > 0;
                            const responsavel = m.criado_por_nome || m.aberto_por_nome || m.usuario_nome || "";
                            return (
                                <tr key={m.id} className="border-b last:border-0 hover:bg-zinc-50/50">
                                    <td className="px-4 py-2.5">
                                        <p className="text-[11px] font-bold text-black leading-tight">{cleanDesc(m.descricao)}</p>
                                        {/* MESMA LINHA - Data/Hora completa + Responsavel */}
                                        <p className="text-[9px] text-gray-500 leading-none mt-1 flex items-center gap-1.5 flex-wrap">
                                            <span>{formatFull(m.criado_em || m.data)}</span>
                                            {responsavel && (
                                                <>
                                                    <span className="w-1 h-1 bg-zinc-300 rounded-full inline-block" />
                                                    <span className="font-bold text-zinc-700">Resp: {responsavel}</span>
                                                </>
                                            )}
                                        </p>
                                    </td>
                                    <td className={`px-2 py-2 text-[10px] font-black capitalize ${isPos? 'text-[#0CC06B]' : 'text-[#E53935]'}`}>
                                        {String(m.tipo).toLowerCase()}
                                    </td>
                                    <td className={`px-4 py-2 text-right text-[11px] font-black ${isPos? 'text-[#0CC06B]' : 'text-[#E53935]'}`}>
                                        {fmt(Number(m.valor))}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {showPagination && (
                <div className="flex justify-end items-center gap-2 px-4 h-[40px] border-t">
                    <span className="text-[10px] font-bold text-gray-400">{page}/{totalPages}</span>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-6 h-6 rounded-full border flex items-center justify-center disabled:opacity-30"><ChevronLeft size={12} /></button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-6 h-6 rounded-full border flex items-center justify-center disabled:opacity-30"><ChevronRight size={12} /></button>
                </div>
            )}
        </div>
    )
}
