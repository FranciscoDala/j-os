"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { CaixaModal } from "./modals/open_close";
import { SangriaModal } from "./modals/saida";
import { MasterCard, EntradasCard, SaidasCard } from "./cards/cards_master";
import { JCalendarPicker } from "./cards/date-picker";
import { JConfirm } from "./modals/confirm";
import { ExtratoList } from "./table/extrato-list";
import { ProdutoMaisVendidoCard, getImgUrl } from "./cards/produto-mais-vendido";
import { GraficoVendas } from "./cards/grafico-vendas";
import RelatorioFolhaView from "./pdf/folha_RelatorioView";
import { toast } from "sonner";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const BASE = `${API_URL.replace(/\/$/, "")}/api/v1`;
const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400";

function getAuthHeaders() {
    const token = typeof window!== "undefined"? (localStorage.getItem("access_token") || localStorage.getItem("token")) : null;
    const empresa_id = typeof window!== "undefined"? localStorage.getItem("empresa_id") : null;
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (empresa_id) h["X-Empresa-ID"] = empresa_id;
    return h;
}
async function apiFetch(path: string, options: RequestInit = {}) {
    const headers: any = { "Content-Type": "application/json",...getAuthHeaders(),...(options.headers || {}) };
    if (options.body instanceof FormData) delete headers["Content-Type"];
    const res = await fetch(`${BASE}${path}`, {...options, headers, cache: "no-store" as any });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw d;
    return d;
}
const fmt = (v: number) => Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Luanda' });
const STORAGE_KEY = "j-os:mostrar_extrato";
const formatDateTimeFull = (iso: string) => {
    try { if (!iso) return "--"; return new Date(iso).toLocaleString('pt-PT', { timeZone: 'Africa/Luanda', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
};

export function CaixaTab() {
    const [status, setStatus] = useState<any>(null);
    const [extrato, setExtrato] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [inicio, setInicio] = useState(todayISO());
    const [fim, setFim] = useState(todayISO());
    const [showExtrato, setShowExtrato] = useState(false);
    const [showRelatorio, setShowRelatorio] = useState(false);
    const [produtosDb, setProdutosDb] = useState<any[]>([]);
    const [vendasBrutas, setVendasBrutas] = useState<any[]>([]);
    const [maisVendidos, setMaisVendidos] = useState<any[]>([]);
    const [vendasPorDia, setVendasPorDia] = useState<any[]>([]);
    const [filtroSales, setFiltroSales] = useState<"Todas" | "Pendentes" | "Concluídas">("Todas");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"abrir" | "fechar" | "forcar">("abrir");
    const [sangriaOpen, setSangriaOpen] = useState(false);
    const [sangriaTipo, setSangriaTipo] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");
    const [menuOpen, setMenuOpen] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuRefMobile = useRef<HTMLDivElement>(null);
    const [confirm, setConfirm] = useState<{ open: boolean, title: string, desc: string, type: "black" | "green" | "red", action: () => void }>({ open: false, title: "", desc: "", type: "black", action: () => { } });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const s = await apiFetch("/caixa/status").catch(() => null);
            setStatus(s);
            let ext = await apiFetch(`/caixa/extrato-por-periodo?inicio=${inicio}&fim=${fim}`);
            setExtrato(ext);
        } catch { setExtrato({ movimentos: [], saldo_inicial: 0, saldo_atual: 0, total_entradas: 0, total_saidas: 0, qtd_caixas: 0, periodo_inicio: inicio, periodo_fim: fim }); }
        setLoading(false);
    }, [inicio, fim]);

    const gerarDiasDoPeriodo = (ini: string, f: string) => {
        const dias: any[] = [];
        const start = new Date(ini);
        const end = new Date(f);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const diaKey = d.toLocaleDateString('en-CA', { timeZone: 'Africa/Luanda' });
            const diaLabel = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', timeZone: 'Africa/Luanda' });
            dias.push({ dia: diaKey, diaLabel, total: 0, qtd: 0, ticket: 0 });
        }
        return dias;
    };

    const loadProdutosDb = useCallback(async () => {
        try {
            const qs = new URLSearchParams({ skip: "0", limit: "100", search: "" });
            const r = await fetch(`${BASE}/produtos/?${qs}`, { headers: getAuthHeaders() as any, cache: "no-store" as any });
            const data = await r.json();
            const items = (data.items || data || []).filter((p: any) => p.ativo!== false);
            setProdutosDb(items);
            try {
                const qsV = new URLSearchParams({ inicio, fim, skip: "0", limit: "1000" });
                const rV = await fetch(`${BASE}/vendas/?${qsV}`, { headers: getAuthHeaders() as any, cache: "no-store" as any });
                if (rV.ok) {
                    const dV = await rV.json();
                    const vendas = dV.items || dV.vendas || dV || [];
                    setVendasBrutas(vendas);
                }
            } catch { setVendasBrutas([]); }
        } catch (e) { console.log("erro produtos db", e); }
    }, [inicio, fim]);

    useEffect(() => {
        const items = produtosDb;
        const vendas = vendasBrutas;
        const filtradas = vendas.filter((v: any) => {
            const st = (v.status || "CONCLUIDA").toUpperCase();
            if (filtroSales === "Todas") return true;
            if (filtroSales === "Pendentes") return st.includes("PEND");
            if (filtroSales === "Concluídas") return st.includes("CONCL");
            return true;
        });
        const map = new Map<string, any>();
        const mapDia = new Map<string, any>();
        gerarDiasDoPeriodo(inicio, fim).forEach(d => mapDia.set(d.dia, d));
        for (const v of filtradas) {
            const dataV = new Date(v.created_at || v.criado_em);
            const diaKey = dataV.toLocaleDateString('en-CA', { timeZone: 'Africa/Luanda' });
            if (!mapDia.has(diaKey)) continue;
            const curDia = mapDia.get(diaKey);
            curDia.total += Number(v.total || 0);
            curDia.qtd += 1;
            curDia.ticket = curDia.qtd > 0? curDia.total / curDia.qtd : 0;
            for (const it of (v.itens || [])) {
                const pid = String(it.produto_id);
                const cur = map.get(pid) || { qtd_vendida: 0, faturamento: 0, nome_produto: it.nome_produto, produto_id: pid };
                cur.qtd_vendida += Number(it.quantidade || 0);
                cur.faturamento += Number(it.total || 0);
                map.set(pid, cur);
            }
        }
        setVendasPorDia(Array.from(mapDia.values()).sort((a, b) => new Date(a.dia).getTime() - new Date(b.dia).getTime()));
        let ranking = Array.from(map.values()).map((m: any) => {
            const db = items.find((p: any) => String(p.id) === String(m.produto_id));
            return {...m,...db, nome: db?.nome || m.nome_produto, imagem_url: db?.imagem_url, preco_venda: db?.preco_venda, stock_atual: db?.stock_atual, controlar_stock: db?.controlar_stock, categoria: db?.categoria };
        }).sort((a, b) => b.qtd_vendida - a.qtd_vendida).slice(0, 8).map((p, i) => ({...p, rank: i + 1 }));
        setMaisVendidos(ranking);
    }, [vendasBrutas, produtosDb, filtroSales, inicio, fim]);

    useEffect(() => { const saved = localStorage.getItem(STORAGE_KEY); if (saved!== null) setShowExtrato(saved === "true"); }, []);
    useEffect(() => { load(); loadProdutosDb(); }, [load, loadProdutosDb]);
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (menuRef.current &&!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
            if (menuRefMobile.current &&!menuRefMobile.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
    }, []);

    const movs = extrato?.movimentos || [];
    const entradas = Number(extrato?.total_entradas || 0);
    const saidas = Math.abs(Number(extrato?.total_saidas || 0));
    const atual = Number(extrato?.saldo_atual?? 0);
    const top4 = useMemo(() => maisVendidos.length > 0? maisVendidos.slice(0, 4) : [], [maisVendidos]);

    const handleCardClick = (type: "master" | "entradas" | "saidas") => {
        if (type === "master") { if (status?.aberto) setConfirm({ open: true, title: "Fechar caixa?", desc: `Saldo Kz ${fmt(atual)}. Fechar?`, type: "black", action: () => { setModalMode("fechar"); setModalOpen(true); } }); else setConfirm({ open: true, title: "Abrir caixa?", desc: "Iniciar novo turno.", type: "black", action: () => { setModalMode("abrir"); setModalOpen(true); } }); }
        if (type === "entradas") { if (!status?.aberto) { toast.error("Abra o caixa antes!"); return; } setConfirm({ open: true, title: "Suprimento?", desc: "Adicionar?", type: "green", action: () => { setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true); } }); }
        if (type === "saidas") { if (!status?.aberto) { toast.error("Abra o caixa antes!"); return; } setConfirm({ open: true, title: "Sangria?", desc: "Retirar?", type: "red", action: () => { setSangriaTipo("SANGRIA"); setSangriaOpen(true); } }); }
    };
    const handleRelatorio = () => { setMenuOpen(false); setShowRelatorio(true); };
    const handleImprimir = () => { setMenuOpen(false); const win = window.open("", "_blank"); if (!win) return; win.document.write(`<html><body><h2>${inicio} a ${fim}</h2><table>${movs.map((m: any) => `<tr><td>${formatDateTimeFull(m.criado_em)}</td><td>${m.tipo}</td><td>${fmt(Number(m.valor))}</td></tr>`).join("")}</table><script>window.print()</script></body></html>`); win.document.close(); };

    if (loading &&!extrato) return <div className="bg-white rounded-[20px] p-8 animate-pulse h-[300px]" />;
    const caixaAtual = status?.caixa_atual; const dataAberturaFull = caixaAtual?.aberto_em? formatDateTimeFull(caixaAtual.aberto_em) : "";

    return (
        <div className="space-y-4">
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none; scrollbar-width:none;}`}</style>

            <div className="hidden md:flex items-center justify-between">
                <div className="flex gap-2 w-[calc((100%-32px)/3)]">
                    <div className="h-[46px] flex-1 min-w-0"><JCalendarPicker value={inicio} onChange={setInicio} /></div>
                    <div className="h-[46px] flex-1 min-w-0"><JCalendarPicker value={fim} onChange={setFim} /></div>
                </div>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen(o =>!o)} className="h-[46px] w-[46px] bg-black text-white rounded-full flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-[52px] w-[180px] bg-white border rounded-[16px] shadow-xl overflow-hidden z-50">
                            <button onClick={handleRelatorio} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50">Relatório</button>
                            <div className="h-[1px] bg-zinc-100" />
                            <button onClick={handleImprimir} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50">Imprimir</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex md:hidden justify-end items-center gap-2">
                <button onClick={() => setShowDateModal(true)} className="h-[46px] w-[46px] bg-black text-white rounded-full flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </button>
                <div className="relative" ref={menuRefMobile}>
                    <button onClick={() => setMenuOpen(o =>!o)} className="h-[46px] w-[46px] bg-black text-white rounded-full flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-[52px] w-[180px] bg-white border rounded-[16px] shadow-xl overflow-hidden z-[9999]">
                            <button onClick={handleRelatorio} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50">Relatório</button>
                            <div className="h-[1px] bg-zinc-100" />
                            <button onClick={handleImprimir} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50">Imprimir</button>
                        </div>
                    )}
                </div>
            </div>

            {showDateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDateModal(false)} />
                    <div className="relative w-full max-w-[340px] bg-white rounded-[24px] p-5 shadow-2xl">
                        <h3 className="text-[14px] font-black uppercase tracking-widest mb-4 text-center">Filtrar por período</h3>
                        <div className="space-y-3">
                            <div className="h-[46px] w-full"><JCalendarPicker value={inicio} onChange={setInicio} /></div>
                            <div className="h-[46px] w-full"><JCalendarPicker value={fim} onChange={setFim} /></div>
                        </div>
                        <button onClick={() => setShowDateModal(false)} className="mt-5 w-full h-[46px] bg-black text-white rounded-full text-[12px] font-black uppercase tracking-widest">Aplicar</button>
                    </div>
                </div>
            )}

            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 -mx-4 px-4 md:mx-0 md:px-0 md:gap-4 md:grid md:grid-cols-3 pb-2">
                <div onClick={() => handleCardClick("master")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer">
                    <MasterCard aberto={!!status?.aberto} atual={atual} nomeRestaurante={caixaAtual?.aberto_por_nome? `Resp: ${caixaAtual?.aberto_por_nome}` : "J-OS RESTAURANTE"} dataAbertura={dataAberturaFull} horaAbertura={dataAberturaFull} />
                </div>
                <div onClick={() => handleCardClick("entradas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer">
                    <EntradasCard entradas={entradas} nome="J-OS RESTAURANTE" dataHoje={inicio.slice(5).replace("-", "/")} qtdVendas={movs.filter((m: any) => (m.tipo || "").toUpperCase().includes("VENDA")).length} />
                </div>
                <div onClick={() => handleCardClick("saidas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer">
                    <SaidasCard saidas={saidas} nome="J-OS RESTAURANTE" hora={new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} retirado={saidas > 0? '1' : '0'} />
                </div>
            </div>

            <div className="space-y-3">
                <div className="w-full grid grid-cols-3 gap-2">
                    {(["Todas", "Pendentes", "Concluídas"] as const).map(t => (
                        <button key={t} onClick={() => setFiltroSales(t)} className={`w-full px-2 py-2.5 rounded-full text-[11px] font-black transition truncate ${filtroSales === t? "bg-[#8B6A5A] text-white shadow-md" : "bg-white border text-zinc-500"}`}>{t}</button>
                    ))}
                </div>

                <div className="bg-white rounded-[28px] border border-black/5 p-4 md:p-5 shadow-sm">
                    <div className="grid md:grid-cols-[1.6fr_1fr] gap-6">
                        <div><GraficoVendas vendasPorDia={vendasPorDia} filtro={filtroSales} inicio={inicio} fim={fim} /></div>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-3 p-3 rounded-[16px] border bg-white">
                                <div className="flex -space-x-2">{top4.slice(0, 2).map((p: any, i: number) => (<img key={i} src={getImgUrl(p.imagem_url)} onError={(e: any) => e.currentTarget.src = FALLBACK_IMG} className="w-10 h-10 rounded-full object-cover border-2 border-white" />))}</div>
                                <div className="min-w-0 flex-1"><div className="text-[12px] font-black leading-none truncate">Mais Vendidos</div><div className="text-[10px] text-zinc-500 mt-1 truncate">{top4[0]?.nome || `Sem vendas ${filtroSales.toLowerCase()} hoje`}</div></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-[16px] bg-[#8B6A5A] text-white shadow-lg -mx-1">
                                <div className="flex -space-x-2">{top4.slice(0, 3).map((p: any, i: number) => (<img key={i} src={getImgUrl(p.imagem_url)} onError={(e: any) => e.currentTarget.src = FALLBACK_IMG} className="w-8 h-8 rounded-full object-cover border-2 border-[#8B6A5A]" />))}</div>
                                <div className="min-w-0 flex-1"><div className="text-[12px] font-black leading-none">Em Alta</div><div className="text-[10px] opacity-80 mt-1 truncate">"{top4[0]?.qtd_vendida || 0} vendidos ✨"</div></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-[16px] border bg-white">
                                <div className="flex -space-x-2">{top4.slice(0, 4).map((p: any, i: number) => (<img key={i} src={getImgUrl(p.imagem_url)} onError={(e: any) => e.currentTarget.src = FALLBACK_IMG} className="w-8 h-8 rounded-full object-cover border-2 border-white" />))}</div>
                                <div className="min-w-0 flex-1"><div className="text-[12px] font-black leading-none">Favoritos</div><div className="text-[10px] text-zinc-500 mt-1 truncate">Kz {fmt(top4.reduce((a: any, b: any) => a + Number(b.faturamento || 0), 0))}</div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="w-full bg-white border rounded-full px-4 py-3 flex items-center justify-center gap-3 text-[12px] font-black shadow-sm">
                        <span className="whitespace-nowrap">📅 {inicio}</span>
                        <span className="opacity-30">a</span>
                        <span className="whitespace-nowrap">📅 {fim}</span>
                    </div>
                    <div className="text-[11px] font-bold text-zinc-400 text-left px-1">{vendasPorDia.length} dias • {maisVendidos.length} produtos • {filtroSales}</div>
                </div>

                <div className="grid gap-2.5 md:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {top4.length === 0? (<div className="col-span-full py-10 text-center bg-white rounded-[22px] border text-[12px] text-zinc-400">Nenhuma venda {filtroSales.toLowerCase()} em {inicio} até {fim}</div>) : (top4.map((p: any) => (<ProdutoMaisVendidoCard key={p.produto_id || p.id} p={p} />)))}
                </div>
            </div>

            <div className="flex justify-end pt-2"><button onClick={() => { const v =!showExtrato; setShowExtrato(v); localStorage.setItem(STORAGE_KEY, String(v)); }} className="flex items-center gap-2"><div className={`w-[44px] h-[26px] rounded-full p-[3px] transition-colors ${showExtrato? 'bg-green-500' : 'bg-zinc-300'}`}><div className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all ${showExtrato? 'translate-x-[18px]' : 'translate-x-0'}`} /></div></button></div>
            {showExtrato && <ExtratoList movimentos={movs} selectedDate={extrato?.periodo_inicio || inicio} statusCaixa={status} />}
            <JConfirm open={confirm.open} title={confirm.title} desc={confirm.desc} type={confirm.type} onClose={() => setConfirm(s => ({...s, open: false }))} onConfirm={confirm.action} />
            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={status?.caixa_atual || extrato} onClose={() => setModalOpen(false)} onSuccess={async () => { await load(); loadProdutosDb(); toast.success("Caixa atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={() => setSangriaOpen(false)} onSuccess={async () => { await load(); loadProdutosDb(); toast.success("Movimento registrado!"); }} />
            {showRelatorio && <RelatorioFolhaView extrato={extrato} inicio={inicio} fim={fim} status={status} onVoltar={() => setShowRelatorio(false)} />}
        </div>
    )
}
