"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, Lock, Unlock, AlertTriangle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com";
const BASE = `${API_URL.replace(/\/$/, "")}/api/v1`;

async function apiFetch(path: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw data;
    return data;
}

type Props = { open: boolean; mode: "abrir" | "fechar" | "forcar"; caixaAtual?: any; onClose: () => void; onSuccess: () => void; }

export function CaixaModal({ open, mode, caixaAtual, onClose, onSuccess }: Props) {
    const [mounted, setMounted] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saldo, setSaldo] = useState("0");
    const [motivo, setMotivo] = useState("");
    const [error, setError] = useState("");
    useEffect(() => setMounted(true), []);
    useEffect(() => { if (open) { setSaldo("0"); setMotivo(""); setError(""); } }, [open, mode]);
    if (!open || !mounted) return null;
    const inputClass = "w-full bg-[#F5F7FB] border border-black/5 rounded-full px-4 py-2.5 text-[12px] outline-none focus:border-[#A67C52] focus:ring-1 focus:ring-[#A67C52]/20 font-bold";

    const handleSubmit = async () => {
        setSaving(true); setError("");
        try {
            if (mode === "abrir") await apiFetch("/caixa/abrir", { method: "POST", body: JSON.stringify({ saldo_inicial: Number(saldo) }) });
            else if (mode === "fechar") await apiFetch("/caixa/fechar", { method: "POST", body: JSON.stringify({ saldo_informado: Number(saldo) }) });
            else await apiFetch("/caixa/forcar-abertura", { method: "POST", body: JSON.stringify({ saldo_inicial: Number(saldo), motivo }) });
            onSuccess(); onClose();
        } catch (e: any) {
            const msg = e.detail?.message || e.detail || e.message || "Erro";
            if (e.detail?.code === "CAIXA_ABERTO_POR_OUTRO") setError(`Aberto por ${e.detail.caixa.aberto_por_nome}. Use forçar abertura.`);
            else setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally { setSaving(false); }
    };

    const isAbrir = mode === "abrir" || mode === "forcar";
    return createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#FAF6F1]/80 backdrop-blur-[14px] flex items-center justify-center p-2 md:p-4">
            <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-2xl rounded-[22px] border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                <div className="p-4 flex justify-between items-center border-b">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAbrir ? 'bg-black text-white' : 'bg-red-500 text-white'}`}>{isAbrir ? <Unlock size={14} /> : <Lock size={14} />}</div>
                        <p className="font-black text-[13px]">{mode === 'abrir' ? 'Abrir Caixa' : mode === 'fechar' ? 'Fechar Caixa' : 'Forçar Abertura'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center"><X size={14} /></button>
                </div>
                <div className="p-4 space-y-3">
                    {mode === 'forcar' && caixaAtual && (
                        <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-3 flex gap-2"><AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" /><p className="text-[11px] text-amber-800 leading-tight">Aberto por <b>{caixaAtual.aberto_por_nome}</b> com Kz {caixaAtual.saldo_atual?.toLocaleString()}.</p></div>
                    )}
                    {mode === 'fechar' && caixaAtual && (
                        <div className="grid grid-cols-2 gap-2"><div className="bg-[#F5F7FB] rounded-[14px] p-3"><p className="text-[9px] font-bold text-gray-500">ESPERADO</p><p className="font-black text-[14px]">Kz {Number(caixaAtual.saldo_atual).toLocaleString()}</p></div><div className="bg-black text-white rounded-[14px] p-3"><p className="text-[9px] font-bold opacity-60">INICIAL</p><p className="font-black text-[14px]">Kz {Number(caixaAtual.saldo_inicial).toLocaleString()}</p></div></div>
                    )}
                    <div><label className="text-[9px] font-bold ml-2 mb-1 block opacity-60">{isAbrir ? 'SALDO INICIAL (Kz)' : 'SALDO INFORMADO (Kz) *'}</label><input value={saldo} onChange={e => setSaldo(e.target.value)} type="number" placeholder="0" className={inputClass} /></div>
                    {mode === 'forcar' && (<div><label className="text-[9px] font-bold ml-2 mb-1 block opacity-60">MOTIVO *</label><input value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex: Troca de turno" className={inputClass} /></div>)}
                    {error && <p className="text-[11px] text-red-500 font-bold bg-red-50 rounded-full px-3 py-2">{error}</p>}
                </div>
                <div className="p-3 border-t flex gap-3 justify-end">
                    <button onClick={onClose} className="w-10 h-10 bg-white border border-[#E8DCCF] rounded-full flex items-center justify-center hover:bg-gray-50"><X size={16} /></button>
                    <button onClick={handleSubmit} disabled={saving} className="min-w-[80px] h-10 bg-black text-white rounded-full flex items-center justify-center gap-2 px-5 hover:bg-zinc-800 disabled:opacity-60 text-[12px] font-bold">{saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} strokeWidth={3} /> {isAbrir ? 'Abrir' : 'Fechar'}</>}</button>
                </div>
            </div>
        </div>, document.body
    )
}
