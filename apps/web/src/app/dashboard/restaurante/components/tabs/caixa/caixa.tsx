"use client";
import { useEffect, useState, useRef } from "react";
import { CaixaModal } from "./modals/open_close";
import { SangriaModal } from "./modals/saida";
import { MasterCard, EntradasCard, SaidasCard } from "./cards/cards_master";
import { JCalendarPicker } from "./cards/date-picker";
import { JConfirm } from "./modals/confirm";
import { ExtratoList } from "./table/extrato-list";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com";
const BASE = `${API_URL.replace(/\/$/, "")}/api/v1`;
async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${BASE}${path}`, {...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`,...(options.headers || {}) } });
    const d = await res.json().catch(() => ({})); if (!res.ok) throw d; return d;
}
const fmt = (v: number) => Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const todayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Luanda' });

export function CaixaTab() {
    const [status, setStatus] = useState<any>(null);
    const [extrato, setExtrato] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [inicio, setInicio] = useState(todayISO());
    const [fim, setFim] = useState(todayISO());
    const [showExtrato, setShowExtrato] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"abrir" | "fechar" | "forcar">("abrir");
    const [sangriaOpen, setSangriaOpen] = useState(false);
    const [sangriaTipo, setSangriaTipo] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const [confirm, setConfirm] = useState<{open: boolean, title: string, desc: string, type: "black"|"green"|"red", action: ()=>void}>({open: false, title:"", desc:"", type:"black", action: ()=>{}});

    const load = async () => {
        setLoading(true);
        try {
            const s = await apiFetch("/caixa/status").catch(()=>null);
            setStatus(s);
            const hoje = todayISO();
            let ext;
            // REGRA FINAL TRAVADA:
            // Se periodo selecionado for HOJE (inicio==fim==hoje) e tem caixa ABERTO, mostra o caixa aberto
            // Se não, busca por abertura no periodo selecionado (sem fallback)
            if (inicio===hoje && fim===hoje && s?.aberto) {
                ext = await apiFetch("/caixa/extrato");
            } else {
                ext = await apiFetch(`/caixa/extrato-por-periodo?inicio=${inicio}&fim=${fim}`);
            }
            setExtrato(ext);
        } catch { setExtrato({ movimentos: [], saldo_inicial: 0, saldo_atual: 0, total_entradas: 0, total_saidas: 0, qtd_caixas: 0, periodo_inicio: inicio, periodo_fim: fim }); }
        setLoading(false);
    };

    useEffect(()=>{ load(); }, [inicio, fim]);
    useEffect(()=>{
        const h = (e: MouseEvent) => { if (menuRef.current &&!menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
        document.addEventListener("mousedown", h); return ()=>document.removeEventListener("mousedown", h);
    }, []);

    const movs = extrato?.movimentos || [];
    const entradas = Number(extrato?.total_entradas || 0);
    const saidas = Math.abs(Number(extrato?.total_saidas || 0));
    const atual = Number(extrato?.saldo_atual?? 0);
    const hojeISO = todayISO();
    const isHoje = inicio===hojeISO && fim===hojeISO;
    const isVazioHoje = isHoje &&!status?.aberto && movs.length===0;

    const handleCardClick = (type: "master" | "entradas" | "saidas") => {
        if (type === "master") {
            if (status?.aberto) setConfirm({ open: true, title: "Fechar caixa?", desc: `Saldo Kz ${fmt(atual)}. Fechar?`, type: "black", action: ()=>{ setModalMode("fechar"); setModalOpen(true); } });
            else setConfirm({ open: true, title: "Abrir caixa?", desc: "Iniciar novo turno.", type: "black", action: ()=>{ setModalMode("abrir"); setModalOpen(true); } });
        }
        if (type === "entradas") {
            if (!status?.aberto) { toast.error("Abra o caixa primeiro"); return; }
            setConfirm({ open: true, title: "Suprimento?", desc: "Adicionar?", type: "green", action: ()=>{ setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true); } });
        }
        if (type === "saidas") {
            if (!status?.aberto) { toast.error("Abra o caixa primeiro"); return; }
            setConfirm({ open: true, title: "Sangria?", desc: "Retirar?", type: "red", action: ()=>{ setSangriaTipo("SANGRIA"); setSangriaOpen(true); } });
        }
    };

    const handleBaixar = () => {
        setMenuOpen(false);
        const linhas = [["Data","Tipo","Valor","Descricao","Usuario"]];
        movs.forEach((m:any)=>{
            const data = new Date(m.criado_em).toLocaleString('pt-PT', { timeZone: 'Africa/Luanda' });
            linhas.push([data, m.tipo, String(m.valor), (m.descricao||"").replace(/;/g,","), m.criado_por_nome||""]);
        });
        linhas.push([]);
        linhas.push(["Periodo", `${extrato?.periodo_inicio || inicio} ate ${extrato?.periodo_fim || fim}`]);
        linhas.push(["Qtd Caixas", String(extrato?.qtd_caixas||0)]);
        linhas.push(["Entradas", String(entradas)]);
        linhas.push(["Saidas", String(saidas)]);
        linhas.push(["Saldo Atual", String(atual)]);
        const csv = linhas.map(r=>r.join(";")).join("\n");
        const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href=url; a.download=`relatorio-caixa-${inicio}_a_${fim}.csv`; a.click();
        URL.revokeObjectURL(url);
        toast.success("Relatório baixado");
    };

    const handleImprimir = () => {
        setMenuOpen(false);
        const win = window.open("", "_blank");
        if(!win) return;
        const html = `
        <html><head><title>Relatorio Caixa ${inicio} - ${fim}</title>
        <style>body{font-family:monospace;padding:20px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:6px;font-size:12px;text-align:left} th{background:#000;color:#fff}</style>
        </head><body>
        <h2>J-OS RESTAURANTE - Caixa</h2>
        <p>Periodo: ${extrato?.periodo_inicio || inicio} ate ${extrato?.periodo_fim || fim} | Caixas: ${extrato?.qtd_caixas||0}</p>
        <p>Entradas: Kz ${fmt(entradas)} | Saidas: Kz ${fmt(saidas)} | Atual: Kz ${fmt(atual)}</p>
        <table><thead><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Descricao</th><th>Usuario</th></tr></thead>
        <tbody>${movs.map((m:any)=>`<tr><td>${new Date(m.criado_em).toLocaleString('pt-PT')}</td><td>${m.tipo}</td><td>${fmt(Number(m.valor))}</td><td>${m.descricao||''}</td><td>${m.criado_por_nome||''}</td></tr>`).join("")}</tbody></table>
        <script>window.print()</script></body></html>`;
        win.document.write(html); win.document.close();
    };

    if (loading &&!extrato) return <div className="bg-white rounded-[20px] p-8 animate-pulse h-[300px]" />;

    return (
        <div className="space-y-4">
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none; scrollbar-width:none;}`}</style>

            <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
                {/* INPUTS DATA */}
                <div className="flex items-center gap-2 bg-white border rounded-full p-1 pr-2 w-fit">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase ml-3 text-zinc-500">De</span>
                        <div className="w-[145px]"><JCalendarPicker value={inicio} onChange={setInicio} /></div>
                    </div>
                    <div className="w-[1px] h-[24px] bg-zinc-200" />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-zinc-500">Até</span>
                        <div className="w-[145px]"><JCalendarPicker value={fim} onChange={setFim} /></div>
                    </div>
                    {!isHoje && (
                        <button onClick={()=>{ setInicio(todayISO()); setFim(todayISO()); }} className="ml-2 h-[32px] px-3 bg-zinc-100 rounded-full text-[10px] font-black uppercase">Hoje</button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-3 bg-white border rounded-full px-4 h-[42px] cursor-pointer">
                        <input type="checkbox" checked={showExtrato} onChange={e=>setShowExtrato(e.target.checked)} className="sr-only" />
                        <div className={`w-[36px] h-[20px] rounded-full transition-colors relative ${showExtrato?'bg-black':'bg-zinc-200'}`}>
                            <div className={`absolute top-[2px] w-[16px] h-[16px] bg-white rounded-full transition-all ${showExtrato?'left-[18px]':'left-[2px]'}`} />
                        </div>
                        <span className="text-[10px] font-black uppercase">Mostrar extrato</span>
                    </label>

                    {/* BOTAO RELATORIO */}
                    <div className="relative" ref={menuRef}>
                        <button onClick={()=>setMenuOpen(o=>!o)} className="h-[42px] w-[42px] bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-[180px] bg-white border rounded-[16px] shadow-xl overflow-hidden z-20">
                                <button onClick={handleBaixar} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50 flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Baixar CSV
                                </button>
                                <div className="h-[1px] bg-zinc-100" />
                                <button onClick={handleImprimir} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50 flex items-center gap-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> Imprimir
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {extrato?.qtd_caixas>1 && <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 bg-white rounded-full px-4 py-2 w-fit border">{extrato.qtd_caixas} caixas • {extrato.periodo_inicio} até {extrato.periodo_fim}</div>}
            {isVazioHoje && <div className="bg-white border rounded-full px-4 py-2 text-[11px] font-bold uppercase text-zinc-500">Nenhum caixa aberto hoje ({hojeISO}) - clique em ABRIR CAIXA</div>}

            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 -mx-4 px-4 md:mx-0 md:px-0 md:gap-4 md:grid md:grid-cols-3 pb-2">
                <div onClick={()=>handleCardClick("master")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <MasterCard aberto={!!status?.aberto} atual={atual} nomeRestaurante="J-OS RESTAURANTE" dataAbertura={isHoje? hojeISO.slice(5).replace("-","/") : `${extrato?.periodo_inicio?.slice(5) || inicio.slice(5)}`} horaAbertura={movs[0]? new Date(movs[0].criado_em).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}): "--:--"} />
                </div>
                <div onClick={()=>handleCardClick("entradas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <EntradasCard entradas={entradas} nome="J-OS RESTAURANTE" dataHoje={isHoje? hojeISO.slice(5).replace("-","/") : `${extrato?.periodo_inicio || inicio}`} qtdVendas={movs.filter((m:any)=> (m.tipo||"").toUpperCase().includes("VENDA")).length} />
                </div>
                <div onClick={()=>handleCardClick("saidas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <SaidasCard saidas={saidas} nome="J-OS RESTAURANTE" hora={new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})} retirado={saidas>0?'1':'0'} />
                </div>
            </div>

            {showExtrato && <ExtratoList movimentos={movs} selectedDate={extrato?.periodo_inicio || inicio} />}

            <JConfirm open={confirm.open} title={confirm.title} desc={confirm.desc} type={confirm.type} onClose={()=>setConfirm(s=>({...s, open:false}))} onConfirm={confirm.action} />
            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={status?.caixa_atual || extrato} onClose={()=>setModalOpen(false)} onSuccess={async()=>{ await load(); toast.success("Atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={()=>setSangriaOpen(false)} onSuccess={async()=>{ await load(); toast.success("Feito!"); }} />
        </div>
    )
}
