"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, TrendingDown, TrendingUp } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

type Props = {
  open: boolean;
  tipo: "SANGRIA" | "SUPRIMENTO";
  onClose: () => void;
  onSuccess: () => void;
}

export function SangriaModal({ open, tipo, onClose, onSuccess }: Props) {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  useEffect(()=>setMounted(true),[]);
  useEffect(()=>{ if(open){ setValor(""); setMotivo(""); setError(""); } },[open]);

  if(!open ||!mounted) return null;
  const inputClass = "w-full bg-[#F5F7FB] border border-black/5 rounded-full px-4 py-2.5 text-[12px] outline-none focus:border-[#A67C52] focus:ring-1 focus:ring-[#A67C52]/20 font-bold";
  const isSangria = tipo === "SANGRIA";

  const handleSubmit = async () => {
    if(!valor || Number(valor) <= 0) { setError("Valor inválido"); return; }
    if(!motivo.trim()) { setError("Informe o motivo"); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/caixa/${isSangria? 'sangria' : 'suprimento'}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ valor: Number(valor), motivo })
      });
      if(!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Erro");
      }
      onSuccess();
      onClose();
    } catch(e:any){ setError(e.message) }
    finally { setSaving(false) }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#FAF6F1]/80 backdrop-blur-[14px] flex items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-2xl rounded-[22px] border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
        <div className="p-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSangria? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
              {isSangria? <TrendingDown size={14}/> : <TrendingUp size={14}/>}
            </div>
            <p className="font-black text-[13px]">{isSangria? 'Sangria / Saída' : 'Suprimento / Entrada'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center"><X size={14}/></button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-[9px] font-bold ml-2 mb-1 block opacity-60">VALOR (Kz) *</label>
            <input value={valor} onChange={e=>setValor(e.target.value)} type="number" placeholder="0,00" className={inputClass}/>
          </div>
          <div>
            <label className="text-[9px] font-bold ml-2 mb-1 block opacity-60">MOTIVO / DESCRIÇÃO *</label>
            <input value={motivo} onChange={e=>setMotivo(e.target.value)} placeholder={isSangria? 'Ex: Pagamento fornecedor' : 'Ex: Troco'} className="w-full bg-[#F5F7FB] border border-black/5 rounded-[16px] px-4 py-2.5 text-[12px] outline-none focus:border-[#A67C52] min-h-[44px]"/>
          </div>
          {error && <p className="text-[11px] text-red-500 font-bold bg-red-50 rounded-full px-3 py-2">{error}</p>}
        </div>

        <div className="p-3 border-t flex gap-3 justify-end">
          <button onClick={onClose} className="w-10 h-10 bg-white border border-[#E8DCCF] rounded-full flex items-center justify-center"><X size={16}/></button>
          <button onClick={handleSubmit} disabled={saving} className={`min-w-[80px] h-10 rounded-full flex items-center justify-center gap-2 px-5 text-[12px] font-bold disabled:opacity-60 ${isSangria? 'bg-red-500 text-white' : 'bg-black text-white'}`}>
            {saving? <Loader2 size={16} className="animate-spin"/> : <><Check size={16} strokeWidth={3}/> Confirmar</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
