"use client";
import { useEffect, useState, useMemo } from "react";
import { Plus, Minus, TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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
const todayISO = () => new Date().toISOString().slice(0,10);

function JCalendarPicker({ value, onChange }: { value: string, onChange: (v:string)=>void }) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(value+'T12:00:00'));
    useEffect(()=>{ setViewDate(new Date(value+'T12:00:00')) }, [value]);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const days = Array.from({length: firstDay}, ()=>null).concat(Array.from({length: daysInMonth}, (_,i)=>i+1));
    const toISO = (d:number) => new Date(year, month, d).toISOString().slice(0,10);
    const isSelected = (d:number) => toISO(d) === value;
    const isToday = (d:number) => toISO(d) === todayISO();

    return (
        <div className="relative">
            <button onClick={()=>setOpen(!open)} className="flex items-center gap-2.5 bg-[#0B0B0B] text-white rounded-full px-5 py-[11px] border border-white/10 shadow-sm justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center"><Calendar size={13}/></div>
                    <div className="text-left"><p className="text-[8px] text-white/40 font-black tracking-widest">DATA</p><p className="text-[12px] font-black -mt-1">{new Date(value+'T12:00:00').toLocaleDateString('pt-PT',{day:'2-digit',month:'short',year:'numeric'})}</p></div>
                </div>
                <ChevronRight size={12} className={`ml-2 text-white/40 transition ${open?'rotate-90':''}`} />
            </button>
            {open && (
                <>
                <div className="fixed inset-0 z-20" onClick={()=>setOpen(false)} />
                <div className="absolute z-30 mt-2 left-0 w-[300px] rounded-[22px] bg-[#0B0B0B] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] p-4 overflow-hidden">
                    <div className="absolute -right-10 top-0 w-[200px] h-[200px] bg-white/[0.04] rounded-[30px] rotate-12" />
                    <div className="relative flex items-center justify-between mb-4">
                        <button onClick={()=>setViewDate(new Date(year, month-1, 1))} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"><ChevronLeft size={14}/></button>
                        <div className="text-center"><p className="text-white font-black text-[13px] uppercase tracking-widest">{viewDate.toLocaleDateString('pt-PT',{month:'long'})} {year}</p><p className="text-[8px] text-white/40 font-bold">J-OS CALENDAR</p></div>
                        <button onClick={()=>setViewDate(new Date(year, month+1, 1))} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center"><ChevronRight size={14}/></button>
                    </div>
                    <div className="relative grid grid-cols-7 gap-1 mb-2">{['D','S','T','Q','Q','S','S'].map((d,i)=><div key={i} className="text-[9px] font-black text-white/30 text-center py-1">{d}</div>)}</div>
                    <div className="relative grid grid-cols-7 gap-1">
                        {days.map((d,i)=> d===null? <div key={`${i}-empty`}/> : (
                            <button key={`${i}-${d}`} onClick={()=>{ onChange(toISO(d)); setOpen(false); }}
                                className={`h-9 rounded-full text-[11px] font-bold transition flex items-center justify-center ${isSelected(d)? 'bg-white text-black shadow-lg scale-105' : isToday(d)? 'bg-[#0CC06B] text-white' : 'text-white/70 hover:bg-white/10'}`}>{d}</button>
                        ))}
                    </div>
                    <div className="relative mt-4 flex gap-2">
                        <button onClick={()=>{ onChange(todayISO()); setOpen(false); }} className="flex-1 h-9 rounded-full bg-white/10 text-white text-[10px] font-black">HOJE</button>
                        <button onClick={()=>setOpen(false)} className="flex-1 h-9 rounded-full bg-white text-black text-[10px] font-black">FECHAR</button>
                    </div>
                </div>
                </>
            )}
        </div>
    )
}

