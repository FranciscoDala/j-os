import { useMemo } from 'react'
interface Props { extrato: any; inicio: string; fim: string; empresa: any; status?: any; }
const LogoDefault = ({ nome, size = 'small' }: any) => {
    const inicial = (nome || 'J').charAt(0).toUpperCase()
    if (size === 'large') return <div className="flex flex-col items-center opacity-[0.12]"><div className="w-[400px] h-[400px] bg-[#1a5ca8] rounded-full flex items-center justify-center text-white font-black text-[160px]">{inicial}</div></div>
    return <div className="w-[90px] h-[70px] flex flex-col items-center justify-center shrink-0"><div className="w-[60px] h-[60px] bg-[#1a5ca8] rounded-full flex items-center justify-center text-white font-black text-[28px]">{inicial}</div></div>
}
export default function RelatorioCaixaPDF({ extrato, inicio, fim, empresa, status }: Props) {
    const empRaw = useMemo(() => { let e: any = empresa; if (!e) { try { const c = localStorage.getItem("empresa_cache"); if (c) e = JSON.parse(c) } catch { } } if (e?.empresa) e = e.empresa; if (e?.data?.empresa) e = e.data.empresa; return e || {} }, [empresa])
    const emp = { nome: empRaw?.nome || 'J-OS Matriz', nif: empRaw?.nif || '500876654', endereco: empRaw?.endereco || 'Lunda-Sul, saurimo', telefone: empRaw?.telefone || '940799954', email: empRaw?.email || 'jenath@gmail.com', cidade: empRaw?.cidade || 'Saurimo', logo: empRaw?.logo_url || empRaw?.image_url || empRaw?.logo || '', logo_url: empRaw?.logo_url || empRaw?.image_url || empRaw?.logo || '' }
    const hasLogo = !!emp.logo
    const normalize = (t: string) => { const u = (t || '').toUpperCase(); if (u.includes('SANGRIA')) return 'SAIDA'; if (u.includes('SUPRIMENTO')) return 'ENTRADA'; return u }
    const { itensAll, totais, movs } = useMemo(() => {
        const all = extrato?.movimentos || []
        const fil = all.filter((m: any) => { const tt = (m.tipo || '').toUpperCase(); return !tt.includes('ABERTURA') && !tt.includes('FECHAMENTO') })
        const ent = fil.filter((m: any) => { const tt = normalize(m.tipo); return tt === 'ENTRADA' || tt === 'VENDA' }).reduce((s: number, m: any) => s + Number(m.valor || 0), 0)
        const sai = fil.filter((m: any) => normalize(m.tipo) === 'SAIDA').reduce((s: number, m: any) => s + Math.abs(Number(m.valor || 0)), 0)
        const ini = Number(extrato?.saldo_inicial || 0)
        const por: Record<string, { incidencia: number, valor: number }> = {}
        fil.forEach((m: any) => { const tt = normalize(m.tipo); if (!por[tt]) por[tt] = { incidencia: 0, valor: 0 }; por[tt].incidencia++; por[tt].valor += Math.abs(Number(m.valor || 0)) })
        const parsed = fil.map((m: any) => { const dt = new Date(m.criado_em); return { hora: dt.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }), desc: m.descricao || normalize(m.tipo), tipo: normalize(m.tipo), valor: Math.abs(Number(m.valor || 0)) } })
        return { movs: fil, itensAll: parsed, totais: { ini, ent, sai, atual: ini + ent - sai, por } }
    }, [extrato])
    const fmt = (n: number) => Number(n).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const fmtD = (d: any) => d ? new Date(d).toLocaleDateString('pt-AO') : '---'
    const IT = 18; const pags: any[][] = []; for (let i = 0; i < itensAll.length; i += IT)pags.push(itensAll.slice(i, i + IT)); if (pags.length === 0) pags.push([])
    return (<>
        {pags.map((itens, pi) => {
            const isLast = pi === pags.length - 1; const isFirst = pi === 0
            return (
                <div key={pi} className="pagina-pdf relative bg-white text-black w-[210mm] min-w-[210mm] min-h-[297mm] p-[8mm] md:p-[10mm] flex flex-col mx-auto" style={{ fontFamily: "var(--fonte-principal)" }}>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.08]"><LogoDefault nome={emp.nome} size="large" /></div>
                    <div className="relative z-10 flex flex-col flex-1 text-[10px] md:text-[11px] leading-[14px]">
                        <div className="flex gap-3 items-start"><div className="w-[100px] shrink-0">{hasLogo ? <img src={emp.logo} className="w-[90px] h-[70px] object-contain" alt="" /> : <LogoDefault nome={emp.nome} />}</div><div><p className="font-bold text-[14px] md:text-[16px]">{emp.nome}</p><p>NIF: {emp.nif}</p><p>Endereço: {emp.endereco}</p><p>Contactos: {emp.telefone}</p><p>Email: {emp.email}</p><p>{emp.cidade}</p></div></div>
                        <div className="flex justify-between mt-4 border-b border-dotted border-gray-300 pb-2"><div><p className="font-bold text-[11px]">RELATÓRIO DE CAIXA</p><p>Período: {inicio} a {fim}</p><p>Moeda: AKZ</p><p>Movimentos: {movs.length} • Pág {pi + 1}/{pags.length}</p></div><div className="text-right"><p className="font-bold">ORIGINAL</p><p>Emissão: {new Date().toLocaleString('pt-AO')}</p><p>Período: {inicio} a {fim}</p></div></div>
                        {isFirst && <><div className="mt-3"><p className="font-bold text-[12px]">Resumo Período: De {fmtD(inicio)} até {fmtD(fim)}</p><p>Saldo Inicial: Kz {fmt(totais.ini)}</p><p>Total Movimentos: {movs.length}</p><p>Operador: {status?.caixa_atual?.aberto_por_nome || 'Admin Jenath'}</p></div><div className="mt-2 grid grid-cols-3 gap-1">{[{ k: 'CÓD. CAIXA', v: status?.caixa_atual?.id?.slice(0, 8) || 'f9a831ea' }, { k: 'DATA INÍCIO', v: fmtD(inicio) }, { k: 'DATA FIM', v: fmtD(fim) }, { k: 'QTD MOVS', v: movs.length }, { k: 'SALDO INICIAL', v: `Kz ${fmt(totais.ini)}` }, { k: 'OPERADOR', v: status?.caixa_atual?.aberto_por_nome?.slice(0, 10) || 'Admin Jena' }].map(b => <div key={b.k} className="border border-[#bbb] p-1"><p className="font-bold text-[8px]">{b.k}</p><p className="text-center text-[10px]">{b.v}</p></div>)}</div></>}
                        <div className="mt-2 w-full overflow-hidden"><table className="w-full border-collapse"><thead><tr className="bg-[#d0d0d0] text-[9px] font-bold"><th className="border border-[#999] p-1 text-left">HORA</th><th className="border border-[#999] p-1 text-left">DESCRIÇÃO</th><th className="border border-[#999] p-1">QTD.</th><th className="border border-[#999] p-1">TIPO</th><th className="border border-[#999] p-1 text-right">VALOR</th></tr></thead><tbody>{itens.map((it: any, i: number) => <tr key={i} className="text-[9px]"><td className="border border-[#bbb] p-1">{it.hora}</td><td className="border border-[#bbb] p-1">{it.desc}</td><td className="border border-[#bbb] p-1 text-center">1</td><td className="border border-[#bbb] p-1 text-center font-bold">{it.tipo}</td><td className="border border-[#bbb] p-1 text-right font-bold">{fmt(it.valor)}</td></tr>)}</tbody></table></div>
                        {isLast && <div className="mt-2 flex gap-1"><div className="flex-1 border border-[#999]"><div className="flex bg-[#d0d0d0] text-[9px] font-bold"><div className="flex-1 p-1 border-r">TIPO</div><div className="w-[40px] p-1 border-r text-center">QTD</div><div className="w-[80px] p-1 text-center">VALOR</div></div>{Object.entries(totais.por).map(([k, v]: any) => <div key={k} className="flex text-[9px]"><div className="flex-1 p-1 border-r border-[#bbb]">{k}</div><div className="w-[40px] p-1 border-r border-[#bbb] text-center">{v.incidencia}</div><div className="w-[80px] p-1 text-right">{fmt(v.valor)}</div></div>)}</div><div className="w-[140px] md:w-[200px]"><div className="border border-[#999] p-1 flex justify-between text-[9px]"><span>Entradas</span><span className="font-bold text-green-700">{fmt(totais.ent)}</span></div><div className="border border-[#999] border-t-0 p-1 flex justify-between text-[9px]"><span>Saidas</span><span className="font-bold text-red-600">{fmt(totais.sai)}</span></div><div className="border border-[#999] border-t-0 p-1 flex justify-between text-[9px] bg-[#eee] font-bold"><span>SALDO</span><span>Kz {fmt(totais.atual)}</span></div></div></div>}
                        <div className="mt-auto pt-2 border-t border-black flex justify-between text-[8px]"><span>{emp.nome} • Pág {pi + 1}/{pags.length}</span><span>Pág. {pi + 1}/{pags.length}</span></div>
                    </div>
                </div>
            )
        })}
    </>)
}
