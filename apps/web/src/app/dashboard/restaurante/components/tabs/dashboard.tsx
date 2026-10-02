"use client";
import { useState, useEffect } from "react";
import { Plus, SlidersHorizontal, ArrowUpRight, FileChartColumn, TriangleAlert, File, Eye, ClipboardList, Pill, Calendar } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const BASE = `${API_URL}/api/v1`;

async function apiFetch(path: string) {
    const token = localStorage.getItem("access_token");
    const r = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw d;
    return d;
}

export function HomeTab({ user }: { user: any }) {
    const [stats, setStats] = useState({ active: 0, urgent: 0, pending: 0, watchlist: 0, vendasHoje: 0, faturamento: 0, caixaAtual: 0 });
    const [loading, setLoading] = useState(true);
    const [ultimasVendas, setUltimasVendas] = useState<any[]>([]);

    const load = async () => {
        try {
            setLoading(true);
            const extrato = await apiFetch("/caixa/extrato").catch(() => null);
            const movs = extrato?.movimentos || [];
            const vendas = movs.filter((m: any) => (m.tipo || "").toUpperCase().includes("VENDA"));
            setStats({
                active: extrato?.qtd_caixas || 0,
                urgent: vendas.length,
                pending: Math.abs(Number(extrato?.total_saidas || 0)),
                watchlist: movs.length,
                vendasHoje: vendas.length,
                faturamento: Number(extrato?.total_entradas || 0),
                caixaAtual: Number(extrato?.saldo_atual || 0)
            });
            setUltimasVendas(vendas.slice(0, 3));
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    // REALTIME CIRÚRGICO - sem refresh, só injeta
    useEffect(() => {
        const onExtrato = (e: any) => {
            const m = e.detail;
            if (!m?.id) return;
            const isVenda = (m.tipo || "").toUpperCase().includes("VENDA");
            setStats(s => ({
               ...s,
                caixaAtual: Number(s.caixaAtual) + Number(m.valor || 0),
                faturamento: Number(m.valor) > 0? Number(s.faturamento) + Number(m.valor) : s.faturamento,
                pending: Number(m.valor) < 0? Number(s.pending) + Math.abs(Number(m.valor)) : s.pending,
                vendasHoje: isVenda? s.vendasHoje + 1 : s.vendasHoje,
                watchlist: s.watchlist + 1,
            }));
            if (isVenda) {
                setUltimasVendas(prev => [m,...prev].slice(0, 3));
            }
        };
        window.addEventListener("caixa:extrato" as any, onExtrato);
        window.addEventListener("venda:nova" as any, onExtrato);
        return () => {
            window.removeEventListener("caixa:extrato" as any, onExtrato);
            window.removeEventListener("venda:nova" as any, onExtrato);
        };
    }, []);

    const fmt = (v: number) => Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2 });

    const cards = [
        { id: 1, value: loading? "..." : `Kz ${fmt(stats.caixaAtual)}`, label: "Caixa Atual", labelColor: "text-blue-600", bg: "bg-white/90", icon: <FileChartColumn size={16} className="text-blue-700" />, iconBg: "bg-blue-100", bottom: (<div className="flex gap-1.5 mt-4 items-end h-8"><div className="w-full h-2.5 bg-[#A8C7F0] rounded-sm" /><div className="w-full h-4 bg-[#A8C7F0] rounded-sm" /><div className="w-full h-8 bg-[#1E3A8A] rounded-sm" /></div>) },
        { id: 2, value: loading? "..." : stats.vendasHoje, label: "Vendas Hoje", labelColor: "text-gray-500", bg: "bg-white/90", icon: <TriangleAlert size={16} className="text-orange-500" />, iconBg: "bg-orange-100", bottom: <p className="text-[12px] text-green-600 mt-6 flex items-center gap-1"><ArrowUpRight size={14} />Kz {fmt(stats.faturamento)} faturado</p> },
        { id: 3, value: loading? "..." : `Kz ${fmt(stats.pending)}`, label: "Saídas Hoje", labelColor: "text-black/70", bg: "bg-[#FFF68F]/95", icon: <File size={16} />, iconBg: "bg-white/70", bottom: (<div className="mt-6"><div className="h-1.5 bg-black/10 rounded-full"><div className="h-1.5 w-1/2 bg-black rounded-full" /></div><p className="text-[11px] mt-2 font-medium">{stats.watchlist} movimentos hoje</p></div>) },
        { id: 4, value: loading? "..." : stats.active, label: "Caixas no período", labelColor: "text-white/80", bg: "bg-gradient-to-br from-[#5A8AD0] to-[#A9C5F0] text-white", icon: <Eye size={16} className="text-white" />, iconBg: "bg-white/20", bottom: <span className="mt-6 inline-flex bg-white/20 rounded-full px-3 py-1 text-[11px]">◎ ao vivo</span> },
    ];

    return (
        <div className="flex flex-col gap-3 md:gap-4 w-full min-w-0 pb-6 no-scrollbar">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 px-1 md:px-0">
                <h1 className="text-[22px] md:text-[20px] font-bold text-slate-900 leading-tight">Bom dia, {user?.nome || "Admin"}</h1>
                <div className="flex gap-2 shrink-0">
                    <button className="flex-1 md:flex-none bg-[#2F4A8A] text-white rounded-full px-4 py-3 md:py-2.5 text-[13px] font-medium flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition">
                        <Plus size={16} /> Nova Venda
                    </button>
                    <button onClick={load} className="bg-white/80 backdrop-blur rounded-full w-11 h-11 md:w-9 md:h-9 flex items-center justify-center border border-white/60 shrink-0">
                        <SlidersHorizontal size={18} />
                    </button>
                </div>
            </div>

            <div className="flex md:hidden gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-1 pb-2 overscroll-x-contain">
                {cards.map((c) => (
                    <div key={c.id} className={`min-w-[100%] snap-center snap-always ${c.bg} backdrop-blur-xl rounded-[22px] p-4 shadow-sm border border-white/60 flex flex-col justify-between h-[130px] shrink-0`}>
                        <div className="flex justify-between items-start">
                            <div><p className="text-[22px] font-black leading-none truncate">{c.value}</p><p className={`text-[13px] mt-1 font-medium ${c.labelColor}`}>{c.label}</p></div>
                            <div className={`w-8 h-8 ${c.iconBg} rounded-full flex items-center justify-center shrink-0`}>{c.icon}</div>
                        </div>
                        {c.bottom}
                    </div>
                ))}
            </div>

            <div className="hidden lg:grid grid-cols-4 gap-3">
                {cards.map((c) => (
                    <div key={c.id} className={`${c.bg} backdrop-blur-xl rounded-[18px] p-4 shadow-sm border border-white/60 flex flex-col justify-between min-h-[120px]`}>
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0"><p className="text-[18px] font-black leading-none truncate">{c.value}</p><p className={`text-[11px] mt-1 ${c.labelColor}`}>{c.label}</p></div>
                            <div className={`w-7 h-7 ${c.iconBg} rounded-full flex items-center justify-center shrink-0`}>{c.icon}</div>
                        </div>
                        {c.bottom}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[20px] md:rounded-[18px] p-3 md:p-4 flex flex-col border border-white/50 min-w-0">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h2 className="font-bold text-[15px] md:text-[13px]">Últimas Vendas (ao vivo)</h2>
                        <button onClick={load} className="text-[12px] md:text-[11px] font-semibold bg-white/80 px-4 py-2 md:px-3 md:py-1.5 rounded-full border border-white/60">Atualizar</button>
                    </div>
                    <div className="flex flex-col gap-2.5 no-scrollbar">
                        {ultimasVendas.length === 0 && <p className="text-[12px] text-gray-400 p-3">Nenhuma venda hoje ainda.</p>}
                        {ultimasVendas.map((v: any, i) => (
                            <div key={v.id || i} className="bg-white rounded-[16px] p-3.5 flex justify-between items-center border border-white/80 shadow-sm active:scale-[0.99] transition">
                                <div className="flex gap-3 items-center min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-black">{v.criado_por_nome?.[0] || 'V'}</div>
                                    <div className="min-w-0"><p className="font-bold text-[14px] truncate">{v.descricao || 'Venda'}</p><p className="text-[12px] text-gray-500 truncate">{new Date(v.criado_em).toLocaleTimeString('pt-PT')} • {v.criado_por_nome || 'Sistema'}</p></div>
                                </div>
                                <span className="text-[12px] px-3 py-1 rounded-full font-bold bg-green-100 text-green-700 shrink-0 ml-2">+ Kz {fmt(Number(v.valor || 0))}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 min-w-0">
                    <div className="bg-white/70 backdrop-blur-xl rounded-[20px] md:rounded-[18px] p-3 md:p-4 border border-white/50">
                        <h2 className="font-bold text-[14px] md:text-[13px] mb-3 px-1">Ações Rápidas</h2>
                        <div className="flex flex-col gap-2.5">
                            <button className="bg-white rounded-[14px] p-3.5 flex items-center justify-between w-full text-left shadow-sm border border-white/60 active:scale-[0.98] transition">
                                <div className="flex gap-3 items-center min-w-0"><div className="w-10 h-10 bg-blue-50 rounded-[12px] flex items-center justify-center shrink-0"><ClipboardList size={18} className="text-blue-600" /></div><div className="min-w-0"><p className="text-[13px] font-semibold truncate">Vendas de Hoje</p><p className="text-[11px] text-gray-400">{stats.vendasHoje} vendas</p></div></div><span className="text-gray-400 text-[18px]">›</span>
                            </button>
                            <button className="bg-white rounded-[14px] p-3.5 flex items-center justify-between w-full text-left shadow-sm border border-white/60 active:scale-[0.98] transition">
                                <div className="flex gap-3 items-center min-w-0"><div className="w-10 h-10 bg-blue-50 rounded-[12px] flex items-center justify-center shrink-0"><Pill size={18} className="text-blue-600" /></div><div className="min-w-0"><p className="text-[13px] font-semibold truncate">Faturamento</p><p className="text-[11px] text-gray-400">Kz {fmt(stats.faturamento)}</p></div></div><span className="text-gray-400 text-[18px]">›</span>
                            </button>
                            <button className="bg-white rounded-[14px] p-3.5 flex items-center justify-between w-full text-left shadow-sm border border-white/60 active:scale-[0.98] transition">
                                <div className="flex gap-3 items-center min-w-0"><div className="w-10 h-10 bg-blue-50 rounded-[12px] flex items-center justify-center shrink-0"><Calendar size={18} className="text-blue-600" /></div><div className="min-w-0"><p className="text-[13px] font-semibold truncate">Saldo Atual</p><p className="text-[11px] text-gray-400">Kz {fmt(stats.caixaAtual)}</p></div></div><span className="text-gray-400 text-[18px]">›</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
           .no-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
           .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
