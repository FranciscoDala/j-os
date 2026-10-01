"use client";
import { useEffect, useState } from "react";
import { DollarSign, Lock, Unlock, TrendingUp, TrendingDown, Clock } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

type Caixa = {
  id: string;
  status: 'aberto' | 'fechado';
  saldo_inicial: number;
  saldo_atual: number;
  data_abertura: string;
  data_fechamento?: string;
}

export function CaixaTab() {
  const [caixa, setCaixa] = useState<Caixa | null>(null);
  const [loading, setLoading] = useState(true);
  const [saldoInicial, setSaldoInicial] = useState("0");
  const [movimentos, setMovimentos] = useState<any[]>([]);

  const fetchCaixa = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/caixa/aberto`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok){
        const data = await res.json();
        setCaixa(data.caixa || data);
        setMovimentos(data.movimentos || []);
      } else {
        setCaixa(null);
      }
    } catch { setCaixa(null) }
    finally { setLoading(false) }
  };

  useEffect(()=>{ fetchCaixa() }, []);

  const abrirCaixa = async () => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/caixa/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ saldo_inicial: Number(saldoInicial) })
    });
    if(res.ok) fetchCaixa();
  };

  const fecharCaixa = async () => {
    if(!confirm("Fechar caixa?")) return;
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_URL}/caixa/fechar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if(res.ok) fetchCaixa();
  };

  if(loading) return <div className="bg-white rounded-[18px] p-8 animate-pulse h-[300px]" />;

  return (
    <div className="space-y-4">
      {/* STATUS CARD */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[22px] p-5 border border-white/60 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${caixa?.status === 'aberto'? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {caixa?.status === 'aberto'? <Unlock size={20}/> : <Lock size={20}/>}
            </div>
            <div>
              <h2 className="font-black text-[16px]">{caixa?.status === 'aberto'? 'Caixa Aberto' : 'Caixa Fechado'}</h2>
              <p className="text-[12px] text-gray-500 flex items-center gap-1"><Clock size={12}/>{caixa? new Date(caixa.data_abertura).toLocaleString() : 'Nenhum caixa aberto'}</p>
            </div>
          </div>
          {caixa?.status === 'aberto'? (
            <button onClick={fecharCaixa} className="px-5 py-2.5 bg-black text-white rounded-full text-[12px] font-bold">Fechar Caixa</button>
          ) : (
            <div className="flex items-center gap-2">
              <input value={saldoInicial} onChange={e=>setSaldoInicial(e.target.value)} placeholder="Saldo inicial" className="w-28 h-10 bg-[#F5F7FB] rounded-full px-4 text-[13px] outline-none border border-black/5" />
              <button onClick={abrirCaixa} className="px-5 py-2.5 bg-black text-white rounded-full text-[12px] font-bold">Abrir Caixa</button>
            </div>
          )}
        </div>

        {caixa?.status === 'aberto' && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-[#F5F7FB] rounded-[16px] p-4"><p className="text-[10px] text-gray-500 font-bold">SALDO INICIAL</p><p className="font-black text-[18px]">Kz {Number(caixa.saldo_inicial).toLocaleString()}</p></div>
            <div className="bg-[#F5F7FB] rounded-[16px] p-4"><p className="text-[10px] text-gray-500 font-bold">ENTRADAS</p><p className="font-black text-[18px] text-green-600">Kz {movimentos.filter(m=>m.tipo==='entrada').reduce((a,b)=>a+Number(b.valor),0).toLocaleString()}</p></div>
            <div className="bg-black text-white rounded-[16px] p-4"><p className="text-[10px] opacity-60 font-bold">SALDO ATUAL</p><p className="font-black text-[18px]">Kz {Number(caixa.saldo_atual || caixa.saldo_inicial).toLocaleString()}</p></div>
          </div>
        )}
      </div>

      {/* MOVIMENTOS */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[22px] p-5 border border-white/60 shadow-sm">
        <h3 className="font-bold text-[14px] mb-3">Movimento do Caixa</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
          {movimentos.length === 0? <p className="text-[12px] text-gray-400 text-center py-10">Sem movimentos hoje</p> : movimentos.map((m,i)=>(
            <div key={i} className="flex items-center justify-between bg-[#F5F7FB] rounded-full px-4 py-3">
              <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.tipo==='entrada'? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{m.tipo==='entrada'? <TrendingUp size={14}/> : <TrendingDown size={14}/>}</div><div><p className="text-[12px] font-bold">{m.descricao || m.tipo}</p><p className="text-[10px] text-gray-500">{new Date(m.created_at).toLocaleTimeString()}</p></div></div>
              <span className={`text-[13px] font-black ${m.tipo==='entrada'? 'text-green-600' : 'text-red-600'}`}>{m.tipo==='entrada'? '+' : '-'} Kz {Number(m.valor).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
