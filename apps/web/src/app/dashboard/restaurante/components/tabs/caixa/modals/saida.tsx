"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, TrendingDown, TrendingUp } from "lucide-react";
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
export function SangriaModal({ open, tipo, onClose, onSuccess }: any) {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  useEffect(()=>setMounted(true),[]); useEffect(()=>{ if(open){ setValor(""); setMotivo(""); setError(""); } },[open]);
  if(!open||!mounted) return null;
  const isSangria = tipo==="SANGRIA";
  const handleSubmit = async () => {
    if(!valor||Number(valor)<=0){ toast.error("Valor inválido",{description:"Coloca um valor maior que 0"}); return; }
    if(!motivo.trim()){ toast.error("Falta o motivo",{description:"Ex: Pagamento fornecedor"}); return; }
    setSaving(true);
    try { await apiFetch(`/caixa/${isSangria? 'sangria' : 'suprimento'}`, { method: "POST", body: JSON.stringify({ valor: Number(valor), motivo }) }); onSuccess(); onClose(); }
    catch(e:any){ const msg = e.detail||e.message||"Erro"; setError(msg); toast.error(isSangria? "Erro na sangria" : "Erro no suprimento",{description: msg}); }
    finally { setSaving(false); }
  };
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#FAF6F1]/80 backdrop-blur-[14px] flex items-center justify-center p-2">
      <div className="w-full max-w-[400px] bg-white rounded-[22px] border shadow-xl overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b"><div className="flex items-center gap-2.5"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSangria? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>{isSangria? <TrendingDown size={14}/> : <TrendingUp size={14}/>}</div><p className="font-black text-[13px]">{isSangria? 'Sangria' : 'Suprimento'}</p></div><button onClick={onClose} className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center"><X size={14}/></button></div>
        <div className="p-4 space-y-3"><div><label className="text-[9px] font-bold ml-2 opacity-60">VALOR (Kz) *</label><input value={valor} onChange={e=>setValor(e.target.value)} type="number" className="w-full bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[12px] font-bold outline-none"/></div><div><label className="text-[9px] font-bold ml-2 opacity-60">MOTIVO *</label><input value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder={isSangria? 'Ex: Pagamento fornecedor' : 'Ex: Troco'} className="w-full bg-[#F5F7FB] border rounded-[16px] px-4 py-2.5 text-[12px] outline-none"/></div>{error && <p className="text-[11px] text-red-500 bg-red-50 rounded-full px-3 py-2">{error}</p>}</div>
        <div className="p-3 border-t flex justify-end gap-2"><button onClick={onClose} className="w-10 h-10 bg-white border rounded-full flex items-center justify-center"><X size={16}/></button><button onClick={handleSubmit} disabled={saving} className={`h-10 rounded-full px-5 text-[12px] font-bold flex items-center gap-2 text-white ${isSangria? 'bg-red-500' : 'bg-black'}`}>{saving? <Loader2 size={16} className="animate-spin"/> : <><Check size={16}/> Confirmar</>}</button></div>
      </div>
    </div>, document.body
  )
}
