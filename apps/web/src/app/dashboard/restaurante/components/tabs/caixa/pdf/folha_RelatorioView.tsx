import RelatorioCaixaPDF from './pdf_RelatorioCaixa'
import { Menu, Download, Printer, Share2 } from 'lucide-react'

export default function RelatorioFolhaView({ extrato, inicio, fim, empresa, status, onVoltar }: any) {
    const handlePrint = () => {
        const el = document.getElementById('fatura-pdf')
        if (!el) return
        const w = window.open('', '', 'width=900,height=1200')
        if (!w) return
        w.document.write(`
          <html><head><title>Relatorio_${inicio}_a_${fim}</title>
            <link href="https://fonts.googleapis.com/css2?family=Zalando+Sans+Expanded:wght@400;700;900&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>@page{size:A4;margin:0}*{font-family:'Zalando Sans Expanded',sans-serif!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;padding:0;background:white;width:210mm;min-height:297mm}#fatura-pdf{width:210mm!important;min-width:210mm!important;min-height:297mm!important;transform:none!important;margin:0!important;box-shadow:none!important;border:none!important;padding:10mm!important}</style>
          </head><body>${el.outerHTML}</body></html>`)
        w.document.close()
        setTimeout(() => { w.focus(); w.print(); }, 700)
    }

    return (
        <div className="fixed inset-0 z-[10000] bg-[#525659] overflow-y-auto overflow-x-hidden">
            <style>{`
              #fatura-pdf-wrapper{width:100%;display:flex;justify-content:center;padding:24px 16px}
              #fatura-pdf{transform-origin:top center;box-shadow:0 10px 30px rgba(0,0,0,0.4)}
              @media (max-width:768px){#fatura-pdf{transform:scale(0.42);margin-bottom:-58%}#fatura-pdf-wrapper{padding:0;display:block}}
            `}</style>
            <div className="sticky top-0 z-30 h-[44px] bg-[#323233] flex items-center justify-between px-2 text-white">
                <div className="flex items-center gap-2">
                    <button onClick={onVoltar} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded"><Menu className="w-4 h-4" /></button>
                    <p className="text-[11px] md:text-[13px] font-bold uppercase">RELATÓRIO {inicio} a {fim}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={handlePrint} className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded"><Download className="w-4 h-4" /></button>
                    <button onClick={handlePrint} className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded"><Printer className="w-4 h-4" /></button>
                </div>
            </div>
            <div id="fatura-pdf-wrapper">
                <RelatorioCaixaPDF extrato={extrato} inicio={inicio} fim={fim} empresa={empresa} status={status} />
            </div>
        </div>
    )
}
