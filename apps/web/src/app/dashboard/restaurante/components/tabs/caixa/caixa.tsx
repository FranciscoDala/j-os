"use client";
import { useEffect, useState } from "react";
import { Unlock, Lock, TrendingUp, TrendingDown, Clock, Plus, Minus, Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { CaixaModal } from "./modals/open_close";
import { SangriaModal } from "./modals/saida";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com";
const BASE = `${API_URL.replace(/\/$/, "")}/api/v1`;
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE}${path}`, {...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`,...(options.headers||{}) }});
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw data;
  return data;
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
    try {
      const status = await apiFetch("/caixa/status");
      if(status.aberto){ setCaixa(status.caixa_atual); const ext = await apiFetch("/caixa/extrato").catch(()=>null); setExtrato(ext); }
      else { setCaixa(null); setExtrato(null); }
    } catch { toast.error("Erro ao carregar caixa"); }
    finally { setLoading(false) }
  };
  useEffect(()=>{ fetchData() },[]);
  if(loading) return <div className="bg-white rounded-[18px] p-8 animate-pulse h-[300px]" />;
  const aberto =!!caixa;
  const entradas = Number(extrato?.total_entradas || 0);
  const inicial = Number(extrato?.saldo_inicial || 0);
  const atual = Number(extrato?.saldo_atual || 0);
  const saidas = (inicial + entradas) - atual; // calcula o que saiu

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="bg-white rounded-[24px] p-4 flex items-center justify-between border shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${aberto? 'bg-[#0CC06B] text-white' : 'bg-black text-white'}`}>{aberto? <Unlock size={18}/> : <Lock size={18}/>}</div>
          <div><h2 className="font-black text-[14px] tracking-tight">{aberto? 'Caixa Aberto' : 'Caixa Fechado'}</h2><p className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={11}/>{aberto? `${caixa.aberto_por_nome} • ${new Date(caixa.aberto_em).toLocaleString()}` : 'Abra o caixa para vender'}</p></div>
        </div>
        {!aberto? <button onClick={()=>{ setModalMode("abrir"); setModalOpen(true) }} className="px-6 py-2.5 bg-black text-white rounded-full text-[11px] font-black">Abrir Caixa</button> : <button onClick={()=>{ setModalMode("fechar"); setModalOpen(true) }} className="px-5 py-2 bg-white border rounded-full text-[11px] font-bold">Fechar</button>}
      </div>

      {aberto && extrato && (
        <>
          {/* CARDS BRABOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* MASTER - GAVETA */}
            <div className="md:col-span-1 bg-black rounded-[24px] p-5 text-white relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2"><Wallet size={14} className="opacity-60"/><p className="text-[9px] font-black tracking-[0.2em] opacity-50">NA GAVETA AGORA</p></div>
                  <span className="text-[9px] bg-white/15 px-2 py-1 rounded-full">Inicial Kz {inicial.toLocaleString()}</span>
                </div>
                <p className="text-[28px] font-black tracking-tight">Kz {atual.toLocaleString()}</p>
                <p className="text-[10px] opacity-60 mt-1">{inicial.toLocaleString()} inicial + {entradas.toLocaleString()} vendas - {saidas.toLocaleString()} saídas</p>
              </div>
            </div>

            {/* ENTRADA */}
            <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-[24px] p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 bg-[#0CC06B] rounded-full flex items-center justify-center text-white"><ArrowDownLeft size={16}/></div>
                <span className="text-[9px] font-black text-[#0CC06B] bg-white px-2.5 py-1 rounded-full">ENTRADAS</span>
              </div>
              <p className="text-[10px] font-bold text-[#2E7D32] tracking-wide">VENDAS DE HOJE</p>
              <p className="text-[22px] font-black text-[#1B5E20] mt-1">+ Kz {entradas.toLocaleString()}</p>
              <p className="text-[10px] text-[#4CAF50] mt-1">{extrato?.movimentos?.filter((m:any)=>Number(m.valor)>0).length || 0} vendas</p>
            </div>

            {/* SAIDA */}
            <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-[24px] p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="w-9 h-9 bg-[#E53935] rounded-full flex items-center justify-center text-white"><ArrowUpRight size={16}/></div>
                <span className="text-[9px] font-black text-[#E53935] bg-white px-2.5 py-1 rounded-full">SAÍDAS</span>
              </div>
              <p className="text-[10px] font-bold text-[#C62828] tracking-wide">SANGRIAS / DESPESAS</p>
              <p className="text-[22px] font-black text-[#B71C1C] mt-1">- Kz {Math.max(saidas,0).toLocaleString()}</p>
              <p className="text-[10px] text-[#EF5350] mt-1">{saidas > 0? 'Dinheiro retirado' : 'Nenhuma saída'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={()=>{ setSangriaTipo("SANGRIA"); setSangriaOpen(true) }} className="h-[48px] bg-white border rounded-full text-[11px] font-black text-[#C62828] flex items-center justify-center gap-2 hover:bg-red-50"><Minus size={14}/> Sangria (Retirar)</button>
            <button onClick={()=>{ setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true) }} className="h-[48px] bg-white border rounded-full text-[11px] font-black text-[#2E7D32] flex items-center justify-center gap-2 hover:bg-green-50"><Plus size={14}/> Suprimento</button>
          </div>
        </>
      )}

      {/* EXTRATO */}
      <div className="bg-white rounded-[24px] p-5 border shadow-sm"><h3 className="font-black text-[12px] mb-4 tracking-tight">Extrato • {extrato?.movimentos?.length || 0} movimentos</h3><div className="space-y-2 max-h-[420px] overflow-y-auto">{!extrato?.movimentos?.length? <p className="text-[11px] text-gray-400 text-center py-10">Sem movimentos</p> : extrato.movimentos.map((m:any)=>(<div key={m.id} className="flex items-center justify-between bg-[#F5F7FB] rounded-full px-4 py-3"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${Number(m.valor) > 0? 'bg-[#0CC06B] text-white' : 'bg-[#E53935] text-white'}`}>{Number(m.valor) > 0? <TrendingUp size={12}/> : <TrendingDown size={12}/>}</div><div><p className="text-[11px] font-bold">{m.descricao}</p><p className="text-[9px] text-gray-500">{m.tipo} • {new Date(m.criado_em).toLocaleTimeString()}</p></div></div><span className={`text-[12px] font-black ${Number(m.valor) > 0? 'text-[#0CC06B]' : 'text-[#E53935]'}`}>{Number(m.valor) > 0? '+' : ''} Kz {Number(m.valor).toLocaleString()}</span></div>))}</div></div>

      <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={caixa} onClose={()=>setModalOpen(false)} onSuccess={()=>{ fetchData(); toast.success(modalMode==='abrir'?"Caixa aberto!":modalMode==='fechar'?"Caixa fechado!":"Troca feita!"); }}/>
      <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={()=>setSangriaOpen(false)} onSuccess={()=>{ fetchData(); toast.success(sangriaTipo==='SANGRIA'?"Sangria feita":"Suprimento ok"); }}/>
    </div>
  )
}