export function CaixaTab() {
    const [caixa, setCaixa] = useState<any>(null);
    const [resumoDia, setResumoDia] = useState<any>(null);
    const [extrato, setExtrato] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"abrir" | "fechar" | "forcar">("abrir");
    const [sangriaOpen, setSangriaOpen] = useState(false);
    const [sangriaTipo, setSangriaTipo] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");

    const fetchByDate = async (date: string) => {
        setLoading(true);
        try {
            // 1. Tenta buscar resumo do dia direto do backend
            let resumo = null;
            try { resumo = await apiFetch(`/caixa/resumo?data=${date}`); }
            catch { try { resumo = await apiFetch(`/caixa/dia?data=${date}`); } catch { resumo = null; } }

            // 2. Busca extrato do dia
            let ext = null;
            try { ext = await apiFetch(`/caixa/extrato?data=${date}`); }
            catch {
                try { ext = await apiFetch(`/caixa/extrato?date=${date}`); }
                catch { ext = await apiFetch("/caixa/extrato").catch(()=>null); }
            }

            // 3. Status atual para nome restaurante
            let status = null;
            try { status = await apiFetch(`/caixa/status?data=${date}`); }
            catch { status = await apiFetch("/caixa/status").catch(()=>null); }

            setResumoDia(resumo);
            setExtrato(ext);
            setCaixa(status?.caixa_atual || status || resumo?.caixa || null);
        } catch { toast.error("Erro ao carregar caixa do dia"); }
        finally { setLoading(false) }
    };

    useEffect(() => { fetchByDate(selectedDate); setPage(1); }, [selectedDate]);

    const allMovs: any[] = useMemo(()=> extrato?.movimentos || extrato?.movs || [], [extrato]);

    const movs = useMemo(()=>{
        // se backend já filtrou, usa direto, senão filtra client
        if (extrato?.filtrado_por_data || resumoDia) return allMovs;
        return allMovs.filter((m:any)=>{
            const d = new Date(m.criado_em || m.data || m.created_at || selectedDate).toISOString().slice(0,10);
            return d === selectedDate;
        });
    }, [allMovs, selectedDate, extrato, resumoDia]);

    const { entradas, saidas, inicial, atual } = useMemo(()=>{
        // Se backend mandou totais, usa eles
        if (resumoDia) {
            return {
                inicial: Number(resumoDia.saldo_inicial?? resumoDia.inicial?? 0),
                entradas: Number(resumoDia.total_entradas?? resumoDia.entradas?? 0),
                saidas: Number(resumoDia.total_saidas?? resumoDia.saidas?? 0),
                atual: Number(resumoDia.saldo_atual?? resumoDia.atual?? resumoDia.saldo?? 0),
            }
        }
        if (extrato?.saldo_atual!== undefined) {
            return {
                inicial: Number(extrato.saldo_inicial?? 0),
                entradas: Number(extrato.total_entradas?? 0),
                saidas: Number(extrato.total_saidas?? 0),
                atual: Number(extrato.saldo_atual?? 0),
            }
        }
        // fallback client
        const ini = Number(extrato?.saldo_inicial?? caixa?.saldo_inicial?? 0);
        const ent = movs.filter((m: any) => {
            const tipo = (m.tipo || '').toUpperCase();
            const desc = (m.descricao || '').toLowerCase();
            const isVenda = tipo.includes('VENDA') || tipo === 'ENTRADA' || desc.includes('venda');
            const isAbertura = tipo.includes('ABERT') || desc.includes('abertura');
            return isVenda &&!isAbertura && Number(m.valor) > 0;
        }).reduce((a:any,c:any)=>a+Number(c.valor),0);
        const sai = movs.filter((m:any)=> m.tipo?.toUpperCase().includes('SANGRIA') || Number(m.valor) < 0).reduce((a:any,c:any)=>a+Math.abs(Number(c.valor)),0);
        return { inicial: ini, entradas: ent, saidas: sai, atual: ini+ent-sai };
    }, [movs, extrato, caixa, resumoDia]);

    const nomeRestaurante = caixa?.restaurante_nome || resumoDia?.restaurante_nome || "J-OS RESTAURANTE";
    const dataAbertura = useMemo(()=> new Date(selectedDate+'T12:00:00').toLocaleDateString('pt-PT').slice(3) || "10/25", [selectedDate]);
    const horaAbertura = caixa?.aberto_em? new Date(caixa.aberto_em).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}) : "08:15";

    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(movs.length / perPage));
    const movsPaginados = useMemo(()=> movs.slice((page-1)*perPage, page*perPage), [movs, page]);

    if (loading) return <div className="bg-white rounded-[22px] p-8 animate-pulse h-[300px]" />;

    const aberto =!!caixa || movs.length > 0 || selectedDate === todayISO();

    return (
        <div className="space-y-4">
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none; scrollbar-width:none;}`}</style>

            {/* BARRA LIVRE - SEM BG WHITE */}
            <div className="flex flex-wrap items-center gap-2">
                <JCalendarPicker value={selectedDate} onChange={setSelectedDate} />
                <button onClick={()=>{ setSangriaTipo("SANGRIA"); setSangriaOpen(true)}} className="h-[42px] bg-white border shadow-sm rounded-full text-[11px] font-black text-[#C62828] flex items-center justify-center gap-1.5 px-5"><Minus size={14}/> Sangria</button>
                <button onClick={()=>{ setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true)}} className="h-[42px] bg-white border shadow-sm rounded-full text-[11px] font-black text-[#2E7D32] flex items-center justify-center gap-1.5 px-5"><Plus size={14}/> Suprimento</button>
                {!caixa? (
                    <button onClick={()=>{ setModalMode("abrir"); setModalOpen(true)}} className="h-[42px] px-6 bg-black text-white rounded-full text-[11px] font-black">Abrir Caixa</button>
                ):(
                    <button onClick={()=>{ setModalMode("fechar"); setModalOpen(true)}} className="h-[42px] px-6 bg-black text-white rounded-full text-[11px] font-black">Fechar</button>
                )}
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 -mx-4 px-4 md:mx-0 md:px-0 md:gap-4 md:grid md:grid-cols-3 pb-2">
                <div className="min-w-full w-full snap-center md:min-w-0 shrink-0"><MasterCard atual={atual} nomeRestaurante={nomeRestaurante} dataAbertura={dataAbertura} horaAbertura={horaAbertura} /></div>
                <div className="min-w-full w-full snap-center md:min-w-0 shrink-0"><EntradasCard entradas={entradas} nome={nomeRestaurante} dataHoje={new Date(selectedDate+'T12:00:00').toLocaleDateString('pt-PT').slice(0,5)} qtdVendas={movs.filter((m:any)=>(m.tipo||'').toUpperCase().includes('VENDA')).length} /></div>
                <div className="min-w-full w-full snap-center md:min-w-0 shrink-0"><SaidasCard saidas={saidas} nome={nomeRestaurante} hora={horaAbertura} retirado={saidas>0?'1':'0'} /></div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-[12px]">Extrato • {movs.length} movimentos • {new Date(selectedDate+'T12:00:00').toLocaleDateString('pt-PT')}</h3>
                    <div className="flex items-center gap-1">
                        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-7 h-7 rounded-full border flex items-center justify-center disabled:opacity-30"><ChevronLeft size={14}/></button>
                        <span className="text-[11px] font-bold px-2">{page}/{totalPages}</span>
                        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="w-7 h-7 rounded-full border flex items-center justify-center disabled:opacity-30"><ChevronRight size={14}/></button>
                    </div>
                </div>
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {!movs.length? <p className="text-[11px] text-gray-400 text-center py-10">Sem movimentos em {selectedDate}</p> : movsPaginados.map((m:any)=>(
                        <div key={m.id} className="flex items-center justify-between bg-[#F5F7FB] rounded-full px-4 py-3">
                            <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${Number(m.valor)>0?'bg-[#0CC06B]':'bg-[#E53935]'} text-white`}>{Number(m.valor)>0?<TrendingUp size={12}/>:<TrendingDown size={12}/>}</div><div><p className="text-[11px] font-bold">{m.descricao}</p><p className="text-[9px] text-gray-500">{m.tipo} • {new Date(m.criado_em||m.data||selectedDate).toLocaleTimeString('pt-PT')}</p></div></div>
                            <span className={`text-[12px] font-black ${Number(m.valor)>0?'text-[#0CC06B]':'text-[#E53935]'}`}>Kz {fmt(Number(m.valor))}</span>
                        </div>
                    ))}
                </div>
            </div>

            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={caixa} onClose={()=>setModalOpen(false)} onSuccess={()=>{ fetchByDate(selectedDate); toast.success("Atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={()=>setSangriaOpen(false)} onSuccess={()=>{ fetchByDate(selectedDate); toast.success("Feito!"); }} />
        </div>
    )
}
