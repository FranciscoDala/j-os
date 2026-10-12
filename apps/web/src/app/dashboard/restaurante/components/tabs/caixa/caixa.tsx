"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { CaixaModal } from "./modals/open_close";
import { SangriaModal } from "./modals/saida";
import { MasterCard, EntradasCard, SaidasCard } from "./cards/cards_master";
import { JCalendarPicker } from "./cards/date-picker";
import { JConfirm } from "./modals/confirm";
import { ExtratoList } from "./table/extrato-list";
import { toast } from "sonner";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
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

const formatDateTimeFull = (iso: string) => {
    try {
        if (!iso) return "--";
        return new Date(iso).toLocaleString('pt-PT', { timeZone: 'Africa/Luanda', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
};

export function CaixaTab() {
    const [status, setStatus] = useState<any>(null);
    const [extrato, setExtrato] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [inicio, setInicio] = useState(todayISO());
    const [fim, setFim] = useState(todayISO());
    const [showExtrato, setShowExtrato] = useState(false);
    const [produtosDb, setProdutosDb] = useState<any[]>([]);
    const [filtroSales, setFiltroSales] = useState<"All Sales"|"Pending"|"Completed">("All Sales");
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
            const hoje = todayISO();
            let ext;
            if (inicio === hoje && fim === hoje && s?.aberto) ext = await apiFetch("/caixa/extrato");
            else ext = await apiFetch(`/caixa/extrato-por-periodo?inicio=${inicio}&fim=${fim}`);
            setExtrato(ext);
        } catch {
            setExtrato({ movimentos: [], saldo_inicial: 0, saldo_atual: 0, total_entradas: 0, total_saidas: 0, qtd_caixas: 0, periodo_inicio: inicio, periodo_fim: fim });
        }
        setLoading(false);
    }, [inicio, fim]);

    // PRODUTOS DO BANCO - MESMO CODIGO DA VENDAS TAB
    const loadProdutosDb = useCallback(async () => {
        try {
            const qs = new URLSearchParams({ skip: "0", limit: "100", search: "" });
            const r = await fetch(`${BASE}/produtos/?${qs}`, {
                headers: getAuthHeaders() as any,
                cache: "no-store" as any
            });
            const data = await r.json();
            const items = data.items || data || [];
            const ativos = items.filter((p: any) => p.ativo!== false);
            setProdutosDb(ativos);
        } catch (e) {
            console.log("erro produtos db", e);
        }
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved!== null) setShowExtrato(saved === "true");
        else setShowExtrato(false);
    }, []);

    useEffect(() => { load(); loadProdutosDb(); }, [load, loadProdutosDb]);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (menuRef.current &&!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
            if (menuRefMobile.current &&!menuRefMobile.current.contains(e.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    useEffect(() => {
        const hoje = todayISO();
        const isHoje = inicio === hoje && fim === hoje;
        const onExtratoPush = (e: any) => {
            if (!isHoje) { load(); return; }
            const m = e.detail?.data || e.detail;
            if (!m) return;
            const valor = Number(m.valor?? m.total_venda?? m.total?? 0);
            if (!m.id && valor === 0) return;
            setExtrato((prev: any) => {
                if (!prev) return prev;
                if (m.id && prev.movimentos?.some((x: any) => x.id === m.id)) return prev;
                if (m.venda_id && prev.movimentos?.some((x: any) => x.venda_id === m.venda_id)) return prev;
                const novoMovs = [m,...(prev.movimentos || [])];
                return {
                   ...prev,
                    movimentos: novoMovs,
                    saldo_atual: Number(prev.saldo_atual || 0) + valor,
                    total_entradas: valor > 0? Number(prev.total_entradas || 0) + valor : prev.total_entradas,
                    total_saidas: valor < 0? Number(prev.total_saidas || 0) + valor : prev.total_saidas,
                };
            });
        };
        const onCaixaFullUpdate = () => { load(); loadProdutosDb(); };
        window.addEventListener("caixa:extrato" as any, onExtratoPush);
        window.addEventListener("caixa:update" as any, onCaixaFullUpdate);
        window.addEventListener("caixa.updated" as any, onCaixaFullUpdate);
        window.addEventListener("caixa:atualizado" as any, onCaixaFullUpdate);
        window.addEventListener("venda:nova" as any, onExtratoPush);
        window.addEventListener("venda:fechada" as any, onExtratoPush);
        window.addEventListener("venda:update" as any, onExtratoPush);
        window.addEventListener("produto:update" as any, loadProdutosDb);
        window.addEventListener("produto:created" as any, loadProdutosDb);
        return () => {
            window.removeEventListener("caixa:extrato" as any, onExtratoPush);
            window.removeEventListener("caixa:update" as any, onCaixaFullUpdate);
            window.removeEventListener("caixa.updated" as any, onCaixaFullUpdate);
            window.removeEventListener("caixa:atualizado" as any, onCaixaFullUpdate);
            window.removeEventListener("venda:nova" as any, onExtratoPush);
            window.removeEventListener("venda:fechada" as any, onExtratoPush);
            window.removeEventListener("venda:update" as any, onExtratoPush);
            window.removeEventListener("produto:update" as any, loadProdutosDb);
            window.removeEventListener("produto:created" as any, loadProdutosDb);
        };
    }, [inicio, fim, load, loadProdutosDb]);

    const movs = extrato?.movimentos || [];
    const entradas = Number(extrato?.total_entradas || 0);
    const saidas = Math.abs(Number(extrato?.total_saidas || 0));
    const atual = Number(extrato?.saldo_atual?? 0);
    const top4 = useMemo(()=> produtosDb.slice(0,4), [produtosDb]);

    const handleCardClick = (type: "master" | "entradas" | "saidas") => {
        if (type === "master") {
            if (status?.aberto) setConfirm({ open: true, title: "Fechar caixa?", desc: `Saldo Kz ${fmt(atual)}. Fechar?`, type: "black", action: () => { setModalMode("fechar"); setModalOpen(true); } });
            else setConfirm({ open: true, title: "Abrir caixa?", desc: "Iniciar novo turno.", type: "black", action: () => { setModalMode("abrir"); setModalOpen(true); } });
        }
        if (type === "entradas") {
            if (!status?.aberto) { toast.error("ATT: você não podes adicionar valores sem antes abrir um caixa, porfavor abra o seu caixa para prosseguir!"); return; }
            setConfirm({ open: true, title: "Suprimento?", desc: "Adicionar?", type: "green", action: () => { setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true); } });
        }
        if (type === "saidas") {
            if (!status?.aberto) { toast.error("ATT: você não podes fazer uma saída sem antes abrir um caixa, porfavor abra o seu caixa para prosseguir!"); return; }
            setConfirm({ open: true, title: "Sangria?", desc: "Retirar?", type: "red", action: () => { setSangriaTipo("SANGRIA"); setSangriaOpen(true); } });
        }
    };

    const handleBaixar = () => {
        setMenuOpen(false);
        const linhas = [["Data", "Tipo", "Valor", "Descricao", "Responsavel"]];
        movs.forEach((m: any) => {
            const data = formatDateTimeFull(m.criado_em || m.data);
            linhas.push([data, m.tipo, String(m.valor), (m.descricao || "").replace(/;/g, ","), m.criado_por_nome || m.aberto_por_nome || ""]);
        });
        linhas.push([]); linhas.push(["Periodo", `${inicio} ate ${fim}`]);
        linhas.push(["Caixa", status?.aberto? `Aberto por ${status?.caixa_atual?.aberto_por_nome} em ${formatDateTimeFull(status?.caixa_atual?.aberto_em)}` : "Fechado"]);
        const csv = linhas.map(r => r.join(";")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `relatorio-caixa-${inicio}_a_${fim}.csv`; a.click();
        URL.revokeObjectURL(url);
    };
    const handleImprimir = () => {
        setMenuOpen(false);
        const win = window.open("", "_blank"); if (!win) return;
        const responsavelCaixa = status?.caixa_atual?.aberto_por_nome? ` - Aberto por: ${status.caixa_atual.aberto_por_nome} em ${formatDateTimeFull(status.caixa_atual.aberto_em)}` : "";
        const html = `<html><head><title>Relatorio ${inicio} - ${fim}</title><style>body{font-family:monospace;padding:20px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:6px;font-size:11px} th{background:#000;color:#fff}.info{margin-bottom:10px;font-size:12px}</style></head><body><h2>J-OS - ${inicio} ate ${fim}</h2><div class="info">Caixa: ${status?.aberto? 'Aberto' : 'Fechado'}${responsavelCaixa}</div><table><thead><tr><th>Data/Hora</th><th>Tipo</th><th>Valor</th><th>Descricao</th><th>Responsavel</th></tr></thead><tbody>${movs.map((m: any) => `<tr><td>${formatDateTimeFull(m.criado_em)}</td><td>${m.tipo}</td><td>${fmt(Number(m.valor))}</td><td>${m.descricao || ''}</td><td>${m.criado_por_nome || m.aberto_por_nome || ''}</td></tr>`).join("")}</tbody></table><script>window.print()</script></body></html>`;
        win.document.write(html); win.document.close();
    };

    if (loading &&!extrato) return <div className="bg-white rounded-[20px] p-8 animate-pulse h-[300px]" />;

    const caixaAtual = status?.caixa_atual;
    const dataAberturaFull = caixaAtual?.aberto_em? formatDateTimeFull(caixaAtual.aberto_em) : "";

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
                            <button onClick={handleBaixar} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50">Baixar</button>
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
                            <button onClick={handleBaixar} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50">Baixar</button>
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
                <div onClick={() => handleCardClick("master")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <MasterCard
                        aberto={!!status?.aberto}
                        atual={atual}
                        nomeRestaurante={caixaAtual?.aberto_por_nome? `Resp: ${caixaAtual?.aberto_por_nome}` : "J-OS RESTAURANTE"}
                        dataAbertura={dataAberturaFull? dataAberturaFull.split(',')[0] || dataAberturaFull.split(' ')[0] : inicio.slice(5).replace("-", "/")}
                        horaAbertura={dataAberturaFull? dataAberturaFull.split(',').pop()?.trim() || dataAberturaFull : (movs[0]? new Date(movs[0].criado_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : "--:--")}
                    />
                </div>
                <div onClick={() => handleCardClick("entradas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <EntradasCard entradas={entradas} nome="J-OS RESTAURANTE" dataHoje={inicio.slice(5).replace("-", "/")} qtdVendas={movs.filter((m: any) => (m.tipo || "").toUpperCase().includes("VENDA")).length} />
                </div>
                <div onClick={() => handleCardClick("saidas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <SaidasCard saidas={saidas} nome="J-OS RESTAURANTE" hora={new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} retirado={saidas > 0? '1' : '0'} />
                </div>
            </div>

            {/* ===== RELATORIO PRODUTOS - IGUAL AO PRINT - PEGA DO BANCO ===== */}
            <div className="space-y-3">
                <div className="flex gap-2">
                    {(["All Sales","Pending","Completed"] as const).map(t=>(
                        <button key={t} onClick={()=>setFiltroSales(t)} className={`px-4 py-1.5 rounded-full text-[11px] font-black transition ${filtroSales===t? "bg-[#8B6A5A] text-white" : "bg-white border text-zinc-500"}`}>{t}</button>
                    ))}
                </div>

                <div className="bg-white rounded-[28px] border border-black/5 p-4 md:p-5 shadow-sm">
                    <div className="grid md:grid-cols-[1.6fr_1fr] gap-6">
                        <div>
                            <div className="flex gap-4 mb-5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8B6A5A]"/>Series 1</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#9B8B7F]"/>Series 2</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-zinc-200"/>Series 3</span>
                            </div>
                            <div className="relative h-[170px]">
                                <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] text-zinc-400 w-8">
                                    <span>50</span><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span>
                                </div>
                                <svg className="absolute left-10 right-0 top-0 bottom-6 w-[calc(100%-40px)] h-[146px]" viewBox="0 0 300 146">
                                    {[0,29,58,87,116].map(y=> <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="#F5F2EF" strokeWidth="1"/>)}
                                    <polyline fill="none" stroke="#8B6A5A" strokeWidth="2.5" points="0,100 75,60 150,70 225,40 300,50" />
                                    <polyline fill="none" stroke="#6B5B54" strokeWidth="2.2" points="0,146 75,120 150,35 225,50 300,70" />
                                    <polyline fill="none" stroke="#E5DDD6" strokeWidth="2" points="0,130 75,85 150,55 225,65 300,80" />
                                </svg>
                                <div className="absolute bottom-0 left-10 right-0 flex justify-between text-[10px] font-bold text-zinc-400">
                                    <span>Item 1</span><span>Item 2</span><span>Item 3</span><span>Item 4</span><span>Item 5</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <div className="flex items-center gap-3 p-3 rounded-[16px] border bg-white">
                                <div className="flex -space-x-2">
                                    {top4.slice(0,2).map((p:any,i:number)=><img key={i} src={p.imagem_url? `${API_URL}${p.imagem_url}` : "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100"} className="w-10 h-10 rounded-full object-cover border-2 border-white"/>)}
                                </div>
                                <div><div className="text-[12px] font-black leading-none">Top-Selling Products</div><div className="text-[10px] text-zinc-500 mt-1 leading-tight">Highlight of our most popular premium products.</div></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-[16px] bg-[#8B6A5A] text-white shadow-lg -mx-1">
                                <div className="flex -space-x-2">
                                    {top4.slice(0,3).map((p:any,i:number)=><img key={i} src={p.imagem_url? `${API_URL}${p.imagem_url}` : "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100"} className="w-8 h-8 rounded-full object-cover border-2 border-[#8B6A5A]"/>)}
                                </div>
                                <div><div className="text-[12px] font-black leading-none">Trending Now</div><div className="text-[10px] opacity-80 mt-1">"Where sweetness meets simplicity ✨"</div></div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-[16px] border bg-white">
                                <div className="flex -space-x-2">
                                    {top4.slice(0,4).map((p:any,i:number)=><img key={i} src={p.imagem_url? `${API_URL}${p.imagem_url}` : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100"} className="w-8 h-8 rounded-full object-cover border-2 border-white"/>)}
                                </div>
                                <div><div className="text-[12px] font-black leading-none">Best sellers</div><div className="text-[10px] text-zinc-500 mt-1 leading-tight">Food items that consistently lead our sales charts.</div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <div className="bg-white border rounded-full px-4 py-2 flex items-center gap-2 text-[11px] font-black shadow-sm">
                        <span>📅 {inicio}</span><span className="opacity-30">To</span><span>📅 {fim}</span>
                    </div>
                    <div className="flex gap-2 text-[11px] font-bold text-zinc-400"><span>‹</span><span>1</span><span className="text-black">2</span><span>3</span><span>›</span></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {produtosDb.length===0? (
                        <div className="col-span-4 py-10 text-center bg-white rounded-[20px] border text-[12px] text-zinc-400">Nenhum produto no banco - cadastre em Produtos</div>
                    ) : (
                        top4.map((p:any)=>(
                            <div key={p.id} className="bg-white rounded-[20px] p-2.5 border border-black/5 shadow-sm">
                                <div className="aspect-square rounded-[14px] overflow-hidden bg-[#F6F3F0] mb-3">
                                    {p.imagem_url? <img src={`${API_URL}${p.imagem_url}`} alt={p.nome} className="w-full h-full object-cover"/> : <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-[10px]">Sem foto</div>}
                                </div>
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-[13px] font-black">Kz {fmt(Number(p.preco_venda||0))}</span>
                                    <span className="w-px h-3 bg-zinc-300"/>
                                    <span className="text-[11px] font-bold truncate">{p.nome}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button onClick={() => { const v =!showExtrato; setShowExtrato(v); localStorage.setItem(STORAGE_KEY, String(v)); }} className="flex items-center gap-2">
                    <div className={`w-[44px] h-[26px] rounded-full p-[3px] transition-colors ${showExtrato? 'bg-green-500' : 'bg-zinc-300'}`}>
                        <div className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transition-all ${showExtrato? 'translate-x-[18px]' : 'translate-x-0'}`} />
                    </div>
                </button>
            </div>

            {showExtrato && <ExtratoList movimentos={movs} selectedDate={extrato?.periodo_inicio || inicio} statusCaixa={status} />}

            <JConfirm open={confirm.open} title={confirm.title} desc={confirm.desc} type={confirm.type} onClose={() => setConfirm(s => ({...s, open: false }))} onConfirm={confirm.action} />
            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={status?.caixa_atual || extrato} onClose={() => setModalOpen(false)} onSuccess={async () => { await load(); toast.success("Caixa atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={() => setSangriaOpen(false)} onSuccess={async () => { await load(); toast.success("Movimento registrado!"); }} />
        </div>
    )
}
