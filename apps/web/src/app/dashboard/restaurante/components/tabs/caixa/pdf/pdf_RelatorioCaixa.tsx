"use client";
export const RelatorioCaixaPDF = ({ extrato, inicio, fim, empresa, status }: any) => {
    const movs = extrato?.movimentos || []
    const entradas = Number(extrato?.total_entradas || 0)
    const saidas = Math.abs(Number(extrato?.total_saidas || 0))
    const saldo = Number(extrato?.saldo_atual?? (entradas - saidas))
    const saldoInicial = Number(extrato?.saldo_inicial || 0)

    const fmt = (n: number) => Number(n).toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const fmtDataHora = (iso: string) => {
        try { if (!iso) return "--"; return new Date(iso).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Luanda' }) } catch { return iso }
    }

    const emp = {
        nome: empresa?.nome || 'J-OS RESTAURANTE',
        nif: empresa?.nif || '---',
        endereco: empresa?.endereco || 'Luanda, Angola',
        telefone: empresa?.telefone || '---',
        email: empresa?.email || '---',
        cidade: empresa?.cidade || 'Luanda',
        logo: empresa?.logo_url || empresa?.logo || '',
    }
    const hasLogo =!!emp.logo

    const porTipo: any = {}
    movs.forEach((m: any) => {
        const t = (m.tipo || 'OUTRO').toUpperCase()
        if (!porTipo[t]) porTipo[t] = { qtd: 0, total: 0 }
        porTipo[t].qtd += 1
        porTipo[t].total += Number(m.valor || 0)
    })

    return (
        <div id="relatorio-caixa-pdf" className="relative bg-white text-black w-[210mm] min-w-[210mm] min-h-[297mm] p-[10mm] flex flex-col border border-gray-200 mx-auto" style={{ fontFamily: "Zalando Sans Expanded, sans-serif" }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]"><div className="w-[500px] h-[500px] bg-black rounded-full flex items-center justify-center text-white font-black text-[180px]">J</div></div>
            <div className="relative z-10 flex flex-col flex-1">
                <div className="flex gap-3">
                    {hasLogo? <img src={emp.logo} className="w-[110px] h-[90px] object-contain" alt="" /> : <div className="w-[110px] h-[90px] bg-black rounded-full flex items-center justify-center text-white font-black text-[36px] shrink-0">J</div>}
                    <div className="text-[11px] leading-[14px]"><p className="font-bold text-[13px]">{emp.nome}</p><p>NIF: {emp.nif}</p><p>{emp.endereco}</p><p>{emp.telefone} | {emp.email}</p><p>{emp.cidade}</p></div>
                </div>
                <div className="flex justify-between mt-6 border-b border-dotted border-zinc-300 pb-3">
                    <div className="text-[9px] leading-[12px]"><p className="font-bold text-[12px]">RELATÓRIO DE CAIXA</p><p className="mt-1">Período: {inicio} a {fim}</p><p>Gerado: {fmtDataHora(new Date().toISOString())}</p><p>Caixa: {status?.aberto? 'Aberto' : 'Fechado'}</p></div>
                    <div className="text-right text-[10px] leading-[13px]"><p className="font-bold text-[14px]">RC-{inicio}_a_{fim}</p><p className="mt-1">Movimentos: {movs.length}</p><p className="font-bold">ORIGINAL</p></div>
                </div>
                <div className="mt-3 border border-black/20">
                    <table className="w-full border-collapse text-[10px]">
                        <thead><tr className="bg-black text-white text-[9px] font-black"><th className="border border-zinc-400 py-2 px-2 text-left w-[105px]">DATA/HORA</th><th className="border border-zinc-400 py-2 px-2 text-left w-[80px]">TIPO</th><th className="border border-zinc-400 py-2 px-2 text-left">DESCRIÇÃO</th><th className="border border-zinc-400 py-2 px-2 text-right w-[105px]">VALOR KZ</th></tr></thead>
                        <tbody>
                            {movs.length === 0? <tr><td colSpan={4} className="py-10 text-center text-zinc-400 border">Sem movimentos em {inicio} a {fim}</td></tr> : movs.map((m: any, i: number) => (
                                <tr key={i} className="text-[10px]"><td className="border border-zinc-300 px-2 py-1.5 bg-white/60">{fmtDataHora(m.criado_em)}</td><td className="border border-zinc-300 px-2 py-1.5 bg-white/60 font-black">{(m.tipo || '').toUpperCase()}</td><td className="border border-zinc-300 px-2 py-1.5 bg-white/60">{m.descricao || m.tipo}</td><td className={`border border-zinc-300 px-2 py-1.5 bg-white/60 text-right font-bold ${Number(m.valor) < 0? 'text-red-600' : 'text-green-700'}`}>{fmt(Number(m.valor))}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex mt-2 gap-2">
                    <div className="flex-1 border border-black/20 text-[10px]">
                        <div className="bg-black text-white font-bold flex"><div className="flex-1 px-2 py-1.5">RESUMO POR TIPO</div><div className="w-[50px] border-l border-zinc-600 text-center py-1.5">QTD</div><div className="w-[110px] border-l border-zinc-600 text-right pr-2 py-1.5">TOTAL</div></div>
                        {Object.entries(porTipo).map(([k, v]: any) => (<div key={k} className="flex border-t"><div className="flex-1 px-2 py-1 bg-white/60">{k}</div><div className="w-[50px] text-center py-1 border-l bg-white/60">{v.qtd}</div><div className="w-[110px] text-right pr-2 py-1 border-l bg-white/60">{fmt(v.total)}</div></div>))}
                    </div>
                    <div className="w-[280px] text-[11px] shrink-0">
                        <div className="flex border border-black/20"><div className="flex-1 px-2 py-2 text-right bg-zinc-100">Total Entradas</div><div className="w-[130px] border-l px-2 py-2 text-right font-bold text-green-700 bg-green-50">{fmt(entradas)}</div></div>
                        <div className="flex border border-black/20 border-t-0"><div className="flex-1 px-2 py-2 text-right bg-zinc-100">Total Saídas</div><div className="w-[130px] border-l px-2 py-2 text-right font-bold text-red-600 bg-red-50">{fmt(saidas)}</div></div>
                        <div className="flex border border-black/20 border-t-0"><div className="flex-1 px-2 py-2 text-right bg-zinc-100">Saldo Inicial</div><div className="w-[130px] border-l px-2 py-2 text-right bg-white">{fmt(saldoInicial)}</div></div>
                        <div className="flex border-2 border-black bg-black text-white font-black"><div className="flex-1 px-2 py-2.5 text-right">DIFERENÇA</div><div className="w-[130px] bg-white text-black border-l-2 border-black px-2 py-2.5 text-right">Kz {fmt(saldo)}</div></div>
                    </div>
                </div>
                <div className="mt-auto pt-4 border-t border-black flex justify-between text-[8px] font-bold"><span>J-OS • {inicio} a {fim} • {movs.length} movs</span><span>Pág 1/1</span></div>
            </div>
        </div>
    )
}
export default RelatorioCaixaPDF
