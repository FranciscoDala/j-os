"use client";
import { useMemo } from 'react'

interface Props {
    extrato: any;
    inicio: string;
    fim: string;
    empresa?: any;
    status?: any;
}

export const RelatorioCaixaPDF = ({ extrato, inicio, fim, empresa, status }: Props) => {
    const movs = extrato?.movimentos || []
    const entradas = Number(extrato?.total_entradas || 0)
    const saidas = Math.abs(Number(extrato?.total_saidas || 0))
    const saldo = Number(extrato?.saldo_atual || (entradas - saidas))
    const saldoInicial = Number(extrato?.saldo_inicial || 0)

    const fmt = (n: number) => Number(n).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const fmtDataHora = (iso: string) => {
        try { if (!iso) return "--"; return new Date(iso).toLocaleString('pt-AO', { timeZone: 'Africa/Luanda', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return iso }
    }

    const emp = {
        nome: empresa?.nome || 'J-OS RESTAURANTE',
        nif: empresa?.nif || '---',
        endereco: empresa?.endereco || 'Luanda, Angola',
        telefone: empresa?.telefone || '---',
        email: empresa?.email || '---',
        cidade: empresa?.cidade || 'Luanda',
        logo: empresa?.logo_url || empresa?.image_url || empresa?.logo || '',
    }
    const hasLogo =!!emp.logo
    const mask = (v: string) => v && v.trim()!== ''? v : '---'

    const LogoDefault = () => (
        <div className="w-[110px] h-[90px] flex flex-col items-center justify-center shrink-0">
            <div className="w-[70px] h-[70px] bg-black rounded-full flex items-center justify-center text-white font-black text-[36px]">J</div>
            <div className="mt-1 bg-black text-white text-[9px] font-bold px-2 py-[2px]">J-OS</div>
        </div>
    )

    const totais = useMemo(() => {
        const porTipo: Record<string, { qtd: number, total: number }> = {}
        movs.forEach((m: any) => {
            const tipo = (m.tipo || 'OUTRO').toUpperCase()
            if (!porTipo[tipo]) porTipo[tipo] = { qtd: 0, total: 0 }
            porTipo[tipo].qtd += 1
            porTipo[tipo].total += Number(m.valor || 0)
        })
        return porTipo
    }, [movs])

    return (
        <>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Zalando+Sans+Expanded:wght@400;700;900&display=swap');
              #relatorio-caixa-pdf{font-family:'Zalando Sans Expanded',sans-serif}
            `}</style>
            <div id="relatorio-caixa-pdf" className="relative bg-white text-black w-[210mm] min-w-[210mm] min-h-[297mm] p-[10mm] flex flex-col border border-gray-200 overflow-hidden mx-auto">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    {hasLogo? <img src={emp.logo} alt="marca" className="w-[500px] h-[500px] object-contain opacity-[0.07]" /> : <div className="w-[550px] h-[550px] bg-black rounded-full flex items-center justify-center text-white font-black text-[200px] opacity-[0.06]">J</div>}
                </div>

                <div className="relative z-10 flex flex-col flex-1">
                    <div className="flex gap-3">
                        {hasLogo? <img src={emp.logo} className="w-[110px] h-[90px] object-contain shrink-0" alt="logo" /> : <LogoDefault />}
                        <div className="text-[11px] leading-[15px]"><p className="font-bold text-[14px]">{mask(emp.nome)}</p><p>NIF: {mask(emp.nif)}</p><p>Endereço: {mask(emp.endereco)}</p><p>Contactos: {mask(emp.telefone)}</p><p>Email: {mask(emp.email)}</p><p>{mask(emp.cidade)}</p></div>
                    </div>

                    <div className="flex justify-between items-start mt-6 border-b border-dotted border-gray-300 pb-3">
                        <div className="text-[9px] leading-[13px] max-w-[300px]">
                            <p className="font-bold text-[12px]">RELATÓRIO DE CAIXA</p>
                            <p className="mt-1">Período: {inicio} até {fim}</p>
                            <p>Moeda: KZ</p>
                            <p className="mt-1">Gerado: {fmtDataHora(new Date().toISOString())}</p>
                            <p>Caixa: {status?.aberto? `Aberto por ${status?.caixa_atual?.aberto_por_nome}` : 'Fechado'}</p>
                        </div>
                        <div className="text-right leading-[14px]">
                            <p className="font-bold text-[15px]">RC-{inicio}_a_{fim}</p>
                            <p className="text-[#777] text-[11px] mt-1">Regime Geral</p>
                            <p className="font-bold text-[12px] mt-1">ORIGINAL</p>
                            <p className="text-[10px] mt-1">Movimentos: {movs.length}</p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-[5px]">
                        {[
                            { k: 'QTD. MOVS', v: movs.length },
                            { k: 'SALDO INICIAL', v: `Kz ${fmt(saldoInicial)}` },
                            { k: 'PERÍODO', v: `${inicio} a ${fim}` },
                            { k: 'OPERADOR', v: status?.caixa_atual?.aberto_por_nome?.slice(0, 12) || 'Sistema' },
                        ].map(b => (
                            <div key={b.k} className="border border-[#bbb] py-[5px] px-1 bg-[rgba(255,255,255,0.40)]"><p className="font-bold text-[10px] truncate">{b.k}</p><p className="text-center text-[11px] mt-[2px] truncate">{b.v}</p></div>
                        ))}
                    </div>

                    <div className="w-full mt-3 overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-[rgba(0,0,0,0.85)] text-white text-[10px] font-bold">
                                    <th className="border border-[#999] py-[7px] px-2 text-left w-[110px]">DATA/HORA</th>
                                    <th className="border border-[#999] py-[7px] px-2 text-left w-[90px]">TIPO</th>
                                    <th className="border border-[#999] py-[7px] px-2 text-left">DESCRIÇÃO</th>
                                    <th className="border border-[#999] py-[7px] px-2 text-left w-[90px]">RESPONSÁVEL</th>
                                    <th className="border border-[#999] py-[7px] px-2 text-right w-[110px]">VALOR (KZ)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movs.length === 0? (
                                    <tr><td colSpan={5} className="border border-[#bbb] py-10 text-center text-[11px] text-gray-400 bg-[rgba(255,255,255,0.40)]">Sem movimentos no período {inicio} até {fim}</td></tr>
                                ) : movs.map((m: any, i: number) => (
                                    <tr key={i} className="text-[11px] align-top">
                                        <td className="border border-[#bbb] px-2 py-[5px] bg-[rgba(255,255,255,0.40)] text-[10px]">{fmtDataHora(m.criado_em)}</td>
                                        <td className="border border-[#bbb] px-2 py-[5px] bg-[rgba(255,255,255,0.40)] font-bold text-[10px]">{(m.tipo || '').toUpperCase()}</td>
                                        <td className="border border-[#bbb] px-2 py-[5px] bg-[rgba(255,255,255,0.40)] break-words leading-[13px]">{m.descricao || m.tipo || '---'}</td>
                                        <td className="border border-[#bbb] px-2 py-[5px] bg-[rgba(255,255,255,0.40)] text-[10px] truncate">{m.criado_por_nome || m.aberto_por_nome || '---'}</td>
                                        <td className={`border border-[#bbb] text-right px-2 py-[5px] bg-[rgba(255,255,255,0.40)] font-semibold ${Number(m.valor) < 0? 'text-red-600' : 'text-green-700'}`}>{fmt(Number(m.valor))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex mt-3 gap-1">
                        <div className="flex-1 border border-[#999] min-w-0">
                            <div className="flex bg-[rgba(0,0,0,0.75)] text-white text-[11px] font-bold">
                                <div className="flex-1 py-[6px] px-2">RESUMO POR TIPO</div>
                                <div className="w-[60px] border-l border-[#999] py-[6px] text-center">QTD</div>
                                <div className="w-[120px] border-l border-[#999] py-[6px] text-right pr-2">TOTAL</div>
                            </div>
                            {Object.entries(totais).map(([tipo, d]: any) => (
                                <div key={tipo} className="flex text-[11px] border-t border-[#bbb]">
                                    <div className="flex-1 py-[5px] px-2 bg-[rgba(255,255,255,0.40)] font-bold text-[10px]">{tipo}</div>
                                    <div className="w-[60px] py-[5px] text-center bg-[rgba(255,255,255,0.40)] border-l border-[#bbb]">{d.qtd}</div>
                                    <div className="w-[120px] py-[5px] text-right pr-2 bg-[rgba(255,255,255,0.40)] border-l border-[#bbb]">{fmt(d.total)}</div>
                                </div>
                            ))}
                        </div>
                        <div className="w-[300px] shrink-0">
                            <div className="flex bg-[rgba(0,0,0,0.1)] text-[11px] border border-[#999]"><div className="flex-1 py-[7px] px-2 text-right">Total Entradas</div><div className="w-[135px] bg-[rgba(200,255,200,0.4)] border-l border-[#999] py-[7px] text-right pr-2 font-bold text-green-700">{fmt(entradas)}</div></div>
                            <div className="flex bg-[rgba(0,0,0,0.1)] text-[11px] border border-[#999] border-t-0"><div className="flex-1 py-[7px] px-2 text-right">Total Saídas</div><div className="w-[135px] bg-[rgba(255,200,200,0.4)] border-l border-[#999] py-[7px] text-right pr-2 font-bold text-red-600">{fmt(saidas)}</div></div>
                            <div className="flex bg-[rgba(0,0,0,0.1)] text-[11px] border border-[#999] border-t-0"><div className="flex-1 py-[7px] px-2 text-right">Saldo Inicial</div><div className="w-[135px] bg-white border-l border-[#999] py-[7px] text-right pr-2">{fmt(saldoInicial)}</div></div>
                            <div className="flex text-[12px] font-black border border-black border-t-0 bg-black text-white"><div className="flex-1 py-[8px] px-2 text-right">DIFERENÇA (SALDO)</div><div className="w-[135px] bg-white text-black border-l border-black py-[8px] text-right pr-2 font-black">Kz {fmt(saldo)}</div></div>
                        </div>
                    </div>

                    <div className="mt-auto border-t border-black flex justify-between items-center bg-[rgba(255,255,255,0.40)] px-1 pt-3">
                        <span className="text-[9px] font-bold">J-OS • Relatório {inicio} a {fim} • {movs.length} movimentos</span>
                        <span className="text-[9px] font-bold">Pág. 1 de 1</span>
                    </div>
                </div>
            </div>
        </>
    )
}
export default RelatorioCaixaPDF
