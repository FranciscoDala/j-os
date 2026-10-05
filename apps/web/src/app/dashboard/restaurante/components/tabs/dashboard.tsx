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
            setUltimasVendas(vendas.slice(0, 3));
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
            if (isVenda) setUltimasVendas(prev => [m,...prev].slice(0, 3));
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

    return (
        <div className="flex flex-col gap-4 w-full min-w-0 pb-6" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            {/* TOP 4 CARDS IGUAL COPIA */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-[20px] p-[18px] shadow-sm border border-white flex justify-between items-center min-h-[88px]">
                    <div>
                        <p className="text-[12px] text-[#7A7A7A] font-medium">Spent this month</p>
                        <p className="text-[20px] font-black mt-1 tracking-tight text-[#111]">{loading? "..." : `Kz ${fmt(stats.caixaAtual)}`}</p>
                    </div>
                    <div className="flex items-end gap-[4px] h-[28px]">
                        <div className="w-[5px] h-[12px] bg-[#7AA58E] rounded-full" />
                        <div className="w-[5px] h-[20px] bg-[#7AA58E] rounded-full" />
                        <div className="w-[5px] h-[14px] bg-[#7AA58E] rounded-full" />
                        <div className="w-[5px] h-[24px] bg-[#7AA58E] rounded-full" />
                        <div className="w-[5px] h-[16px] bg-[#7AA58E]/60 rounded-full" />
                        <div className="w-[5px] h-[10px] bg-[#7AA58E]/40 rounded-full" />
                    </div>
                </div>
                <div className="bg-white rounded-[20px] p-[18px] shadow-sm border border-white flex justify-between items-center min-h-[88px]">
                    <div className="flex gap-3 items-center">
                        <div className="w-9 h-9 rounded-full bg-[#EAF0E8] flex items-center justify-center text-[16px]">👥</div>
                        <div><p className="text-[12px] text-[#7A7A7A]">New clients</p><p className="text-[20px] font-black">{loading? "..." : stats.vendasHoje}</p></div>
                    </div>
                    <svg width="64" height="22" viewBox="0 0 60 24"><path d="M0 20 Q10 5 20 15 T40 12 T60 5" fill="none" stroke="#7BAE9A" strokeWidth="1.8"/></svg>
                </div>
                <div className="bg-white rounded-[20px] p-[18px] shadow-sm border border-white flex justify-between items-center min-h-[88px]">
                    <div className="flex gap-3 items-center">
                        <div className="w-9 h-9 rounded-full bg-[#F2E8D5] flex items-center justify-center text-[16px]">💰</div>
                        <div><p className="text-[12px] text-[#7A7A7A]">Earnings</p><p className="text-[20px] font-black">Kz {fmt(stats.faturamento)}</p></div>
                    </div>
                    <svg width="64" height="22" viewBox="0 0 60 24"><path d="M0 18 Q15 22 25 10 T45 14 T60 8" fill="none" stroke="#9A8BC2" strokeWidth="1.8"/></svg>
                </div>
                <div className="bg-[#7AA58E] rounded-[20px] p-[18px] shadow-sm flex justify-between items-center min-h-[88px] text-white">
                    <div><p className="text-[12px] text-white/80">Activity</p><p className="text-[20px] font-black">Kz {fmt(stats.pending)}</p></div>
                    <svg width="80" height="28" viewBox="0 0 80 32"><path d="M0 20 Q10 28 20 12 Q30 32 40 16 Q50 8 60 18 Q70 5 80 10" fill="none" stroke="white" strokeWidth="1.8" opacity="0.9"/></svg>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 bg-white rounded-[20px] p-5 shadow-sm border border-white">
                    <div className="flex justify-between items-center"><p className="font-bold text-[13px] flex items-center gap-2">Balance <span className="text-[10px] bg-[#E8F0E6] text-[#5A7A6A] px-2 py-0.5 rounded-full">● On track</span></p><span className="text-[11px] text-[#9A9A9A]">Monthly ▾</span></div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-[#F9F9F7] rounded-[12px] p-3"><p className="text-[10px] text-[#9A9A9A]">Saves</p><p className="text-[14px] font-black mt-1">43.50% <span className="text-[9px] bg-[#E8F0E6] px-1.5 py-0.5 rounded-full ml-1">+2.45%</span></p></div>
                        <div className="bg-[#F9F9F7] rounded-[12px] p-3"><p className="text-[10px] text-[#9A9A9A]">Balance</p><p className="text-[14px] font-black mt-1">${fmt(stats.caixaAtual)} <span className="text-[9px] bg-[#FCE8E8] text-[#D44] px-1.5 py-0.5 rounded-full ml-1">-4.75%</span></p></div>
                    </div>
                    <div className="mt-4 h-[96px]"><svg viewBox="0 0 300 80" className="w-full h-full"><path d="M0 60 Q20 30 40 50 T80 20 T120 55 T160 30 T200 15 T240 40 T300 10" fill="none" stroke="#5A7A6A" strokeWidth="2"/><path d="M0 60 Q20 30 40 50 T80 20 T120 55 T160 30 T200 15 T240 40 T300 10 L300 80 L0 80 Z" fill="#E8F0E6" opacity="0.6"/></svg></div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-[20px] p-5 shadow-sm border border-white flex flex-col items-center">
                    <p className="font-bold text-[13px] w-full text-left">Earnings</p>
                    <p className="text-[10px] text-[#9A9A9A] w-full text-left mt-1">Total Expense</p>
                    <p className="text-[20px] font-black mt-2">$6078.76</p>
                    <p className="text-[11px] text-[#7A7A7A] mt-1 text-center leading-tight">Profit is 34% More than<br/>last Month</p>
                    <div className="mt-5 relative w-[130px] h-[65px]">
                        <svg viewBox="0 0 100 50" className="w-full h-full"><path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#EFEFEF" strokeWidth="10"/><path d="M10 50 A40 40 0 0 1 78 18" fill="none" stroke="#5A7A6A" strokeWidth="10" strokeLinecap="round"/></svg>
                        <p className="absolute left-1/2 top-[55%] -translate-x-1/2 text-[18px] font-black">80%</p>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-white rounded-[20px] p-6 shadow-sm border border-white flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#E9E0D5] flex items-center justify-center text-[22px] font-bold">{user?.nome?.[0] || "C"}</div>
                    <p className="font-bold text-[14px] mt-3">{user?.nome || "Carlic Bolomboy"}</p>
                    <p className="text-[11px] text-[#9A9A9A]">{user?.email || "carlic@gmail.com"}</p>
                    <div className="grid grid-cols-3 w-full mt-8 border-t border-[#F2F0EB] pt-4">
                        <div><p className="text-[10px] text-[#9A9A9A]">Projects</p><p className="font-black text-[14px] mt-1">26</p></div>
                        <div><p className="text-[10px] text-[#9A9A9A]">Followers</p><p className="font-black text-[14px] mt-1">{stats.watchlist}</p></div>
                        <div><p className="text-[10px] text-[#9A9A9A]">Following</p><p className="font-black text-[14px] mt-1">68</p></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 bg-white rounded-[20px] p-5 shadow-sm border border-white">
                    <p className="font-bold text-[13px] leading-tight max-w-[220px]">Available Credit Card in Wallet</p>
                    <p className="text-[11px] text-[#9A9A9A] mt-2 max-w-[260px] leading-snug">Lorem ipsum dolor sit amet consectetur. Facilisis tincidunt purus id hendrerit cras massa sollicitudin adipiscing.</p>
                    <div className="flex gap-3 mt-6 items-center">
                        <button onClick={load} className="bg-[#5A7A6A] text-white text-[11px] px-4 py-2 rounded-full font-semibold shrink-0">Add New Card +</button>
                        <div className="relative w-[180px] h-[92px] ml-auto">
                            <div className="absolute top-0 left-3 w-[130px] h-[80px] bg-[#D8E6D3] rounded-[12px] border border-white shadow-md rotate-[-8deg]" />
                            <div className="absolute top-1 left-5 w-[130px] h-[80px] bg-[#7AA58E] rounded-[12px] border border-white shadow-md rotate-[-4deg] flex items-end p-2 text-white text-[8px]">1234 1234 1234 1234</div>
                            <div className="absolute top-5 left-7 w-[130px] h-[80px] bg-[#1E1E1E] rounded-[12px] shadow-md rotate-[6deg] flex items-end p-2 text-white/80 text-[8px]">1234 1234 1234 1234</div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-[20px] p-5 shadow-sm border border-white">
                    <p className="font-bold text-[13px]">Your Transfers</p>
                    <div className="flex flex-col gap-4 mt-5">
                        {ultimasVendas.length > 0? ultimasVendas.map((v:any,i)=>(
                            <div key={v.id||i} className="flex justify-between items-center">
                                <div><p className="text-[12px] font-semibold truncate max-w-[130px]">{v.descricao||"Venda"}</p><p className="text-[10px] text-[#9A9A9A]">{v.criado_em? new Date(v.criado_em).toLocaleTimeString('pt-PT') : "Today, 14:34"}</p></div>
                                <span className="text-[10px] bg-[#E8F0E6] text-[#5A7A6A] px-2 py-1 rounded-full font-bold">+ Kz {fmt(Number(v.valor||0))}</span>
                            </div>
                        )) : (
                            <>
                                <div className="flex justify-between items-center"><div><p className="text-[12px] font-semibold">From Anna Jones</p><p className="text-[10px] text-[#9A9A9A]">Today, 14:34</p></div><span className="text-[10px] bg-[#E8F0E6] text-[#5A7A6A] px-2 py-1 rounded-full font-bold">+2.45%</span></div>
                                <div className="flex justify-between items-center"><div><p className="text-[12px] font-semibold">To Carlos Brown III</p><p className="text-[10px] text-[#9A9A9A]">Today, 15:23</p></div><span className="text-[10px] bg-[#FCE8E8] text-[#C44] px-2 py-1 rounded-full font-bold">-4.75%</span></div>
                                <div className="flex justify-between items-center"><div><p className="text-[12px] font-semibold">From David Brown</p><p className="text-[10px] text-[#9A9A9A]">Today, 17:54</p></div><span className="text-[10px] bg-[#E8F0E6] text-[#5A7A6A] px-2 py-1 rounded-full font-bold">+2.45%</span></div>
                            </>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 bg-[#E8F0E6] rounded-[20px] p-6 shadow-sm border border-white/50 flex flex-col items-center text-center justify-center min-h-[180px]">
                    <div className="w-12 h-12 rounded-full bg-[#D0E2CA] flex items-center justify-center text-[18px]">🖐</div>
                    <p className="font-bold text-[14px] mt-3">Keep you safe!</p>
                    <p className="text-[11px] text-[#6B6B6B] mt-1">Update your security password</p>
                    <button className="mt-5 bg-[#2F4A3A] text-white text-[11px] px-6 py-2.5 rounded-full font-semibold">Update Your Security</button>
                </div>
            </div>
        </div>
    );
}
