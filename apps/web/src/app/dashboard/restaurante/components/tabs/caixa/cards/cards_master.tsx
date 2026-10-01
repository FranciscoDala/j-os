"use client";

function ChipReal() {
    return (
        <div className="relative w-[40px] h-[30px] rounded-[4px] bg-gradient-to-b from-[#FFE9A6] via-[#D8A44A] to-[#8C5E16] p-[1px] shadow-sm">
            <div className="w-full h-full rounded-[3px] bg-gradient-to-br from-[#FFED8C] to-[#B07D25] relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-around py-[2px]"><div className="h-[1px] bg-black/20" /><div className="h-[1px] bg-black/20" /></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-black/20" />
                <div className="absolute left-[11px] top-1/2 -translate-y-1/2 w-[14px] h-[15px] rounded-[3px] border border-black/30 bg-white/20" />
            </div>
        </div>
    )
}

function Contactless() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white/90">
            <path d="M12 8.5C13.5 10 14.5 11.2 14.5 13C14.5 14.8 13.5 16 12 17.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M15 6.5C17.2 8.7 18.5 10.7 18.5 13C18.5 15.3 17.2 17.3 15 19.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="7.5" cy="13" r="2" fill="white" />
        </svg>
    )
}

const fmt = (v: number) => Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function MasterCard({ atual, nomeRestaurante, dataAbertura, horaAbertura }: { atual: number, nomeRestaurante: string, dataAbertura: string, horaAbertura: string }) {
    return (
        <div className="relative h-[190px] rounded-[18px] bg-[#0B0B0B] overflow-hidden border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.5)] p-[16px] flex flex-col justify-between">
            <div className="absolute -right-10 top-0 w-[260px] h-[260px] bg-white/[0.05] rounded-[40px] rotate-12" />
            <div className="relative flex justify-between items-start">
                <div className="flex items-center gap-1"><span className="text-white font-black text-[12px] tracking-widest">KZ</span><span className="text-[8px] text-white/40">AO</span></div>
                <span className="text-[#D4AF37] italic text-[12px] font-bold">premium</span>
            </div>
            <div className="relative flex items-center gap-2.5 mt-1"><ChipReal /><Contactless /></div>
            <div className="relative">
                <p className="text-white font-mono text-[14px] font-bold tracking-wide">KZ {fmt(atual)}</p>
                <div className="flex gap-6 mt-[8px]">
                    <div><p className="text-[7px] text-white/40 tracking-widest font-bold">MONTH/YEAR</p><p className="text-[9px] text-white/90 font-bold mt-[2px]">{dataAbertura}</p></div>
                    <div><p className="text-[7px] text-white/40 tracking-widest font-bold">HORA ABERTURA</p><p className="text-[9px] text-white/90 font-bold mt-[2px]">{horaAbertura}</p></div>
                    <div className="ml-auto text-right"><p className="text-[6px] text-white/40 tracking-widest">DEBIT CARD</p><p className="text-[8px] text-white font-black mt-[2px]">CAIXA • MASTER</p></div>
                </div>
            </div>
            <div className="relative flex justify-between items-end mt-1">
                <p className="text-white text-[10px] font-black tracking-[0.08em] uppercase">{nomeRestaurante}</p>
                <div className="flex flex-col items-center">
                    <div className="flex -space-x-[8px]"><div className="w-6 h-6 rounded-full bg-[#EB001B]" /><div className="w-6 h-6 rounded-full bg-[#F79E1B]" /></div>
                    <p className="text-white/60 text-[7px] mt-1">mastercard.</p>
                </div>
            </div>
        </div>
    )
}

export function EntradasCard({ entradas, nome, dataHoje, qtdVendas }: { entradas: number, nome: string, dataHoje: string, qtdVendas: number }) {
    return (
        <div className="relative h-[190px] rounded-[18px] bg-gradient-to-br from-[#0D2818] via-[#1A5C34] to-[#2D7A4A] overflow-hidden border border-white/10 p-[16px] flex flex-col justify-between">
            <div className="absolute -right-10 top-0 w-[260px] h-[260px] bg-white/[0.06] rounded-[40px] rotate-12" />
            <div className="relative flex justify-between"><span className="text-white font-black text-[11px] tracking-widest">ENTRADAS</span><span className="text-white/60 italic text-[11px]">influx</span></div>
            <div className="flex gap-2.5"><ChipReal /><Contactless /></div>
            <div>
                <p className="text-white font-mono text-[14px] font-bold">+ KZ {fmt(entradas)}</p>
                <div className="flex gap-6 mt-[8px]">
                    <div><p className="text-[7px] text-white/60 font-bold">HOJE</p><p className="text-[9px] text-white font-bold mt-[2px]">{dataHoje}</p></div>
                    <div><p className="text-[7px] text-white/60 font-bold">VENDAS</p><p className="text-[9px] text-white font-bold mt-[2px]">{qtdVendas} MOVS</p></div>
                </div>
            </div>
            <div className="flex justify-between items-end"><p className="text-white text-[10px] font-black uppercase">{nome}</p><p className="text-white/60 text-[7px]">mastercard.</p></div>
        </div>
    )
}

export function SaidasCard({ saidas, nome, hora, retirado }: { saidas: number, nome: string, hora: string, retirado: string }) {
    return (
        <div className="relative h-[190px] rounded-[18px] bg-gradient-to-br from-[#2A0A0A] via-[#7A1F1F] to-[#B91C1C] overflow-hidden border border-white/10 p-[16px] flex flex-col justify-between">
            <div className="absolute -right-10 top-0 w-[260px] h-[260px] bg-white/[0.06] rounded-[40px] rotate-12" />
            <div className="relative flex justify-between"><span className="text-white font-black text-[11px] tracking-widest">SAIDAS</span><span className="text-white/60 italic text-[11px]">outflow</span></div>
            <div className="flex gap-2.5"><ChipReal /><Contactless /></div>
            <div>
                <p className="text-white font-mono text-[14px] font-bold">- KZ {fmt(saidas)}</p>
                <div className="flex gap-6 mt-[8px]">
                    <div><p className="text-[7px] text-white/60 font-bold">RETIRADO</p><p className="text-[9px] text-white font-bold mt-[2px]">{retirado}</p></div>
                    <div><p className="text-[7px] text-white/60 font-bold">HORA</p><p className="text-[9px] text-white font-bold mt-[2px]">{hora}</p></div>
                </div>
            </div>
            <div className="flex justify-between items-end"><p className="text-white text-[10px] font-black uppercase">{nome}</p><p className="text-white/60 text-[7px]">mastercard.</p></div>
        </div>
    )
}
