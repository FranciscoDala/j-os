"use client";
import { useEffect, useState, useRef } from "react";
import { Clock3, User, ShoppingBag, Eye, Check, X, Timer, Utensils, Sparkles, AlertCircle } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

type Pedido = {
  id: string;
  mesa_numero: string;
  cliente_nome: string;
  cliente_telefone?: string;
  status: string;
  total: number;
  created_at: string;
  itens: { produto_nome: string; quantidade: number; preco_unit: number; subtotal: number }[];
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
function getColor(m: number) {
  if (m < 5) return "bg-emerald-500";
  if (m < 15) return "bg-amber-500";
  return "bg-red-500";
}

export function PedidosTab() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Pedido | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchPedidos = async () => {
    try {
      const empresaId = localStorage.getItem("empresa_id") || sessionStorage.getItem("empresa_id") || "";
      const token = localStorage.getItem("token") || "";
      const r = await fetch(`${API_URL}/api/v1/pedidos-qr/pendentes`, {
        headers: { "Authorization": `Bearer ${token}`, "X-Empresa-ID": empresaId },
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      // toca som se entrou novo
      if (pedidos.length && data.length > pedidos.length) {
        audioRef.current?.play().catch(()=>{});
      }
      setPedidos(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPedidos();
    const id = setInterval(fetchPedidos, 5000);
    return () => clearInterval(id);
  }, []);

  const aprovar = async (p: Pedido) => {
    if (!confirm(`Levar pedido da MESA ${p.mesa_numero} para Venda?`)) return;
    const empresaId = localStorage.getItem("empresa_id") || "";
    const token = localStorage.getItem("token") || "";
    const r = await fetch(`${API_URL}/api/v1/pedidos-qr/${p.id}/aprovar`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "X-Empresa-ID": empresaId },
    });
    if (r.ok) {
      setPedidos(prev => prev.filter(x => x.id!== p.id));
      setSelected(null);
    } else {
      alert("Precisa abrir o caixa primeiro!");
    }
  };

  const recusar = async (p: Pedido) => {
    if (!confirm("Recusar este pedido?")) return;
    const empresaId = localStorage.getItem("empresa_id") || "";
    const token = localStorage.getItem("token") || "";
    await fetch(`${API_URL}/api/v1/pedidos-qr/${p.id}/recusar`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "X-Empresa-ID": empresaId },
    });
    setPedidos(prev => prev.filter(x => x.id!== p.id));
  };

  if (loading) return <div className="bg-white/70 rounded-[18px] p-10 text-center text-[13px]">Carregando pedidos...</div>;

  return (
    <div className="space-y-4">
      <audio ref={audioRef} src="https://cdn.pixabay.com/audio/2022/03/10/audio_c3a4bbd0d6.mp3" preload="auto" />
      <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 border border-white/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center"><Utensils size={18} className="text-white"/></div>
          <div>
            <h2 className="font-black text-[16px] leading-none">Pedidos QR</h2>
            <p className="text-[11px] text-zinc-500 font-bold mt-1">{pedidos.length} pendentes • tempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> LIVE
        </div>
      </div>

      {pedidos.length === 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-12 text-center border border-white/50">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3"><ShoppingBag size={24} className="text-zinc-400"/></div>
          <p className="font-black text-[14px]">Nenhum pedido pendente</p>
          <p className="text-[12px] text-zinc-500 mt-1">Quando cliente escanear QR da mesa, aparece aqui</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {pedidos.map(p => {
          const mins = Math.floor((Date.now() - new Date(p.created_at).getTime())/60000);
          return (
            <div key={p.id} className="bg-white rounded-[22px] border border-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-4 relative overflow-hidden group hover:shadow-[0_12px_32px_rgba(14,165,233,0.18)] hover:border-sky-200 transition-all">
              {/* barra tempo */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${getColor(mins)}`} />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-black text-white text-[11px] font-black px-3 py-1 rounded-full">MESA {p.mesa_numero}</div>
                  <div className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${mins < 5? "bg-emerald-50 text-emerald-700" : mins < 15? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700 animate-pulse"}`}>
                    <Timer size={12}/> {timeAgo(p.created_at)}
                  </div>
                </div>
                <button onClick={()=>setSelected(p)} className="w-8 h-8 bg-[#F5F7FB] rounded-full flex items-center justify-center"><Eye size={14}/></button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-50 border border-sky-100 rounded-full flex items-center justify-center font-black text-sky-700 text-[13px]">{p.cliente_nome.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[13px] truncate flex items-center gap-1"><User size={12}/> {p.cliente_nome}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{p.cliente_telefone || "sem telefone"} • {p.itens?.length || 0} itens</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-400 font-bold">TOTAL</p>
                  <p className="font-black text-[13px]">Kz {Number(p.total).toLocaleString('de-DE')}</p>
                </div>
              </div>

              <div className="mt-3 bg-[#F5F7FB] rounded-[14px] p-2.5">
                <p className="text-[10px] font-black text-zinc-500 mb-1.5 flex items-center gap-1"><Sparkles size={10}/> ITENS</p>
                <div className="space-y-1 max-h-[54px] overflow-hidden">
                  {p.itens?.slice(0,3).map((it,i)=>(
                    <div key={i} className="flex justify-between text-[11px]"><span className="font-bold truncate">{it.quantidade}x {it.produto_nome}</span><span className="text-zinc-500">Kz {Number(it.subtotal).toLocaleString('de-DE')}</span></div>
                  ))}
                  {(p.itens?.length||0) > 3 && <p className="text-[10px] text-sky-600 font-black">+{p.itens.length-3} itens • ver detalhes</p>}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <button onClick={()=>aprovar(p)} className="bg-black text-white rounded-full py-3 font-black text-[12px] flex items-center justify-center gap-2"><Check size={16}/> LEVAR P/ VENDA</button>
                <button onClick={()=>recusar(p)} className="w-12 bg-white border border-zinc-200 rounded-full flex items-center justify-center"><X size={16}/></button>
              </div>

              {mins > 10 && <div className="mt-2 bg-red-50 border border-red-100 rounded-full px-3 py-1.5 text-[10px] font-black text-red-600 flex items-center gap-1"><AlertCircle size={12}/> Cliente esperando há {mins} min!</div>}
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-[380px] shadow-2xl overflow-hidden">
            <div className="p-5 border-b">
              <div className="flex justify-between">
                <h3 className="font-black text-[16px]">MESA {selected.mesa_numero}</h3>
                <button onClick={()=>setSelected(null)} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center"><X size={14}/></button>
              </div>
              <p className="text-[12px] text-zinc-500 mt-1">{selected.cliente_nome} • {timeAgo(selected.created_at)} atrás • <Clock3 size={11} className="inline"/> {new Date(selected.created_at).toLocaleTimeString()}</p>
            </div>
            <div className="p-4 max-h-[50vh] overflow-auto space-y-2">
              {selected.itens?.map((it,i)=>(
                <div key={i} className="flex justify-between bg-[#F5F7FB] rounded-full px-4 py-3 text-[13px]"><span className="font-bold">{it.quantidade}x {it.produto_nome}</span><span className="font-black">Kz {Number(it.subtotal).toLocaleString('de-DE')}</span></div>
              ))}
              <div className="flex justify-between font-black text-[14px] pt-2 px-2"><span>Total</span><span>Kz {Number(selected.total).toLocaleString('de-DE')}</span></div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              <button onClick={()=>recusar(selected)} className="bg-white border border-zinc-200 rounded-full py-3 font-black text-[13px]">Recusar</button>
              <button onClick={()=>aprovar(selected)} className="bg-sky-500 text-white rounded-full py-3 font-black text-[13px]">Levar p/ Venda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
