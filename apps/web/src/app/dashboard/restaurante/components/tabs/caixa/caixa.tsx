"use client";
import { useEffect, useState } from "react";
import { Unlock, Lock, TrendingUp, TrendingDown, Clock, Plus, Minus } from "lucide-react";
import { CaixaModal } from "./modals/open_close";
import { SangriaModal } from "./modals/saida";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com";
const BASE = `${API_URL.replace(/\/$/, "")}/api/v1`;
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE}${path}`, {...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`,...(options.headers||{}) }});
  const d = await res.json().catch(()=>({})); if(!res.ok) throw d; return d;
}

function WorldMap({ className="" }: {className?: string}) {
  return (
    <svg viewBox="0 0 1000 500" className={`absolute inset-0 w-[165%] h-[165%] -top-[20%] -left-[5%] ${className}`} fill="currentColor">
      <path d="M150 120 Q180 100 220 130 T300 140 Q320 160 300 190 T250 210 Q200 200 150 170 Z M350 80 Q420 60 480 90 T550 110 Q580 150 540 190 T450 210 Q380 180 350 120 Z M600 90 Q700 70 800 110 T850 180 Q820 220 700 230 T600 160 Z M100 250 Q200 230 280 270 T350 320 Q300 360 200 350 T100 300 Z M400 280 Q500 260 600 300 T650 380 Q550 420 450 390 T400 320 Z M700 300 Q800 280 900 320 T850 420 Q750 430 700 380 Z" opacity="0.9"/>
      <path d="M50 350 Q150 330 250 360 T400 400 Q350 450 200 440 T50 390 Z" opacity="0.6"/>
    </svg>
  )
}

function ChipReal() {
  return (
    <div className="relative w-[58px] h-[44px] rounded-[8px] bg-gradient-to-b from-[#FFE9A6] via-[#D8A44A] to-[#8C5E16] p-[1.2px] shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="w-full h-full rounded-[7px] bg-gradient-to-br from-[#FFED8C] via-[#E6C35A] to-[#B07D25] relative overflow-hidden">
        {/* linhas do chip */}
        <div className="absolute inset-0 flex flex-col justify-around py-[3px]">
          <div className="h-[1px] bg-black/20 w-full" />
          <div className="h-[1px] bg-black/20 w-full" />
        </div>
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-black/20" />
        <div className="absolute left-[18px] top-1/2 -translate-y-1/2 w-[22px] h-[26px] rounded-[7px] border-[1.2px] border-black/30 bg-gradient-to-b from-white/30 to-black/10 shadow-inner" />
      </div>
    </div>
  )
}

function CardBase({ children, variant }: { children: React.ReactNode, variant: "black"|"green"|"red" }) {
  const bg = {
    black: "bg-[#0A0A0A]",
    green: "bg-gradient-to-br from-[#0A2E22] via-[#0E6B43] to-[#14A166]",
    red: "bg-gradient-to-br from-[#3A0C0C] via-[#8A1C1C] to-[#C92A2A]",
  }[variant];
  return (
    <div className={`relative h-[192px] rounded-[22px] overflow-hidden ${bg} border border-white/[0.14] shadow-[0_22px_50px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]`}>
      {/* luz superior */}
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_18%,transparent_40%)] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-[280px] h-[280px] bg-white/[0.08] rounded-full blur-[40px] pointer-events-none" />
      {/* mapa */}
      <WorldMap className={`${variant==="black"? "text-white/[0.11]" : variant==="green"? "text-emerald-950/40" : "text-black/25"} `} />
      <div className={`absolute inset-0 ${variant==="black"? "bg-gradient-to-br from-white/[0.07] to-transparent" : "bg-gradient-to-br from-white/[0.12] to-black/20"}`} />
      <div className="relative h-full p-[20px] flex flex-col justify-between">{children}</div>
    </div>
  )
}

