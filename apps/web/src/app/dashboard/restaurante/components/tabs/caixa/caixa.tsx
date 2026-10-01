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

  return (
    <div className="space-y-3">
      <div className="bg-white/80 backdrop-blur-xl rounded-[22px] p-5 border border-white/60 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${aberto? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{aberto? <Unlock size={20}/> : <Lock size={20}/>}</div>
            <div><h2 className="font-black text-[15px]">{aberto? 'Caixa Aberto' : 'Caixa Fechado'}</h2><p className="text-[11px] text-gray-500 flex items-center gap-1"><Clock size={12}/>{aberto? `Aberto por ${caixa.aberto_por_nome} • ${new Date(caixa.aberto_em).toLocaleString()}` : 'Abra o caixa para vender'}</p></div>
          </div>
          {!aberto? <button onClick={()=>{ setModalMode("abrir"); setModalOpen(true) }} className="px-5 py-2.5 bg-black text-white rounded-full text-[12px] font-bold">Abrir Caixa</button> : <button onClick={()=>{ setModalMode("fechar"); setModalOpen(true) }} className="px-5 py-2.5 bg-white border rounded-full text-[12px] font-bold">Fechar</button>}
        </div>
        {aberto && extrato && (
          <>
            <div className="grid grid-cols-3 gap-3 mt-5"><div className="bg-[#F5F7FB] rounded-[16px] p-4"><p className="text-[9px] text-gray-500 font-bold">INICIAL</p><p className="font-black text-[16px]">Kz {Number(extrato.saldo_inicial).toLocaleString()}</p></div><div className="bg-[#F5F7FB] rounded-[16px] p-4"><p className="text-[9px] text-gray-500 font-bold">ENTRADAS</p><p className="font-black text-[16px] text-green-600">+ Kz {Number(extrato.total_entradas).toLocaleString()}</p></div><div className="bg-black text-white rounded-[16px] p-4"><p className="text-[9px] opacity-60 font-bold">ATUAL</p><p className="font-black text-[16px]">Kz {Number(extrato.saldo_atual).toLocaleString()}</p></div></div>
            <div className="flex gap-2 mt-3"><button onClick={()=>{ setSangriaTipo("SANGRIA"); setSangriaOpen(true) }} className="flex-1 h-10 bg-red-50 border border-red-100 rounded-full text-[11px] font-bold text-red-600 flex items-center justify-center gap-1"><Minus size={14}/> Sangria</button><button onClick={()=>{ setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true) }} className="flex-1 h-10 bg-green-50 border border-green-100 rounded-full text-[11px] font-bold text-green-600 flex items-center justify-center gap-1"><Plus size={14}/> Suprimento</button></div>
          </>
        )}
      </div>
      <div className="bg-white/80 backdrop-blur-xl rounded-[22px] p-5 border border-white/60 shadow-sm"><h3 className="font-bold text-[13px] mb-3">Extrato • {extrato?.movimentos?.length || 0}</h3><div className="space-y-2 max-h-[420px] overflow-y-auto">{!extrato?.movimentos?.length? <p className="text-[11px] text-gray-400 text-center py-10">Sem movimentos</p> : extrato.movimentos.map((m:any)=>(<div key={m.id} className="flex items-center justify-between bg-[#F5F7FB] rounded-full px-4 py-3"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${Number(m.valor) > 0? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{Number(m.valor) > 0? <TrendingUp size={12}/> : <TrendingDown size={12}/>}</div><div><p className="text-[11px] font-bold">{m.descricao}</p><p className="text-[9px] text-gray-500">{m.tipo} • {new Date(m.criado_em).toLocaleTimeString()}</p></div></div><span className={`text-[12px] font-black ${Number(m.valor) > 0? 'text-green-600' : 'text-red-600'}`}>{Number(m.valor) > 0? '+' : ''} Kz {Number(m.valor).toLocaleString()}</span></div>))}</div></div>
      <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={caixa} onClose={()=>setModalOpen(false)} onSuccess={()=>{ fetchData(); if(modalMode==='abrir') toast.success("Caixa aberto com sucesso!",{description:"Já podes começar a vender."}); if(modalMode==='fechar') toast.success("Caixa fechado!",{description:"Turno encerrado."}); if(modalMode==='forcar') toast.success("Troca de turno feita!",{description:"Novo caixa aberto."}); }}/>
      <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={()=>setSangriaOpen(false)} onSuccess={()=>{ fetchData(); if(sangriaTipo==='SANGRIA') toast.success("Sangria registrada",{description:"Saída lançada no extrato."}); else toast.success("Suprimento registrado",{description:"Entrada adicionada."}); }}/>
    </div>
  )
}
