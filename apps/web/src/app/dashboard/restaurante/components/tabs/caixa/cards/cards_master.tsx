"use client";

function ChipReal() {
    return (
        <div className="relative w-[46px] h-[34px] rounded-[5px] bg-gradient-to-b from-[#FFE9A6] via-[#D8A44A] to-[#8C5E16] p-[1px] shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            <div className="w-full h-full rounded-[4px] bg-gradient-to-br from-[#FFED8C] to-[#B07D25] relative overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-around py-[2px]"><div className="h-[1px] bg-black/20" /><div className="h-[1px] bg-black/20" /></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-black/20" />
                <div className="absolute left-[13px] top-1/2 -translate-y-1/2 w-[16px] h-[18px] rounded-[4px] border border-black/30 bg-white/20" />
            </div>
        </div>
    )
}

function Contactless() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white/80">
            <path d="M12 8.5C13.5 10 14.5 11.2 14.5 13C14.5 14.8 13.5 16 12 17.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M15 6.5C17.2 8.7 18.5 10.7 18.5 13C18.5 15.3 17.2 17.3 15 19.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M18.5 4C21.5 6.9 23 10 23 13C23 16 21.5 19.1 18.5 22" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="7.5" cy="13" r="2.2" fill="white" />
        </svg>
    )
}

const fmt = (v: number) => Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// CARD PRETO - NA GAVETA
export function MasterCard({ atual, nomeRestaurante, dataAbertura, horaAbertura }: { atual: number, nomeRestaurante: string, dataAbertura: string, horaAbertura: string }) {
    return (
        <div className="relative h-[210px] rounded-[22px] bg-[#0B0B0B] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-[18px] flex flex-col justify-between">
            <div className="absolute -right-10 top-0 w-[260px] h-[260px] bg-white/[0.07] rounded-[40px] rotate-12" />
            <div className="relative flex justify-between"><div className="flex gap-1.5"><span className="text-white font-black text-[13px]">KZ</span><span>🇦🇴</span></div><span className="text-[#D4AF37] italic text-[16px]">premium</span></div>
            <div className="flex gap-3"><ChipReal /><Contactless /></div>
            <div>
                <p className="text-white font-mono text-[18px] font-bold">KZ {fmt(atual)}</p>
                <div className="flex gap-8 mt-2">
                    <div><p className="text-[7px] text-white/40">MONTH/YEAR</p><p className="text-[10px] text-white/80">{dataAbertura}</p></div>
                    <div><p className="text-[7px] text-white/40">HORA</p><p className="text-[10px] text-white/80">{horaAbertura}</p></div>
                </div>
            </div>
            <div className="flex justify-between items-end">
                <p className="text-white text-[11px] font-bold uppercase truncate max-w-[65%]">{nomeRestaurante}</p>
                <div className="flex -space-x-[10px]"><div className="w-7 h-7 rounded-full bg-[#EB001B]" /><div className="w-7 h-7 rounded-full bg-[#F79E1B]" /></div>
            </div>
        </div>
    )
}

// CARD VERDE - ENTRADAS
export function EntradasCard({ entradas, nome, qtdVendas }: { entradas: number, nome: string, qtdVendas: number }) {
    return (
        <div className="relative h-[210px] rounded-[22px] bg-gradient-to-br from-[#0B1F15] to-[#149256] overflow-hidden border border-white/10 p-[18px] flex flex-col justify-between">
            <div className="absolute -right-10 top-0 w-[260px] h-[260px] bg-white/[0.06] rounded-[40px] rotate-12" />
            <div className="relative flex justify-between"><span className="text-white font-black text-[12px]">ENTRADAS</span><span className="text-emerald-200/80 italic text-[15px]">influx</span></div>
            <div className="flex gap-3"><ChipReal /><Contactless /></div>
            <div>
                <p className="text-white font-mono text-[18px] font-bold">+ KZ {fmt(entradas)}</p>
                <p className="text-[9px] text-white/70 mt-2">{entradas === 0 ? 'NENHUMA VENDA' : `${qtdVendas} VENDAS`}</p>
            </div>
            <div className="flex justify-between"><p className="text-white text-[10px] font-bold uppercase truncate max-w-[60%]">{nome}</p><p className="text-white/70 text-[9px]">mastercard.</p></div>
        </div>
    )
}

// CARD VERMELHO - SAIDAS
export function SaidasCard({ saidas, nome }: { saidas: number, nome: string }) {
    return (
        <div className="relative h-[210px] rounded-[22px] bg-gradient-to-br from-[#2A0A0A] to-[#B91C1C] overflow-hidden border border-white/10 p-[18px] flex flex-col justify-between">
            <div className="absolute -right-10 top-0 w-[260px] h-[260px] bg-white/[0.06] rounded-[40px] rotate-12" />
            <div className="relative flex justify-between"><span className="text-white font-black text-[12px]">SAIDAS</span><span className="text-red-200/80 italic text-[15px]">outflow</span></div>
            <div className="flex gap-3"><ChipReal /><Contactless /></div>
            <div><p className="text-white font-mono text-[18px] font-bold">- KZ {fmt(saidas)}</p></div>
            <div className="flex justify-between"><p className="text-white text-[10px] font-bold uppercase truncate max-w-[60%]">{nome}</p><p className="text-white/70 text-[9px]">mastercard.</p></div>
        </div>
    )
}
