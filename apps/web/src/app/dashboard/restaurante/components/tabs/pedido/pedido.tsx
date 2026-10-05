"use client";
import { useEffect, useState } from "react";
import { Clock3, Eye, Check, X, Timer, Utensils, ShoppingBag, AlertCircle, User } from "lucide-react";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "")+"/api/v1";

function timeAgo(iso:string){const d=Date.now()-new Date(iso).getTime();const m=Math.floor(d/60000);if(m<1)return"agora";if(m<60)return`${m} min`;return`${Math.floor(m/60)}h ${m%60}m`}
export function PedidosTab(){
  const [pedidos,setPedidos]=useState<any[]>([]); const [sel,setSel]=useState<any>(null); const [loading,setLoading]=useState(true);
  const load=async()=>{
    try{
      const token=localStorage.getItem("access_token")||""; const u=JSON.parse(localStorage.getItem("user")||"{}"); const emp=u.empresa_id||localStorage.getItem("empresa_id")||"";
      const r=await fetch(`${API_URL}/pedidos-qr/pendentes`,{headers:{Authorization:`Bearer ${token}`,"X-Empresa-ID":emp},cache:"no-store"});
      const data=await r.json(); if(Array.isArray(data)) setPedidos(data);
    }catch{}finally{setLoading(false)}
  };
  useEffect(()=>{load(); const id=setInterval(load,4000); return()=>clearInterval(id)},[]);
  const aprovar=async(p:any)=>{
    if(!confirm(`Levar MESA ${p.mesa_numero} para venda?`))return;
    const token=localStorage.getItem("access_token")||""; const u=JSON.parse(localStorage.getItem("user")||"{}"); const emp=u.empresa_id||"";
    const r=await fetch(`${API_URL}/pedidos-qr/${p.id}/aprovar`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"X-Empresa-ID":emp}});
    if(r.ok) setPedidos(s=>s.filter(x=>x.id!==p.id)); else alert("Abra o caixa primeiro");
  };
  const recusar=async(p:any)=>{
    const token=localStorage.getItem("access_token")||""; const u=JSON.parse(localStorage.getItem("user")||"{}"); const emp=u.empresa_id||"";
    await fetch(`${API_URL}/pedidos-qr/${p.id}/recusar`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"X-Empresa-ID":emp}});
    setPedidos(s=>s.filter(x=>x.id!==p.id)); setSel(null);
  };
  if(loading) return <div className="bg-white/70 rounded-[18px] p-10 text-center text-[13px] font-bold">Carregando pedidos...</div>;
  return (
    <div className="space-y-3">
      <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 border border-white/50 flex justify-between items-center"><div className="flex gap-3 items-center"><div className="w-10 h-10 bg-black rounded-full flex items-center justify-center"><Utensils size={18} className="text-white"/></div><div><h2 className="font-black">Pedidos QR • {pedidos.length}</h2><p className="text-[11px] text-zinc-500 font-bold">Tempo real a cada 4s</p></div></div><span className="text-[10px] font-black flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>LIVE</span></div>
      {pedidos.length===0 && <div className="bg-white/70 rounded-[18px] p-12 text-center border"><ShoppingBag className="mx-auto mb-2 opacity-30"/><p className="font-black text-[14px]">Nenhum pedido pendente</p></div>}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {pedidos.map((p:any)=>{
          const mins=Math.floor((Date.now()-new Date(p.created_at).getTime())/60000);
          return (
          <div key={p.id} className="bg-white rounded-[22px] border shadow-sm p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${mins<5?'bg-emerald-500':mins<15?'bg-amber-500':'bg-red-500'}`} />
            <div className="flex justify-between"><div className="bg-black text-white text-[11px] font-black px-3 py-1 rounded-full">MESA {p.mesa_numero}</div><div className="text-[10px] font-black flex items-center gap-1"><Timer size={12}/>{timeAgo(p.created_at)}</div><button onClick={()=>setSel(p)} className="w-8 h-8 bg-[#F5F7FB] rounded-full flex items-center justify-center"><Eye size={14}/></button></div>
            <div className="mt-3 flex gap-3 items-center"><div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center font-black text-sky-700">{p.cliente_nome?.[0]}</div><div className="flex-1"><p className="font-black text-[13px] flex items-center gap-1"><User size={12}/>{p.cliente_nome}</p><p className="text-[11px] text-zinc-500">{p.itens?.length} itens • Kz {Number(p.total).toLocaleString('de-DE')}</p></div></div>
            <div className="mt-3 bg-[#F5F7FB] rounded-[14px] p-2.5 text-[11px]">{p.itens?.slice(0,2).map((it:any,i:number)=><div key={i} className="flex justify-between"><span>{it.quantidade}x {it.produto_nome}</span><span>Kz {it.subtotal}</span></div>)} {p.itens?.length>2 && <p className="text-sky-600 font-black text-[10px] mt-1">+{p.itens.length-2} ver detalhes</p>}</div>
            <div className="mt-3 flex gap-2"><button onClick={()=>aprovar(p)} className="flex-1 bg-black text-white rounded-full py-3 font-black text-[12px] flex justify-center gap-2"><Check size={14}/>LEVAR P/ VENDA</button><button onClick={()=>recusar(p)} className="w-12 border rounded-full flex items-center justify-center"><X size={16}/></button></div>
            {mins>10 && <div className="mt-2 bg-red-50 text-red-600 text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1"><AlertCircle size={12}/> Esperando há {mins} min</div>}
          </div>)
        })}
      </div>
      {sel && <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"><div className="bg-white rounded-[24px] w-full max-w-[380px] overflow-hidden"><div className="p-5 border-b flex justify-between"><h3 className="font-black">MESA {sel.mesa_numero}</h3><button onClick={()=>setSel(null)} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center"><X size={14}/></button></div><div className="p-4 space-y-2 max-h-[50vh] overflow-auto">{sel.itens?.map((it:any,i:number)=><div key={i} className="flex justify-between bg-[#F5F7FB] rounded-full px-4 py-3 text-[13px]"><span>{it.quantidade}x {it.produto_nome}</span><span className="font-black">Kz {it.subtotal}</span></div>)}<div className="flex justify-between font-black px-2 pt-2"><span>Total</span><span>Kz {sel.total}</span></div></div><div className="p-4 grid grid-cols-2 gap-2"><button onClick={()=>recusar(sel)} className="border rounded-full py-3 font-black text-[13px]">Recusar</button><button onClick={()=>aprovar(sel)} className="bg-black text-white rounded-full py-3 font-black text-[13px]">Levar p/ Venda</button></div></div></div>}
    </div>
  )
}
