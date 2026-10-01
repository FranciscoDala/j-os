"use client";
import { useEffect, useState } from "react";
import { Unlock, Lock, TrendingUp, TrendingDown, Clock, Plus, Minus, Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { CaixaModal } from "./modals/open_close";
import { SangriaModal } from "./modals/saida";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com";
const BASE = `${API_URL.replace(/\/$/, "")}/api/v1`;
async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw data;
    return data;
}

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
        try {
            const status = await apiFetch("/caixa/status");
            if (status.aberto) { setCaixa(status.caixa_atual); const ext = await apiFetch("/caixa/extrato").catch(() => null); setExtrato(ext); }
            else { setCaixa(null); setExtrato(null); }
        } catch { toast.error("Erro ao carregar caixa"); }
        finally { setLoading(false) }
    };
    useEffect(() => { fetchData() }, []);
    if (loading) return <div className="bg-white rounded-[18px] p-8 animate-pulse h-[300px]" />;
    const aberto = !!caixa;
    const entradas = Number(extrato?.total_entradas || 0);
    const inicial = Number(extrato?.saldo_inicial || 0);
    const atual = Number(extrato?.saldo_atual || 0);
    const saidas = (inicial + entradas) - atual; // calcula o que saiu

    return (
        <div className="space-y-4">
            {/* HEADER */}
            <div className="bg-white rounded-[24px] p-4 flex items-center justify-between border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${aberto ? 'bg-[#0CC06B] text-white' : 'bg-black text-white'}`}>{aberto ? <Unlock size={18} /> : <Lock size={18} />}</div>
                    <div><h2 className="font-black text-[14px] tracking-tight">{aberto ? 'Caixa Aberto' : 'Caixa Fechado'}</h2><p className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={11} />{aberto ? `${caixa.aberto_por_nome} • ${new Date(caixa.aberto_em).toLocaleString()}` : 'Abra o caixa para vender'}</p></div>
                </div>
                {!aberto ? <button onClick={() => { setModalMode("abrir"); setModalOpen(true) }} className="px-6 py-2.5 bg-black text-white rounded-full text-[11px] font-black">Abrir Caixa</button> : <button onClick={() => { setModalMode("fechar"); setModalOpen(true) }} className="px-5 py-2 bg-white border rounded-full text-[11px] font-bold">Fechar</button>}
            </div>

            {aberto && extrato && (
                <>
                    // CARDS ESTILO CARTÃO REAL
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* MASTER BLACK */}
                        <div className="relative h-[170px] rounded-[18px] bg-[#0F0F0F] p-5 overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                            {/* mapa mundi de fundo */}
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')`, backgroundSize: 'cover' }} />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                            <div className="relative h-full flex flex-col justify-between">
                                <div className="flex justify-between"><p className="text-white font-black tracking-widest text-[14px]">J-OS • NA GAVETA</p><p className="text-[9px] text-white/60 bg-white/10 px-2 py-1 rounded-full">MASTER • BALANCE</p></div>
                                <div className="w-14 h-10 rounded-[6px] bg-gradient-to-br from-[#FFD27D] to-[#C89A3E] border border-[#FFD27D] shadow-inner flex items-center justify-center"> <div className="w-full h-[1px] bg-black/20 absolute" /> <div className="w-[1px] h-full bg-black/20 absolute left-1/2" /></div>
                                <div className="flex justify-between items-end"><p className="text-white text-[26px] font-black tracking-tight">Kz {atual.toLocaleString()}</p><div className="flex gap-1"><div className="w-7 h-7 bg-[#EB001B] rounded-full" /><div className="w-7 h-7 bg-[#F79E1B] rounded-full -ml-3 opacity-90" /></div></div>
                            </div>
                        </div>

                        {/* ENTRADAS - VERDE */}
                        <div className="relative h-[170px] rounded-[18px] bg-gradient-to-br from-[#0A3D2E] to-[#0CC06B] p-5 overflow-hidden shadow-[0_20px_40px_rgba(12,192,107,0.3)]">
                            <div className="absolute inset-0 opacity-15 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-cover" />
                            <div className="relative h-full flex flex-col justify-between">
                                <div className="flex justify-between"><p className="text-emerald-100 font-black tracking-widest text-[15px]">ENTRADAS</p><span className="text-[8px] font-black bg-white/20 text-white px-2 py-1 rounded-full">TODAY • INFLUX</span></div>
                                <div className="w-14 h-10 rounded-[6px] bg-gradient-to-br from-[#FFD27D] to-[#C89A3E]" />
                                <p className="text-emerald-100 text-[26px] font-black">+ Kz {entradas.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* SAIDAS - VERMELHO */}
                        <div className="relative h-[170px] rounded-[18px] bg-gradient-to-br from-[#4A0A0A] to-[#E53935] p-5 overflow-hidden shadow-[0_20px_40px_rgba(229,57,53,0.3)]">
                            <div className="absolute inset-0 opacity-15 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-cover" />
                            <div className="relative h-full flex flex-col justify-between">
                                <div className="flex justify-between"><p className="text-red-100 font-black tracking-widest text-[15px]">SAIDAS</p><span className="text-[8px] font-black bg-white/20 text-white px-2 py-1 rounded-full">TODAY • OUTFLOW</span></div>
                                <div className="w-14 h-10 rounded-[6px] bg-gradient-to-br from-[#FFD27D] to-[#C89A3E]" />
                                <p className="text-red-100 text-[26px] font-black">- Kz {saidas.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { setSangriaTipo("SANGRIA"); setSangriaOpen(true) }} className="h-[48px] bg-white border rounded-full text-[11px] font-black text-[#C62828] flex items-center justify-center gap-2 hover:bg-red-50"><Minus size={14} /> Sangria (Retirar)</button>
                        <button onClick={() => { setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true) }} className="h-[48px] bg-white border rounded-full text-[11px] font-black text-[#2E7D32] flex items-center justify-center gap-2 hover:bg-green-50"><Plus size={14} /> Suprimento</button>
                    </div>
                </>
            )}

            {/* EXTRATO */}
            <div className="bg-white rounded-[24px] p-5 border shadow-sm"><h3 className="font-black text-[12px] mb-4 tracking-tight">Extrato • {extrato?.movimentos?.length || 0} movimentos</h3><div className="space-y-2 max-h-[420px] overflow-y-auto">{!extrato?.movimentos?.length ? <p className="text-[11px] text-gray-400 text-center py-10">Sem movimentos</p> : extrato.movimentos.map((m: any) => (<div key={m.id} className="flex items-center justify-between bg-[#F5F7FB] rounded-full px-4 py-3"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${Number(m.valor) > 0 ? 'bg-[#0CC06B] text-white' : 'bg-[#E53935] text-white'}`}>{Number(m.valor) > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}</div><div><p className="text-[11px] font-bold">{m.descricao}</p><p className="text-[9px] text-gray-500">{m.tipo} • {new Date(m.criado_em).toLocaleTimeString()}</p></div></div><span className={`text-[12px] font-black ${Number(m.valor) > 0 ? 'text-[#0CC06B]' : 'text-[#E53935]'}`}>{Number(m.valor) > 0 ? '+' : ''} Kz {Number(m.valor).toLocaleString()}</span></div>))}</div></div>

            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={caixa} onClose={() => setModalOpen(false)} onSuccess={() => { fetchData(); toast.success(modalMode === 'abrir' ? "Caixa aberto!" : modalMode === 'fechar' ? "Caixa fechado!" : "Troca feita!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={() => setSangriaOpen(false)} onSuccess={() => { fetchData(); toast.success(sangriaTipo === 'SANGRIA' ? "Sangria feita" : "Suprimento ok"); }} />
        </div>
    )
}
