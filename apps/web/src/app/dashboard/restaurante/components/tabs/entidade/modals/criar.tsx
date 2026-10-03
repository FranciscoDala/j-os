"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Check, ChevronDown, Loader2 } from "lucide-react";

const TIPOS = ["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const;
const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };
const MODAL_TABS_FUNC = ["Geral", "Trabalho", "Acesso"];
const MODAL_TABS_FORN = ["Geral", "Fornecedor"];
const MODAL_TABS_CLIENTE = ["Geral"];

function CustomSelect({ value, onChange, options, labelMap, placeholder }: any) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    const getLabel = (opt: string) => labelMap?.[opt] || opt || placeholder;
    return (
        <div ref={ref} className={`relative ${open ? "z-[60]" : "z-0"}`}>
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 py-2.5 text-[12px] font-bold text-left flex items-center justify-between shadow-sm hover:border-[#A67C52] focus:border-[#A67C52] focus:ring-2 focus:ring-[#A67C52]/20 transition-all outline-none">
                <span className="truncate">{getLabel(value)}</span><ChevronDown size={14} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[100] p-1.5">
                    <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
                        {options.map((opt: string) => (
                            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2 rounded-full text-[11px] font-bold ${value === opt ? "bg-[#A67C52] text-white" : "hover:bg-[#F5E6D3] hover:text-[#5A3A22]"}`}>{labelMap?.[opt] || opt}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StyledCheck({ checked, onChange, label }: any) {
    return (
        <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${checked ? "bg-[#A67C52] border-[#A67C52]" : "bg-white border-[#E5D5C0] group-hover:border-[#A67C52]"}`}>
                {checked && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span className="text-[11px] font-bold">{label}</span>
        </label>
    );
}

export function EntidadeModal({ open, setOpen, form, setForm, perfis, saving, onSave }: any) {
    const [mounted, setMounted] = useState(false);
    const [tab, setTab] = useState("Geral");
    useEffect(() => setMounted(true), []);
    useEffect(() => { if (open) setTab("Geral"); }, [open, form.tipo]);

    if (!open || !mounted) return null;

    const tabs = form.tipo === "FUNCIONARIO" ? MODAL_TABS_FUNC : form.tipo === "FORNECEDOR" ? MODAL_TABS_FORN : MODAL_TABS_CLIENTE;
    const inputClass = "w-full bg-[#F5F7FB] border border-black/5 rounded-full px-4 py-2.5 text-[12px] outline-none focus:border-[#A67C52] focus:ring-1 focus:ring-[#A67C52]/20 transition";

    return createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#FAF6F1]/80 backdrop-blur-[14px] flex items-center justify-center p-2 md:p-4">
            <div className="w-full max-w-[560px] bg-white/95 backdrop-blur-2xl rounded-[22px] border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden max-h-[94dvh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 flex justify-between items-center border-b border-black/5">
                    <p className="font-black text-[14px]">Nova Entidade • {TIPO_LABELS[form.tipo]}</p>
                    <button onClick={() => setOpen(false)} className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center hover:bg-black/10"><X size={14} /></button>
                </div>

                {/* Tabs igual ProdutoModal */}
                <div className="flex gap-1.5 px-4 py-2.5 border-b bg-[#F5F7FB]/70 overflow-x-auto no-scrollbar">
                    {tabs.map(t => (
                        <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${tab === t ? "bg-black text-white border-black shadow-sm" : "bg-white border-black/10 hover:border-[#A67C52]"}`}>{t}</button>
                    ))}
                </div>

                <div className="p-4 overflow-y-auto no-scrollbar space-y-3 flex-1">
                    {tab === "Geral" && (
                        <div className="space-y-2.5">
                            <CustomSelect value={form.tipo} onChange={(v: string) => setForm({ ...form, tipo: v })} options={[...TIPOS]} labelMap={TIPO_LABELS} placeholder="Tipo" />
                            <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome *" className={`${inputClass} font-bold`} />
                            <div className="grid grid-cols-2 gap-2">
                                <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="Telefone" className={inputClass} />
                                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className={inputClass} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} placeholder="BI / NIF" className={inputClass} />
                                <input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} placeholder="Endereço" className={inputClass} />
                            </div>
                        </div>
                    )}

                    {tab === "Trabalho" && form.tipo === "FUNCIONARIO" && (
                        <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                                <input value={form.cargo || ""} onChange={e => setForm({ ...form, cargo: e.target.value })} placeholder="Cargo *" className={`${inputClass} font-bold`} />
                                <input value={form.departamento || ""} onChange={e => setForm({ ...form, departamento: e.target.value })} placeholder="Departamento" className={inputClass} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="text-[9px] font-bold ml-2 opacity-60">SALÁRIO</label><input type="number" value={form.salario || ""} onChange={e => setForm({ ...form, salario: e.target.value })} placeholder="0,00" className={inputClass} /></div>
                                <div><label className="text-[9px] font-bold ml-2 opacity-60">CARGA H/SEMANA</label><input type="number" value={form.carga_horaria || ""} onChange={e => setForm({ ...form, carga_horaria: e.target.value })} placeholder="44" className={inputClass} /></div>
                            </div>
                            <div><label className="text-[9px] font-bold ml-2 opacity-60">DATA ADMISSÃO</label><input type="date" value={form.data_admissao || ""} onChange={e => setForm({ ...form, data_admissao: e.target.value })} className={inputClass} /></div>
                        </div>
                    )}

                    {tab === "Fornecedor" && form.tipo === "FORNECEDOR" && (
                        <div className="space-y-2.5">
                            <input value={form.empresa_fornecedora || ""} onChange={e => setForm({ ...form, empresa_fornecedora: e.target.value })} placeholder="Empresa fornecedora" className={inputClass} />
                            <input value={form.categoria_fornecedor || ""} onChange={e => setForm({ ...form, categoria_fornecedor: e.target.value })} placeholder="Categoria ex: Bebidas, Carnes" className={inputClass} />
                        </div>
                    )}

                    {tab === "Acesso" && form.tipo === "FUNCIONARIO" && (
                        <div className="space-y-3">
                            <StyledCheck checked={form.tem_acesso_app} onChange={(v: boolean) => setForm({ ...form, tem_acesso_app: v })} label="Tem acesso ao app?" />
                            {form.tem_acesso_app && (
                                <div className="space-y-2.5 bg-[#F5F7FB] rounded-[16px] p-3 border border-black/5">
                                    <CustomSelect value={form.perfil_id} onChange={(v: string) => setForm({ ...form, perfil_id: v })} options={perfis.map((p: any) => p.id)} labelMap={Object.fromEntries(perfis.map((p: any) => [p.id, p.nome]))} placeholder="Selecione perfil de acesso" />
                                    <input type="password" value={form.senha || ""} onChange={e => setForm({ ...form, senha: e.target.value })} placeholder="Senha mínimo 6 caracteres" className={inputClass} />
                                    <p className="text-[10px] opacity-50 px-2">O perfil define: operador_caixa, caixa, garçom, etc. O caixa não poderá apagar.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-black/5 flex gap-3 justify-end bg-white shrink-0">
                    <button onClick={() => setOpen(false)} className="w-10 h-10 bg-white border border-[#E8DCCF] rounded-full flex items-center justify-center hover:bg-gray-50 transition"><X size={16} /></button>
                    <button onClick={onSave} disabled={saving} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 disabled:opacity-60 transition">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
