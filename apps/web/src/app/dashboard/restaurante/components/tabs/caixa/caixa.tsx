"use client";
import { useEffect, useState } from "react";
import { Unlock, Lock, Clock, Plus, Minus, TrendingUp, TrendingDown } from "lucide-react";
import { CaixaModal } from "./modals/open_close";
import { SangriaModal } from "./modals/saida";
import { MasterCard, EntradasCard, SaidasCard } from "./cards/cards_master";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com";
const BASE = `${API_URL.replace(/\/$/, "")}/api/v1`;
async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    const d = await res.json().catch(() => ({})); if (!res.ok) throw d; return d;
}
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
    const inicial = Number(extrato?.saldo_inicial ?? caixa?.saldo_inicial ?? 0);
    const entradas = movs.filter((m: any) => {
        const tipo = (m.tipo || '').toUpperCase();
        const desc = (m.descricao || '').toLowerCase();
        const isVenda = tipo.includes('VENDA') || tipo === 'ENTRADA' || desc.includes('venda');
        const isAbertura = tipo.includes('ABERT') || desc.includes('abertura');
        return isVenda && !isAbertura && Number(m.valor) > 0;
    }).reduce((acc: any, m: any) => acc + Number(m.valor), 0);
    const saidas = movs.filter((m: any) => m.tipo?.toUpperCase().includes('SANGRIA') || Number(m.valor) < 0).reduce((acc: any, m: any) => acc + Math.abs(Number(m.valor)), 0);
    const atual = inicial + entradas - saidas;

    const nomeRestaurante = caixa?.restaurante_nome || "J-OS RESTAURANTE";
    const dataAbertura = caixa?.aberto_em ? new Date(caixa.aberto_em).toLocaleDateString('pt-PT').slice(3) : "10/25";
    const horaAbertura = caixa?.aberto_em ? new Date(caixa.aberto_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : "08:15";
    const qtdVendas = movs.filter((m: any) => (m.tipo || '').toUpperCase().includes('VENDA')).length;

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-[24px] p-4 flex items-center justify-between border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${aberto ? 'bg-[#0CC06B] text-white' : 'bg-black text-white'}`}>{aberto ? <Unlock size={18} /> : <Lock size={18} />}</div>
                    <div><h2 className="font-black text-[13px]">{aberto ? 'Caixa Aberto' : 'Caixa Fechado'}</h2><p className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={11} />{aberto ? `${caixa.aberto_por_nome} • ${new Date(caixa.aberto_em).toLocaleString()}` : 'Abra o caixa'}</p></div>
                </div>
                {!aberto ? <button onClick={() => { setModalMode("abrir"); setModalOpen(true) }} className="px-6 py-2.5 bg-black text-white rounded-full text-[11px] font-black">Abrir Caixa</button> : <button onClick={() => { setModalMode("fechar"); setModalOpen(true) }} className="px-5 py-2 bg-white border rounded-full text-[11px] font-bold">Fechar</button>}
            </div>

            {aberto && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MasterCard atual={atual} nomeRestaurante={nomeRestaurante} dataAbertura={dataAbertura} horaAbertura={horaAbertura} />
                        <EntradasCard entradas={entradas} nome={nomeRestaurante} qtdVendas={qtdVendas} />
                        <SaidasCard saidas={saidas} nome={nomeRestaurante} />
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
