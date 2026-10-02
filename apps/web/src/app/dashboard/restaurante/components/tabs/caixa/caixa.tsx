"use client";
import { useEffect, useState } from "react";
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
const addDays = (iso: string, delta: number) => {
    const [y,m,d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m-1, d));
    dt.setUTCDate(dt.getUTCDate()+delta);
    return dt.toLocaleDateString('en-CA', { timeZone: 'Africa/Luanda', year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-').replace(/\//g,'-').length? `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}` : iso;
};

type Periodo = "hoje" | "dia" | "7" | "14" | "30" | "60" | "90" | "personalizado";

export function CaixaTab() {
    const [status, setStatus] = useState<any>(null);
    const [extrato, setExtrato] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [periodo, setPeriodo] = useState<Periodo>("hoje");
    const [showExtrato, setShowExtrato] = useState(true);
    const [customOpen, setCustomOpen] = useState(false);
    const [customInicio, setCustomInicio] = useState(todayISO());
    const [customFim, setCustomFim] = useState(todayISO());
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"abrir" | "fechar" | "forcar">("abrir");
    const [sangriaOpen, setSangriaOpen] = useState(false);
    const [sangriaTipo, setSangriaTipo] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");
    const [confirm, setConfirm] = useState<{open: boolean, title: string, desc: string, type: "black"|"green"|"red", action: ()=>void}>({open: false, title:"", desc:"", type:"black", action: ()=>{}});

    const load = async () => {
        setLoading(true);
        try {
            const s = await apiFetch("/caixa/status").catch(()=>null);
            setStatus(s);
            const hoje = todayISO();
            let ext;
            if (periodo === "hoje") {
                // REGRA QUE VOCE QUER:
                // Se tem caixa ABERTO (abriu dia 1 e ainda aberto dia 2,3...), mostra ele
                // Se NAO tem caixa aberto, busca so o que abriu HOJE (02/10). Se nao abriu nada hoje, vem vazio -> cards zerados
                if (s?.aberto) {
                    ext = await apiFetch("/caixa/extrato");
                } else {
                    ext = await apiFetch(`/caixa/extrato-por-data/${hoje}`);
                }
            } else if (periodo === "dia") {
                // Dia especifico selecionado no calendario (ex: 01/10)
                ext = await apiFetch(`/caixa/extrato-por-data/${selectedDate}`);
            } else if (periodo === "personalizado") {
                ext = await apiFetch(`/caixa/extrato-por-periodo?inicio=${customInicio}&fim=${customFim}`);
            } else {
                const dias = Number(periodo);
                const fim = hoje;
                const inicio = addDays(fim, -dias+1);
                ext = await apiFetch(`/caixa/extrato-por-periodo?inicio=${inicio}&fim=${fim}`);
            }
            setExtrato(ext);
        } catch { setExtrato({ movimentos: [], saldo_inicial: 0, saldo_atual: 0, total_entradas: 0, total_saidas: 0, qtd_caixas: 0 }); }
        setLoading(false);
    };

    useEffect(()=>{ load(); }, [selectedDate, periodo, customInicio, customFim]);

    const movs = extrato?.movimentos || [];
    const entradas = Number(extrato?.total_entradas || 0);
    const saidas = Math.abs(Number(extrato?.total_saidas || 0));
    const atual = Number(extrato?.saldo_atual?? 0);
    const hojeISO = todayISO();

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

    if (loading &&!extrato) return <div className="bg-white rounded-[20px] p-8 animate-pulse h-[300px]" />;

    const isVazioHoje = periodo==="hoje" &&!status?.aberto && movs.length===0;

    return (
        <div className="space-y-4">
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none; scrollbar-width:none;}`}</style>

            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
                <div className="flex gap-2 items-center flex-wrap">
                    {/* Calendario só aparece quando for DIA especifico */}
                    {periodo==="dia" && <div className="w-[200px]"><JCalendarPicker value={selectedDate} onChange={setSelectedDate} /></div>}

                    <select value={periodo} onChange={e=>{
                        const v = e.target.value as Periodo;
                        if (v==="personalizado") setCustomOpen(true);
                        if (v==="hoje") setSelectedDate(todayISO());
                        setPeriodo(v);
                    }} className="h-[42px] bg-white border rounded-full px-4 text-[12px] font-bold uppercase">
                        <option value="hoje">Hoje</option>
                        <option value="dia">Dia específico</option>
                        <option value="7">Últimos 7 dias</option>
                        <option value="14">Últimos 14 dias</option>
                        <option value="30">Últimos 30 dias</option>
                        <option value="60">Últimos 60 dias</option>
                        <option value="90">Últimos 90 dias</option>
                        <option value="personalizado">Personalizado...</option>
                    </select>
                </div>
                <label className="flex items-center gap-3 bg-white border rounded-full px-4 h-[42px] cursor-pointer w-fit">
                    <input type="checkbox" checked={showExtrato} onChange={e=>setShowExtrato(e.target.checked)} className="sr-only" />
                    <div className={`w-[36px] h-[20px] rounded-full transition-colors ${showExtrato?'bg-black':'bg-zinc-200'}`} />
                    <span className="text-[10px] font-black uppercase">Mostrar extrato</span>
                </label>
            </div>

            {extrato?.qtd_caixas>1 && <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 bg-white rounded-full px-4 py-2 w-fit border">{extrato.qtd_caixas} caixas • {extrato.periodo_inicio} até {extrato.periodo_fim}</div>}

            {isVazioHoje && (
                <div className="bg-amber-50 border border-amber-200 rounded-full px-4 py-2 text-[11px] font-bold uppercase">Nenhum caixa aberto hoje ({hojeISO}). Abra um novo caixa.</div>
            )}

            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 -mx-4 px-4 md:mx-0 md:px-0 md:gap-4 md:grid md:grid-cols-3 pb-2">
                <div onClick={()=>handleCardClick("master")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <MasterCard aberto={!!status?.aberto} atual={atual} nomeRestaurante="J-OS RESTAURANTE" dataAbertura={periodo==="hoje"? hojeISO.slice(5).replace("-","/") : periodo==="dia"? selectedDate.slice(5).replace("-","/") : `${extrato?.periodo_inicio?.slice(5) || ''}`} horaAbertura={movs[0]? new Date(movs[0].criado_em).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}): "--:--"} />
                </div>
                <div onClick={()=>handleCardClick("entradas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <EntradasCard entradas={entradas} nome="J-OS RESTAURANTE" dataHoje={periodo==="hoje"? hojeISO.slice(5).replace("-","/") : periodo==="dia"? selectedDate.slice(5).replace("-","/") : `${periodo}d`} qtdVendas={movs.filter((m:any)=> (m.tipo||"").toUpperCase().includes("VENDA")).length} />
                </div>
                <div onClick={()=>handleCardClick("saidas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <SaidasCard saidas={saidas} nome="J-OS RESTAURANTE" hora={new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})} retirado={saidas>0?'1':'0'} />
                </div>
            </div>

            {showExtrato && <ExtratoList movimentos={movs} selectedDate={extrato?.periodo_inicio || (periodo==="hoje"? hojeISO : selectedDate)} />}

            {customOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[20px] p-6 w-full max-w-sm space-y-4">
                        <h3 className="font-black uppercase text-sm">Período personalizado</h3>
                        <div><p className="text-[10px] font-black uppercase mb-1">Início</p><JCalendarPicker value={customInicio} onChange={setCustomInicio} /></div>
                        <div><p className="text-[10px] font-black uppercase mb-1">Fim</p><JCalendarPicker value={customFim} onChange={setCustomFim} /></div>
                        <div className="flex gap-2">
                            <button onClick={()=>{ setPeriodo("personalizado"); setCustomOpen(false); }} className="flex-1 h-11 bg-black text-white rounded-full text-[11px] font-black uppercase">Aplicar</button>
                            <button onClick={()=>setCustomOpen(false)} className="flex-1 h-11 bg-zinc-100 rounded-full text-[11px] font-black uppercase">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            <JConfirm open={confirm.open} title={confirm.title} desc={confirm.desc} type={confirm.type} onClose={()=>setConfirm(s=>({...s, open:false}))} onConfirm={confirm.action} />
            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={status?.caixa_atual || extrato} onClose={()=>setModalOpen(false)} onSuccess={async()=>{ await load(); toast.success("Atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={()=>setSangriaOpen(false)} onSuccess={async()=>{ await load(); toast.success("Feito!"); }} />
        </div>
    )
}
