import { useMemo } from 'react'

const LogoDefault = ({ nome, size='small' }:any) => {
    const inicial=(nome||'T').charAt(0).toUpperCase()
    if(size==='large') return <div className="flex flex-col items-center opacity-[0.12]" style={{fontFamily:"var(--fonte-principal)"}}><div className="w-[550px] h-[550px] bg-[#1a5ca8] rounded-full flex items-center justify-center text-white font-black text-[220px]">{inicial}</div></div>
    return <div className="w-[110px] h-[90px] flex flex-col items-center justify-center shrink-0"><div className="w-[70px] h-[70px] bg-[#1a5ca8] rounded-full flex items-center justify-center text-white font-black text-[36px]">{inicial}</div><div className="mt-1 bg-[#1a5ca8] text-white text-[9px] font-bold px-2 py-[2px]">{(nome||'J-OS').toUpperCase().slice(0,10)}</div></div>
}

export default function RelatorioCaixaPDF({ extrato, inicio, fim, empresa, status }:any){
    const empresaRaw=useMemo(()=>{let e:any=empresa; if(!e){try{const c=localStorage.getItem("empresa_cache");if(c)e=JSON.parse(c)}catch{}} if(e?.empresa)e=e.empresa; if(e?.data?.empresa)e=e.data.empresa; return e||{}},[empresa])
    const emp={nome:empresaRaw?.nome||'J-OS Matriz',nif:empresaRaw?.nif||'500876654',endereco:empresaRaw?.endereco||'Lunda-Sul, saurimo',telefone:empresaRaw?.telefone||'940799954',email:empresaRaw?.email||'jenath@gmail.com',cidade:empresaRaw?.cidade||'Saurimo',logo:empresaRaw?.logo_url||empresaRaw?.image_url||empresaRaw?.logo||'',logo_url:empresaRaw?.logo_url||empresaRaw?.image_url||empresaRaw?.logo||''}
    const hasLogo=!!emp.logo && emp.logo.trim()!==''
    const mask=(v:string)=>v&&v.trim()!==''?v:'---'
    const normalize=(r:string)=>{const t=(r||'').toUpperCase(); if(t.includes('SANGRIA'))return'SAIDA'; if(t.includes('SUPRIMENTO'))return'ENTRADA'; return t}
    const {itensAll,totais,movs}=useMemo(()=>{
        const all=extrato?.movimentos||[]
        const fil=all.filter((m:any)=>{const tt=(m.tipo||'').toUpperCase(); return!tt.includes('ABERTURA')&&!tt.includes('FECHAMENTO')})
        const ent=fil.filter((m:any)=>{const tt=normalize(m.tipo); return tt==='ENTRADA'||tt==='VENDA'}).reduce((s:number,m:any)=>s+Number(m.valor||0),0)
        const sai=fil.filter((m:any)=>normalize(m.tipo)==='SAIDA').reduce((s:number,m:any)=>s+Math.abs(Number(m.valor||0)),0)
        const ini=Number(extrato?.saldo_inicial||0)
        const por:Record<string,{incidencia:number,valor:number}>={}
        fil.forEach((m:any)=>{const tt=normalize(m.tipo); if(!por[tt])por[tt]={incidencia:0,valor:0}; por[tt].incidencia++; por[tt].valor+=Math.abs(Number(m.valor||0))})
        const parsed=fil.map((m:any)=>{const dt=new Date(m.criado_em); return{ref:dt.toLocaleTimeString('pt-AO',{hour:'2-digit',minute:'2-digit'}), nome:m.descricao||normalize(m.tipo), tipo:normalize(m.tipo), valor:Math.abs(Number(m.valor||0))}})
        return{movs:fil,itensAll:parsed,totais:{ini,ent,sai,atual:ini+ent-sai,por}}
    },[extrato])
    const fmt=(n:number)=>Number(n).toLocaleString('pt-AO',{minimumFractionDigits:2,maximumFractionDigits:2})
    const fmtD=(d:any)=>d?new Date(d).toLocaleDateString('pt-AO'):'---'
    const fmtDH=(d:any)=>d?new Date(d).toLocaleString('pt-AO'):'---'
    const IT=20; const pags:any[][]=[]; for(let i=0;i<itensAll.length;i+=IT)pags.push(itensAll.slice(i,i+IT)); if(pags.length===0)pags.push([])

    const FolhaTela=({itens,pageIdx}:{itens:any[],pageIdx:number})=>{
        const isLast=pageIdx===pags.length-1; const isFirst=pageIdx===0
        return(
            <div className="pagina-pdf relative bg-white text-black w-[210mm] min-w-[210mm] min-h-[297mm] p-[10mm] flex flex-col border border-gray-200 overflow-hidden mx-auto" style={{fontFamily:"var(--fonte-principal)"}}>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">{hasLogo?<img src={emp.logo_url} alt="marca" className="w-[650px] h-[650px] object-contain opacity-[0.10]" />:<LogoDefault nome={emp.nome} size="large" />}</div>
                <div className="relative z-10 flex flex-col flex-1">
                    <div className="flex gap-3">{hasLogo?<img src={emp.logo} className="w-[110px] h-[90px] object-contain shrink-0" alt="logo" />:<LogoDefault nome={emp.nome} />}<div className="text-[11px] leading-[15px]"><p className="font-bold text-[14px]">{mask(emp.nome)}</p><p>NIF: {mask(emp.nif)}</p><p>Endereço: {mask(emp.endereco)}</p><p>Contactos: {mask(emp.telefone)}</p><p>Email: {mask(emp.email)}</p><p>{mask(emp.cidade)}</p></div></div>
                    <div className="flex justify-between items-start mt-6 border-b border-dotted border-gray-300 pb-3"><div className="text-[9px] leading-[13px] max-w-[300px]"><p className="font-bold text-[12px]">RELATÓRIO DE CAIXA</p><p className="mt-1">Período: {inicio} a {fim}</p><p>Moeda: AKZ</p><p>Movimentos: {movs.length} • Pág {pageIdx+1}/{pags.length}</p></div><div className="flex gap-3 items-start"><div className="text-right leading-[14px]"><p className="font-bold text-[12px]">ORIGINAL</p><p className="text-[10px] mt-1">Emissão: {fmtDH(new Date().toISOString())}</p><p className="text-[10px]">Período: {inicio} a {fim}</p></div></div></div>
                    {isFirst&&<><div className="mt-6 flex justify-between"><div className="w-[60%] text-[12px] leading-[16px]"><p className="font-bold text-[13px]">Resumo Período:</p><p className="font-bold">De {fmtD(inicio)} até {fmtD(fim)}</p><p>Saldo Inicial: Kz {fmt(totais.ini)}</p><p>Total Movimentos: {movs.length}</p><p>Operador: {status?.caixa_atual?.aberto_por_nome||'Admin Jenath'}</p></div><div className="text-right"><p className="text-[9px] text-[#666]">Processado por programa validado 83/AGT/2019</p></div></div><div className="mt-4 grid grid-cols-[90px_95px_95px_125px_115px_1fr] gap-[5px]">{[{k:'CÓD. CAIXA',v:status?.caixa_atual?.id?.slice(0,8)||'f9a831ea'},{k:'DATA INÍCIO',v:fmtD(inicio)},{k:'DATA FIM',v:fmtD(fim)},{k:'QTD MOVS',v:movs.length},{k:'SALDO INICIAL',v:`Kz ${fmt(totais.ini)}`},{k:'OPERADOR',v:status?.caixa_atual?.aberto_por_nome?.slice(0,10)||'Admin Jena'}].map(b=><div key={b.k} className="border border-[#bbb] py-[5px] px-1 bg-[rgba(255,255,255,0.40)]"><p className="font-bold text-[10px] truncate">{b.k}</p><p className="text-center text-[11px] mt-[2px] truncate">{b.v}</p></div>)}</div></>}
                    <div className="w-full mt-2 overflow-x-auto no-scrollbar"><table className="w-full border-collapse table-auto min-w-[720px]"><colgroup><col style={{width:'68px'}}/><col style={{width:'auto'}}/><col style={{width:'56px'}}/><col style={{width:'90px'}}/><col style={{width:'118px'}}/></colgroup><thead><tr className="bg-[rgba(194,194,194,0.65)] text-[10.5px] font-bold"><th className="border border-[#999] py-[7px] px-2 text-left">HORA</th><th className="border border-[#999] py-[7px] px-2 text-left">DESCRIÇÃO</th><th className="border border-[#999] py-[7px] px-1 text-center">QTD.</th><th className="border border-[#999] py-[7px] px-1 text-center">TIPO</th><th className="border border-[#999] py-[7px] px-2 text-right">VALOR (KZ)</th></tr></thead><tbody>{itens.length===0?<tr><td colSpan={5} className="border border-[#bbb] py-10 text-center text-[11px] text-gray-400">Sem movimentos</td></tr>:itens.map((it:any,i:number)=><tr key={i} className="text-[11px]"><td className="border border-[#bbb] px-2 py-[6px] bg-[rgba(255,255,255,0.40)] whitespace-nowrap">{it.ref}</td><td className="border border-[#bbb] px-2 py-[6px] bg-[rgba(255,255,255,0.40)] whitespace-normal break-words leading-[14px]">{it.nome}</td><td className="border border-[#bbb] text-center px-1 py-[6px] bg-[rgba(255,255,255,0.40)]">1</td><td className="border border-[#bbb] text-center px-1 py-[6px] bg-[rgba(255,255,255,0.40)] font-bold text-[10px]">{it.tipo}</td><td className="border border-[#bbb] text-right px-2 py-[6px] bg-[rgba(255,255,255,0.40)] font-semibold whitespace-nowrap">{fmt(it.valor)}</td></tr>)}</tbody></table></div>
                    {isLast&&<div className="flex mt-2 gap-1"><div className="flex-1 border border-[#999] min-w-0 overflow-hidden"><div className="flex bg-[rgba(194,194,194,0.65)] text-[11px] font-bold"><div className="flex-1 border-r border-[#999] py-[6px] px-1">TIPO MOVIMENTO</div><div className="w-[50px] border-r border-[#999] py-[6px] text-center shrink-0">QTD</div><div className="w-[125px] py-[6px] text-center shrink-0">VALOR</div></div>{Object.entries(totais.por).map(([k,v]:any)=><div key={k} className="flex text-[11px]"><div className="flex-1 border-r border-[#999] py-[6px] px-1 bg-[rgba(255,255,255,0.40)] truncate">{k}</div><div className="w-[50px] border-r border-[#999] py-[6px] text-center bg-[rgba(255,255,255,0.40)] shrink-0">{v.incidencia}</div><div className="w-[125px] py-[6px] text-right pr-2 bg-[rgba(255,255,255,0.40)] shrink-0 font-bold whitespace-nowrap">{fmt(v.valor)}</div></div>)}</div><div className="w-[300px] shrink-0"><div className="flex bg-[rgba(194,194,194,0.65)] text-[11px] border border-[#999]"><div className="flex-1 py-[7px] px-2 text-right">Total Entradas</div><div className="w-[135px] bg-[rgba(255,255,255,0.55)] border-l border-[#999] py-[7px] text-right pr-2 font-bold text-green-700 whitespace-nowrap">{fmt(totais.ent)}</div></div><div className="flex bg-[rgba(194,194,194,0.65)] text-[11px] border border-[#999] border-t-0"><div className="flex-1 py-[7px] px-2 text-right">Total Saidas</div><div className="w-[135px] bg-[rgba(255,255,255,0.55)] border-l border-[#999] py-[7px] text-right pr-2 font-bold text-red-600 whitespace-nowrap">{fmt(totais.sai)}</div></div><div className="flex bg-[rgba(194,194,194,0.65)] text-[11px] border border-[#999] border-t-0"><div className="flex-1 py-[7px] px-2 text-right">Saldo Inicial</div><div className="w-[135px] bg-[rgba(255,255,255,0.55)] border-l border-[#999] py-[7px] text-right pr-2 whitespace-nowrap">{fmt(totais.ini)}</div></div><div className="flex text-[11px] font-bold border border-[#999] border-t-0 bg-[rgba(194,194,194,0.75)]"><div className="flex-1 py-[7px] px-2 text-right">SALDO ATUAL</div><div className="w-[135px] bg-white border-l border-[#999] py-[7px] text-right pr-2 font-bold whitespace-nowrap">Kz {fmt(totais.atual)}</div></div></div></div>}
                    <div className="mt-auto border-t border-black flex justify-between items-center bg-[rgba(255,255,255,0.40)] px-1 pt-3"><span className="text-[9px] font-bold">{mask(emp.nome)} • Período {inicio} a {fim} • Pág {pageIdx+1}/{pags.length}</span><span className="text-[9px] font-bold">Pág. {pageIdx+1} de {pags.length}</span></div>
                </div>
            </div>
        )
    }

    return(
        <>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Zalando+Sans+Expanded:ital,wght@0,200..900;1,200..900&display=swap');
              #relatorio-wrapper{display:flex;flex-direction:column;align-items:center;width:100%;gap:24px;background:transparent}
            .pagina-pdf{transform-origin:top center}
           .no-scrollbar::-webkit-scrollbar{display:none}
           .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
              @media (max-width:768px){
                #relatorio-wrapper{overflow-x:hidden!important;width:100%!important;gap:0!important;display:block!important}
              .pagina-pdf{transform:scale(0.42);transform-origin:top center;margin-bottom:-58%!important;width:210mm!important;min-width:210mm!important;display:block!important;margin-left:auto!important;margin-right:auto!important}
              .pagina-pdf:last-child{margin-bottom:0!important}
              }
            `}</style>
            {pags.map((itens,idx)=><FolhaTela key={idx} itens={itens} pageIdx={idx} />)}
        </>
    )
}
