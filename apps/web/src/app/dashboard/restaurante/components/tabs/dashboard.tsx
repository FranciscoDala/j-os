"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const BASE = `${API_URL}/api/v1`;

async function apiFetch(path: string) {
    const token = typeof window!== "undefined"? localStorage.getItem("access_token") : null;
    if (!token) throw new Error("Sem token");
    const r = await fetch(`${BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw d;
    return d;
}

export function HomeTab({ user }: { user: any }) {
    const [stats, setStats] = useState({ active: 0, urgent: 0, pending: 0, watchlist: 0, vendasHoje: 0, faturamento: 0, caixaAtual: 0 });
    const [loading, setLoading] = useState(true);
    const [ultimasVendas, setUltimasVendas] = useState<any[]>([]);
    const mountedRef = useRef(true);

    const load = useCallback(async () => {
        try {
            if (mountedRef.current) setLoading(true);
            const extrato = await apiFetch("/caixa/extrato").catch(() => null);
            if (!mountedRef.current) return;
            const movs = extrato?.movimentos || [];
            const vendas = movs.filter((m: any) => (m.tipo || "").toUpperCase().includes("VENDA"));
            setStats({
                active: Number(extrato?.qtd_caixas || 0),
                urgent: vendas.length,
                pending: Math.abs(Number(extrato?.total_saidas || 0)),
                watchlist: movs.length,
                vendasHoje: vendas.length,
                faturamento: Number(extrato?.total_entradas || 0),
                caixaAtual: Number(extrato?.saldo_atual || 0)
            });
            setUltimasVendas(vendas.slice(0, 5));
        } catch {} finally {
            if (mountedRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        load();
        return () => { mountedRef.current = false; };
    }, [load]);

    useEffect(() => {
        const onExtrato = (e: any) => {
            const m = e.detail;
            if (!m || (!m.id &&!m.valor &&!m.total)) return;
            const valorNum = Number(m.valor?? m.total_venda?? m.total?? 0);
            if (isNaN(valorNum)) return;
            const isVenda = (m.tipo || "").toUpperCase().includes("VENDA") || e.type === "venda:nova";
            setStats(s => ({
             ...s,
                caixaAtual: m.saldo_atual? Number(m.saldo_atual) : s.caixaAtual + valorNum,
                faturamento: valorNum > 0? s.faturamento + valorNum : s.faturamento,
                pending: valorNum < 0? s.pending + Math.abs(valorNum) : s.pending,
                vendasHoje: isVenda? s.vendasHoje + 1 : s.vendasHoje,
                watchlist: s.watchlist + 1,
            }));
            if (isVenda) setUltimasVendas(prev => [m,...prev].slice(0, 5));
        };
        const events = ["caixa:extrato", "caixa:update", "caixa:atualizado", "venda:nova", "entidade:created"] as const;
        events.forEach(ev => window.addEventListener(ev as any, onExtrato));
        return () => { events.forEach(ev => window.removeEventListener(ev as any, onExtrato)); };
    }, []);

    const fmt = (v: number) => {
        const n = Number(v);
        if (isNaN(n)) return "0,00";
        return n.toLocaleString('pt-PT', { minimumFractionDigits: 2 });
    };

    // DADOS REAIS PARA O GRÁFICO
    const percSave = stats.faturamento > 0? ((stats.caixaAtual / stats.faturamento) * 100) : 0;
    const goalPerc = Math.min(99, Math.max(5, Math.round((stats.faturamento / (stats.faturamento + stats.pending + 1)) * 100)));

    return (
        <div className="flex flex-col gap-[14px] w-full min-w-0 pb-6" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            {/* TOP 4 - DADOS REAIS DO DB - SEM ZOOM, CARDS FINOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[14px]">
                <div className="bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex justify-between items-center h-[82px]">
                    <div>
                        <p className="text-[11px] text-[#9A9A9A] font-medium">Spent this month</p>
                        <p className="text-[18px] font-bold mt-1 text-[#111] tracking-tight">{loading? "..." : `Kz ${fmt(stats.caixaAtual)}`}</p>
                    </div>
                    <div className="flex items-end gap-[3px] h-6">
                        <div className="w-[4px] h-[10px] bg-[#7AA58E] rounded-full" />
                        <div className="w-[4px] h-[16px] bg-[#7AA58E] rounded-full" />
                        <div className="w-[4px] h-[12px] bg-[#7AA58E] rounded-full" />
                        <div className="w-[4px] h-[20px] bg-[#7AA58E] rounded-full" />
                        <div className="w-[4px] h-[14px] bg-[#7AA58E]/60 rounded-full" />
                    </div>
                </div>
                <div className="bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex justify-between items-center h-[82px]">
                    <div className="flex gap-2.5 items-center">
                        <div className="w-8 h-8 rounded-full bg-[#EEF4EE] flex items-center justify-center text-[12px]">👥</div>
                        <div><p className="text-[11px] text-[#9A9A9A]">New clients</p><p className="text-[18px] font-bold">{loading? "..." : stats.vendasHoje}</p></div>
                    </div>
                    <span className="text-[10px] bg-[#E8F0E6] text-[#5A7A6A] px-2 py-1 rounded-full font-bold">+{stats.vendasHoje}</span>
                </div>
                <div className="bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex justify-between items-center h-[82px]">
                    <div className="flex gap-2.5 items-center">
                        <div className="w-8 h-8 rounded-full bg-[#F9F0E0] flex items-center justify-center text-[12px]">🔥</div>
                        <div><p className="text-[11px] text-[#9A9A9A]">Earnings</p><p className="text-[16px] font-bold">Kz {fmt(stats.faturamento)}</p></div>
                    </div>
                    <span className="text-[10px] bg-[#F9F0E0] text-[#9A7A4A] px-2 py-1 rounded-full font-bold">{stats.watchlist} mov</span>
                </div>
                <div className="bg-[#7AA58E] rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex justify-between items-center h-[82px] text-white">
                    <div><p className="text-[11px] text-white/80">Activity</p><p className="text-[18px] font-bold">Kz {fmt(stats.pending)}</p></div>
                    <svg width="56" height="20" viewBox="0 0 80 32"><path d="M0 20 Q10 28 20 12 Q30 32 40 16 Q50 8 60 18 Q70 5 80 10" fill="none" stroke="white" strokeWidth="1.5" opacity="0.9"/></svg>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-[14px]">
                <div className="lg:col-span-5 bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                    <div className="flex justify-between items-center"><p className="font-bold text-[13px] flex items-center gap-2">Balance <span className="text-[10px] bg-[#E8F0E6] text-[#5A7A6A] px-2 py-0.5 rounded-full">● On track</span></p><span className="text-[11px] text-[#9A9A9A]">Monthly ▾</span></div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-[#F9F8F5] rounded-[10px] p-3"><p className="text-[10px] text-[#9A9A9A]">Saves</p><p className="text-[13px] font-bold mt-1">{percSave.toFixed(2)}% <span className="text-[9px] bg-[#E8F0E6] px-1.5 py-0.5 rounded-full ml-1">+{stats.vendasHoje}</span></p></div>
                        <div className="bg-[#F9F8F5] rounded-[10px] p-3"><p className="text-[10px] text-[#9A9A9A]">Balance</p><p className="text-[13px] font-bold mt-1">Kz {fmt(stats.caixaAtual)} <span className="text-[9px] bg-[#FCE8E8] text-[#D44] px-1.5 py-0.5 rounded-full ml-1">-{fmt(stats.pending)}</span></p></div>
                    </div>
                    <div className="mt-4 h-[88px] opacity-80"><svg viewBox="0 0 300 80" className="w-full h-full"><path d="M0 60 Q20 30 40 50 T80 20 T120 55 T160 30 T200 15 T240 40 T300 10" fill="none" stroke="#5A7A6A" strokeWidth="1.6"/><path d="M0 60 Q20 30 40 50 T80 20 T120 55 T160 30 T200 15 T240 40 T300 10 L300 80 L0 80 Z" fill="#E8F0E6" opacity="0.5"/></svg></div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col items-center">
                    <p className="font-bold text-[13px] w-full text-left">Earnings</p>
                    <p className="text-[10px] text-[#9A9A9A] w-full text-left">Total Expense</p>
                    <p className="text-[18px] font-bold mt-2">Kz {fmt(stats.faturamento)}</p>
                    <p className="text-[10px] text-[#7A7A7A] mt-1 text-center">Profit {stats.vendasHoje} vendas hoje</p>
                    <div className="mt-4 relative w-[120px] h-[60px]">
                        <svg viewBox="0 0 100 50" className="w-full h-full"><path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#EFEFEF" strokeWidth="10"/><path d="M10 50 A40 40 0 0 1 78 18" fill="none" stroke="#5A7A6A" strokeWidth="10" strokeLinecap="round"/></svg>
                        <p className="absolute left-1/2 top-[55%] -translate-x-1/2 text-[16px] font-bold">{goalPerc}%</p>
                    </div>
                    <p className="text-[10px] text-[#9A9A9A] mt-1">Meta: {stats.active} caixas</p>
                </div>

                <div className="lg:col-span-4 bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-[#E9E0D5] flex items-center justify-center text-[18px] font-bold">{user?.nome?.[0] || "F"}</div>
                    <p className="font-bold text-[13px] mt-3">{user?.nome || "Francisco Dala"}</p>
                    <p className="text-[10px] text-[#9A9A9A]">{user?.email || "killerbless12@gmail.com"}</p>
                    <div className="grid grid-cols-3 w-full mt-6 border-t border-[#F2F0EB] pt-4">
                        <div><p className="text-[10px] text-[#9A9A9A]">Projects</p><p className="font-bold text-[13px] mt-1">{stats.active}</p></div>
                        <div><p className="text-[10px] text-[#9A9A9A]">Followers</p><p className="font-bold text-[13px] mt-1">{stats.watchlist}</p></div>
                        <div><p className="text-[10px] text-[#9A9A9A]">Following</p><p className="font-bold text-[13px] mt-1">68</p></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-[14px]">
                <div className="lg:col-span-5 bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                    <p className="font-bold text-[12px]">Available Credit Card in Wallet</p>
                    <p className="text-[10px] text-[#9A9A9A] mt-1.5 max-w-[260px]">Saldo atual em caixa - {stats.active} caixas no período</p>
                    <div className="flex gap-3 mt-4 items-center">
                        <button onClick={load} className="bg-[#5A7A6A] text-white text-[10px] px-4 py-2 rounded-full font-semibold">Atualizar +</button>
                        <div className="relative w-[160px] h-[84px] ml-auto">
                            <div className="absolute top-0 left-2 w-[120px] h-[74px] bg-[#D8E6D3] rounded-[10px] border border-white shadow-sm rotate-[-8deg]" />
                            <div className="absolute top-1 left-4 w-[120px] h-[74px] bg-[#7AA58E] rounded-[10px] border border-white shadow-sm rotate-[-4deg] flex items-end p-2 text-white text-[7px]">Kz {fmt(stats.caixaAtual)}</div>
                            <div className="absolute top-4 left-6 w-[120px] h-[74px] bg-[#1E1E1E] rounded-[10px] shadow-sm rotate-[6deg] flex items-end p-2 text-white/80 text-[7px]">**** **** **** {String(stats.caixaAtual).slice(-4)}</div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                    <p className="font-bold text-[12px]">Your Transfers</p>
                    <div className="flex flex-col gap-3 mt-4">
                        {ultimasVendas.length > 0? ultimasVendas.map((v:any,i)=>(
                            <div key={v.id||i} className="flex justify-between items-center border-l-2 border-[#7AA58E] pl-3">
                                <div><p className="text-[11px] font-semibold truncate max-w-[120px]">{v.descricao||`Venda #${v.id||i}`}</p><p className="text-[9px] text-[#9A9A9A]">{v.criado_em? new Date(v.criado_em).toLocaleTimeString('pt-PT') : "Hoje"}</p></div>
                                <span className="text-[9px] bg-[#E8F0E6] text-[#5A7A6A] px-2 py-1 rounded-full font-bold">+ Kz {fmt(Number(v.valor||v.total||0))}</span>
                            </div>
                        )) : <p className="text-[11px] text-[#9A9A9A]">Nenhuma venda hoje</p>}
                    </div>
                </div>

                <div className="lg:col-span-4 bg-[#E8F0E6] rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col items-center text-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#D0E2CA] flex items-center justify-center">🖐</div>
                    <p className="font-bold text-[13px] mt-2">Keep you safe!</p>
                    <p className="text-[10px] text-[#6B6B6B] mt-1">Update your security password</p>
                    <button className="mt-4 bg-[#2F4A3A] text-white text-[10px] px-5 py-2 rounded-full font-semibold">Update Your Security</button>
                </div>
            </div>
        </div>
    );
}
