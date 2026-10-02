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
const STORAGE_KEY = "j-os:mostrar_extrato";

export function CaixaTab() {
    const [status, setStatus] = useState<any>(null);
    const [extrato, setExtrato] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [inicio, setInicio] = useState(todayISO());
    const [fim, setFim] = useState(todayISO());
    const [showExtrato, setShowExtrato] = useState(false);
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
            if (inicio===hoje && fim===hoje && s?.aberto) {
                ext = await apiFetch("/caixa/extrato");
            } else {
                ext = await apiFetch(`/caixa/extrato-por-periodo?inicio=${inicio}&fim=${fim}`);
            }
            setExtrato(ext);
        } catch { setExtrato({ movimentos: [], saldo_inicial: 0, saldo_atual: 0, total_entradas: 0, total_saidas: 0, qtd_caixas: 0, periodo_inicio: inicio, periodo_fim: fim }); }
        setLoading(false);
    };

    useEffect(()=>{
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved!== null) setShowExtrato(saved === "true");
        else setShowExtrato(false);
    }, []);
    useEffect(()=>{ load(); }, [inicio, fim]);
    useEffect(()=>{
        const h = (e: MouseEvent) => { if (menuRef.current &&!menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
        document.addEventListener("mousedown", h); return ()=>document.removeEventListener("mousedown", h);
    }, []);

    const toggleExtrato = (v: boolean) => {
        setShowExtrato(v);
        localStorage.setItem(STORAGE_KEY, String(v));
    };

    const movs = extrato?.movimentos || [];
    const entradas = Number(extrato?.total_entradas || 0);
    const saidas = Math.abs(Number(extrato?.total_saidas || 0));
    const atual = Number(extrato?.saldo_atual?? 0);

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
        linhas.push(["Entradas", String(entradas)]);
        linhas.push(["Saidas", String(saidas)]);
        linhas.push(["Saldo", String(atual)]);
        const csv = linhas.map(r=>r.join(";")).join("\n");
        const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href=url; a.download=`relatorio-caixa-${inicio}_a_${fim}.csv`; a.click();
        URL.revokeObjectURL(url);
        toast.success("Baixado");
    };

    const handleImprimir = () => {
        setMenuOpen(false);
        const win = window.open("", "_blank");
        if(!win) return;
        const html = `<html><head><title>Relatorio ${inicio} - ${fim}</title><style>body{font-family:monospace;padding:20px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #ddd;padding:6px;font-size:12px} th{background:#000;color:#fff}</style></head><body><h2>J-OS - ${inicio} ate ${fim}</h2><table><thead><tr><th>Data</th><th>Tipo</th><th>Valor</th><th>Descricao</th></tr></thead><tbody>${movs.map((m:any)=>`<tr><td>${new Date(m.criado_em).toLocaleString('pt-PT')}</td><td>${m.tipo}</td><td>${fmt(Number(m.valor))}</td><td>${m.descricao||''}</td></tr>`).join("")}</tbody></table><script>window.print()</script></body></html>`;
        win.document.write(html); win.document.close();
    };

    if (loading &&!extrato) return <div className="bg-white rounded-[20px] p-8 animate-pulse h-[300px]" />;

    return (
        <div className="space-y-4">
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none; scrollbar-width:none;}`}</style>

            {/* TOP: inputs + btn relatorio - sem div branca, scroll no mobile */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 py-2">
                <div className="min-w-[175px] w-[175px] md:w-[185px] h-[46px] shrink-0 snap-start relative z-30">
                    <JCalendarPicker value={inicio} onChange={setInicio} />
                </div>
                <div className="min-w-[175px] w-[175px] md:w-[185px] h-[46px] shrink-0 snap-start relative z-20">
                    <JCalendarPicker value={fim} onChange={setFim} />
                </div>
                <div className="relative shrink-0 snap-start z-40" ref={menuRef}>
                    <button onClick={()=>setMenuOpen(o=>!o)} className="h-[46px] w-[46px] bg-black text-white rounded-full flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    </button>
                    {menuOpen && (
                        <div className="absolute left-0 mt-2 w-[180px] bg-white border rounded-[16px] shadow-xl overflow-hidden z-[999]">
                            <button onClick={handleBaixar} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50">Baixar</button>
                            <div className="h-[1px] bg-zinc-100" />
                            <button onClick={handleImprimir} className="w-full text-left px-4 py-3 text-[11px] font-black uppercase hover:bg-zinc-50">Imprimir</button>
                        </div>
                    )}
                </div>
            </div>

            {/* CARDS */}
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 -mx-4 px-4 md:mx-0 md:px-0 md:gap-4 md:grid md:grid-cols-3 pb-2">
                <div onClick={()=>handleCardClick("master")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <MasterCard aberto={!!status?.aberto} atual={atual} nomeRestaurante="J-OS RESTAURANTE" dataAbertura={inicio.slice(5).replace("-","/")} horaAbertura={movs[0]? new Date(movs[0].criado_em).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}): "--:--"} />
                </div>
                <div onClick={()=>handleCardClick("entradas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <EntradasCard entradas={entradas} nome="J-OS RESTAURANTE" dataHoje={inicio.slice(5).replace("-","/")} qtdVendas={movs.filter((m:any)=> (m.tipo||"").toUpperCase().includes("VENDA")).length} />
                </div>
                <div onClick={()=>handleCardClick("saidas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <SaidasCard saidas={saidas} nome="J-OS RESTAURANTE" hora={new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})} retirado={saidas>0?'1':'0'} />
                </div>
            </div>

            {/* MOSTRAR EXTRATO EMBAIXO */}
            <div className="flex justify-end">
                <label className="flex items-center gap-3 bg-white border rounded-full px-4 h-[42px] cursor-pointer w-fit">
                    <input type="checkbox" checked={showExtrato} onChange={e=>toggleExtrato(e.target.checked)} className="sr-only" />
                    <div className={`w-[36px] h-[20px] rounded-full transition-colors relative ${showExtrato?'bg-black':'bg-zinc-200'}`}>
                        <div className={`absolute top-[2px] w-[16px] h-[16px] bg-white rounded-full transition-all ${showExtrato?'left-[18px]':'left-[2px]'}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase">Mostrar extrato</span>
                </label>
            </div>

            {showExtrato && <ExtratoList movimentos={movs} selectedDate={extrato?.periodo_inicio || inicio} />}

            <JConfirm open={confirm.open} title={confirm.title} desc={confirm.desc} type={confirm.type} onClose={()=>setConfirm(s=>({...s, open:false}))} onConfirm={confirm.action} />
            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={status?.caixa_atual || extrato} onClose={()=>setModalOpen(false)} onSuccess={async()=>{ await load(); toast.success("Atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={()=>setSangriaOpen(false)} onSuccess={async()=>{ await load(); toast.success("Feito!"); }} />
        </div>
    )
}
