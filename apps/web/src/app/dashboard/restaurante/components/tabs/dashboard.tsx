"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const BASE = `${API_URL}/api/v1`;

async function apiFetch(path: string) {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const empresa_id = typeof window !== "undefined" ? localStorage.getItem("empresa_id") : null;
    if (!token) throw new Error("Sem token");
    const headers: any = { Authorization: `Bearer ${token}` };
    if (empresa_id) headers["X-Empresa-ID"] = empresa_id;
    const r = await fetch(`${BASE}${path}`, { headers, cache: "no-store" as any });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw d;
    return d;
}

export function HomeTab({ user }: { user: any }) {
    const [stats, setStats] = useState({ active: 0, urgent: 0, pending: 0, watchlist: 0, vendasHoje: 0, faturamento: 0, caixaAtual: 0 });
    const [loading, setLoading] = useState(true);
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
        const getData = (e: any) => e.detail?.data || e.detail;

        const onExtrato = (e: any) => {
            const m = getData(e);
            if (!m) return;
            if (m.faturamento !== undefined || m.total_entradas !== undefined) { load(); return; }
            if (!m.id && !m.valor && !m.total && !m.total_venda) return;
            const valorNum = Number(m.valor ?? m.total_venda ?? m.total ?? 0);
            if (isNaN(valorNum)) return;
            const isVenda = (m.tipo || "").toUpperCase().includes("VENDA") || e.type.includes("venda");
            setStats(s => ({
                ...s,
                caixaAtual: m.saldo_atual ? Number(m.saldo_atual) : s.caixaAtual + valorNum,
                faturamento: valorNum > 0 ? s.faturamento + valorNum : s.faturamento,
                pending: valorNum < 0 ? s.pending + Math.abs(valorNum) : s.pending,
                vendasHoje: isVenda ? s.vendasHoje + 1 : s.vendasHoje,
                watchlist: s.watchlist + 1,
            }));
        };

        const onFull = () => load();

        const eventsIncremental = ["caixa:extrato", "venda:nova", "venda:fechada", "venda:update"] as const;
        const eventsFull = ["caixa:update", "caixa:atualizado", "caixa.updated", "dashboard:refresh", "stats.updated", "entidade:created", "entidade:update"] as const;

        eventsIncremental.forEach(ev => window.addEventListener(ev as any, onExtrato));
        eventsFull.forEach(ev => window.addEventListener(ev as any, onFull));

        return () => {
            eventsIncremental.forEach(ev => window.removeEventListener(ev as any, onExtrato));
            eventsFull.forEach(ev => window.removeEventListener(ev as any, onFull));
        };
    }, [load]);

    const fmt = (v: number) => {
        const n = Number(v);
        if (isNaN(n)) return "0,00";
        return n.toLocaleString('pt-PT', { minimumFractionDigits: 2 });
    };

    return (
        <div className="flex flex-col gap-[14px] w-full min-w-0 pb-6" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[14px]">
                <div className="bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex justify-between items-center h-[82px]">
                    <div>
                        <p className="text-[11px] text-[#9A9A9A] font-medium">Spent this month</p>
                        <p className="text-[18px] font-bold mt-1 text-[#111] tracking-tight">{loading ? "..." : `Kz ${fmt(stats.caixaAtual)}`}</p>
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
                        <div><p className="text-[11px] text-[#9A9A9A]">New clients</p><p className="text-[18px] font-bold">{loading ? "..." : stats.vendasHoje}</p></div>
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
                    <svg width="56" height="20" viewBox="0 0 80 32"><path d="M0 20 Q10 28 20 12 Q30 32 40 16 Q50 8 60 18 Q70 5 80 10" fill="none" stroke="white" strokeWidth="1.5" opacity="0.9" /></svg>
                </div>
            </div>
        </div>
    );
}
