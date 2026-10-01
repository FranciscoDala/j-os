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

// DATA LOCAL - FIX FUSO LUANDA
const todayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
};
const toLocalISO = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth()+1).padStart(2,'0');
    const day = String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
}

function JCalendarPicker({ value, onChange }: { value: string, onChange: (v:string)=>void }) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(()=>{
        const [y,m,d] = value.split('-').map(Number);
        return new Date(y, m-1, d);
    });
    useEffect(()=>{
        const [y,m,d] = value.split('-').map(Number);
        setViewDate(new Date(y, m-1, d));
    }, [value]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const days = Array.from({length: firstDay}, ()=>null).concat(Array.from({length: daysInMonth}, (_,i)=>i+1));
    const toISO = (d:number) => toLocalISO(new Date(year, month, d));

    return (
        <div className="relative">
            <button onClick={()=>setOpen(!open)} className="flex items-center gap-2 bg-black text-white rounded-full px-4 py-2 border">
                <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center"><Calendar size={12}/></div>
                <div className="text-left"><p className="text-[7px] text-white/40 font-black">DATA</p><p className="text-[11px] font-black -mt-1">{value.split('-').reverse().join('/')}</p></div>
                <ChevronRight size={10} className={`ml-1 opacity-50 ${open?'rotate-90':''}`} />
            </button>
            {open && (
                <>
                <div className="fixed inset-0 z-20" onClick={()=>setOpen(false)} />
                <div className="absolute z-30 mt-2 left-0 w-[290px] rounded-[20px] bg-[#0B0B0B] border border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={()=>setViewDate(new Date(year, month-1, 1))} className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center"><ChevronLeft size={14}/></button>
                        <p className="text-white font-black text-[12px] uppercase">{viewDate.toLocaleDateString('pt-PT',{month:'long'})} {year}</p>
                        <button onClick={()=>setViewDate(new Date(year, month+1, 1))} className="w-7 h-7 rounded-full bg-white/10 text-white flex items-center justify-center"><ChevronRight size={14}/></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-1">{['D','S','T','Q','Q','S','S'].map((d,i)=><div key={i} className="text-[8px] text-white/30 text-center">{d}</div>)}</div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((d,i)=> d===null? <div key={i}/> : (
                            <button key={i} onClick={()=>{ onChange(toISO(d)); setOpen(false); }}
                                className={`h-8 rounded-full text-[11px] font-bold ${toISO(d)===value?'bg-white text-black':'text-white/70 hover:bg-white/10'} ${toISO(d)===todayISO() && toISO(d)!==value?'bg-[#0CC06B] text-white':''}`}>{d}</button>
                        ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button onClick={()=>{ onChange(todayISO()); setOpen(false); }} className="flex-1 h-8 rounded-full bg-white/10 text-white text-[10px] font-black">HOJE</button>
                        <button onClick={()=>setOpen(false)} className="flex-1 h-8 rounded-full bg-white text-black text-[10px] font-black">OK</button>
                    </div>
                </div>
                </>
            )}
        </div>
    )
}

