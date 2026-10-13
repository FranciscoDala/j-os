"use client";
import { useMemo, useEffect, useState } from 'react'

interface Props { extrato: any; inicio: string; fim: string; empresa: any; status?: any; }

const LogoDefault = ({ nome, size = 'small' }: { nome?: string; size?: 'small' | 'large' }) => {
    const inicial = (nome || 'J').charAt(0).toUpperCase()
    if (size === 'large') return <div className="flex flex-col items-center opacity-[0.08]"><div className="w-[500px] h-[500px] bg-black rounded-full flex items-center justify-center text-white font-black text-[200px]">{inicial}</div></div>
    return <div className="w-[110px] h-[90px] flex flex-col items-center justify-center shrink-0"><div className="w-[70px] h-[70px] bg-black rounded-full flex items-center justify-center text-white font-black text-[32px]">{inicial}</div></div>
}

export const RelatorioCaixaPDF = ({ extrato, inicio, fim, empresa, status }: Props) => {
    const movs = extrato?.movimentos || []
    const [empresaLocal, setEmpresaLocal] = useState<any>(empresa)

    // BUSCA EMPRESA DENTRO DO PDF SE NÃO VEIO
    useEffect(() => {
        if (empresa && (empresa.nome || empresa.companyName)) { setEmpresaLocal(empresa); return; }
        const tryLoad = async () => {
            try {
                const token = localStorage.getItem("access_token") || localStorage.getItem("token")
                const empresa_id = localStorage.getItem("empresa_id")
                const h: any = {}
                if (token) h["Authorization"] = `Bearer ${token}`
                if (empresa_id) h["X-Empresa-ID"] = empresa_id
                const BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1"
                const paths = ["/empresa/me", "/empresas/me", "/empresa", "/auth/me", "/usuarios/me"]
                for (const p of paths) {
                    try {
                        const r = await fetch(`${BASE}${p}`, { headers: h, cache: "no-store" as any })
                        if (!r.ok) continue
                        const d = await r.json()
                        const cand = d?.empresa || d?.data?.empresa || d?.data || d?.user?.empresa || d
                        if (cand?.nome || cand?.companyName) { setEmpresaLocal(cand); localStorage.setItem("empresa_cache", JSON.stringify(cand)); break; }
                    } catch {}
                }
            } catch {}
            if (!empresaLocal) {
                try {
                    const c = localStorage.getItem("empresa_cache") || localStorage.getItem("empresa")
                    if (c) setEmpresaLocal(JSON.parse(c))
                } catch {}
            }
        }
        tryLoad()
    }, [empresa])

    const empresaRaw = useMemo(() => {
        let e = empresaLocal || empresa || {}
        if (e?.empresa) e = e.empresa
        if (e?.data?.empresa) e = e.data.empresa
        if (e?.data?.nome) e = e.data
        return e
    }, [empresaLocal, empresa])

    const emp = {
        nome: empresaRaw?.nome || empresaRaw?.companyName || empresaRaw?.razao_social || empresaRaw?.nome_fantasia || 'J-OS RESTAURANTE',
        nif: empresaRaw?.nif || empresaRaw?.cnpj || empresaRaw?.documento || '',
        endereco: empresaRaw?.endereco || empresaRaw?.morada || empresaRaw?.address || 'Luanda, Angola',
        telefone: empresaRaw?.telefone || empresaRaw?.phone || empresaRaw?.contactos || '',
        email: empresaRaw?.email || '',
        cidade: empresaRaw?.cidade || empresaRaw?.city || 'Luanda',
        logo: empresaRaw?.logo_url || empresaRaw?.image_url || empresaRaw?.logo || '',
        logo_url: empresaRaw?.logo_url || empresaRaw?.image_url || empresaRaw?.logo || '',
    }
    const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "")
    if (emp.logo && emp.logo.startsWith("/") &&!emp.logo.startsWith("http")) emp.logo = `${API_URL}${emp.logo}`
    if (emp.logo_url && emp.logo_url.startsWith("/") &&!emp.logo_url.startsWith("http")) emp.logo_url = `${API_URL}${emp.logo_url}`
    const hasLogo =!!emp.logo && emp.logo.trim()!== ''

    const { itens, totais } = useMemo(() => {
        const entradas = Number(extrato?.total_entradas || 0)
        const saidas = Math.abs(Number(extrato?.total_saidas || 0))
        const saldoInicial = Number(extrato?.saldo_inicial || 0)
        const saldoAtual = Number(extrato?.saldo_atual || (saldoInicial + entradas - saidas))
        const porTipo: Record<string, any> = {}
        movs.forEach((m: any) => {
            const t = (m.tipo || 'OUTRO').toUpperCase()
            if (!porTipo[t]) porTipo[t] = { incidencia: 0, valor: 0 }
            porTipo[t].incidencia += 1
            porTipo[t].valor += Number(m.valor || 0)
        })
        const parsed = movs.map((m: any) => {
            const dt = new Date(m.criado_em)
            return {
                hora: dt.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }),
                data: dt.toLocaleDateString('pt-AO'),
                desc: m.descricao || m.tipo || 'Movimento',
                tipo: (m.tipo || 'MOV').slice(0, 8).toUpperCase(),
                valor: Number(m.valor || 0),
            }
        })
        return { itens: parsed, totais: { entradas, saidas, saldoInicial, diferenca: saldoAtual, ivaPorTaxa: porTipo } }
    }, [movs, extrato])

    const fmt = (n: number) => Number(n).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const fmtData = (d: any) => d? new Date(d).toLocaleDateString('pt-AO') : '---'
    const fmtDataHora = (d: any) => d? new Date(d).toLocaleString('pt-AO') : '---'

    // PAGINAÇÃO: 22 linhas por página A4
    const ITENS_POR_PAGINA = 22
    const paginas: any[][] = []
    for (let i = 0; i < itens.length; i += ITENS_POR_PAGINA) paginas.push(itens.slice(i, i + ITENS_POR_PAGINA))
    if (paginas.length === 0) paginas.push([])

    return (
        <div id="relatorio-caixa-pdf" className="flex flex-col gap-6">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Zalando+Sans+Expanded:wght@400;700;900&display=swap');.pagina-pdf{width:210mm; min-height:297mm; background:white; padding:10mm; position:relative; page-break-after:always; break-after:page} @media print{.pagina-pdf{box-shadow:none!important; border:none!important}} @media (max-width:768px){.pagina-pdf{transform:scale(0.42); transform-origin:top center; margin-bottom:-58%}}`}</style>

            {paginas.map((paginaItens, pageIndex) => {
                const isLast = pageIndex === paginas.length - 1
                const isFirst = pageIndex === 0
                return (
                    <div key={pageIndex} className="pagina-pdf relative bg-white text-black flex flex-col border border-gray-200 mx-auto shadow-xl overflow-hidden" style={{ fontFamily: "Zalando Sans Expanded, sans-serif" }}>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.06]">{hasLogo? <img src={emp.logo_url || emp.logo} className="w-[600px] h-[600px] object-contain" alt="" /> : <LogoDefault nome={emp.nome} size="large" />}</div>
                        <div className="relative z-10 flex flex-col flex-1">
                            {/* HEADER SÓ NA PRIMEIRA PÁGINA REPETE INFO */}
                            <div className="flex gap-3">
                                {hasLogo? <img src={emp.logo} className="w-[90px] h-[70px] object-contain shrink-0" alt="" /> : <LogoDefault nome={emp.nome} />}
                                <div className="text-[10px] leading-[13px]"><p className="font-black text-[13px]">{emp.nome}</p><p>NIF: {emp.nif || '---'}</p><p>{emp.endereco}</p><p>{emp.telefone} {emp.telefone && emp.email? ' | ' : ''}{emp.email}</p><p>{emp.cidade}</p></div>
                            </div>

                            <div className="flex justify-between mt-5 border-b border-dotted border-zinc-300 pb-2">
                                <div className="text-[8.5px] leading-[11px]"><p className="font-black text-[11px]">RELATÓRIO DE CAIXA</p><p className="mt-1">Período: {inicio} a {fim}</p><p>Caixa: {status?.aberto? 'Aberto' : 'Fechado'}</p><p>Página: {pageIndex + 1} de {paginas.length}</p></div>
                                <div className="text-right text-[8.5px] leading-[11px]"><p className="font-black text-[12px]">RC-{inicio}_a_{fim}</p><p>Movs: {movs.length}</p><p className="font-bold mt-1">{isFirst? 'ORIGINAL' : `CONTINUAÇÃO ${pageIndex + 1}`}</p></div>
                            </div>

                            {isFirst && (
                                <div className="mt-3 grid grid-cols-[90px_95px_95px_125px_115px_1fr] gap-[4px]">
                                    {[
                                        { k: 'CÓD. CAIXA', v: status?.caixa_atual?.id?.slice(0, 8) || 'AVULSO' },
                                        { k: 'DATA INÍCIO', v: fmtData(inicio) },
                                        { k: 'DATA FIM', v: fmtData(fim) },
                                        { k: 'QTD MOVS', v: movs.length },
                                        { k: 'SALDO INICIAL', v: `Kz ${fmt(totais.saldoInicial)}` },
                                        { k: 'OPERADOR', v: status?.caixa_atual?.aberto_por_nome?.slice(0, 10) || 'Sistema' },
                                    ].map(b => (<div key={b.k} className="border border-[#bbb] py-[4px] px-1 bg-white/60"><p className="font-bold text-[8px] truncate">{b.k}</p><p className="text-center text-[9px] mt-[1px] truncate">{b.v}</p></div>))}
                                </div>
                            )}

                            <div className="mt-3 border border-black/20">
                                <table className="w-full border-collapse text-[9px]">
                                    <thead><tr className="bg-black text-white text-[8px] font-black"><th className="border border-zinc-400 py-1.5 px-2 text-left w-[70px]">HORA</th><th className="border border-zinc-400 py-1.5 px-2 text-left w-[60px]">DATA</th><th className="border border-zinc-400 py-1.5 px-2 text-left">DESCRIÇÃO</th><th className="border border-zinc-400 py-1.5 px-2 text-center w-[60px]">TIPO</th><th className="border border-zinc-400 py-1.5 px-2 text-right w-[95px]">VALOR KZ</th></tr></thead>
                                    <tbody>
                                        {paginaItens.length === 0? <tr><td colSpan={5} className="py-10 text-center text-zinc-400 border text-[10px]">Sem movimentos em {inicio} a {fim}</td></tr> : paginaItens.map((it: any, i: number) => (
                                            <tr key={i} className="text-[9px]"><td className="border border-zinc-300 px-2 py-1 bg-white/60">{it.hora}</td><td className="border border-zinc-300 px-2 py-1 bg-white/60">{it.data}</td><td className="border border-zinc-300 px-2 py-1 bg-white/60">{it.desc}</td><td className="border border-zinc-300 px-2 py-1 bg-white/60 font-bold text-center">{it.tipo}</td><td className={`border border-zinc-300 px-2 py-1 bg-white/60 text-right font-bold ${it.valor < 0? 'text-red-600' : 'text-green-700'}`}>{fmt(it.valor)}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* TOTAIS SÓ NA ÚLTIMA PÁGINA */}
                            {isLast && (
                                <>
                                    <div className="flex mt-3 gap-2">
                                        <div className="flex-1 border border-black/20 text-[9px]"><div className="bg-black text-white font-bold flex"><div className="flex-1 px-2 py-1">RESUMO POR TIPO</div><div className="w-[45px] border-l border-zinc-600 text-center py-1">QTD</div><div className="w-[90px] border-l border-zinc-600 text-right pr-2 py-1">TOTAL</div></div>{Object.entries(totais.ivaPorTaxa).map(([k, v]: any) => (<div key={k} className="flex border-t"><div className="flex-1 px-2 py-1 bg-white/60 font-bold">{k}</div><div className="w-[45px] text-center py-1 border-l bg-white/60">{v.incidencia}</div><div className="w-[90px] text-right pr-2 py-1 border-l bg-white/60">{fmt(v.valor)}</div></div>))}</div>
                                        <div className="w-[260px] text-[10px] shrink-0"><div className="flex border border-black/20"><div className="flex-1 px-2 py-2 text-right bg-zinc-100">Total Entradas</div><div className="w-[120px] border-l px-2 py-2 text-right font-bold text-green-700 bg-green-50">{fmt(totais.entradas)}</div></div><div className="flex border border-black/20 border-t-0"><div className="flex-1 px-2 py-2 text-right bg-zinc-100">Total Saídas</div><div className="w-[120px] border-l px-2 py-2 text-right font-bold text-red-600 bg-red-50">{fmt(totais.saidas)}</div></div><div className="flex border border-black/20 border-t-0"><div className="flex-1 px-2 py-2 text-right bg-zinc-100">Saldo Inicial</div><div className="w-[120px] border-l px-2 py-2 text-right bg-white">{fmt(totais.saldoInicial)}</div></div><div className="flex border-2 border-black bg-black text-white font-black"><div className="flex-1 px-2 py-2.5 text-right">DIFERENÇA</div><div className="w-[120px] bg-white text-black border-l-2 border-black px-2 py-2.5 text-right">Kz {fmt(totais.diferenca)}</div></div></div>
                                    </div>
                                    <div className="mt-3 bg-zinc-50 border border-dashed p-2 text-[9px]"><p className="font-bold">Emitido por: {status?.caixa_atual?.aberto_por_nome || 'Sistema'} em {fmtDataHora(new Date().toISOString())}</p><p className="mt-1">Período analisado: {inicio} até {fim} • {movs.length} movimentos</p></div>
                                </>
                            )}

                            <div className="mt-auto pt-3 border-t border-black flex justify-between text-[7px] font-bold"><span>{emp.nome} • {inicio} a {fim} • Pág {pageIndex + 1}/{paginas.length}</span><span>J-OS Sistema</span></div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
export default RelatorioCaixaPDF
