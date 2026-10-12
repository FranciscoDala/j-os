"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { CaixaModal } from "./modals/open_close";
import { SangriaModal } from "./modals/saida";
import { MasterCard, EntradasCard, SaidasCard } from "./cards/cards_master";
import { JCalendarPicker } from "./cards/date-picker";
import { JConfirm } from "./modals/confirm";
import { ExtratoList } from "./table/extrato-list";
import { JSelect } from "./select/j-select";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Crown, Flame } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com";
const BASE = `${API_URL.replace(/\/$/, "")}/api/v1`;

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
const TAB_KEY = "j-os:caixa_tab";

const formatDateTimeFull = (iso: string) => {
    try { if (!iso) return "--"; return new Date(iso).toLocaleString('pt-PT', { timeZone: 'Africa/Luanda', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
};
const formatDia = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }); } catch { return iso; }
};

export function CaixaTab() {
    const [status, setStatus] = useState<any>(null);
    const [extrato, setExtrato] = useState<any>(null);
    const [produtosRank, setProdutosRank] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inicio, setInicio] = useState(todayISO());
    const [fim, setFim] = useState(todayISO());
    const [showExtrato, setShowExtrato] = useState(true);
    const [activeTab, setActiveTab] = useState<any>("extrato");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"abrir" | "fechar" | "forcar">("abrir");
    const [sangriaOpen, setSangriaOpen] = useState(false);
    const [sangriaTipo, setSangriaTipo] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");
    const [menuOpen, setMenuOpen] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const menuRefMobile = useRef<HTMLDivElement>(null);
    const [confirm, setConfirm] = useState<{ open: boolean, title: string, desc: string, type: "black" | "green" | "red", action: () => void }>({ open: false, title: "", desc: "", type: "black", action: () => {} });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const s = await apiFetch("/caixa/status").catch(() => null);
            setStatus(s);
            const hoje = todayISO();
            let ext;
            if (inicio === hoje && fim === hoje && s?.aberto) ext = await apiFetch("/caixa/extrato");
            else ext = await apiFetch(`/caixa/extrato-por-periodo?inicio=${inicio}&fim=${fim}`);
            setExtrato(ext);

            // produtos ranking
            const prod = await apiFetch(`/relatorios/produtos?inicio=${inicio}&fim=${fim}`).catch(async () => {
                // fallback: tenta /produtos/mais-vendidos ou usa vendas
                const v = await apiFetch(`/vendas/relatorio?inicio=${inicio}&fim=${fim}`).catch(() => null);
                return v?.produtos || v?.ranking || [];
            });
            if (Array.isArray(prod)) setProdutosRank(prod);
            else if (prod?.ranking) setProdutosRank(prod.ranking);
            else if (prod?.mais_vendidos) setProdutosRank(prod.mais_vendidos);
        } catch {
            setExtrato({ movimentos: [], saldo_inicial: 0, saldo_atual: 0, total_entradas: 0, total_saidas: 0, qtd_caixas: 0, periodo_inicio: inicio, periodo_fim: fim });
        }
        setLoading(false);
    }, [inicio, fim]);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved!== null) setShowExtrato(saved === "true");
        const t = localStorage.getItem(TAB_KEY);
        if (t) setActiveTab(t);
    }, []);
    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (menuRef.current &&!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
            if (menuRefMobile.current &&!menuRefMobile.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const movs = extrato?.movimentos || [];
    const entradas = Number(extrato?.total_entradas || 0);
    const saidas = Math.abs(Number(extrato?.total_saidas || 0));
    const atual = Number(extrato?.saldo_atual?? 0);

    // GRAFICO POR DIA
    const vendasPorDia = useMemo(() => {
        const map: Record<string, number> = {};
        movs.filter((m: any) => (m.tipo || "").toUpperCase().includes("VENDA") || Number(m.valor) > 0).forEach((m: any) => {
            const d = (m.criado_em || m.data || "").slice(0, 10);
            if (!d) return;
            map[d] = (map[d] || 0) + Math.abs(Number(m.valor || 0));
        });
        const arr = Object.entries(map).sort((a,b) => a[0].localeCompare(b[0])).map(([dia, total]) => ({ dia, total, label: formatDia(dia) }));
        // se periodo maior que 7 dias, agrupa mas mantem
        return arr;
    }, [movs]);

    const maxVendas = Math.max(...vendasPorDia.map(v => v.total), 1);

    // PRODUTOS MAIS E MENOS VENDIDOS
    const maisVendidos = useMemo(() => [...produtosRank].sort((a,b) => (b.qtd_vendida||b.quantidade||0) - (a.qtd_vendida||a.quantidade||0)).slice(0,5), [produtosRank]);
    const menosVendidos = useMemo(() => [...produtosRank].sort((a,b) => (a.qtd_vendida||a.quantidade||0) - (b.qtd_vendida||b.quantidade||0)).slice(0,5), [produtosRank]);

    const handleCardClick = (type: "master" | "entradas" | "saidas") => {
        if (type === "master") {
            if (status?.aberto) setConfirm({ open: true, title: "Fechar caixa?", desc: `Saldo Kz ${fmt(atual)}. Fechar?`, type: "black", action: () => { setModalMode("fechar"); setModalOpen(true); } });
            else setConfirm({ open: true, title: "Abrir caixa?", desc: "Iniciar novo turno.", type: "black", action: () => { setModalMode("abrir"); setModalOpen(true); } });
        }
        if (type === "entradas") {
            if (!status?.aberto) { toast.error("Abre o caixa primeiro!"); return; }
            setConfirm({ open: true, title: "Suprimento?", desc: "Adicionar?", type: "green", action: () => { setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true); } });
        }
        if (type === "saidas") {
            if (!status?.aberto) { toast.error("Abre o caixa primeiro!"); return; }
            setConfirm({ open: true, title: "Sangria?", desc: "Retirar?", type: "red", action: () => { setSangriaTipo("SANGRIA"); setSangriaOpen(true); } });
        }
    };

    const handleBaixar = () => {
        setMenuOpen(false);
        const linhas = [["Data", "Tipo", "Valor", "Descricao"]];
        movs.forEach((m: any) => { linhas.push([formatDateTimeFull(m.criado_em), m.tipo, String(m.valor), (m.descricao||"").replace(/;/g,",")]); });
        const csv = linhas.map(r=>r.join(";")).join("\n");
        const blob = new Blob(["\uFEFF"+csv], {type:"text/csv"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`relatorio-${activeTab}-${inicio}_a_${fim}.csv`; a.click(); URL.revokeObjectURL(url);
    };

    if (loading &&!extrato) return <div className="bg-white rounded-[20px] p-8 animate-pulse h-[300px]" />;
    const caixaAtual = status?.caixa_atual;
    const dataAberturaFull = caixaAtual?.aberto_em? formatDateTimeFull(caixaAtual.aberto_em) : "";

    return (
        <div className="space-y-4">
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none; scrollbar-width:none;}`}</style>

            {/* HEADER DESKTOP */}
            <div className="hidden md:flex items-center justify-between gap-3">
                <div className="flex gap-2">
                    <div className="h-[46px] w-[160px]"><JCalendarPicker value={inicio} onChange={setInicio} /></div>
                    <div className="h-[46px] w-[160px]"><JCalendarPicker value={fim} onChange={setFim} /></div>
                </div>
                <div className="flex items-center gap-2">
                    <JSelect value={activeTab} onChange={setActiveTab} />
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setMenuOpen(o=>!o)} className="h-[46px] w-[46px] bg-black text-white rounded-full flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></button>
                        {menuOpen && (<div className="absolute right-0 top-[52px] w-[180px] bg-white border rounded-[16px] shadow-xl overflow-hidden z-50"><button onClick={handleBaixar} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50">Baixar CSV</button></div>)}
                    </div>
                </div>
            </div>

            {/* MOBILE */}
            <div className="flex md:hidden flex-col gap-3">
                <JSelect value={activeTab} onChange={setActiveTab} />
                <div className="flex gap-2 justify-between">
                    <button onClick={() => setShowDateModal(true)} className="flex-1 h-[46px] bg-[#EDEBE6] border rounded-full text-[11px] font-black uppercase tracking-widest"> {inicio.slice(5)} até {fim.slice(5)} </button>
                    <button onClick={handleBaixar} className="h-[46px] w-[46px] bg-black text-white rounded-full flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></button>
                </div>
            </div>

            {showDateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:hidden">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDateModal(false)} />
                    <div className="relative w-full max-w-[340px] bg-[#EDEBE6] rounded-[24px] p-1.5 shadow-2xl">
                        <div className="bg-white rounded-[18px] p-5">
                            <h3 className="text-[14px] font-black uppercase tracking-widest mb-4 text-center">Filtrar período</h3>
                            <div className="space-y-3"><div className="h-[46px] w-full"><JCalendarPicker value={inicio} onChange={setInicio} /></div><div className="h-[46px] w-full"><JCalendarPicker value={fim} onChange={setFim} /></div></div>
                            <button onClick={() => setShowDateModal(false)} className="mt-5 w-full h-[46px] bg-black text-white rounded-full text-[12px] font-black uppercase">Aplicar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CARDS */}
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 -mx-4 px-4 md:mx-0 md:px-0 md:gap-4 md:grid md:grid-cols-3 pb-2">
                <div onClick={() => handleCardClick("master")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition"><MasterCard aberto={!!status?.aberto} atual={atual} nomeRestaurante={caixaAtual?.aberto_por_nome? `Resp: ${caixaAtual?.aberto_por_nome}` : "J-OS RESTAURANTE"} dataAbertura={dataAberturaFull? dataAberturaFull.split(',')[0] : inicio.slice(5)} horaAbertura={dataAberturaFull? dataAberturaFull.split(',').pop()?.trim() || "" : "--:--"} /></div>
                <div onClick={() => handleCardClick("entradas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition"><EntradasCard entradas={entradas} nome="J-OS" dataHoje={inicio.slice(5)} qtdVendas={movs.filter((m:any)=>(m.tipo||"").toUpperCase().includes("VENDA")).length} /></div>
                <div onClick={() => handleCardClick("saidas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition"><SaidasCard saidas={saidas} nome="J-OS" hora={new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})} retirado={saidas>0?'1':'0'} /></div>
            </div>

            <div className="flex justify-end">
                <button onClick={() => { const v=!showExtrato; setShowExtrato(v); localStorage.setItem(STORAGE_KEY, String(v)); }}><div className={`w-[44px] h-[26px] rounded-full p-[3px] transition-colors ${showExtrato?'bg-green-500':'bg-zinc-300'}`}><div className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all ${showExtrato?'translate-x-[18px]':''}`} /></div></button>
            </div>

            {showExtrato && (
                <>
                    {activeTab === "extrato" && <ExtratoList movimentos={movs} selectedDate={extrato?.periodo_inicio || inicio} statusCaixa={status} />}

                    {activeTab === "vendas" && (
                        <div className="space-y-4">
                            {/* GRAFICO */}
                            <div className="bg-[#EDEBE6] border border-black/10 rounded-[24px] p-[6px]">
                                <div className="bg-white rounded-[18px] p-5">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-black text-[12px] uppercase tracking-widest flex items-center gap-2"><TrendingUp size={16}/> Vendas por dia</h3>
                                        <span className="text-[11px] text-zinc-500 font-bold">{inicio} até {fim}</span>
                                    </div>
                                    {vendasPorDia.length===0? <div className="py-10 text-center text-[12px] text-zinc-400">Sem vendas neste período</div> : (
                                        <div className="flex items-end gap-2 h-[160px] px-2">
                                            {vendasPorDia.map((v,i)=>(
                                                <div key={v.dia} className="flex-1 flex flex-col items-center gap-2 group">
                                                    <div className="relative w-full flex justify-center" style={{height: '130px'}}>
                                                        <div className="absolute bottom-0 w-full max-w-[48px] bg-black rounded-t-[10px] transition-all group-hover:bg-zinc-800" style={{height: `${(v.total/maxVendas)*100}%`, minHeight: v.total>0?'8px':'2px'}} />
                                                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-full transition">Kz {fmt(v.total)}</div>
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase text-zinc-500">{v.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* LISTA VENDAS */}
                            <div className="bg-[#EDEBE6] border border-black/10 rounded-[24px] p-[6px]">
                                <div className="bg-white rounded-[18px] divide-y">
                                    {movs.filter((m:any)=>(m.tipo||"").toUpperCase().includes("VENDA")).slice(0,20).map((m:any)=>(
                                        <div key={m.id||m.venda_id} className="flex items-center justify-between p-4">
                                            <div><div className="text-[12px] font-black">{m.descricao||`Venda #${m.venda_id||m.id}`}</div><div className="text-[11px] text-zinc-500">{formatDateTimeFull(m.criado_em)} • {m.criado_por_nome||""}</div></div>
                                            <div className="text-[13px] font-black">Kz {fmt(Number(m.valor))}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "produtos" && (
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* MAIS VENDIDOS */}
                            <div className="bg-[#EDEBE6] border border-black/10 rounded-[24px] p-[6px]">
                                <div className="bg-white rounded-[18px] p-5">
                                    <h3 className="font-black text-[12px] uppercase tracking-widest flex items-center gap-2 mb-4"><Crown size={16} className="text-amber-500"/> Mais vendidos <span className="ml-auto bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px]">{maisVendidos.length} itens</span></h3>
                                    <div className="space-y-3">
                                        {maisVendidos.length===0? <div className="text-[12px] text-zinc-400 text-center py-8">Sem dados de produtos. Verifica endpoint /relatorios/produtos</div> :
                                        maisVendidos.map((p:any,i)=>(
                                            <div key={p.id||i} className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[12px] ${i===0?"bg-black text-white":i===1?"bg-zinc-800 text-white":"bg-zinc-100"}`}>{i+1}</div>
                                                <div className="flex-1 min-w-0"><div className="text-[12px] font-bold truncate">{p.nome||p.nome_produto||"Produto"}</div><div className="text-[11px] text-zinc-500">{p.qtd_vendida||p.quantidade||0} un • Kz {fmt(Number(p.total||p.total_vendido||0))}</div></div>
                                                <div className="w-20 h-2 bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-black" style={{width:`${Math.min(100,((p.qtd_vendida||0)/(maisVendidos[0]?.qtd_vendida||1))*100)}%`}} /></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* MENOS VENDIDOS */}
                            <div className="bg-[#EDEBE6] border border-black/10 rounded-[24px] p-[6px]">
                                <div className="bg-white rounded-[18px] p-5">
                                    <h3 className="font-black text-[12px] uppercase tracking-widest flex items-center gap-2 mb-4"><Flame size={16} className="text-red-500"/> Menos vendidos <span className="ml-auto bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px]">Atenção</span></h3>
                                    <div className="space-y-3">
                                        {menosVendidos.length===0? <div className="text-[12px] text-zinc-400 text-center py-8">Sem dados</div> :
                                        menosVendidos.map((p:any,i)=>(
                                            <div key={p.id||i} className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-black text-[11px] text-zinc-500"><TrendingDown size={14}/></div>
                                                <div className="flex-1 min-w-0"><div className="text-[12px] font-bold truncate">{p.nome||p.nome_produto||"Produto"}</div><div className="text-[11px] text-zinc-500">{p.qtd_vendida||p.quantidade||0} un</div></div>
                                                <div className="text-[11px] font-bold text-red-600">Baixo giro</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "geral" && (
                        <div className="bg-[#EDEBE6] border border-black/10 rounded-[24px] p-[6px]">
                            <div className="bg-white rounded-[18px] p-5 space-y-4">
                                <h3 className="font-black text-[12px] uppercase tracking-widest">Resumo Geral - {inicio} até {fim}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-black text-white rounded-[16px] p-4"><div className="text-[10px] opacity-60 uppercase font-black">Faturamento</div><div className="text-[16px] font-black mt-1">Kz {fmt(entradas)}</div></div>
                                    <div className="bg-zinc-100 rounded-[16px] p-4"><div className="text-[10px] opacity-60 uppercase font-black">Saídas</div><div className="text-[16px] font-black mt-1">Kz {fmt(saidas)}</div></div>
                                    <div className="bg-green-500 text-white rounded-[16px] p-4"><div className="text-[10px] opacity-80 uppercase font-black">Lucro</div><div className="text-[16px] font-black mt-1">Kz {fmt(entradas - saidas)}</div></div>
                                    <div className="bg-white border rounded-[16px] p-4"><div className="text-[10px] opacity-60 uppercase font-black">Ticket Médio</div><div className="text-[16px] font-black mt-1">Kz {fmt(movs.length? entradas/movs.filter((m:any)=>(m.tipo||"").toUpperCase().includes("VENDA")).length||0 :0)}</div></div>
                                </div>
                                <div className="pt-2 text-[11px] text-zinc-500">Saldo atual em caixa: <span className="font-black text-black">Kz {fmt(atual)}</span></div>
                            </div>
                        </div>
                    )}
                </>
            )}

            <JConfirm open={confirm.open} title={confirm.title} desc={confirm.desc} type={confirm.type} onClose={() => setConfirm(s => ({...s, open: false }))} onConfirm={confirm.action} />
            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={status?.caixa_atual || extrato} onClose={() => setModalOpen(false)} onSuccess={async () => { await load(); toast.success("Caixa atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={() => setSangriaOpen(false)} onSuccess={async () => { await load(); toast.success("Movimento registrado!"); }} />
        </div>
    )
}
