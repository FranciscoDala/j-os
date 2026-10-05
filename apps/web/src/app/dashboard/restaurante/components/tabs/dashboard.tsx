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
        <div className="w-full min-w-0 bg-[#EDE9E3] rounded-[24px] p-4 md:p-6 flex flex-col gap-4" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            {/* HEADER IGUAL COPIA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F5F3EF]/80 rounded-[20px] p-4">
                <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-full bg-[#DCE8D8] flex items-center justify-center text-[#5A7A6A] text-[22px]">✳</div>
                    <div>
                        <h1 className="text-[22px] font-bold leading-none text-[#1A1A1A]">Hello, {user?.nome || "Carlic"}!</h1>
                        <p className="text-[13px] text-[#6B6B6B] mt-1">Explore information and activity about your property</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white rounded-full flex items-center px-4 py-2.5 w-[280px] shadow-sm border border-white">
                        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mr-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="6"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                        <input placeholder="Search..." className="bg-transparent outline-none text-[13px] w-full placeholder:text-[#9A9A9A]" />
                    </div>
                    <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm">💬</div>
                    <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm">🔔</div>
                </div>
            </div>

            {/* TOP 4 CARDS - IGUAL COPIA 1:1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1 - Spent this month -> Caixa Atual */}
                <div className="bg-white rounded-[20px] p-4 shadow-sm border border-white/50 flex justify-between items-center">
                    <div>
                        <p className="text-[13px] text-[#6B6B6B]">Spent this month</p>
                        <p className="text-[22px] font-black mt-1">{loading? "..." : `Kz ${fmt(stats.caixaAtual)}`}</p>
                    </div>
                    <div className="flex items-end gap-[3px] h-[32px]">
                        <div className="w-[6px] h-[14px] bg-[#5A7A6A] rounded-full" />
                        <div className="w-[6px] h-[22px] bg-[#5A7A6A] rounded-full" />
                        <div className="w-[6px] h-[18px] bg-[#5A7A6A] rounded-full" />
                        <div className="w-[6px] h-[28px] bg-[#5A7A6A] rounded-full" />
                        <div className="w-[6px] h-[20px] bg-[#5A7A6A]/60 rounded-full" />
                        <div className="w-[6px] h-[12px] bg-[#5A7A6A]/40 rounded-full" />
                    </div>
                </div>
                {/* Card 2 - New clients -> Vendas Hoje */}
                <div className="bg-white rounded-[20px] p-4 shadow-sm border border-white/50 flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-[#EAF0E8] flex items-center justify-center">👥</div>
                        <div>
                            <p className="text-[13px] text-[#6B6B6B]">New clients</p>
                            <p className="text-[22px] font-black">{loading? "..." : stats.vendasHoje}</p>
                        </div>
                    </div>
                    <svg width="60" height="24" viewBox="0 0 60 24"><path d="M0 20 Q10 5 20 15 T40 12 T60 5" fill="none" stroke="#7BAE9A" strokeWidth="2"/></svg>
                </div>
                {/* Card 3 - Earnings */}
                <div className="bg-white rounded-[20px] p-4 shadow-sm border border-white/50 flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-[#F2E8D5] flex items-center justify-center">💰</div>
                        <div>
                            <p className="text-[13px] text-[#6B6B6B]">Earnings</p>
                            <p className="text-[22px] font-black">Kz {fmt(stats.faturamento)}</p>
                        </div>
                    </div>
                    <svg width="60" height="24" viewBox="0 0 60 24"><path d="M0 18 Q15 22 25 10 T45 14 T60 8" fill="none" stroke="#9A8BC2" strokeWidth="2"/></svg>
                </div>
                {/* Card 4 - Activity VERDE */}
                <div className="bg-[#7AA58E] rounded-[20px] p-4 shadow-sm flex justify-between items-center text-white">
                    <div>
                        <p className="text-[13px] text-white/80">Activity</p>
                        <p className="text-[22px] font-black">Kz {fmt(stats.pending)}</p>
                    </div>
                    <svg width="80" height="32" viewBox="0 0 80 32"><path d="M0 20 Q10 28 20 12 Q30 32 40 16 Q50 8 60 18 Q70 5 80 10" fill="none" stroke="white" strokeWidth="2" opacity="0.9"/></svg>
                </div>
            </div>

            {/* MID ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 bg-white rounded-[20px] p-5 shadow-sm border border-white/50">
                    <div className="flex justify-between items-center">
                        <p className="font-bold text-[14px] flex items-center gap-2">Balance <span className="text-[11px] bg-[#E8F0E6] px-2 py-1 rounded-full">● On track</span></p>
                        <span className="text-[11px] text-[#8A8A8A]">Monthly ▾</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-[#F9F9F7] rounded-[12px] p-3">
                            <p className="text-[11px] text-[#8A8A8A]">Saves</p>
                            <p className="text-[16px] font-black">43.50% <span className="text-[10px] bg-[#E8F0E6] px-1.5 py-0.5 rounded-full font-semibold">+2.45%</span></p>
                        </div>
                        <div className="bg-[#F9F9F7] rounded-[12px] p-3">
                            <p className="text-[11px] text-[#8A8A8A]">Balance</p>
                            <p className="text-[16px] font-black">${fmt(stats.caixaAtual)} <span className="text-[10px] bg-[#FCE8E8] text-[#D44] px-1.5 py-0.5 rounded-full">-4.75%</span></p>
                        </div>
                    </div>
                    <div className="mt-4 h-[90px] relative">
                        <svg viewBox="0 0 300 80" className="w-full h-full"><path d="M0 60 Q20 30 40 50 T80 20 T120 55 T160 30 T200 15 T240 40 T300 10" fill="none" stroke="#5A7A6A" strokeWidth="2"/><path d="M0 60 Q20 30 40 50 T80 20 T120 55 T160 30 T200 15 T240 40 T300 10 L300 80 L0 80 Z" fill="#E8F0E6" opacity="0.6"/></svg>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-[20px] p-5 shadow-sm border border-white/50 flex flex-col items-center">
                    <p className="font-bold text-[14px] w-full text-left">Earnings</p>
                    <p className="text-[11px] text-[#8A8A8A] w-full text-left mt-1">Total Expense</p>
                    <p className="text-[22px] font-black mt-1">$6078.76</p>
                    <p className="text-[11px] text-[#6B6B6B] mt-1 text-center">Profit is 34% More than last Month</p>
                    <div className="mt-6 relative w-[140px] h-[70px]">
                        <svg viewBox="0 0 100 50" className="w-full h-full"><path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#E5E5E5" strokeWidth="10"/><path d="M10 50 A40 40 0 0 1 78 18" fill="none" stroke="#5A7A6A" strokeWidth="10" strokeLinecap="round"/></svg>
                        <p className="absolute left-1/2 top-[55%] -translate-x-1/2 text-[20px] font-black">80%</p>
                    </div>
                    <p className="text-[11px] text-[#8A8A8A] mt-2">Goal: $8000 • {stats.active} caixas</p>
                </div>

                <div className="lg:col-span-4 bg-white rounded-[20px] p-5 shadow-sm border border-white/50 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-full bg-[#E9E0D5] flex items-center justify-center text-[24px]">{user?.nome?.[0] || "C"}</div>
                    <p className="font-bold text-[15px] mt-3">{user?.nome || "Carlic Bolomboy"}</p>
                    <p className="text-[12px] text-[#8A8A8A]">{user?.email || "carlic@gmai.com"}</p>
                    <div className="grid grid-cols-3 w-full mt-6 border-t pt-4">
                        <div><p className="text-[11px] text-[#8A8A8A]">Projects</p><p className="font-black text-[16px]">26</p></div>
                        <div><p className="text-[11px] text-[#8A8A8A]">Followers</p><p className="font-black text-[16px]">{stats.watchlist}</p></div>
                        <div><p className="text-[11px] text-[#8A8A8A]">Following</p><p className="font-black text-[16px]">68</p></div>
                    </div>
                </div>
            </div>

            {/* BOTTOM ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 bg-white rounded-[20px] p-5 shadow-sm border border-white/50">
                    <p className="font-bold text-[14px]">Available Credit Card in Wallet</p>
                    <p className="text-[11px] text-[#8A8A8A] mt-1 max-w-[220px]">Lorem ipsum dolor sit amet consectetur. Facilisis tincidunt purus id hendrerit cras massa sollicitudin adipiscing.</p>
                    <div className="flex gap-3 mt-5 items-center">
                        <button onClick={load} className="bg-[#5A7A6A] text-white text-[11px] px-4 py-2 rounded-full font-semibold">Add New Card +</button>
                        <div className="relative w-[160px] h-[90px]">
                            <div className="absolute top-0 left-4 w-[130px] h-[80px] bg-[#D8E6D3] rounded-[12px] border border-white shadow-md rotate-[-8deg]" />
                            <div className="absolute top-2 left-6 w-[130px] h-[80px] bg-[#7AA58E] rounded-[12px] border border-white shadow-md rotate-[-4deg] flex items-center justify-center text-white text-[10px]">1234 1234 1234 1234</div>
                            <div className="absolute top-6 left-8 w-[130px] h-[80px] bg-[#2B2B2B] rounded-[12px] shadow-md rotate-[6deg] flex items-center justify-center text-white text-[10px]">1234 1234 1234 1234</div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 bg-white rounded-[20px] p-5 shadow-sm border border-white/50">
                    <p className="font-bold text-[14px]">Your Transfers</p>
                    <div className="flex flex-col gap-4 mt-4">
                        {ultimasVendas.length === 0 && <p className="text-[11px] text-[#9A9A9A]">Nenhuma venda ainda</p>}
                        {ultimasVendas.map((v: any, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div>
                                    <p className="text-[13px] font-semibold truncate max-w-[120px]">{v.descricao || "Venda"}</p>
                                    <p className="text-[11px] text-[#8A8A8A]">{v.criado_em? new Date(v.criado_em).toLocaleTimeString('pt-PT') : "Today, 14:34"}</p>
                                </div>
                                <span className="text-[11px] bg-[#E8F0E6] text-[#5A7A6A] px-2 py-1 rounded-full font-bold">+2.45%</span>
                            </div>
                        ))}
                        {ultimasVendas.length === 0 && (
                            <>
                                <div className="flex justify-between items-center"><div><p className="text-[13px] font-semibold">From Anna Jones</p><p className="text-[11px] text-[#8A8A8A]">Today, 14:34</p></div><span className="text-[11px] bg-[#E8F0E6] text-[#5A7A6A] px-2 py-1 rounded-full font-bold">+2.45%</span></div>
                                <div className="flex justify-between items-center"><div><p className="text-[13px] font-semibold">To Carlos Brown III</p><p className="text-[11px] text-[#8A8A8A]">Today, 15:23</p></div><span className="text-[11px] bg-[#FCE8E8] text-[#C44] px-2 py-1 rounded-full font-bold">-4.75%</span></div>
                            </>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 bg-[#E8F0E6] rounded-[20px] p-5 shadow-sm border border-white/50 flex flex-col items-center text-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#D0E2CA] flex items-center justify-center text-[20px]">🖐</div>
                    <p className="font-bold text-[15px] mt-3">Keep you safe!</p>
                    <p className="text-[12px] text-[#6B6B6B] mt-1">Update your security password</p>
                    <button className="mt-5 bg-[#2F4A3A] text-white text-[12px] px-6 py-2.5 rounded-full font-semibold">Update Your Security</button>
                </div>
            </div>
        </div>
    );
}