export function CaixaTab() {
    const [extrato, setExtrato] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [page, setPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"abrir" | "fechar" | "forcar">("abrir");
    const [sangriaOpen, setSangriaOpen] = useState(false);
    const [sangriaTipo, setSangriaTipo] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");

    const loadDia = async (date: string) => {
        setLoading(true);
        try {
            const ext = await apiFetch(`/caixa/extrato?data=${date}`);
            setExtrato(ext);
        } catch {
            // se API não tem filtro, busca tudo e filtra aqui
            try {
                const all = await apiFetch("/caixa/extrato");
                setExtrato(all);
            } catch {
                setExtrato({movimentos:[]});
            }
        } finally { setLoading(false); }
    };

    useEffect(()=>{ loadDia(selectedDate); setPage(1); }, [selectedDate]);

    const movs = useMemo(()=>{
        const all = extrato?.movimentos || extrato?.data || [];
        // SEMPRE filtra por data localmente para garantir
        return (extrato?.movimentos || []).filter((m:any)=>{
            const raw = (m.data || m.criado_em || m.created_at || "").toString();
            const d = raw.slice(0,10); // já vem YYYY-MM-DD
            if (!d) return false;
            return d === selectedDate;
        });
    }, [extrato, selectedDate]);

    const { entradas, saidas, atual } = useMemo(()=>{
        if (!movs.length) return { entradas: 0, saidas: 0, atual: 0, qtdVendas: 0, inicial: 0 };

        let ent = 0, sai = 0, ini = 0;
        movs.forEach((m:any)=>{
            const tipo = (m.tipo||"").toUpperCase();
            const valor = Number(m.valor||0);
            if (tipo.includes("ABERTURA") || tipo.includes("SALDO_INICIAL")) { ini += valor; return; }
            if (tipo.includes("SANGRIA")) { sai += Math.abs(valor); return; }
            if (tipo.includes("SUPRIMENTO")) { ent += Math.abs(valor); return; }
            if (tipo.includes("VENDA") || tipo.includes("ENTRADA")) {
                if (valor > 0) ent += valor;
            } else {
                if (valor > 0) ent += valor;
                if (valor < 0) sai += Math.abs(valor);
            }
        });

        return { inicial: ini, entradas: ent, saidas: sai, atual: ini+ent-sai, qtdVendas: movs.filter((m:any)=> (m.tipo||"").toUpperCase().includes("VENDA")).length };
    }, [movs]);

    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(movs.length / perPage));
    const paginados = useMemo(()=> movs.slice((page-1)*perPage, page*perPage), [movs, page]);

    if (loading) return <div className="bg-white rounded-[20px] p-8 animate-pulse h-[300px]" />;

    return (
        <div className="space-y-4">
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none; scrollbar-width:none;}`}</style>

            <div className="flex flex-wrap items-center gap-2">
                <JCalendarPicker value={selectedDate} onChange={setSelectedDate} />
                <button onClick={()=>{ setSangriaTipo("SANGRIA"); setSangriaOpen(true)}} className="h-[38px] bg-white border rounded-full text-[11px] font-black text-[#C62828] px-5 flex items-center gap-1"><Minus size={14}/> Sangria</button>
                <button onClick={()=>{ setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true)}} className="h-[38px] bg-white border rounded-full text-[11px] font-black text-[#2E7D32] px-5 flex items-center gap-1"><Plus size={14}/> Suprimento</button>
                <button onClick={()=>{ setModalMode("fechar"); setModalOpen(true)}} className="h-[38px] bg-black text-white rounded-full text-[11px] font-black px-6">Fechar</button>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 -mx-4 px-4 md:mx-0 md:px-0 md:gap-4 md:grid md:grid-cols-3 pb-2">
                <div className="min-w-full w-full snap-center md:min-w-0 shrink-0"><MasterCard atual={atual} nomeRestaurante="J-OS RESTAURANTE" dataAbertura={selectedDate.slice(5).replace("-","/")} horaAbertura={new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})} /></div>
                <div className="min-w-full w-full snap-center md:min-w-0 shrink-0"><EntradasCard entradas={entradas} nome="J-OS RESTAURANTE" dataHoje={selectedDate.slice(5).replace("-","/")} qtdVendas={movs.filter((m:any)=>(m.tipo||"").toUpperCase().includes("VENDA")).length} /></div>
                <div className="min-w-full w-full snap-center md:min-w-0 shrink-0"><SaidasCard saidas={saidas} nome="J-OS RESTAURANTE" hora={new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})} retirado={saidas>0?'1':'0'} /></div>
            </div>

            <div className="bg-white rounded-[24px] p-5 border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-[12px]">Extrato • {movs.length} movimentos • {selectedDate.split('-').reverse().join('/')}</h3>
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

            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={extrato} onClose={()=>setModalOpen(false)} onSuccess={()=>{ loadDia(selectedDate); toast.success("Atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={()=>setSangriaOpen(false)} onSuccess={()=>{ loadDia(selectedDate); toast.success("Feito!"); }} />
        </div>
    )
}
