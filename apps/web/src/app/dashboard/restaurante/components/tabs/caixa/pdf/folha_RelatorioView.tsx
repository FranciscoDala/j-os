"use client";
import RelatorioCaixaPDF from './pdf_RelatorioCaixa'
export default function RelatorioFolhaView({ extrato, inicio, fim, empresa, status, onVoltar }: any) {
    const handlePrint = () => {
        const el = document.getElementById('relatorio-caixa-pdf'); if (!el) return
        const w = window.open('', '', 'width=900,height=1200'); if (!w) return
        w.document.write(`<html><head><title>Relatorio_${inicio}_a_${fim}</title><script src="https://cdn.tailwindcss.com"></script><style>@page{size:A4;margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;padding:0}</style></head><body>${el.outerHTML}<script>window.onload=()=>{setTimeout(()=>{window.print()},500)}</script></body></html>`)
        w.document.close()
    }
    return (
        <div className="fixed inset-0 z-[99999] bg-[#525659] overflow-y-auto">
            <style>{`#relatorio-wrapper{display:flex;justify-content:center;padding:20px} #relatorio-caixa-pdf{box-shadow:0 10px 40px rgba(0,0,0,.5)} @media(max-width:768px){#relatorio-caixa-pdf{transform:scale(0.42);transform-origin:top center;margin-bottom:-58%}#relatorio-wrapper{padding:0;display:block}}`}</style>
            <div className="sticky top-0 z-10 h-[48px] bg-[#323233] flex items-center justify-between px-3 text-white">
                <button onClick={onVoltar} className="h-8 px-3 bg-white/10 rounded-full text-[11px] font-bold">✕ FECHAR</button>
                <p className="text-[11px] font-black uppercase">RELATÓRIO {inicio} a {fim}</p>
                <button onClick={handlePrint} className="h-8 px-4 bg-white text-black rounded-full text-[11px] font-black">IMPRIMIR</button>
            </div>
            <div id="relatorio-wrapper"><RelatorioCaixaPDF extrato={extrato} inicio={inicio} fim={fim} empresa={empresa} status={status} /></div>
        </div>
    )
}
