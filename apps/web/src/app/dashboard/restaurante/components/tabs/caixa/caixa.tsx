"use client";
import { useEffect, useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { CaixaModal } from "./modals/open_close";
import { SangriaModal } from "./modals/saida";
import { MasterCard, EntradasCard, SaidasCard } from "./cards/cards_master";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com";
const BASE = `${API_URL.replace(/\/$/, "")}/api/v1`;

async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${BASE}${path}`, {...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`,...(options.headers || {}) } });
    const d = await res.json().catch(() => ({})); if (!res.ok) throw d; return d;
}
const fmt = (v: number) => Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const toLocalISO = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const getDatePart = (iso: string) => iso? iso.slice(0,10) : "";

function JConfirm({ open, title, desc, type, onClose, onConfirm }: { open: boolean, title: string, desc: string, type: "black" | "green" | "red", onClose: ()=>void, onConfirm: ()=>void }) {
    if (!open) return null;
    const accent = type === "green"? "bg-[#0CC06B]" : type === "red"? "bg-[#E53935]" : "bg-black";
    const iconBg = type === "green"? "bg-[#0CC06B]/10 text-[#0CC06B]" : type === "red"? "bg-[#E53935]/10 text-[#E53935]" : "bg-black/5 text-black";
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-[360px] bg-white rounded-[24px] border p-6 shadow-xl">
                <div className={`absolute top-0 left-6 right-6 h-[3px] rounded-full ${accent}`} />
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${iconBg}`}><AlertTriangle size={18} /></div>
                <h3 className="text-black font-black text-[13px] uppercase">{title}</h3>
                <p className="text-gray-500 text-[11px] mt-2">{desc}</p>
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <button onClick={onClose} className="h-[42px] rounded-full bg-[#F5F7FB] border text-black font-black text-[11px]">CANCELAR</button>
                    <button onClick={()=>{ onClose(); onConfirm(); }} className={`h-[42px] rounded-full text-white font-black text-[11px] ${accent}`}>CONFIRMAR</button>
                </div>
            </div>
        </div>
    )
}

function JCalendarPicker({ value, onChange }: { value: string, onChange: (v:string)=>void }) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(()=>{ const [y,m,d]=value.split('-').map(Number); return new Date(y, m-1, d); });
    useEffect(()=>{ const [y,m,d]=value.split('-').map(Number); setViewDate(new Date(y, m-1, d)); },[value]);
    const year = viewDate.getFullYear(); const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month+1, 0).getDate();
    const days = Array.from({length: firstDay}, ()=>null).concat(Array.from({length: daysInMonth}, (_,i)=>i+1));
    const toISO = (d:number) => toLocalISO(new Date(year, month, d));
    return (
        <div className="relative w-full">
            <button onClick={()=>setOpen(!open)} className="w-full h-[46px] flex items-center justify-between bg-white border rounded-full px-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center"><Calendar size={14}/></div>
                    <div className="text-left">
                        <p className="text-[10px] font-black text-black -mt-0.5">{value.split('-').reverse().join('/')}</p>
                    </div>
                </div>
                <ChevronRight size={14} className={`text-black/40 ${open?'rotate-90':''}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-20" onClick={()=>setOpen(false)} />
                    <div className="absolute z-30 mt-2 left-0 w-full md:w-[320px] rounded-[20px] bg-white border shadow-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <button onClick={()=>setViewDate(new Date(year, month-1, 1))} className="w-8 h-8 rounded-full bg-[#F5F7FB] border flex items-center justify-center"><ChevronLeft size={14}/></button>
                            <p className="font-black text-[12px] uppercase">{viewDate.toLocaleDateString('pt-PT',{month:'long'})} {year}</p>
                            <button onClick={()=>setViewDate(new Date(year, month+1, 1))} className="w-8 h-8 rounded-full bg-[#F5F7FB] border flex items-center justify-center"><ChevronRight size={14}/></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-1">{['D','S','T','Q','Q','S','S'].map((d,i)=><div key={i} className="text-[8px] text-gray-400 text-center font-bold">{d}</div>)}</div>
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((d,i)=> d===null? <div key={i}/> : (<button key={i} onClick={()=>{ onChange(toISO(d)); setOpen(false); }} className={`h-8 rounded-full text-[11px] font-bold ${toISO(d)===value?'bg-black text-white': toISO(d)===todayISO()?'bg-[#0CC06B] text-white':'hover:bg-gray-100'}`}>{d}</button>))}
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button onClick={()=>{ onChange(todayISO()); setOpen(false); }} className="flex-1 h-8 rounded-full bg-[#F5F7FB] border text-[10px] font-black">HOJE</button>
                            <button onClick={()=>setOpen(false)} className="flex-1 h-8 rounded-full bg-black text-white text-[10px] font-black">OK</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export function CaixaTab() {
    const [status, setStatus] = useState<any>(null);
    const [extrato, setExtrato] = useState<any>(null);
    const [historico, setHistorico] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"abrir" | "fechar" | "forcar">("abrir");
    const [sangriaOpen, setSangriaOpen] = useState(false);
    const [sangriaTipo, setSangriaTipo] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");
    const [confirm, setConfirm] = useState<{open: boolean, title: string, desc: string, type: "black"|"green"|"red", action: ()=>void}>({open: false, title:"", desc:"", type:"black", action: ()=>{}});

    const loadAll = async () => {
        const s = await apiFetch("/caixa/status").catch(()=>null);
        setStatus(s);
        const h = await apiFetch("/caixa/historico").catch(async()=> await apiFetch("/caixa/").catch(()=>[]));
        setHistorico(Array.isArray(h)? h : []);
        if (s?.aberto) {
            const ext = await apiFetch("/caixa/extrato");
            setExtrato(ext);
        } else {
            setExtrato({ movimentos: [], saldo_inicial: 0, saldo_atual: 0, total_entradas: 0, total_saidas: 0 });
        }
    };

    useEffect(()=>{ (async()=>{ setLoading(true); await loadAll(); setLoading(false); })(); }, []);

    const findCaixaForDate = (date: string) => {
        if (status?.aberto && status?.caixa_atual?.aberto_em) {
            const abertura = getDatePart(status.caixa_atual.aberto_em);
            if (date >= abertura && date <= todayISO()) return status.caixa_atual;
        }
        return historico.find((c:any)=> {
            const ab = getDatePart(c.aberto_em);
            const fe = c.fechado_em? getDatePart(c.fechado_em) : todayISO();
            return date >= ab && date <= fe;
        }) || historico.find((c:any)=> getDatePart(c.aberto_em) === date);
    };

    useEffect(()=>{
        (async()=>{
            setLoading(true);
            const caixaAlvo = findCaixaForDate(selectedDate);
            if (caixaAlvo) {
                try {
                    if (status?.aberto && caixaAlvo.id === status.caixa_atual.id) {
                        const ext = await apiFetch("/caixa/extrato");
                        setExtrato(ext);
                    } else {
                        const ext = await apiFetch(`/caixa/${caixaAlvo.id}/extrato`);
                        setExtrato(ext);
                    }
                } catch {
                    setExtrato({ movimentos: [], saldo_inicial: 0, saldo_atual: 0, total_entradas: 0, total_saidas: 0 });
                }
            } else {
                setExtrato({ movimentos: [], saldo_inicial: 0, saldo_atual: 0, total_entradas: 0, total_saidas: 0 });
            }
            setPage(1);
            setLoading(false);
        })();
    },[selectedDate, historico, status]);

    const movs = extrato?.movimentos || [];
    const { entradas, saidas, atual } = useMemo(()=>{
        const saldoInicial = Number(extrato?.saldo_inicial || 0);
        let ent = 0, sai = 0;
        (extrato?.movimentos || []).forEach((m:any)=>{
            const tipo = (m.tipo||"").toUpperCase();
            if (tipo === "ABERTURA" || tipo === "FECHAMENTO") return;
            const v = Number(m.valor||0);
            if (v > 0) ent += v;
            if (v < 0) sai += Math.abs(v);
        });
        return { entradas: ent, saidas: sai, atual: saldoInicial + ent - sai };
    }, [extrato]);

    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(movs.length / perPage));
    const paginados = useMemo(()=> movs.slice((page-1)*perPage, page*perPage), [movs, page]);

    const handleCardClick = (type: "master" | "entradas" | "saidas") => {
        if (type === "master") {
            if (status?.aberto) {
                setConfirm({ open: true, title: "Fechar caixa?", desc: `Saldo atual Kz ${fmt(atual)}. Fechar agora?`, type: "black", action: ()=>{ setModalMode("fechar"); setModalOpen(true); } });
            } else {
                setConfirm({ open: true, title: "Abrir caixa?", desc: "Iniciar novo turno.", type: "black", action: ()=>{ setModalMode("abrir"); setModalOpen(true); } });
            }
        }
        if (type === "entradas") {
            if (!status?.aberto) { toast.error("Abra o caixa primeiro"); return; }
            setConfirm({ open: true, title: "Fazer suprimento?", desc: "Adicionar dinheiro?", type: "green", action: ()=>{ setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true); } });
        }
        if (type === "saidas") {
            if (!status?.aberto) { toast.error("Abra o caixa primeiro"); return; }
            setConfirm({ open: true, title: "Fazer sangria?", desc: "Retirar dinheiro?", type: "red", action: ()=>{ setSangriaTipo("SANGRIA"); setSangriaOpen(true); } });
        }
    };

    if (loading) return <div className="bg-white rounded-[20px] p-8 animate-pulse h-[300px]" />;

    return (
        <div className="space-y-4">
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none; scrollbar-width:none;}`}</style>

            {/* DATE - MESMA LARGURA DO CARD PRETO NO DESKTOP */}
            <div className="w-full md:w-[calc((100%-32px)/3)]">
                <JCalendarPicker value={selectedDate} onChange={setSelectedDate} />
            </div>

            {/* CARDS - 1 POR VEZ NO CELULAR COM SWIPE, 3 NO DESKTOP */}
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 -mx-4 px-4 md:mx-0 md:px-0 md:gap-4 md:grid md:grid-cols-3 pb-2">
                <div onClick={()=>handleCardClick("master")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <MasterCard atual={atual} nomeRestaurante="J-OS RESTAURANTE" dataAbertura={selectedDate.slice(5).replace("-","/")} horaAbertura={status?.caixa_atual? new Date(status.caixa_atual.aberto_em).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}): "--:--"} />
                </div>
                <div onClick={()=>handleCardClick("entradas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <EntradasCard entradas={entradas} nome="J-OS RESTAURANTE" dataHoje={selectedDate.slice(5).replace("-","/")} qtdVendas={movs.filter((m:any)=> (m.tipo||"").toUpperCase().includes("VENDA")).length} />
                </div>
                <div onClick={()=>handleCardClick("saidas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <SaidasCard saidas={saidas} nome="J-OS RESTAURANTE" hora={new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})} retirado={saidas>0?'1':'0'} />
                </div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-[12px]">Extrato • {movs.length} • {selectedDate.split('-').reverse().join('/')}</h3>
                    <div className="flex items-center gap-1">
                        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-7 h-7 rounded-full border flex items-center justify-center disabled:opacity-30"><ChevronLeft size={14}/></button>
                        <span className="text-[11px] font-bold px-2">{page}/{totalPages}</span>
                        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="w-7 h-7 rounded-full border flex items-center justify-center disabled:opacity-30"><ChevronRight size={14}/></button>
                    </div>
                </div>
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {!movs.length? <p className="text-[11px] text-gray-400 text-center py-10">Sem movimentos em {selectedDate.split('-').reverse().join('/')}</p> : paginados.map((m:any)=>(
                        <div key={m.id} className="flex items-center justify-between bg-[#F5F7FB] rounded-full px-4 py-3">
                            <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${Number(m.valor)>0?'bg-[#0CC06B]':'bg-[#E53935]'} text-white`}>{Number(m.valor)>0?<TrendingUp size={12}/>:<TrendingDown size={12}/>}</div><div><p className="text-[11px] font-bold">{m.descricao}</p><p className="text-[9px] text-gray-500">{m.tipo}</p></div></div>
                            <span className={`text-[12px] font-black ${Number(m.valor)>0?'text-[#0CC06B]':'text-[#E53935]'}`}>Kz {fmt(Number(m.valor))}</span>
                        </div>
                    ))}
                </div>
            </div>

            <JConfirm open={confirm.open} title={confirm.title} desc={confirm.desc} type={confirm.type} onClose={()=>setConfirm(s=>({...s, open:false}))} onConfirm={confirm.action} />
            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={status?.caixa_atual || extrato} onClose={()=>setModalOpen(false)} onSuccess={async()=>{ await loadAll(); toast.success("Atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={()=>setSangriaOpen(false)} onSuccess={async()=>{ await loadAll(); toast.success("Feito!"); }} />
        </div>
    )
}
