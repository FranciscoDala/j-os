"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

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

type Period = "1D" | "1W" | "1M" | "1Y";

function buildPath(points: number[], w: number, h: number, pad = 6) {
    if (points.length < 2) return "";
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const stepX = (w - pad * 2) / (points.length - 1);
    return points.map((p, i) => {
        const x = pad + i * stepX;
        const y = pad + (1 - (p - min) / range) * (h - pad * 2);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
}

function Spark({ data, color, w = 88, h = 28 }: { data: number[]; color: string; w?: number; h?: number }) {
    const d = buildPath(data.length ? data : [0, 0], w, h);
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
            <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function HomeTab({ user }: { user: any }) {
    const [stats, setStats] = useState({ active: 0, urgent: 0, pending: 0, watchlist: 0, vendasHoje: 0, faturamento: 0, caixaAtual: 0 });
    const [loading, setLoading] = useState(true);
    const [movs, setMovs] = useState<any[]>([]);
    const [period, setPeriod] = useState<Period>("1W");
    const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
    const mountedRef = useRef(true);

    const load = useCallback(async () => {
        try {
            if (mountedRef.current) setLoading(true);
            const extrato = await apiFetch("/caixa/extrato").catch(() => null);
            if (!mountedRef.current) return;
            const movs = extrato?.movimentos || [];
            setMovs(movs);
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

    // ---- Série dinâmica a partir dos movimentos reais ----
    const series = useMemo(() => {
        const sorted = [...movs].sort((a, b) => new Date(a.created_at || a.data || 0).getTime() - new Date(b.created_at || b.data || 0).getTime());
        const now = new Date();
        const limitDays = period === "1D" ? 1 : period === "1W" ? 7 : period === "1M" ? 30 : 365;
        const cutoff = new Date(now.getTime() - limitDays * 24 * 60 * 60 * 1000);
        const filtered = sorted.filter((m) => {
            const d = new Date(m.created_at || m.data || 0);
            return !isNaN(d.getTime()) ? d >= cutoff : true;
        });
        const base = filtered.length ? filtered : sorted;
        // Valor acumulado para o gráfico grande ficar igual ao do print (linha a subir/descer)
        let acc = 0;
        const values = base.map((m: any) => {
            acc += Number(m.valor ?? m.total_venda ?? m.total ?? 0);
            return acc;
        });
        const labels = base.map((m: any) => {
            const d = new Date(m.created_at || m.data || Date.now());
            return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
        });
        return { values: values.length ? values : [0, 0, 0, 0, 0], labels };
    }, [movs, period]);

    const lastVal = series.values[series.values.length - 1] || 0;
    const firstVal = series.values[0] || 0;
    const variation = firstVal !== 0 ? ((lastVal - firstVal) / Math.abs(firstVal)) * 100 : 0;

    // Mini gráficos dos 4 cards - usam fatias reais da série
    const spark1 = series.values.slice(-8);
    const spark2 = series.values.slice(-8).map((v) => Math.abs(v));
    const spark3 = series.values.slice(-8);
    const spark4 = series.values.slice(-8).map((v) => Math.abs(v) * 0.6);

    const W = 640, H = 240, PAD = 8;
    const min = Math.min(...series.values);
    const max = Math.max(...series.values);
    const range = max - min || 1;
    const bigPath = buildPath(series.values, W, H, PAD);
    const areaPath = series.values.length > 1 ? `${bigPath} L${W - PAD},${H - PAD} L${PAD},${H - PAD} Z` : "";

    const topCards = [
        { label: "Caixa Atual", value: `Kz ${fmt(stats.caixaAtual)}`, pct: `+ ${Math.abs(variation).toFixed(2)}%`, icon: "Kz", bg: "#FFF3D6", color: "#E8A020", spark: spark1, sparkColor: "#E8A020" },
        { label: "Faturamento", value: `Kz ${fmt(stats.faturamento)}`, pct: `+ ${(stats.watchlist ? (stats.faturamento / Math.max(stats.watchlist, 1) / 100).toFixed(2) : "0.00")}%`, icon: "$", bg: "#E8F1FF", color: "#3B82F6", spark: spark2, sparkColor: "#3B82F6" },
        { label: "Vendas Hoje", value: `${stats.vendasHoje}`, pct: `+ ${stats.vendasHoje}%`, icon: "◈", bg: "#EDE9FE", color: "#8B5CF6", spark: spark3, sparkColor: "#8B5CF6" },
        { label: "Saídas", value: `Kz ${fmt(stats.pending)}`, pct: `+ ${(stats.pending ? 7.55 : 0).toFixed(2)}%`, icon: "⇄", bg: "#E0F2FE", color: "#0284C7", spark: spark4, sparkColor: "#F97316" },
    ];

    return (
        <div className="flex flex-col gap-[14px] w-full min-w-0 pb-6" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>



            {/* ===== 4 CARDS TOPO - igual print ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
                {topCards.map((c) => (
                    <div key={c.label} className="bg-white rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-black/[0.03] h-[140px] flex flex-col justify-between overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[12px] text-[#8A8A8A] font-medium">{c.label}</p>
                                <p className="text-[20px] font-bold mt-1 text-[#111] tracking-tight leading-none">{loading ? "..." : c.value}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black shrink-0" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                        </div>
                        <div className="flex items-end justify-between gap-2">
                            <div>
                                <p className="text-[10px] text-[#9A9A9A]">• $0,00</p>
                                <p className="text-[10px] font-bold text-[#111]">Increase {c.pct}</p>
                            </div>
                            <Spark data={c.spark} color={c.sparkColor} w={92} h={30} />
                        </div>
                    </div>
                ))}
            </div>





            {/* ===== GRÁFICO GRANDE + STAKING ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-[14px]">
                {/* Gráfico grande */}
                <div className="lg:col-span-2 bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-black/[0.03]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-6 h-6 rounded-full bg-[#FFF3D6] flex items-center justify-center text-[12px] font-black text-[#E8A020]">Kz</span>
                                <p className="text-[13px] font-bold text-[#111]">Caixa (Kz)</p>
                                <span className="text-[11px] text-[#9A9A9A]">⌄</span>
                            </div>
                            <p className="text-[26px] font-bold text-[#111] tracking-tight mt-2 leading-none">{loading ? "..." : `$${fmt(stats.caixaAtual)}`} <span className="text-[13px] font-bold text-[#111]">+{Math.abs(variation).toFixed(1)}%</span></p>
                        </div>
                        <div className="flex items-center gap-1 bg-[#F5F5F5] rounded-full p-1">
                            <button className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] text-[#9A9A9A]">📊</button>
                            <button className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] text-[#9A9A9A]">📈</button>
                            {(["1D", "1W", "1M", "1Y"] as Period[]).map((p) => (
                                <button key={p} onClick={() => setPeriod(p)} className={`h-7 px-2.5 rounded-full text-[11px] font-bold transition ${period === p ? "bg-black text-white" : "text-[#111]"}`}>{p}</button>
                            ))}
                        </div>
                    </div>

                    {/* Y axis + Chart */}
                    <div className="relative mt-4 flex gap-2">
                        <div className="flex flex-col justify-between text-[10px] text-[#9A9A9A] py-1 h-[240px] shrink-0">
                            <span>$20k</span><span>$15k</span><span>$10k</span><span>$5k</span><span>$0</span>
                        </div>
                        <div className="flex-1 relative min-w-0">
                            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[240px] overflow-visible" preserveAspectRatio="none"
                                onMouseMove={(e) => {
                                    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const idx = Math.round(((x / rect.width) * (series.values.length - 1)));
                                    const clamped = Math.max(0, Math.min(series.values.length - 1, idx));
                                    const px = PAD + (clamped / Math.max(series.values.length - 1, 1)) * (W - PAD * 2);
                                    const py = PAD + (1 - (series.values[clamped] - min) / range) * (H - PAD * 2);
                                    setHover({ i: clamped, x: px, y: py });
                                }}
                                onMouseLeave={() => setHover(null)}
                            >
                                <defs>
                                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#F97316" stopOpacity="0.18" />
                                        <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d={areaPath} fill="url(#areaFill)" />
                                <path d={bigPath} fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                                {hover && <g><line x1={hover.x} y1={0} x2={hover.x} y2={H} stroke="#E5E5E5" strokeDasharray="3 3" /><circle cx={hover.x} cy={hover.y} r="4" fill="#F97316" stroke="white" strokeWidth="2" /></g>}
                            </svg>
                            {hover && (
                                <div className="absolute pointer-events-none bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] rounded-[12px] px-3 py-2 border border-black/5 z-10" style={{ left: Math.min(hover.x, W - 140), top: Math.max(hover.y - 60, 0) }}>
                                    <p className="text-[10px] text-[#9A9A9A]">{series.labels[hover.i] || "Hoje"}</p>
                                    <div className="flex justify-between gap-4 text-[11px] mt-0.5"><span className="text-[#9A9A9A]">Price</span><span className="font-bold">Kz {fmt(series.values[hover.i] || 0)}</span></div>
                                    <div className="flex justify-between gap-4 text-[11px]"><span className="text-[#9A9A9A]">Vol.24h</span><span className="font-bold">Kz {fmt(stats.faturamento)}</span></div>
                                </div>
                            )}
                            <div className="flex justify-between text-[10px] text-[#9A9A9A] mt-2 px-1">
                                <span>Jan 25</span><span>Jan 24</span><span>Jan 27</span><span>Jan 28</span><span>Jan 30</span><span>Jan 31</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Staking / Caixa - igual print */}
                <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] border border-black/[0.03] flex flex-col">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] font-bold text-[#111]">You&apos;re staking</p>
                        <span className="text-[11px] text-[#9A9A9A]">⌄</span>
                    </div>

                    <div className="mt-4 flex items-end gap-1.5">
                        <p className="text-[28px] font-bold text-[#111] leading-none">{loading ? "..." : fmt(stats.caixaAtual)}</p>
                        <span className="text-[11px] font-bold text-[#111] mb-0.5">TRX</span>
                        <span className="ml-auto w-6 h-6 rounded-full bg-[#FFE5E5] flex items-center justify-center text-[11px]">🔴</span>
                    </div>
                    <p className="text-[11px] text-[#9A9A9A] mt-1">Kz {fmt(stats.faturamento)}</p>

                    <div className="flex items-center justify-between mt-3">
                        <p className="text-[11px] text-[#9A9A9A]">Balance: {stats.watchlist}</p>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {["25%", "50%", "75%", "Max"].map((v, i) => (
                            <button key={v} className={`flex-1 h-8 rounded-full text-[11px] font-bold border ${i === 3 ? "bg-black text-white border-black" : "bg-white text-[#111] border-black/10"}`}>{v}</button>
                        ))}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 text-[12px]">
                        <div className="flex justify-between"><span className="text-[#9A9A9A]">Protocol</span><span className="font-bold">Caixa Atual</span></div>
                        <div className="flex justify-between"><span className="text-[#9A9A9A]">App</span><span className="font-bold">Kitanda OS</span></div>
                        <div className="flex justify-between"><span className="text-[#9A9A9A]">Transaction Fee</span><span className="font-bold">0.00 Kz / $0.00</span></div>
                    </div>

                    <div className="mt-auto pt-5">
                        <p className="text-[11px] text-[#9A9A9A]">To receive</p>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-[22px] font-bold leading-none">{loading ? "..." : fmt(stats.pending)} <span className="text-[11px] font-bold">WTRX</span></p>
                            <span className="w-6 h-6 rounded-full bg-[#FFE5E5] flex items-center justify-center text-[11px]">🔴</span>
                        </div>
                        <p className="text-[11px] text-[#9A9A9A] mt-1">{stats.vendasHoje} REWARD</p>
                        <button className="w-full h-[48px] mt-4 rounded-full bg-[#FF4D2E] hover:bg-[#E63E22] active:scale-[0.98] transition text-white text-[13px] font-black tracking-wide">STAKE</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
