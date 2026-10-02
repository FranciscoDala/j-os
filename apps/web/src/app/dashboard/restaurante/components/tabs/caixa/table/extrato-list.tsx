"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

const fmt = (v: number) => Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ExtratoList({ movimentos, selectedDate }: { movimentos: any[], selectedDate: string }) {
    const [page, setPage] = useState(1);
    const perPage = 12;
    const totalPages = Math.max(1, Math.ceil(movimentos.length / perPage));
    const paginados = useMemo(() => movimentos.slice((page - 1) * perPage, page * perPage), [movimentos, page]);

    return (
        <div className="bg-white rounded-[16px] border overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b">
                <h3 className="font-black text-[11px] uppercase tracking-widest">Extrato • {movimentos.length} • {selectedDate.split('-').reverse().join('/')}</h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400">{page}/{totalPages}</span>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-6 h-6 rounded-full border flex items-center justify-center disabled:opacity-30"><ChevronLeft size={12} /></button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-6 h-6 rounded-full border flex items-center justify-center disabled:opacity-30"><ChevronRight size={12} /></button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b bg-[#FAFAFA]">
                            <th className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 py-2">Descrição</th>
                            <th className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 py-2">Tipo</th>
                            <th className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 py-2 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!movimentos.length? (
                            <tr><td colSpan={3} className="text-[11px] text-gray-400 text-center py-10">Sem movimentos em {selectedDate.split('-').reverse().join('/')}</td></tr>
                        ) : paginados.map((m: any) => (
                            <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                <td className="px-4 py-2.5">
                                    <p className="text-[11px] font-bold text-black leading-none">{m.descricao}</p>
                                    <p className="text-[9px] text-gray-400 mt-1">{new Date(m.criado_em || m.data || Date.now()).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
                                </td>
                                <td className="px-2 py-2.5">
                                    <span className="text-[8px] font-black uppercase px-2 py-1 rounded-full bg-[#F5F7FB] border">{m.tipo}</span>
                                </td>
                                <td className={`px-4 py-2.5 text-right text-[11px] font-black ${Number(m.valor) > 0? 'text-[#0CC06B]' : 'text-[#E53935]'}`}>
                                    {Number(m.valor) > 0? '+' : ''}Kz {fmt(Number(m.valor))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
