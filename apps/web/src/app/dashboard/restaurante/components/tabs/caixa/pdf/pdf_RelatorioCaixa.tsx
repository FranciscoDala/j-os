import { useMemo } from 'react'

interface Props {
    extrato: any;
    inicio: string;
    fim: string;
    empresa: any;
    status?: any;
}

const LogoDefault = ({ nome, size = 'small' }: { nome?: string; size?: 'small' | 'large' }) => {
    const inicial = (nome || 'T').charAt(0).toUpperCase()
    if (size === 'large') {
        return (
            <div className="flex flex-col items-center opacity-[0.12]" style={{ fontFamily: "var(--fonte-principal)" }}>
                <div className="w-[550px] h-[550px] bg-[#1a5ca8] rounded-full flex items-center justify-center text-white font-black text-[220px]" style={{ fontFamily: "var(--fonte-principal)" }}>{inicial}</div>
            </div>
        )
    }
    return (
        <div className="w-[110px] h-[90px] flex flex-col items-center justify-center shrink-0">
            <div className="w-[70px] h-[70px] bg-[#1a5ca8] rounded-full flex items-center justify-center text-white font-black text-[36px]" style={{ fontFamily: "var(--fonte-principal)" }}>{inicial}</div>
            <div className="mt-1 bg-[#1a5ca8] text-white text-[9px] font-bold px-2 py-[2px]" style={{ fontFamily: "var(--fonte-principal)" }}>{(nome || 'J-OS').toUpperCase().slice(0, 10)}</div>
        </div>
    )
}

