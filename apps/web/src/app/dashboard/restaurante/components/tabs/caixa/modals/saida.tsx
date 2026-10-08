"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, TrendingDown, TrendingUp } from "lucide-react";
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
export function SangriaModal({ open, tipo, onClose, onSuccess }: any) {
    const [mounted, setMounted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [valor, setValor] = useState("");
    const [motivo, setMotivo] = useState("");
    const [error, setError] = useState("");
    useEffect(() => setMounted(true), []); useEffect(() => { if (open) { setValor(""); setMotivo(""); setError(""); } }, [open]);
    if (!open ||!mounted) return null;
    const isSangria = tipo === "SANGRIA";
    // FIX ZOOM IOS: text-[16px] no mobile
    const inputClass = "w-full h-9 bg-white border border-[#E8DCCF] rounded-full px-4 text-[16px] md:text-[11px] font-bold outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-black/40 transition-all";
    const labelClass = "text-[8px] font-black tracking-widest text-zinc-500 mb-1 ml-1";
    const handleSubmit = async () => {
        if (!valor || Number(valor) <= 0) { toast.error("Valor inválido", { description: "Coloca um valor maior que 0" }); return; }
        if (!motivo.trim()) { toast.error("Falta o motivo", { description: "Ex: Pagamento fornecedor" }); return; }
        setSaving(true);
        try { await apiFetch(`/caixa/${isSangria? 'sangria' : 'suprimento'}`, { method: "POST", body: JSON.stringify({ valor: Number(valor), motivo }) }); onSuccess(); onClose(); }
        catch (e: any) { const msg = e.detail || e.message || "Erro"; setError(msg); toast.error(isSangria? "Erro na sangria" : "Erro no suprimento", { description: msg }); }
        finally { setSaving(false); }
    };
    return createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={onClose} />
            <div className="relative w-full max-w-[400px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col max-h-[92dvh] overflow-hidden animate-in fade-in zoom-in-95">
                <div className="bg-white m-[6px] rounded-[18px] p-3 flex justify-between items-center border border-black/5 shrink-0">
                    <div className="flex items-center gap-2.5"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSangria? 'bg-red-500 text-white' : 'bg-[#0CC06B] text-white'}`}>{isSangria? <TrendingDown size={14} /> : <TrendingUp size={14} />}</div><div><p className="font-black text-[13px] leading-none">{isSangria? 'SANGRIA' : 'SUPRIMENTO'}</p><p className="text-[8px] font-black tracking-widest text-zinc-500 mt-1">CAIXA • J-OS</p></div></div><button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95"><X size={14} /></button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="bg-white m-[6px] rounded-[18px] p-4 border border-black/5 space-y-3">
                        <div><p className={labelClass}>VALOR (Kz) *</p><input value={valor} onChange={e => setValor(e.target.value)} type="number" inputMode="decimal" className={`${inputClass} font-black`} placeholder="0" /></div>
                        <div><p className={labelClass}>MOTIVO *</p><input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder={isSangria? 'Ex: Pagamento fornecedor' : 'Ex: Troco'} className="w-full h-9 bg-white border border-[#E8DCCF] rounded-[16px] px-4 text-[16px] md:text-[11px] font-bold outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-black/40 transition-all" /></div>
                        {error && <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-4 py-2.5">{error}</p>}
                    </div>
                </div>
                <div className="shrink-0 bg-[#EDEBE6] p-[6px] pt-2 border-t border-black/5">
                    <div className="bg-white rounded-[18px] border border-black/5 p-2 flex gap-2">
                        <button onClick={onClose} className="flex-1 bg-white border border-black/10 rounded-full py-3 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.98] transition-all">Cancelar</button>
                        <button onClick={handleSubmit} disabled={saving} className={`flex-1 rounded-full py-3 text-[11px] font-black disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 text-white ${isSangria? 'bg-red-500' : 'bg-black'}`}>{saving? <Loader2 size={14} className="animate-spin" /> : <><Check size={12} /> Confirmar</>}</button>
                    </div>
                </div>
            </div>
        </div>, document.body
    )
}
