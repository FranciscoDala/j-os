import { useMemo } from 'react'
import RelatorioCaixaPDF from './pdf_RelatorioCaixa'
import { Menu, Download, Printer, Share2 } from 'lucide-react'

export default function RelatorioFolhaView({ extrato, inicio, fim, empresa, status, onVoltar }: any) {
    const empresaView = useMemo(() => {
        let e = empresa
        if (!e) { try { const c = localStorage.getItem("empresa_cache"); if (c) e = JSON.parse(c) } catch {} }
        if (e?.empresa) e = e.empresa
        if (e?.data?.empresa) e = e.data.empresa
        return e? {...e, logo: e.logo_url || e.image_url || e.logo || '', logo_url: e.logo_url || e.image_url || e.logo || '' } : { nome: 'J-OS RESTAURANTE', logo: '', logo_url: '' }
    }, [empresa])

    const handlePrint = () => {
        const wrapper = document.getElementById('relatorio-wrapper')
        if (!wrapper) return
        const w = window.open('', '', 'width=900,height=1200')
        if (!w) return
        w.document.write(`
          <html><head>
            <title>RELATORIO_${inicio}_a_${fim}</title>
            <link href="https://fonts.googleapis.com/css2?family=Zalando+Sans+Expanded:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page{size:A4;margin:0}
              *{font-family:'Zalando Sans Expanded',sans-serif!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
              html,body{margin:0;padding:0;background:white}
             .pagina-pdf{width:210mm!important;min-height:297mm!important;padding:10mm!important;page-break-after:always;break-after:page;margin:0 auto!important;box-shadow:none!important;border:none!important;position:relative!important}
            </style>
          </head><body>${wrapper.innerHTML}</body></html>
        `)
        w.document.close()
        setTimeout(() => { w.focus(); w.print(); }, 700)
    }

    return (
        <div className="fixed inset-0 z-[10000] bg-[#525659] overflow-y-auto overflow-x-auto">
            <style>{`
              #relatorio-wrapper{width:100%;display:flex;flex-direction:column;align-items:center;gap:24px;padding:24px 16px;background:transparent}
             .pagina-pdf{transform-origin:top center;box-shadow:0 10px 30px rgba(0,0,0,0.4);background:white;width:210mm;min-width:210mm;min-height:297mm}
              #relatorio-wrapper::-webkit-scrollbar{display:none}
              @media (max-width:768px){
                #relatorio-wrapper{padding:8px;gap:12px;width:100%;align-items:stretch}
               .pagina-pdf{width:100%!important;min-width:100%!important;max-width:100%!important;min-height:auto!important;padding:3mm!important;box-shadow:0 2px 8px rgba(0,0,0,0.15)!important}
              }
              @media print{.no-print{display:none!important}}
            `}</style>

            <div className="no-print sticky top-0 z-30 h-[44px] bg-[#323233] flex items-center justify-between px-2 text-white">
                <div className="flex items-center gap-2 min-w-0">
                    <button onClick={onVoltar} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded shrink-0"><Menu className="w-4 h-4" /></button>
                    <p className="text-[11px] md:text-[13px] font-bold uppercase truncate">RELATÓRIO {inicio} a {fim}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={onVoltar} className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded"><Share2 className="w-4 h-4" /></button>
                    <button onClick={handlePrint} className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded"><Download className="w-4 h-4" /></button>
                    <button onClick={handlePrint} className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded"><Printer className="w-4 h-4" /></button>
                </div>
            </div>

            <div id="relatorio-wrapper">
                <RelatorioCaixaPDF extrato={extrato} inicio={inicio} fim={fim} empresa={empresaView} status={status} />
            </div>
        </div>
    )
}