export function CaixaTab() {
  const [caixa, setCaixa] = useState<any>(null);
  const [extrato, setExtrato] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"abrir"|"fechar"|"forcar">("abrir");
  const [sangriaOpen, setSangriaOpen] = useState(false);
  const [sangriaTipo, setSangriaTipo] = useState<"SANGRIA"|"SUPRIMENTO">("SANGRIA");

  const fetchData = async () => {
    setLoading(true);
    try { const s = await apiFetch("/caixa/status"); if(s.aberto){ setCaixa(s.caixa_atual); setExtrato(await apiFetch("/caixa/extrato").catch(()=>null)); } else { setCaixa(null); setExtrato(null);} }
    catch { toast.error("Erro ao carregar caixa"); } finally { setLoading(false) }
  };
  useEffect(()=>{fetchData()},[]);
  if(loading) return <div className="bg-white rounded-[22px] p-8 animate-pulse h-[300px]" />;

  const aberto =!!caixa;
  const entradas = Number(extrato?.total_entradas||0);
  const inicial = Number(extrato?.saldo_inicial||0);
  const atual = Number(extrato?.saldo_atual||0);
  const saidas = Math.max(0,(inicial+entradas)-atual);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[24px] p-4 flex items-center justify-between border shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${aberto?'bg-[#0CC06B] text-white':'bg-black text-white'}`}>{aberto?<Unlock size={18}/>:<Lock size={18}/>}</div>
          <div><h2 className="font-black text-[14px]">{aberto?'Caixa Aberto':'Caixa Fechado'}</h2><p className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={11}/>{aberto?`${caixa.aberto_por_nome} • ${new Date(caixa.aberto_em).toLocaleString()}`:'Abra o caixa para vender'}</p></div>
        </div>
        {!aberto?<button onClick={()=>{setModalMode("abrir");setModalOpen(true)}} className="px-6 py-2.5 bg-black text-white rounded-full text-[11px] font-black">Abrir Caixa</button>:<button onClick={()=>{setModalMode("fechar");setModalOpen(true)}} className="px-5 py-2 bg-white border rounded-full text-[11px] font-bold">Fechar</button>}
      </div>

      {aberto && extrato && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CardBase variant="black">
              <div className="flex justify-between items-start"><p className="text-white font-black tracking-[0.1em] text-[11px]">J-OS • NA GAVETA</p><span className="text-[8px] font-bold tracking-widest text-white/60 bg-white/[0.14] border border-white/10 px-2.5 py-[4px] rounded-full backdrop-blur">MASTER • BALANCE</span></div>
              <ChipReal />
              <div className="flex justify-between items-end">
                <div><p className="text-white text-[26px] font-black leading-none tracking-tight">Kz {atual.toLocaleString()}</p><p className="text-[9px] text-white/40 mt-2 tracking-wide font-medium">•••• 4288 • {inicial.toLocaleString()} inicial</p></div>
                <div className="flex"><div className="w-[28px] h-[28px] rounded-full bg-[#EB001B] shadow-[0_2px_6px_rgba(0,0,0,0.6)] border border-white/20"/><div className="w-[28px] h-[28px] rounded-full bg-[#F79E1B] -ml-[12px] shadow-[0_2px_6px_rgba(0,0,0,0.6)] border border-white/20"/></div>
              </div>
            </CardBase>

            <CardBase variant="green">
              <div className="flex justify-between items-start"><p className="text-emerald-50 font-black tracking-[0.12em] text-[12px] drop-shadow">ENTRADAS</p><span className="text-[8px] font-black text-white/80 bg-white/20 border border-white/20 px-2.5 py-[4px] rounded-full backdrop-blur">TODAY • INFLUX</span></div>
              <ChipReal />
              <div className="flex justify-between items-end"><p className="text-white text-[26px] font-black leading-none">+ Kz {entradas.toLocaleString()}</p><span className="text-[10px] font-bold text-emerald-100/80 tracking-wide">↗ •••• 9102</span></div>
            </CardBase>

            <CardBase variant="red">
              <div className="flex justify-between items-start"><p className="text-red-50 font-black tracking-[0.12em] text-[12px] drop-shadow">SAIDAS</p><span className="text-[8px] font-black text-white/80 bg-white/20 border border-white/20 px-2.5 py-[4px] rounded-full backdrop-blur">TODAY • OUTFLOW</span></div>
              <ChipReal />
              <div className="flex justify-between items-end"><p className="text-white text-[26px] font-black leading-none">- Kz {saidas.toLocaleString()}</p><span className="text-[10px] font-bold text-red-100/80 tracking-wide">↘ •••• 6371</span></div>
            </CardBase>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={()=>{setSangriaTipo("SANGRIA");setSangriaOpen(true)}} className="h-[48px] bg-white border rounded-full text-[11px] font-black text-[#C62828] flex items-center justify-center gap-2"><Minus size={14}/> Sangria (Retirar)</button>
            <button onClick={()=>{setSangriaTipo("SUPRIMENTO");setSangriaOpen(true)}} className="h-[48px] bg-white border rounded-full text-[11px] font-black text-[#2E7D32] flex items-center justify-center gap-2"><Plus size={14}/> Suprimento</button>
          </div>
        </>
      )}

      <div className="bg-white rounded-[24px] p-5 border shadow-sm"><h3 className="font-black text-[12px] mb-4">Extrato • {extrato?.movimentos?.length||0} movimentos</h3><div className="space-y-2 max-h-[420px] overflow-y-auto">{!extrato?.movimentos?.length?<p className="text-[11px] text-gray-400 text-center py-10">Sem movimentos</p>:extrato.movimentos.map((m:any)=>(<div key={m.id} className="flex items-center justify-between bg-[#F5F7FB] rounded-full px-4 py-3"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${Number(m.valor)>0?'bg-[#0CC06B] text-white':'bg-[#E53935] text-white'}`}>{Number(m.valor)>0?<TrendingUp size={12}/>:<TrendingDown size={12}/>}</div><div><p className="text-[11px] font-bold">{m.descricao}</p><p className="text-[9px] text-gray-500">{m.tipo} • {new Date(m.criado_em).toLocaleTimeString()}</p></div></div><span className={`text-[12px] font-black ${Number(m.valor)>0?'text-[#0CC06B]':'text-[#E53935]'}`}>{Number(m.valor)>0?'+':''} Kz {Number(m.valor).toLocaleString()}</span></div>))}</div></div>

      <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={caixa} onClose={()=>setModalOpen(false)} onSuccess={()=>{fetchData(); toast.success(modalMode==='abrir'?"Caixa aberto!":modalMode==='fechar'?"Caixa fechado!":"Troca feita!");}}/>
      <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={()=>setSangriaOpen(false)} onSuccess={()=>{fetchData(); toast.success(sangriaTipo==='SANGRIA'?"Sangria feita":"Suprimento ok");}}/>
    </div>
  )
}
