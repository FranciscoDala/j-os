"use client";
import { useEffect, useState, useMemo } from "react";
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

const toUTCDate = (iso?: string) => {
    if (!iso) return null;
    let s = iso;
    if (s.includes('T') &&!s.endsWith('Z') &&!s.includes('+') && s.lastIndexOf('-') < 11) s += 'Z';
    const d = new Date(s);
    return isNaN(d.getTime())? null : d;
};
const getLocalDatePart = (iso?: string) => {
    if (!iso) return "";
    const d = toUTCDate(iso);
    if (!d) return iso.slice(0,10);
    return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Luanda' });
};

export function CaixaTab() {
    const [status, setStatus] = useState<any>(null);
    const [extrato, setExtrato] = useState<any>(null);
    const [historico, setHistorico] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [showExtrato, setShowExtrato] = useState(false);
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
    };

    useEffect(()=>{ (async()=>{ setLoading(true); await loadAll(); setLoading(false); })(); }, []);

    const caixaDoDia = useMemo(() => {
        if (!selectedDate || historico.length===0 &&!status?.aberto) return null;
        if (status?.aberto && status?.caixa_atual?.aberto_em) {
            const ab = getLocalDatePart(status.caixa_atual.aberto_em);
            if (selectedDate >= ab) return status.caixa_atual;
        }
        const achado = historico.find((c:any)=> {
            const ab = getLocalDatePart(c.aberto_em);
            const fe = c.fechado_em? getLocalDatePart(c.fechado_em) : todayISO();
            return selectedDate >= ab && selectedDate <= fe;
        });
        return achado || historico.find((c:any)=> getLocalDatePart(c.aberto_em) === selectedDate) || null;
    }, [selectedDate, historico, status]);

    useEffect(()=>{
        (async()=>{
            if (!caixaDoDia) { setExtrato({ movimentos: [], saldo_inicial: 0, saldo_atual: 0, total_entradas: 0, total_saidas: 0 }); return; }
            setLoading(true);
            try {
                const isAbertoAtual = status?.aberto && caixaDoDia.id === status?.caixa_atual?.id;
                const ext = isAbertoAtual? await apiFetch("/caixa/extrato") : await apiFetch(`/caixa/${caixaDoDia.id}/extrato`);
                setExtrato(ext);
            } catch {
                setExtrato({ movimentos: [], saldo_inicial: caixaDoDia.saldo_inicial||0, saldo_atual: caixaDoDia.saldo_final_esperado||caixaDoDia.saldo_atual||0, total_entradas: 0, total_saidas: 0 });
            }
            setLoading(false);
        })();
    },[caixaDoDia]);

    const movs = extrato?.movimentos || [];
    const { entradas, saidas, atual } = useMemo(()=>{
        if (extrato?.total_entradas!=null || extrato?.total_saidas!=null) {
            const ent = Number(extrato.total_entradas||0);
            const sai = Math.abs(Number(extrato.total_saidas||0));
            const tot = extrato.saldo_atual!=null? Number(extrato.saldo_atual) : Number(extrato.saldo_inicial||0)+ent-sai;
            return { entradas: ent, saidas: sai, atual: tot };
        }
        let ent = 0, sai = 0;
        movs.forEach((m:any)=>{
            if ((m.tipo||"").toUpperCase() === "ABERTURA") return;
            const v = Number(m.valor||0); if (v > 0) ent += v; if (v < 0) sai += Math.abs(v);
        });
        const tot = caixaDoDia?.saldo_final_esperado!=null? Number(caixaDoDia.saldo_final_esperado) : Number(extrato?.saldo_inicial||caixaDoDia?.saldo_inicial||0)+ent-sai;
        return { entradas: ent, saidas: sai, atual: tot };
    }, [extrato, movs, caixaDoDia]);

    const handleCardClick = (type: "master" | "entradas" | "saidas") => {
        if (type === "master") {
            if (status?.aberto) setConfirm({ open: true, title: "Fechar caixa?", desc: `Saldo Kz ${fmt(atual)}. Fechar agora?`, type: "black", action: ()=>{ setModalMode("fechar"); setModalOpen(true); } });
            else setConfirm({ open: true, title: "Abrir caixa?", desc: "Iniciar novo turno.", type: "black", action: ()=>{ setModalMode("abrir"); setModalOpen(true); } });
        }
        if (type === "entradas") {
            if (!status?.aberto) { toast.error("Abra o caixa primeiro"); return; }
            setConfirm({ open: true, title: "Suprimento?", desc: "Adicionar dinheiro?", type: "green", action: ()=>{ setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true); } });
        }
        if (type === "saidas") {
            if (!status?.aberto) { toast.error("Abra o caixa primeiro"); return; }
            setConfirm({ open: true, title: "Sangria?", desc: "Retirar dinheiro?", type: "red", action: ()=>{ setSangriaTipo("SANGRIA"); setSangriaOpen(true); } });
        }
    };

    if (loading &&!extrato) return <div className="bg-white rounded-[20px] p-8 animate-pulse h-[300px]" />;

    const isAbertoNoDia =!!(caixaDoDia &&!caixaDoDia.fechado_em) ||!!(status?.aberto && selectedDate >= getLocalDatePart(status.caixa_atual?.aberto_em));

    return (
        <div className="space-y-4">
            <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none; scrollbar-width:none;}`}</style>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="w-full md:w-[calc((100%-32px)/3)]"><JCalendarPicker value={selectedDate} onChange={setSelectedDate} /></div>
                <label className="flex items-center gap-3 bg-white border rounded-full px-4 h-[42px] cursor-pointer select-none w-fit">
                    <div className="relative">
                        <input type="checkbox" checked={showExtrato} onChange={e=>setShowExtrato(e.target.checked)} className="sr-only" />
                        <div className={`w-[36px] h-[20px] rounded-full transition-all ${showExtrato? 'bg-black' : 'bg-zinc-200'}`} />
                        <div className={`absolute top-[2px] w-[16px] h-[16px] bg-white rounded-full shadow transition-all ${showExtrato? 'left-[18px]' : 'left-[2px]'}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Mostrar extrato</span>
                </label>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0 -mx-4 px-4 md:mx-0 md:px-0 md:gap-4 md:grid md:grid-cols-3 pb-2">
                <div onClick={()=>handleCardClick("master")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <MasterCard aberto={isAbertoNoDia} atual={atual} nomeRestaurante="J-OS RESTAURANTE" dataAbertura={selectedDate.slice(5).replace("-","/")} horaAbertura={caixaDoDia? (toUTCDate(caixaDoDia.aberto_em)?.toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit', timeZone: 'Africa/Luanda'})||"--:--") : "--:--"} />
                </div>
                <div onClick={()=>handleCardClick("entradas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <EntradasCard entradas={entradas} nome="J-OS RESTAURANTE" dataHoje={selectedDate.slice(5).replace("-","/")} qtdVendas={movs.filter((m:any)=> (m.tipo||"").toUpperCase().includes("VENDA")).length} />
                </div>
                <div onClick={()=>handleCardClick("saidas")} className="min-w-full w-full snap-center md:min-w-0 shrink-0 cursor-pointer active:scale-[0.98] transition">
                    <SaidasCard saidas={saidas} nome="J-OS RESTAURANTE" hora={new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})} retirado={saidas>0?'1':'0'} />
                </div>
            </div>

            {showExtrato && <ExtratoList movimentos={movs} selectedDate={selectedDate} />}

            <JConfirm open={confirm.open} title={confirm.title} desc={confirm.desc} type={confirm.type} onClose={()=>setConfirm(s=>({...s, open:false}))} onConfirm={confirm.action} />
            <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={status?.caixa_atual || caixaDoDia || extrato} onClose={()=>setModalOpen(false)} onSuccess={async()=>{ await loadAll(); toast.success("Atualizado!"); }} />
            <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={()=>setSangriaOpen(false)} onSuccess={async()=>{ await loadAll(); toast.success("Feito!"); }} />
        </div>
    )
}
