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
const sevenDaysAgoISO = () => {
    const d = new Date();
    d.setDate(d.getDate() - 6); // 7 dias incluindo hoje
    return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Luanda' });
};

const STORAGE_KEY = "j-os:mostrar_extrato";
const formatDateTimeFull = (iso: string) => {
    try { if (!iso) return "--"; return new Date(iso).toLocaleString('pt-PT', { timeZone: 'Africa/Luanda', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
};

export function CaixaTab() {
    const [status, setStatus] = useState<any>(null);
    const [extrato, setExtrato] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [inicio, setInicio] = useState(sevenDaysAgoISO());
    const [fim, setFim] = useState(todayISO());
    const [showExtrato, setShowExtrato] = useState(false);
    const [produtosDb, setProdutosDb] = useState<any[]>([]);
    const [maisVendidos, setMaisVendidos] = useState<any[]>([]);
    const [vendasPorDia, setVendasPorDia] = useState<any[]>([]);
    const [filtroSales, setFiltroSales] = useState<"All Sales" | "Pending" | "Completed">("All Sales");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"abrir" | "fechar" | "forcar">("abrir");
    const [sangriaOpen, setSangriaOpen] = useState(false);
    const [sangriaTipo, setSangriaTipo] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuRefMobile = useRef<HTMLDivElement>(null);
    const [confirm, setConfirm] = useState<{ open: boolean, title: string, desc: string, type: "black" | "green" | "red", action: () => void }>({ open: false, title: "", desc: "", type: "black", action: () => { } });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const s = await apiFetch("/caixa/status").catch(() => null);
            setStatus(s);
            let ext;
            // Se o periodo for os ultimos 7 dias e caixa aberto, usa extrato normal senão periodo
            ext = await apiFetch(`/caixa/extrato-por-periodo?inicio=${inicio}&fim=${fim}`);
            setExtrato(ext);
        } catch { setExtrato({ movimentos: [], saldo_inicial: 0, saldo_atual: 0, total_entradas: 0, total_saidas: 0, qtd_caixas: 0, periodo_inicio: inicio, periodo_fim: fim }); }
        setLoading(false);
    }, [inicio, fim]);

    // FUNCAO PARA GERAR DIAS VAZIOS ENTRE INICIO E FIM
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

            // CARREGA VENDAS DO PERIODO SELECIONADO
            const qsV = new URLSearchParams({ inicio, fim, skip: "0", limit: "1000" });
            const rV = await fetch(`${BASE}/vendas/?${qsV}`, { headers: getAuthHeaders() as any, cache: "no-store" as any });
            if (rV.ok) {
                const dV = await rV.json();
                const vendas = dV.items || dV.vendas || dV || [];

                const mapProdutos = new Map<string, any>();
                const mapDia = new Map<string, any>();

                // Preenche todos os dias do periodo com zero para grafico ficar continuo
                const diasBase = gerarDiasDoPeriodo(inicio, fim);
                diasBase.forEach(d => mapDia.set(d.dia, d));

                for (const v of vendas) {
                    if (v.status && v.status!== "CONCLUIDA") continue;
                    const dataV = new Date(v.created_at || v.criado_em);
                    const diaKey = dataV.toLocaleDateString('en-CA', { timeZone: 'Africa/Luanda' });
                    const diaLabel = dataV.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', timeZone: 'Africa/Luanda' });

                    if (!mapDia.has(diaKey)) {
                        mapDia.set(diaKey, { dia: diaKey, diaLabel, total: 0, qtd: 0, ticket: 0 });
                    }
                    const curDia = mapDia.get(diaKey);
                    curDia.total += Number(v.total || 0);
                    curDia.qtd += 1;
                    curDia.ticket = curDia.qtd > 0? curDia.total / curDia.qtd : 0;

                    for (const it of (v.itens || [])) {
                        const pid = String(it.produto_id);
                        const cur = mapProdutos.get(pid) || { qtd_vendida: 0, faturamento: 0, nome_produto: it.nome_produto, produto_id: pid };
                        cur.qtd_vendida += Number(it.quantidade || 0);
                        cur.faturamento += Number(it.total || 0);
                        mapProdutos.set(pid, cur);
                    }
                }

                const porDia = Array.from(mapDia.values()).sort((a, b) => new Date(a.dia).getTime() - new Date(b.dia).getTime());
                setVendasPorDia(porDia);

                // Ranking de produtos DO PERIODO selecionado
                let ranking = Array.from(mapProdutos.values()).map((m: any) => {
                    const db = items.find((p: any) => String(p.id) === String(m.produto_id));
                    return {...m,...db, nome: db?.nome || m.nome_produto, imagem_url: db?.imagem_url, preco_venda: db?.preco_venda, stock_atual: db?.stock_atual, controlar_stock: db?.controlar_stock, categoria: db?.categoria };
                }).sort((a, b) => b.qtd_vendida - a.qtd_vendida).slice(0, 8).map((p, i) => ({...p, rank: i + 1 }));

                if (ranking.length > 0) setMaisVendidos(ranking);
                else setMaisVendidos([]); // Se não vendeu nada no periodo, não mostra nada
            }
        } catch (e) { console.log("erro produtos db", e); }
    }, [inicio, fim]);

    useEffect(() => { const saved = localStorage.getItem(STORAGE_KEY); if (saved!== null) setShowExtrato(saved === "true"); }, []);
    useEffect(() => { load(); loadProdutosDb(); }, [load, loadProdutosDb]);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (menuRef.current &&!menuRef.current.contains(e.target as Node)) setMenuOpen(false); if (menuRefMobile.current &&!menuRefMobile.current.contains(e.target as Node)) setMenuOpen(false); };
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
    const handleBaixar = () => { setMenuOpen(false); const linhas = [["Data", "Tipo", "Valor"]]; movs.forEach((m: any) => { linhas.push([formatDateTimeFull(m.criado_em), m.tipo, String(m.valor)]); }); const csv = linhas.map(r => r.join(";")).join("\n"); const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `relatorio-${inicio}_a_${fim}.csv`; a.click(); URL.revokeObjectURL(url); };
    const handleImprimir = () => { setMenuOpen(false); const win = window.open("", "_blank"); if (!win) return; win.document.write(`<html><body><h2>${inicio} a ${fim}</h2><table>${movs.map((m: any) => `<tr><td>${formatDateTimeFull(m.criado_em)}</td><td>${m.tipo}</td><td>${fmt(Number(m.valor))}</td></tr>`).join("")}</table><script>window.print()</script></body></html>`); win.document.close(); };

    if (loading &&!extrato) return <div className="bg-white rounded-[20px] p-8 animate-pulse h-[300px]" />;
    const caixaAtual = status?.caixa_atual; const dataAberturaFull = caixaAtual?.aberto_em? formatDateTimeFull(caixaAtual.aberto_em) : "";

    return (
        <div className="space-y-4">
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none; scrollbar-width:none;}`}</style>

            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2 flex-1">
                    <div className="h-[46px] flex-1"><JCalendarPicker value={inicio} onChange={setInicio} /></div>
                    <div className="h-[46px] flex-1"><JCalendarPicker value={fim} onChange={setFim} /></div>
                </div>
                <div className="relative" ref={menuRef}><button onClick={() => setMenuOpen(o =>!o)} className="h-[46px] w-[46px] bg-black text-white rounded-full flex items-center justify-center">≡</button>{menuOpen && (<div className="absolute right-0 top-[52px] w-[180px] bg-white border rounded-[16px] shadow-xl overflow-hidden z-50"><button onClick={handleBaixar} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50">Baixar</button><button onClick={handleImprimir} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50">Imprimir</button></div>)}</div>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 -mx-4 px-4 md:mx-0 md:px-0 md:gap-4 md:grid md:grid-cols-3 pb-2">
                <div onClick={() => handleCardClick("master")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer"><MasterCard aberto={!!status?.aberto} atual={atual} nomeRestaurante={caixaAtual?.aberto_por_nome? `Resp: ${caixaAtual?.aberto_por_nome}` : "J-OS RESTAURANTE"} dataAbertura={dataAberturaFull} horaAbertura={dataAberturaFull} /></div>
                <div onClick={() => handleCardClick("entradas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer"><EntradasCard entradas={entradas} nome="J-OS RESTAURANTE" dataHoje={inicio.slice(5).replace("-", "/")} qtdVendas={movs.filter((m: any) => (m.tipo || "").toUpperCase().includes("VENDA")).length} /></div>
                <div onClick={() => handleCardClick("saidas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer"><SaidasCard saidas={saidas} nome="J-OS RESTAURANTE" hora={new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} retirado={saidas > 0? '1' : '0'} /></div>
            </div>

            <div className="space-y-3">
                <div className="flex gap-2">{(["All Sales", "Pending", "Completed"] as const).map(t => (<button key={t} onClick={() => setFiltroSales(t)} className={`px-4 py-1.5 rounded-full text-[11px] font-black transition ${filtroSales === t? "bg-[#8B6A5A] text-white" : "bg-white border text-zinc-500"}`}>{t}</button>))}</div>

                <div className="bg-white rounded-[28px] border border-black/5 p-4 md:p-5 shadow-sm">
                    <div className="grid md:grid-cols-[1.6fr_1fr] gap-6">
                        <div>
                            <GraficoVendas vendasPorDia={vendasPorDia} filtro={filtroSales} inicio={inicio} fim={fim} />
                        </div>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-3 p-3 rounded-[16px] border bg-white">
                                <div className="flex -space-x-2">{top4.slice(0, 2).map((p: any, i: number) => (<img key={i} src={getImgUrl(p.imagem_url)} onError={(e: any) => e.currentTarget.src = FALLBACK_IMG} className="w-10 h-10 rounded-full object-cover border-2 border-white" />))}</div>
                                <div><div className="text-[12px] font-black leading-none">Top-Selling Products</div><div className="text-[10px] text-zinc-500 mt-1 leading-tight">{top4[0]?.nome || "Sem vendas no período"}</div></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-[16px] bg-[#8B6A5A] text-white shadow-lg -mx-1">
                                <div className="flex -space-x-2">{top4.slice(0, 3).map((p: any, i: number) => (<img key={i} src={getImgUrl(p.imagem_url)} onError={(e: any) => e.currentTarget.src = FALLBACK_IMG} className="w-8 h-8 rounded-full object-cover border-2 border-[#8B6A5A]" />))}</div>
                                <div><div className="text-[12px] font-black leading-none">Trending Now</div><div className="text-[10px] opacity-80 mt-1">"{top4[0]?.qtd_vendida || 0} vendidos ✨"</div></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-[16px] border bg-white">
                                <div className="flex -space-x-2">{top4.slice(0, 4).map((p: any, i: number) => (<img key={i} src={getImgUrl(p.imagem_url)} onError={(e: any) => e.currentTarget.src = FALLBACK_IMG} className="w-8 h-8 rounded-full object-cover border-2 border-white" />))}</div>
                                <div><div className="text-[12px] font-black leading-none">Best sellers</div><div className="text-[10px] text-zinc-500 mt-1 leading-tight">Faturamento Kz {fmt(top4.reduce((a: any, b: any) => a + Number(b.faturamento || 0), 0))}</div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="w-full bg-white border rounded-full px-4 py-3 flex items-center justify-center gap-3 text-[12px] font-black shadow-sm">
                        <span className="whitespace-nowrap">📅 {inicio}</span>
                        <span className="opacity-30">To</span>
                        <span className="whitespace-nowrap">📅 {fim}</span>
                    </div>
                    <div className="text-[11px] font-bold text-zinc-400 text-left px-1">
                        {vendasPorDia.length} dias • {maisVendidos.length} produtos • Período dinâmico
                    </div>
                </div>

                <div className="grid gap-2.5 md:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {top4.length === 0? (<div className="col-span-4 py-10 text-center bg-white rounded-[22px] border text-[12px] text-zinc-400">Nenhuma venda neste período de {inicio} a {fim}</div>) : (top4.map((p: any) => (<ProdutoMaisVendidoCard key={p.produto_id || p.id} p={p} />)))}
                </div>
            </div>

            <div className="flex justify-end pt-2"><button onClick={() => { const v =!showExtrato; setShowExtrato(v); localStorage.setItem(STORAGE_KEY, String(v)); }} className="flex items-center gap-2"><div className={`w-[44px] h-[26px] rounded-full p-[3px] transition-colors ${showExtrato? 'bg-green-500' : 'bg-zinc-300'}`}><div className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all ${showExtrato? 'translate-x-[18px]' : 'translate-x-0'}`} /></div></button></div>
            {showExtrato && <ExtratoList movimentos={movs} selectedDate={extrato?.periodo_inicio || inicio} statusCaixa={status} />}
            <JConfirm open={confirm.open} title={confirm.title} desc={confirm.desc} type={confirm.type} onClose={() => setConfirm(s => ({...s, open: false }))} onConfirm={confirm.action} />
            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={status?.caixa_atual || extrato} onClose={() => setModalOpen(false)} onSuccess={async () => { await load(); loadProdutosDb(); toast.success("Caixa atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={() => setSangriaOpen(false)} onSuccess={async () => { await load(); loadProdutosDb(); toast.success("Movimento registrado!"); }} />
        </div>
    )
}
