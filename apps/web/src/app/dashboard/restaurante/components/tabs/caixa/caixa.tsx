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
  const res = await fetch(`${BASE}${path}`, {...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`,...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

function Chip() {
  return (
    <div className="w-[56px] h-[42px] rounded-[7px] bg-gradient-to-br from-[#FFE7A0] via-[#D4A847] to-[#A67C2E] p-[1px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_6px_rgba(0,0,0,0.3)]">
      <div className="w-full h-full rounded-[6px] bg-gradient-to-br from-[#FFDC73] to-[#C89A3E] relative overflow-hidden flex flex-col justify-between py-[5px]">
        <div className="absolute top-1/2 w-full h-[1px] bg-black/20 -translate-y-1/2" />
        <div className="absolute left-[22px] top-1/2 h-[16px] w-[14px] border border-black/25 rounded-[7px] -translate-y-1/2 bg-gradient-to-b from-[#FFE9A8]/80 to-[#C89A3E]/50" />
        <div className="flex justify-between px-1"><div className="w-full h-[1px] bg-black/15" /></div>
        <div className="flex justify-between px-1"><div className="w-full h-[1px] bg-black/15" /></div>
      </div>
    </div>
  );
}

export function CaixaTab() {
  const [caixa, setCaixa] = useState<any>(null);
  const [extrato, setExtrato] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"abrir" | "fechar" | "forcar">("abrir");
  const [sangriaOpen, setSangriaOpen] = useState(false);
  const [sangriaTipo, setSangriaTipo] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");

  const fetchData = async () => {
    setLoading(true);
    try {
      const status = await apiFetch("/caixa/status");
      if (status.aberto) { setCaixa(status.caixa_atual); const ext = await apiFetch("/caixa/extrato").catch(() => null); setExtrato(ext); }
      else { setCaixa(null); setExtrato(null); }
    } catch { toast.error("Erro ao carregar caixa"); }
    finally { setLoading(false) }
  };
  useEffect(() => { fetchData() }, []);
  if (loading) return <div className="bg-white rounded-[18px] p-8 animate-pulse h-[300px]" />;

  const aberto =!!caixa;
  const entradas = Number(extrato?.total_entradas || 0);
  const inicial = Number(extrato?.saldo_inicial || 0);
  const atual = Number(extrato?.saldo_atual || 0);
  const saidas = Math.max(0, (inicial + entradas) - atual);

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="bg-white rounded-[24px] p-4 flex items-center justify-between border shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center ${aberto? 'bg-[#0CC06B] text-white' : 'bg-black text-white'}`}>{aberto? <Unlock size={18} /> : <Lock size={18} />}</div>
          <div><h2 className="font-black text-[14px] tracking-tight">{aberto? 'Caixa Aberto' : 'Caixa Fechado'}</h2><p className="text-[10px] text-gray-500 flex items-center gap-1"><Clock size={11} />{aberto? `${caixa.aberto_por_nome} • ${new Date(caixa.aberto_em).toLocaleString()}` : 'Abra o caixa para vender'}</p></div>
        </div>
        {!aberto? <button onClick={() => { setModalMode("abrir"); setModalOpen(true) }} className="px-6 py-2.5 bg-black text-white rounded-full text-[11px] font-black">Abrir Caixa</button> : <button onClick={() => { setModalMode("fechar"); setModalOpen(true) }} className="px-5 py-2 bg-white border rounded-full text-[11px] font-bold">Fechar</button>}
      </div>

      {aberto && extrato && (
        <>
          {/* CARDS REALISTAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MASTER */}
            <div className="relative h-[190px] rounded-[20px] overflow-hidden bg-[#121212] shadow-[0_18px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.15)] border border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(255,255,255,0.18),transparent_60%)]" />
              <div className="absolute inset-0 opacity-[0.22] mix-blend-luminosity" style={{ backgroundImage: `url('https://raw.githubusercontent.com/djaiss/mapsicon/master/all/world/low/world.svg')`, backgroundRepeat: 'no-repeat', backgroundSize: '160%', backgroundPosition: '70% 30%' }} />
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-black/40" />
              {/* brushed metal */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0) 1px, transparent 2px)` }} />

              <div className="relative h-full p-[18px] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <p className="text-white font-black tracking-[0.08em] text-[12.5px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">J-OS • NA GAVETA</p>
                  <span className="text-[8px] font-bold tracking-widest text-white/60 bg-white/[0.12] border border-white/10 px-2.5 py-1 rounded-full backdrop-blur">MASTER • BALANCE</span>
                </div>
                <Chip />
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white text-[26px] font-black tracking-tight leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9),0_0_0.5px_rgba(255,255,255,0.6)]">Kz {atual.toLocaleString()}</p>
                    <p className="text-[9px] text-white/45 mt-1.5 tracking-wide">•••• 4288 • {inicial} inicial</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-[#EB001B] shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                    <div className="w-7 h-7 rounded-full bg-[#F79E1B] -ml-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.5)] opacity-95" />
                  </div>
                </div>
              </div>
            </div>

            {/* ENTRADAS */}
            <div className="relative h-[190px] rounded-[20px] overflow-hidden bg-gradient-to-br from-[#0B3D2A] via-[#0E5A3B] to-[#149256] shadow-[0_18px_40px_rgba(12,150,86,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(255,255,255,0.22),transparent_60%)]" />
              <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay" style={{ backgroundImage: `url('https://raw.githubusercontent.com/djaiss/mapsicon/master/all/world/low/world.svg')`, backgroundRepeat: 'no-repeat', backgroundSize: '160%', backgroundPosition: '70% 30%' }} />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />

              <div className="relative h-full p-[18px] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <p className="text-emerald-50 font-black tracking-[0.08em] text-[13px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">ENTRADAS</p>
                  <span className="text-[8px] font-black tracking-widest text-emerald-50/80 bg-white/15 border border-white/15 px-2.5 py-1 rounded-full backdrop-blur">TODAY • INFLUX</span>
                </div>
                <Chip />
                <div className="flex justify-between items-end">
                  <p className="text-emerald-50 text-[24px] font-black tracking-tight leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">+ Kz {entradas.toLocaleString()}</p>
                  <div className="text-right"><p className="text-[10px] text-emerald-200/80 font-bold">↗ •••• 9102</p></div>
                </div>
              </div>
            </div>

            {/* SAIDAS */}
            <div className="relative h-[190px] rounded-[20px] overflow-hidden bg-gradient-to-br from-[#4A0E0E] via-[#7A1A1A] to-[#C1272D] shadow-[0_18px_40px_rgba(193,39,45,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)] border border-white/10">
              <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(255,255,255,0.18),transparent_60%)]" />
              <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay" style={{ backgroundImage: `url('https://raw.githubusercontent.com/djaiss/mapsicon/master/all/world/low/world.svg')`, backgroundRepeat: 'no-repeat', backgroundSize: '160%', backgroundPosition: '70% 30%' }} />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/25 to-transparent" />

              <div className="relative h-full p-[18px] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <p className="text-red-50 font-black tracking-[0.08em] text-[13px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">SAIDAS</p>
                  <span className="text-[8px] font-black tracking-widest text-red-50/80 bg-white/15 border border-white/15 px-2.5 py-1 rounded-full backdrop-blur">TODAY • OUTFLOW</span>
                </div>
                <Chip />
                <div className="flex justify-between items-end">
                  <p className="text-red-50 text-[24px] font-black tracking-tight leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">- Kz {saidas.toLocaleString()}</p>
                  <div className="text-right"><p className="text-[10px] text-red-200/80 font-bold">↘ •••• 6371</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setSangriaTipo("SANGRIA"); setSangriaOpen(true) }} className="h-[48px] bg-white border rounded-full text-[11px] font-black text-[#C62828] flex items-center justify-center gap-2 hover:bg-red-50 transition"><Minus size={14} /> Sangria (Retirar)</button>
            <button onClick={() => { setSangriaTipo("SUPRIMENTO"); setSangriaOpen(true) }} className="h-[48px] bg-white border rounded-full text-[11px] font-black text-[#2E7D32] flex items-center justify-center gap-2 hover:bg-green-50 transition"><Plus size={14} /> Suprimento</button>
          </div>
        </>
      )}

      {/* EXTRATO */}
      <div className="bg-white rounded-[24px] p-5 border shadow-sm"><h3 className="font-black text-[12px] mb-4 tracking-tight">Extrato • {extrato?.movimentos?.length || 0} movimentos</h3><div className="space-y-2 max-h-[420px] overflow-y-auto">{!extrato?.movimentos?.length? <p className="text-[11px] text-gray-400 text-center py-10">Sem movimentos</p> : extrato.movimentos.map((m: any) => (<div key={m.id} className="flex items-center justify-between bg-[#F5F7FB] rounded-full px-4 py-3"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${Number(m.valor) > 0? 'bg-[#0CC06B] text-white' : 'bg-[#E53935] text-white'}`}>{Number(m.valor) > 0? <TrendingUp size={12} /> : <TrendingDown size={12} />}</div><div><p className="text-[11px] font-bold">{m.descricao}</p><p className="text-[9px] text-gray-500">{m.tipo} • {new Date(m.criado_em).toLocaleTimeString()}</p></div></div><span className={`text-[12px] font-black ${Number(m.valor) > 0? 'text-[#0CC06B]' : 'text-[#E53935]'}`}>{Number(m.valor) > 0? '+' : ''} Kz {Number(m.valor).toLocaleString()}</span></div>))}</div></div>

      <CaixaModal open={modalOpen} mode={modalMode} caixaAtual={caixa} onClose={() => setModalOpen(false)} onSuccess={() => { fetchData(); toast.success(modalMode === 'abrir'? "Caixa aberto!" : modalMode === 'fechar'? "Caixa fechado!" : "Troca feita!"); }} />
      <SangriaModal open={sangriaOpen} tipo={sangriaTipo} onClose={() => setSangriaOpen(false)} onSuccess={() => { fetchData(); toast.success(sangriaTipo === 'SANGRIA'? "Sangria feita" : "Suprimento ok"); }} />
    </div>
  )
}
