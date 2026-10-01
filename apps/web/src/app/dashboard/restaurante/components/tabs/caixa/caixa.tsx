"use client";
import { useEffect, useState } from "react";
import { Unlock, Lock, Clock, Plus, Minus, TrendingUp, TrendingDown } from "lucide-react";
import { CaixaModal } from "./modals/open_close";
import { SangriaModal } from "./modals/saida";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com";
const BASE = `${API_URL.replace(/\/$/, "")}/api/v1`;
async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    const d = await res.json().catch(() => ({})); if (!res.ok) throw d; return d;
}

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
function Contactless() { return (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white/80"><path d="M12 8.5C13.5 10 14.5 11.2 14.5 13C14.5 14.8 13.5 16 12 17.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" /><path d="M15 6.5C17.2 8.7 18.5 10.7 18.5 13C18.5 15.3 17.2 17.3 15 19.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" /><path d="M18.5 4C21.5 6.9 23 10 23 13C23 16 21.5 19.1 18.5 22" stroke="white" strokeWidth="1.6" strokeLinecap="round" /><circle cx="7.5" cy="13" r="2.2" fill="white" /></svg>) }

const fmt = (v: number) => Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function CaixaTab() {
    const [caixa, setCaixa] = useState<any>(null);
    const [extrato, setExtrato] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"abrir" | "fechar" | "forcar">("abrir");
    const [sangriaOpen, setSangriaOpen] = useState(false);
    const [sangriaTipo, setSangriaTipo] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");

    const fetchData = async () => {
        setLoading(true);
        try { const s = await apiFetch("/caixa/status"); if (s.aberto) { setCaixa(s.caixa_atual); setExtrato(await apiFetch("/caixa/extrato").catch(() => null)); } else { setCaixa(null); setExtrato(null); } }
        catch { toast.error("Erro ao carregar caixa"); } finally { setLoading(false) }
    };
    useEffect(() => { fetchData() }, []);
    if (loading) return <div className="bg-white rounded-[22px] p-8 animate-pulse h-[300px]" />;

    const aberto = !!caixa;
    const movs: any[] = extrato?.movimentos || [];

    // LÓGICA CORRETA - IGNORA BACKEND BUGADO
    const inicial = Number(extrato?.saldo_inicial ?? caixa?.saldo_inicial ?? 0);

    // ENTRADAS = SÓ VENDAS REAIS, NÃO ABERTURA, NÃO SUPRIMENTO
    const entradas = movs
        .filter((m: any) => {
            const tipo = (m.tipo || '').toUpperCase();
            const desc = (m.descricao || '').toLowerCase();
            const isVenda = tipo.includes('VENDA') || tipo === 'ENTRADA' || desc.includes('venda') || desc.includes('pedido');
            const isAbertura = tipo.includes('ABERT') || desc.includes('abertura') || desc.includes('inicial');
            return isVenda && !isAbertura && Number(m.valor) > 0;
        })
        .reduce((acc: any, m: any) => acc + Number(m.valor), 0);

    // SAIDAS = SÓ SANGRIA REAL (valor absoluto)
    const saidas = movs
        .filter((m: any) => {
            const tipo = (m.tipo || '').toUpperCase();
            const desc = (m.descricao || '').toLowerCase();
            return tipo.includes('SANGRIA') || tipo.includes('SAIDA') || desc.includes('sangria') || Number(m.valor) < 0;
        })
        .reduce((acc: any, m: any) => acc + Math.abs(Number(m.valor)), 0);

    // ATUAL CALCULADO NA MÃO - NÃO USA O DO BACKEND
    const atual = inicial + entradas - saidas;

    const nomeRestaurante = caixa?.restaurante_nome || caixa?.loja_nome || "J-OS RESTAURANTE";
    const dataAbertura = caixa?.aberto_em ? new Date(caixa.aberto_em).toLocaleDateString('pt-PT').slice(3) : "10/25";
    const horaAbertura = caixa?.aberto_em ? new Date(caixa.aberto_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : "08:15";

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-[24px] p-4 flex items-center justify-between border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${aberto ? 'bg-[#0CC06B] text-white' : 'bg-black text-white'}`}>{aberto ? <Unlock size={18} /> : <Lock size={18} />}</div>
                    <div><h2 className="font-black text-[13px] tracking-tight">{aberto ? 'Caixa Aberto' : 'Caixa Fechado'}</h2><p className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={11} />{aberto ? `${caixa.aberto_por_nome} • ${new Date(caixa.aberto_em).toLocaleString()}` : 'Abra o caixa'}</p></div>
                </div>
                {!aberto ? <button onClick={() => { setModalMode("abrir"); setModalOpen(true) }} className="px-6 py-2.5 bg-black text-white rounded-full text-[11px] font-black">Abrir Caixa</button> : <button onClick={() => { setModalMode("fechar"); setModalOpen(true) }} className="px-5 py-2 bg-white border rounded-full text-[11px] font-bold">Fechar</button>}
            </div>

            {aberto && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative h-[210px] rounded-[22px] bg-[#0B0B0B] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-[18px] flex flex-col justify-between">
                            <div className="absolute -right-10 top-0 w-[260px] h-[260px] bg-white/[0.07] rounded-[40px] rotate-12" />
                            <div className="relative flex justify-between"><div className="flex gap-1.5"><span className="text-white font-black text-[13px]">KZ</span><span>🇦🇴</span></div><span className="text-[#D4AF37] italic text-[16px]">premium</span></div>
                            <div className="flex gap-3"><ChipReal /><Contactless /></div>
                            <div><p className="text-white font-mono text-[18px] font-bold">KZ {fmt(atual)}</p>
                                <div className="flex gap-8 mt-2"><div><p className="text-[7px] text-white/40">MONTH/YEAR</p><p className="text-[10px] text-white/80">{dataAbertura}</p></div><div><p className="text-[7px] text-white/40">HORA</p><p className="text-[10px] text-white/80">{horaAbertura}</p></div></div>
                            </div>
                            <div className="flex justify-between items-end"><p className="text-white text-[11px] font-bold uppercase">{nomeRestaurante}</p><div className="flex -space-x-[10px]"><div className="w-7 h-7 rounded-full bg-[#EB001B]" /><div className="w-7 h-7 rounded-full bg-[#F79E1B]" /></div></div>
                        </div>

                        <div className="relative h-[210px] rounded-[22px] bg-gradient-to-br from-[#0B1F15] to-[#149256] overflow-hidden border border-white/10 p-[18px] flex flex-col justify-between">
                            <div className="absolute -right-10 top-0 w-[260px] h-[260px] bg-white/[0.06] rounded-[40px] rotate-12" />
                            <div className="relative flex justify-between"><span className="text-white font-black text-[12px]">ENTRADAS</span><span className="text-emerald-200/80 italic text-[15px]">influx</span></div>
                            <div className="flex gap-3"><ChipReal /><Contactless /></div>
                            <div><p className="text-white font-mono text-[18px] font-bold">+ KZ {fmt(entradas)}</p>
                                <div className="flex gap-8 mt-2"><p className="text-[9px] text-white/70">{entradas === 0 ? 'NENHUMA VENDA' : `${movs.filter((m: any) => Number(m.valor) > 0 && (m.tipo || '').includes('VENDA')).length} VENDAS`}</p></div>
                            </div>
                            <div className="flex justify-between"><p className="text-white text-[10px] font-bold uppercase">{nomeRestaurante}</p><p className="text-white/70 text-[9px]">mastercard.</p></div>
                        </div>

                        <div className="relative h-[210px] rounded-[22px] bg-gradient-to-br from-[#2A0A0A] to-[#B91C1C] overflow-hidden border border-white/10 p-[18px] flex flex-col justify-between">
                            <div className="absolute -right-10 top-0 w-[260px] h-[260px] bg-white/[0.06] rounded-[40px] rotate-12" />
                            <div className="relative flex justify-between"><span className="text-white font-black text-[12px]">SAIDAS</span><span className="text-red-200/80 italic text-[15px]">outflow</span></div>
                            <div className="flex gap-3"><ChipReal /><Contactless /></div>
                            <div><p className="text-white font-mono text-[18px] font-bold">- KZ {fmt(saidas)}</p></div>
                            <div className="flex justify-between"><p className="text-white text-[10px] font-bold uppercase">{nomeRestaurante}</p><p className="text-white/70 text-[9px]">mastercard.</p></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { setSangriaTipo("SANGRIA"); setSangriaOpen(true) }} className="h-[48px] bg-white border rounded-full text-[11px] font-black text-[#C62828] flex items-center justify-center gap-2"><Minus size={14} /> Sangria</button>
                        <button onClick={() => { setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true) }} className="h-[48px] bg-white border rounded-full text-[11px] font-black text-[#2E7D32] flex items-center justify-center gap-2"><Plus size={14} /> Suprimento</button>
                    </div>
                </>
            )}

            <div className="bg-white rounded-[24px] p-5 border shadow-sm"><h3 className="font-black text-[12px] mb-4">Extrato • {movs.length} movimentos</h3><div className="space-y-2 max-h-[420px] overflow-y-auto">{!movs.length ? <p className="text-[11px] text-gray-400 text-center py-10">Sem movimentos</p> : movs.map((m: any) => (<div key={m.id} className="flex items-center justify-between bg-[#F5F7FB] rounded-full px-4 py-3"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${Number(m.valor) > 0 ? 'bg-[#0CC06B]' : 'bg-[#E53935]'} text-white`}>{Number(m.valor) > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}</div><div><p className="text-[11px] font-bold">{m.descricao}</p><p className="text-[9px] text-gray-500">{m.tipo}</p></div></div><span className={`text-[12px] font-black ${Number(m.valor) > 0 ? 'text-[#0CC06B]' : 'text-[#E53935]'}`}>Kz {fmt(Number(m.valor))}</span></div>))}</div></div>

            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={caixa} onClose={() => setModalOpen(false)} onSuccess={() => { fetchData(); toast.success("Atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={() => setSangriaOpen(false)} onSuccess={() => { fetchData(); toast.success("Feito!"); }} />
        </div>
    )
}