export const RelatorioCaixaPDF = ({ extrato, inicio, fim, empresa, status }: Props) => {
    const movs = extrato?.movimentos || []

    // EMPRESA - PEGA DE QUALQUER FORMATO
    const empresaRaw = useMemo(() => {
        let e: any = empresa
        if (!e) {
            try { const c = localStorage.getItem("empresa_cache"); if (c) e = JSON.parse(c) } catch {}
        }
        if (e?.empresa) e = e.empresa
        if (e?.data?.empresa) e = e.data.empresa
        if (e?.data?.nome) e = e.data
        if (e?.user?.empresa) e = e.user.empresa
        return e || {}
    }, [empresa])

    const emp = {
        nome: empresaRaw?.nome || empresaRaw?.companyName || empresaRaw?.razao_social || empresaRaw?.nome_fantasia || 'J-OS RESTAURANTE',
        nif: empresaRaw?.nif || empresaRaw?.cnpj || empresaRaw?.documento || '',
        endereco: empresaRaw?.endereco || empresaRaw?.morada || empresaRaw?.address || 'Luanda, Angola',
        telefone: empresaRaw?.telefone || empresaRaw?.contactos || empresaRaw?.phone || '',
        email: empresaRaw?.email || '',
        cidade: empresaRaw?.cidade || empresaRaw?.city || 'Luanda',
        logo: empresaRaw?.logo_url || empresaRaw?.image_url || empresaRaw?.logo || '',
        logo_url: empresaRaw?.logo_url || empresaRaw?.image_url || empresaRaw?.logo || '',
    }
    const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "")
    if (emp.logo?.startsWith("/")) emp.logo = `${API_URL}${emp.logo}`
    if (emp.logo_url?.startsWith("/")) emp.logo_url = `${API_URL}${emp.logo_url}`
    const hasLogo =!!emp.logo && emp.logo.trim()!== ''
    const mask = (v: string) => v && v.trim()!== ''? v : '---'

    const { itensAll, totais } = useMemo(() => {
        const entradas = Number(extrato?.total_entradas || 0)
        const saidas = Math.abs(Number(extrato?.total_saidas || 0))
        const saldoInicial = Number(extrato?.saldo_inicial || 0)
        const saldoAtual = Number(extrato?.saldo_atual || (saldoInicial + entradas - saidas))

        const porTipo: Record<string, { incidencia: number, valor: number }> = {}
        movs.forEach((m: any) => {
            const t = (m.tipo || 'OUTRO').toUpperCase()
            if (!porTipo[t]) porTipo[t] = { incidencia: 0, valor: 0 }
            porTipo[t].incidencia += 1
            porTipo[t].valor += Number(m.valor || 0)
        })

        const parsed = movs.map((m: any) => {
            const dt = new Date(m.criado_em)
            return {
                referencia: dt.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }),
                nome_snapshot: m.descricao || m.tipo || 'Movimento caixa',
                quantidade: 1,
                unidade: (m.tipo || 'MOV').slice(0, 6).toUpperCase(),
                preco_unit_snapshot: Number(m.valor || 0),
                desconto_perc: 0,
                desconto_valor: 0,
                taxa_iva: 0,
                subtotal_base: Number(m.valor || 0),
                valor_iva: 0,
                subtotal_linha: Number(m.valor || 0),
            }
        })

        return {
            itensAll: parsed,
            totais: {
                liquido: entradas,
                desconto: saidas,
                iva: 0,
                pagar: saldoAtual,
                saldoInicial,
                entradas,
                saidas,
                diferenca: saldoAtual,
                ivaPorTaxa: porTipo
            }
        }
    }, [movs, extrato])

    const fmt = (n: number) => Number(n).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const fmtData = (d: any) => d? new Date(d).toLocaleDateString('pt-AO') : '---'
    const fmtDataHora = (d: any) => d? new Date(d).toLocaleString('pt-AO') : '---'

    // PAGINAÇÃO - 20 ITENS POR PÁGINA PARA NÃO CRIAR FOLHA LONGA
    const ITENS_POR_PAGINA = 20
    const paginas: any[][] = []
    for (let i = 0; i < itensAll.length; i += ITENS_POR_PAGINA) paginas.push(itensAll.slice(i, i + ITENS_POR_PAGINA))
    if (paginas.length === 0) paginas.push([])

    return (
        <div id="relatorio-wrapper" className="flex flex-col gap-8">
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Zalando+Sans+Expanded:ital,wght@0,200..900;1,200..900&display=swap');
             .no-scrollbar::-webkit-scrollbar{display:none}
             .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
            `}</style>

            {paginas.map((itens, pageIdx) => {
                const isLast = pageIdx === paginas.length - 1
                const isFirst = pageIdx === 0
                return (
                    <div key={pageIdx} id={pageIdx === 0? "fatura-pdf" : `fatura-pdf-${pageIdx}`} className="pagina-pdf relative bg-white text-black w-[210mm] min-w-[210mm] min-h-[297mm] p-[10mm] flex flex-col border border-gray-200 overflow-hidden mx-auto" style={{ fontFamily: "var(--fonte-principal)" }}>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                            {hasLogo? <img src={emp.logo_url} alt="marca" className="w-[650px] h-[650px] object-contain opacity-[0.10]" /> : <LogoDefault nome={emp.nome} size="large" />}
                        </div>
                        <div className="relative z-10 flex flex-col flex-1">
                            <div className="flex gap-3">
                                {hasLogo? <img src={emp.logo} className="w-[110px] h-[90px] object-contain shrink-0" alt="logo" /> : <LogoDefault nome={emp.nome} />}
                                <div className="text-[11px] leading-[15px]"><p className="font-bold text-[14px]">{mask(emp.nome)}</p><p>NIF: {mask(emp.nif)}</p><p>Endereço: {mask(emp.endereco)}</p><p>Contactos: {mask(emp.telefone)}</p><p>Email: {mask(emp.email)}</p><p>{mask(emp.cidade)}</p></div>
                            </div>

                            <div className="flex justify-between items-start mt-6 border-b border-dotted border-gray-300 pb-3">
                                <div className="text-[9px] leading-[13px] max-w-[300px]">
                                    <p className="font-bold text-[12px]">RELATÓRIO DE CAIXA</p>
                                    <p className="mt-1">Período: {inicio} a {fim}</p>
                                    <p>Moeda: AKZ</p>
                                    <p className="mt-1">Caixa: {status?.aberto? `Aberto por ${status?.caixa_atual?.aberto_por_nome || '---'}` : 'Fechado'}</p>
                                    <p>Movimentos: {movs.length} • Pág {pageIdx + 1}/{paginas.length}</p>
                                </div>
                                <div className="flex gap-3 items-start">
                                    <div className="text-right leading-[14px]">
                                        <p className="font-bold text-[15px]">RC-{inicio}_a_{fim}</p>
                                        <p className="text-[#777] text-[11px] mt-1">Regime Geral</p>
                                        <p className="font-bold text-[12px] mt-1">ORIGINAL</p>
                                        <p className="text-[10px] mt-1">Emissão: {fmtDataHora(new Date().toISOString())}</p>
                                        <p className="text-[10px]">Período: {inicio} a {fim}</p>
                                    </div>
                                    <div className="w-[90px] h-[90px] shrink-0 border p-1 bg-white flex items-center justify-center text-[8px] font-black text-center leading-[10px]">
                                        J-OS<br />RELATÓRIO<br />{movs.length} MOVS
                                    </div>
                                </div>
                            </div>

                            {isFirst && (
                                <>
                                    <div className="mt-6 flex justify-between">
                                        <div className="w-[60%] text-[12px] leading-[16px]">
                                            <p className="font-bold text-[13px]">Resumo Período:</p>
                                            <p className="font-bold">De {fmtData(inicio)} até {fmtData(fim)}</p>
                                            <p>Saldo Inicial: Kz {fmt(totais.saldoInicial)}</p>
                                            <p>Total Movimentos: {movs.length}</p>
                                            <p>Operador: {status?.caixa_atual?.aberto_por_nome || 'Sistema'}</p>
                                        </div>
                                        <div className="text-right"><p className="text-[9px] text-[#666]">Processado por J-OS Sistema</p><p className="text-[9px] text-[#666]">Relatório interno</p></div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-[90px_95px_95px_125px_115px_1fr] gap-[5px]">
                                        {[
                                            { k: 'CÓD. CAIXA', v: status?.caixa_atual?.id?.slice(0, 8) || 'AVULSO' },
                                            { k: 'DATA INÍCIO', v: fmtData(inicio) },
                                            { k: 'DATA FIM', v: fmtData(fim) },
                                            { k: 'QTD MOVS', v: movs.length },
                                            { k: 'SALDO INICIAL', v: `Kz ${fmt(totais.saldoInicial)}` },
                                            { k: 'OPERADOR', v: status?.caixa_atual?.aberto_por_nome?.slice(0, 10) || 'Sistema' },
                                        ].map(b => (
                                            <div key={b.k} className="border border-[#bbb] py-[5px] px-1 bg-[rgba(255,255,255,0.40)]"><p className="font-bold text-[10px] truncate">{b.k}</p><p className="text-center text-[11px] mt-[2px] truncate">{b.v}</p></div>
                                        ))}
                                    </div>
                                </>
                            )}

                            <div className="w-full mt-2 overflow-x-auto no-scrollbar">
                                <table className="w-full border-collapse table-auto min-w-[720px]">
                                    <colgroup>
                                        <col style={{ width: '68px' }} />
                                        <col style={{ width: 'auto' }} />
                                        <col style={{ width: '56px' }} />
                                        <col style={{ width: '56px' }} />
                                        <col style={{ width: '96px' }} />
                                        <col style={{ width: '82px' }} />
                                        <col style={{ width: '68px' }} />
                                        <col style={{ width: '118px' }} />
                                    </colgroup>
                                    <thead>
                                        <tr className="bg-[rgba(194,194,194,0.65)] text-[10.5px] font-bold">
                                            <th className="border border-[#999] py-[7px] px-2 text-left whitespace-nowrap">HORA</th>
                                            <th className="border border-[#999] py-[7px] px-2 text-left">DESCRIÇÃO / TIPO</th>
                                            <th className="border border-[#999] py-[7px] px-1 text-center">QTD.</th>
                                            <th className="border border-[#999] py-[7px] px-1 text-center">TIPO</th>
                                            <th className="border border-[#999] py-[7px] px-2 text-right">VALOR UNIT.</th>
                                            <th className="border border-[#999] py-[7px] px-2 text-right">-</th>
                                            <th className="border border-[#999] py-[7px] px-1 text-center">-</th>
                                            <th className="border border-[#999] py-[7px] px-2 text-right">VALOR (KZ)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itens.length === 0? <tr><td colSpan={8} className="border border-[#bbb] py-10 text-center text-[11px] text-gray-400">Sem movimentos de {inicio} até {fim}</td></tr> : itens.map((it: any, i: number) => (
                                            <tr key={i} className="text-[11px] align-top">
                                                <td className="border border-[#bbb] px-2 py-[6px] bg-[rgba(255,255,255,0.40)] whitespace-nowrap">{it.referencia}</td>
                                                <td className="border border-[#bbb] px-2 py-[6px] bg-[rgba(255,255,255,0.40)] whitespace-normal break-words leading-[14px]">{it.nome_snapshot}</td>
                                                <td className="border border-[#bbb] text-center px-1 py-[6px] bg-[rgba(255,255,255,0.40)]">{it.quantidade}</td>
                                                <td className="border border-[#bbb] text-center px-1 py-[6px] bg-[rgba(255,255,255,0.40)] font-bold text-[10px]">{it.unidade}</td>
                                                <td className="border border-[#bbb] text-right px-2 py-[6px] bg-[rgba(255,255,255,0.40)] whitespace-nowrap">{fmt(it.preco_unit_snapshot)}</td>
                                                <td className="border border-[#bbb] text-right px-2 py-[6px] bg-[rgba(255,255,255,0.40)]">-</td>
                                                <td className="border border-[#bbb] text-center px-1 py-[6px] bg-[rgba(255,255,255,0.40)]">-</td>
                                                <td className={`border border-[#bbb] text-right px-2 py-[6px] font-semibold whitespace-nowrap ${it.subtotal_linha < 0? 'text-red-600 bg-[#FFF0F0]' : 'bg-[rgba(255,255,255,0.40)]'}`}>{fmt(it.subtotal_linha)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {isLast && (
                                <div className="flex mt-2 gap-1">
                                    <div className="flex-1 border border-[#999] min-w-0 overflow-hidden">
                                        <div className="flex bg-[rgba(194,194,194,0.65)] text-[11px] font-bold">
                                            <div className="flex-1 border-r border-[#999] py-[6px] px-1">TIPO MOVIMENTO</div>
                                            <div className="w-[50px] border-r border-[#999] py-[6px] text-center shrink-0">QTD</div>
                                            <div className="w-[125px] border-r border-[#999] py-[6px] text-center shrink-0">OCORRÊNCIAS</div>
                                            <div className="w-[125px] py-[6px] text-center shrink-0">VALOR</div>
                                        </div>
                                        {Object.entries(totais.ivaPorTaxa).map(([tipo, d]: any) => (
                                            <div key={tipo} className="flex text-[11px]">
                                                <div className="flex-1 border-r border-[#999] py-[6px] px-1 bg-[rgba(255,255,255,0.40)] font-bold truncate">{tipo}</div>
                                                <div className="w-[50px] border-r border-[#999] py-[6px] text-center bg-[rgba(255,255,255,0.40)] shrink-0">{d.incidencia}</div>
                                                <div className="w-[125px] border-r border-[#999] py-[6px] text-right pr-2 bg-[rgba(255,255,255,0.40)] shrink-0">{d.incidencia}</div>
                                                <div className="w-[125px] py-[6px] text-right pr-2 bg-[rgba(255,255,255,0.40)] shrink-0 font-bold whitespace-nowrap">{fmt(d.valor)}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="w-[300px] shrink-0">
                                        <div className="flex bg-[rgba(194,194,194,0.65)] text-[11px] border border-[#999]"><div className="flex-1 py-[7px] px-2 text-right">Total Entradas</div><div className="w-[135px] bg-[rgba(255,255,255,0.55)] border-l border-[#999] py-[7px] text-right pr-2 font-bold text-green-700 whitespace-nowrap">{fmt(totais.entradas)}</div></div>
                                        <div className="flex bg-[rgba(194,194,194,0.65)] text-[11px] border border-[#999] border-t-0"><div className="flex-1 py-[7px] px-2 text-right">Total Saídas</div><div className="w-[135px] bg-[rgba(255,255,255,0.55)] border-l border-[#999] py-[7px] text-right pr-2 font-bold text-red-600 whitespace-nowrap">{fmt(totais.saidas)}</div></div>
                                        <div className="flex bg-[rgba(194,194,194,0.65)] text-[11px] border border-[#999] border-t-0"><div className="flex-1 py-[7px] px-2 text-right">Saldo Inicial</div><div className="w-[135px] bg-[rgba(255,255,255,0.55)] border-l border-[#999] py-[7px] text-right pr-2 whitespace-nowrap">{fmt(totais.saldoInicial)}</div></div>
                                        <div className="flex text-[11px] font-bold border border-[#999] border-t-0 bg-[rgba(194,194,194,0.75)]"><div className="flex-1 py-[7px] px-2 text-right">DIFERENÇA (SALDO)</div><div className="w-[135px] bg-white border-l border-[#999] py-[7px] text-right pr-2 font-bold whitespace-nowrap">Kz {fmt(totais.diferenca)}</div></div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto border-t border-black flex justify-between items-center bg-[rgba(255,255,255,0.40)] px-1 pt-3">
                                <span className="text-[9px] font-bold">{mask(emp.nome)} • Período {inicio} a {fim} • Pág {pageIdx + 1} de {paginas.length}</span>
                                <span className="text-[9px] font-bold">Pág. {pageIdx + 1} de {paginas.length}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
export default RelatorioCaixaPDF
