"use client";

const fmt = (v: number) => Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function GraficoVendas({ vendasPorDia, filtro }: { vendasPorDia: any[], filtro: string }) {
    if (vendasPorDia.length === 0) {
        return (
            <div className="h-[170px] flex items-center justify-center text-[11px] text-zinc-400 border border-dashed rounded-[16px] bg-[#FFFEFB]">
                Sem vendas no período {filtro} - {new Date().toLocaleDateString()}
            </div>
        );
    }

    const maxFaturamento = Math.max(...vendasPorDia.map((d: any) => d.total), 1);
    const maxPedidos = Math.max(...vendasPorDia.map((d: any) => d.qtd), 1);
    const maior = vendasPorDia.reduce((a: any, b: any) => a.total > b.total? a : b);
    const menor = vendasPorDia.reduce((a: any, b: any) => a.total < b.total? a : b);

    const width = 300;
    const height = 146;
    const stepX = vendasPorDia.length > 1? width / (vendasPorDia.length - 1) : width;

    const pointsFaturamento = vendasPorDia.map((d: any, i: number) => {
        const x = i * stepX;
        const y = height - (d.total / maxFaturamento) * (height - 20) - 10;
        return `${x},${y}`;
    }).join(" ");

    const pointsPedidos = vendasPorDia.map((d: any, i: number) => {
        const x = i * stepX;
        const y = height - (d.qtd / maxPedidos) * (height - 20) - 10;
        return `${x},${y}`;
    }).join(" ");

    const pointsTicket = vendasPorDia.map((d: any, i: number) => {
        const x = i * stepX;
        const maxTicket = Math.max(...vendasPorDia.map((x: any) => x.ticket), 1);
        const y = height - (d.ticket / maxTicket) * (height - 20) - 10;
        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="space-y-4">
            {/* LEGENDA + MAX/MIN */}
            <div className="flex flex-wrap gap-2 text-[10px] font-bold tracking-widest">
                <span className="flex items-center gap-1.5 text-zinc-500"><span className="w-2.5 h-2.5 rounded-full bg-[#8B6A5A]" /> FATURAMENTO</span>
                <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-[#9B8B7F]" /> PEDIDOS</span>
                <span className="flex items-center gap-1.5 text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-zinc-200" /> TICKET</span>
                <span className="ml-auto text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-black">↑ Alta: {maior.diaLabel} Kz {fmt(maior.total)}</span>
                <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-black">↓ Baixa: {menor.diaLabel} Kz {fmt(menor.total)}</span>
            </div>

            {/* GRAFICO DE LINHA COM DIAS REAIS */}
            <div className="relative h-[170px]">
                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-zinc-400 w-10 text-right pr-2">
                    <span>{fmt(maxFaturamento)}</span>
                    <span>{fmt(maxFaturamento / 2)}</span>
                    <span>0</span>
                </div>
                <svg className="absolute left-12 right-0 top-0 bottom-6 w-[calc(100%-48px)] h-[146px]" viewBox={`0 0 ${width} ${height}`}>
                    {[0, 36, 73, 109, 146].map(y => <line key={y} x1="0" x2={width} y1={y} y2={y} stroke="#F5F2EF" strokeWidth="1" />)}
                    <polyline fill="none" stroke="#8B6A5A" strokeWidth="2.5" points={pointsFaturamento} strokeLinecap="round" strokeLinejoin="round" />
                    <polyline fill="none" stroke="#6B5B54" strokeWidth="2" strokeDasharray="4 4" points={pointsPedidos} />
                    <polyline fill="none" stroke="#E5DDD6" strokeWidth="2" points={pointsTicket} />
                    {vendasPorDia.map((d: any, i: number) => {
                        const x = i * stepX;
                        const y = height - (d.total / maxFaturamento) * (height - 20) - 10;
                        const isMax = d.dia === maior.dia;
                        const isMin = d.dia === menor.dia;
                        return (
                            <g key={i}>
                                <circle cx={x} cy={y} r={isMax || isMin? 5 : 3} fill={isMax? "#16a34a" : isMin? "#dc2626" : "#8B6A5A"} stroke="white" strokeWidth="2" />
                                <title>{d.diaLabel}: Kz {fmt(d.total)} - {d.qtd} pedidos - ticket Kz {fmt(d.ticket)}</title>
                            </g>
                        )
                    })}
                </svg>
                <div className="absolute bottom-0 left-12 right-0 flex justify-between text-[10px] font-bold text-zinc-500">
                    {vendasPorDia.map((d: any) => <span key={d.dia} className={`${d.dia === maior.dia? "text-green-600" : d.dia === menor.dia? "text-red-500" : ""} truncate max-w-[60px]`}>{d.diaLabel}</span>)}
                </div>
            </div>

            {/* SEGUNDO GRAFICO - BARRAS FACIL DE LER - MAIS ALTA PARA MAIS BAIXA */}
            <div className="pt-3 border-t border-zinc-100">
                <div className="text-[10px] font-black tracking-widest text-zinc-500 mb-2">VENDAS POR DIA - ORDENADO POR FATURAMENTO</div>
                <div className="space-y-1.5">
                    {[...vendasPorDia].sort((a, b) => b.total - a.total).slice(0, 5).map((d: any) => {
                        const pct = (d.total / maxFaturamento) * 100;
                        const isMax = d.dia === maior.dia;
                        return (
                            <div key={d.dia} className="flex items-center gap-2 text-[11px]">
                                <span className="w-14 font-bold text-zinc-500">{d.diaLabel}</span>
                                <div className="flex-1 h-7 bg-[#F6F3F0] rounded-full overflow-hidden relative">
                                    <div className={`h-full rounded-full transition-all ${isMax? "bg-[#8B6A5A]" : "bg-[#C4B5AB]"}`} style={{ width: `${pct}%` }} />
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-white drop-shadow">Kz {fmt(d.total)}</span>
                                </div>
                                <span className="w-12 text-right font-bold text-zinc-400">{d.qtd} ped.</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
