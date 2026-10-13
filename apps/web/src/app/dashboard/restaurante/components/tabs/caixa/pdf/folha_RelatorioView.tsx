import RelatorioCaixaPDF from './pdf_RelatorioCaixa'
import { Menu, Download, Printer } from 'lucide-react'

export default function RelatorioFolhaView({ extrato, inicio, fim, empresa, status, onVoltar }: any) {
    const handlePrint = () => {
        const el = document.getElementById('relatorio-caixa-pdf')
        if (!el) return
        const paginas = el.querySelectorAll('.pagina-pdf')
        let html = ''
        paginas.forEach((p: any) => html += p.outerHTML)
        const w = window.open('', '', 'width=900,height=1200')
        if (!w) return
        w.document.write(`
          <html><head><title>RC_${inicio}_a_${fim}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>@page{size:A4;margin:0}*{ -webkit-print-color-adjust:exact; print-color-adjust:exact} body{margin:0}.pagina-pdf{width:210mm; min-height:297mm; padding:10mm; page-break-after:always; break-after:page}</style>
          </head><body>${html}</body></html>`)
        w.document.close()
        setTimeout(() => { w.focus(); w.print(); }, 700)
    }

    return (
        <div className="fixed inset-0 z-[10000] bg-[#525659] overflow-y-auto">
            <div className="sticky top-0 z-30 h-[44px] bg-[#323233] flex items-center justify-between px-3 text-white">
                <button onClick={onVoltar} className="h-8 px-3 bg-white/10 rounded-full text-[11px] font-bold flex items-center gap-2"><Menu className="w-4 h-4" /> FECHAR</button>
                <p className="text-[11px] font-black uppercase">RELATÓRIO {inicio} a {fim}</p>
                <button onClick={handlePrint} className="h-8 px-4 bg-white text-black rounded-full text-[11px] font-black flex items-center gap-2"><Printer className="w-4 h-4" /> IMPRIMIR {extrato?.movimentos?.length > 22? `(${Math.ceil(extrato.movimentos.length/22)} PÁGS)` : ''}</button>
            </div>
            <div className="flex flex-col items-center gap-6 py-6 px-2 md:px-0">
                <RelatorioCaixaPDF extrato={extrato} inicio={inicio} fim={fim} empresa={empresa} status={status} />
            </div>
        </div>
    )
}
