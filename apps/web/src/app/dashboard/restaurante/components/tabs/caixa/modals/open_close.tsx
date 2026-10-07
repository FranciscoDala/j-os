"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, Lock, Unlock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com";
const BASE = `${API_URL.replace(/\/$/, "")}/api/v1`;
async function apiFetch(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw data;
    return data;
}
export function CaixaModal({ open, mode, caixaAtual, onClose, onSuccess }: any) {
    const [mounted, setMounted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saldo, setSaldo] = useState("0");
    const [motivo, setMotivo] = useState("");
    const [error, setError] = useState("");
    useEffect(() => setMounted(true), []);
    useEffect(() => { if (open) { setSaldo("0"); setMotivo(""); setError(""); } }, [open, mode]);
    if (!open || !mounted) return null;
    const inputClass = "w-full h-9 bg-white border border-[#E8DCCF] rounded-full px-4 text-[11px] font-bold outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-black/40 transition-all";
    const labelClass = "text-[8px] font-black tracking-widest text-zinc-500 mb-1 ml-1";
    const handleSubmit = async () => {
        if (mode === 'forcar' && !motivo.trim()) { toast.error("Falta o motivo", { description: "Ex: Troca de turno" }); return; }
        setSaving(true); setError("");
        try {
            if (mode === "abrir") await apiFetch("/caixa/abrir", { method: "POST", body: JSON.stringify({ saldo_inicial: Number(saldo) }) });
            else if (mode === "fechar") await apiFetch("/caixa/fechar", { method: "POST", body: JSON.stringify({ saldo_informado: Number(saldo) }) });
            else await apiFetch("/caixa/forcar-abertura", { method: "POST", body: JSON.stringify({ saldo_inicial: Number(saldo), motivo }) });
            onSuccess(); onClose();
        } catch (e: any) {
            const msg = e.detail?.message || e.detail || e.message || "Erro";
            const txt = typeof msg === 'string' ? msg : JSON.stringify(msg);
            setError(txt);
            if (txt.toLowerCase().includes("mesas ocupadas")) toast.error("Não podes fechar agora", { description: txt });
            else if (e.detail?.code === "CAIXA_ABERTO_POR_OUTRO") toast.error("Caixa já aberto", { description: `Aberto por ${e.detail.caixa.aberto_por_nome}` });
            else toast.error("Erro no caixa", { description: txt });
        } finally { setSaving(false); }
    };
    const isAbrir = mode === "abrir" || mode === "forcar";
    return createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={onClose} />
            <div className="relative w-full max-w-[420px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col max-h-[92dvh] overflow-hidden animate-in fade-in zoom-in-95">
                {/* HEADER FIXO */}
                <div className="bg-white m-[6px] rounded-[18px] p-3 flex justify-between items-center border border-black/5 shrink-0">
                    <div className="flex items-center gap-2.5"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAbrir ? 'bg-black text-white' : 'bg-red-500 text-white'}`}>{isAbrir ? <Unlock size={14} /> : <Lock size={14} />}</div><div><p className="font-black text-[13px] leading-none">{mode === 'abrir' ? 'ABRIR CAIXA' : mode === 'fechar' ? 'FECHAR CAIXA' : 'FORÇAR ABERTURA'}</p><p className="text-[8px] font-black tracking-widest text-zinc-500 mt-1">CAIXA • J-OS</p></div></div><button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95"><X size={14} /></button>
                </div>
                {/* CONTEÚDO */}
                <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="bg-white m-[6px] rounded-[18px] p-4 border border-black/5 space-y-3">
                        {mode === 'forcar' && caixaAtual && <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-3 flex gap-2 items-start"><AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" /><p className="text-[11px] font-bold text-amber-800 leading-tight">Aberto por <b>{caixaAtual.aberto_por_nome}</b></p></div>}
                        <div><p className={labelClass}>{isAbrir ? 'SALDO INICIAL (Kz)' : 'QUANTO TEM NA GAVETA *'}</p><input value={saldo} onChange={e => setSaldo(e.target.value)} type="number" className={`${inputClass} font-black`} placeholder="0" /></div>
                        {mode === 'forcar' && <div><p className={labelClass}>MOTIVO *</p><input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex: Troca de turno" className={inputClass} /></div>}
                        {error && <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-4 py-2.5">{error}</p>}
                    </div>
                </div>
                {/* FOOTER FIXO */}
                <div className="shrink-0 bg-[#EDEBE6] p-[6px] pt-2 border-t border-black/5">
                    <div className="bg-white rounded-[18px] border border-black/5 p-2 flex gap-2">
                        <button onClick={onClose} className="flex-1 bg-white border border-black/10 rounded-full py-3 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.98] transition-all">Cancelar</button>
                        <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-black text-white rounded-full py-3 text-[11px] font-black disabled:opacity-50 hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">{saving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={12} /> {isAbrir ? 'Abrir' : 'Fechar'}</>}</button>
                    </div>
                </div>
            </div>
        </div>, document.body
    )
}
