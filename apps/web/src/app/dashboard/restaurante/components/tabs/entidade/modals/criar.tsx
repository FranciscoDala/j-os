"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Check, ChevronDown, Loader2, AlertCircle } from "lucide-react";

const TIPOS = ["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const;
const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };
const MODAL_TABS_FUNC = ["Geral", "Trabalho", "Acesso"];
const MODAL_TABS_FORN = ["Geral", "Fornecedor"];
const MODAL_TABS_CLIENTE = ["Geral"];

function CustomSelect({ value, onChange, options, labelMap, placeholder }: any) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    return (
        <div ref={ref} className={`relative w-full ${open? "z-[70]" : "z-0"}`}>
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 h-9 text-[11px] font-bold text-left flex items-center justify-between hover:border-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all">
                <span className={`truncate ${!value? "text-black/40" : "text-black"}`}>{value? (labelMap?.[value] || value) : placeholder}</span>
                <ChevronDown size={14} className={`ml-2 transition-transform ${open? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[16px] border border-[#E8DCCF] shadow-[0_16px_32px_rgba(0,0,0,0.18)] z-[100] p-1">
                    <div className="max-h-[160px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-0.5">
                        {options.map((opt: string) => (
                            <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-full text-[11px] font-bold transition-all ${value === opt? "bg-black text-white" : "hover:bg-[#F5E6D3]"}`}>{labelMap?.[opt] || opt}</button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StyledCheck({ checked, onChange, label }: any) {
    return (
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${checked? "bg-black border-black" : "bg-white border-[#E5D5C0] group-hover:border-black"}`}>{checked && <Check size={12} className="text-white" strokeWidth={3} />}</div>
            <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span className="text-[11px] font-bold text-black">{label}</span>
        </label>
    );
}

export function EntidadeModal({ open, setOpen, form, setForm, perfis, saving, onSave }: any) {
    const [mounted, setMounted] = useState(false);
    const [tab, setTab] = useState("Geral");
    const [localError, setLocalError] = useState("");
    useEffect(() => setMounted(true), []);
    useEffect(() => { if (open) { setTab("Geral"); setLocalError(""); } }, [open]);
    if (!open ||!mounted) return null;

    const tabs = form.tipo === "FUNCIONARIO"? MODAL_TABS_FUNC : form.tipo === "FORNECEDOR"? MODAL_TABS_FORN : MODAL_TABS_CLIENTE;
    const inputClass = "w-full h-9 bg-white border border-[#E8DCCF] rounded-full px-4 text-[11px] font-bold outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-black/40 transition-all";
    const labelClass = "text-[8px] font-black tracking-widest text-zinc-500 mb-1 ml-1";
    const perfilOptions = perfis.map((p: any) => p.id);
    const perfilLabelMap = Object.fromEntries(perfis.map((p: any) => [p.id, `${p.nome} • ${p.slug}`]));
    const isEdit =!!form.id;

    const handleSaveClick = () => {
        setLocalError("");
        if (!form.nome?.trim()) { setLocalError("Nome obrigatório"); setTab("Geral"); return; }
        if (form.tipo === "FUNCIONARIO" &&!form.cargo?.trim()) { setLocalError("Cargo obrigatório"); setTab("Trabalho"); return; }
        if (form.tem_acesso_app) {
            if (!form.perfil_id) { setLocalError("Selecione o perfil de acesso"); setTab("Acesso"); return; }
            if (!form.email?.trim()) { setLocalError("Email obrigatório para acesso ao app"); setTab("Geral"); return; }
            if (!isEdit && (!form.senha || form.senha.trim().length < 6)) { setLocalError("Senha obrigatória - mínimo 6 caracteres"); setTab("Acesso"); return; }
            if (form.senha && form.senha.trim().length > 0 && form.senha.trim().length < 6) { setLocalError("Senha mínimo 6 caracteres"); setTab("Acesso"); return; }
        }
        onSave();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-3 md:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={() => setOpen(false)} />
            <div className="relative w-full max-w-[560px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col max-h-[92dvh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER FIXO */}
                <div className="bg-white m-[6px] rounded-[18px] p-3 flex justify-between items-center border border-black/5 shrink-0">
                    <div>
                        <p className="font-black text-[13px] leading-none text-black">{isEdit? "EDITAR" : "NOVA"} • {TIPO_LABELS[form.tipo]}</p>
                        <p className="text-[8px] font-black tracking-widest text-zinc-500 mt-1">ENTIDADE • J-OS</p>
                    </div>
                    <button onClick={() => setOpen(false)} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95"><X size={14} /></button>
                </div>

                {/* TABS FIXAS */}
                <div className="mx-[6px] bg-white rounded-[18px] border border-black/5 p-1.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
                    {tabs.map((t: string) => <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap px-4 h-8 rounded-full text-[11px] font-black transition-all ${tab === t? "bg-black text-white" : "bg-[#F5F2ED] text-black hover:bg-[#F5E6D3]"}`}>{t}</button>)}
                </div>

                {/* CONTEÚDO SCROLL INVISÍVEL */}
                <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="bg-white m-[6px] rounded-[18px] p-4 border border-black/5 space-y-3">
                        {localError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-full px-4 py-2.5 text-[11px] font-bold flex items-center gap-2"><AlertCircle size={14} />{localError}</div>}

                        {tab === "Geral" && (
                            <div className="space-y-2.5">
                                <div><p className={labelClass}>TIPO DE ENTIDADE</p><CustomSelect value={form.tipo} onChange={(v: string) => setForm({...form, tipo: v})} options={[...TIPOS]} labelMap={TIPO_LABELS} placeholder="Tipo" /></div>
                                <div><p className={labelClass}>NOME COMPLETO *</p><input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Nome" className={`${inputClass} font-black`} /></div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div><p className={labelClass}>TELEFONE</p><input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="Telefone" className={inputClass} /></div>
                                    <div><p className={labelClass}>EMAIL</p><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className={inputClass} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div><p className={labelClass}>BI / NIF</p><input value={form.documento} onChange={e => setForm({...form, documento: e.target.value})} placeholder="BI/NIF" className={inputClass} /></div>
                                    <div><p className={labelClass}>ENDEREÇO</p><input value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} placeholder="Endereço" className={inputClass} /></div>
                                </div>
                            </div>
                        )}
                        {tab === "Trabalho" && (
                            <div className="space-y-2.5">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div><p className={labelClass}>CARGO *</p><input value={form.cargo || ""} onChange={e => setForm({...form, cargo: e.target.value})} placeholder="Cargo" className={`${inputClass} font-black`} /></div>
                                    <div><p className={labelClass}>DEPARTAMENTO</p><input value={form.departamento || ""} onChange={e => setForm({...form, departamento: e.target.value})} placeholder="Departamento" className={inputClass} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div><p className={labelClass}>SALÁRIO</p><input type="number" value={form.salario || ""} onChange={e => setForm({...form, salario: e.target.value})} placeholder="Salário" className={inputClass} /></div>
                                    <div><p className={labelClass}>CARGA HORÁRIA</p><input type="number" value={form.carga_horaria || ""} onChange={e => setForm({...form, carga_horaria: e.target.value})} placeholder="h/semana" className={inputClass} /></div>
                                </div>
                                <div><p className={labelClass}>DATA ADMISSÃO</p><input type="date" value={form.data_admissao || ""} onChange={e => setForm({...form, data_admissao: e.target.value})} className={inputClass} /></div>
                            </div>
                        )}
                        {tab === "Fornecedor" && (
                            <div className="space-y-2.5">
                                <div><p className={labelClass}>EMPRESA FORNECEDORA</p><input value={form.empresa_fornecedora || ""} onChange={e => setForm({...form, empresa_fornecedora: e.target.value})} placeholder="Empresa" className={inputClass} /></div>
                                <div><p className={labelClass}>CATEGORIA</p><input value={form.categoria_fornecedor || ""} onChange={e => setForm({...form, categoria_fornecedor: e.target.value})} placeholder="Categoria" className={inputClass} /></div>
                            </div>
                        )}
                        {tab === "Acesso" && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-2.5 bg-[#F5F2ED] border border-[#E8DCCF] rounded-[16px]">
                                    <StyledCheck checked={form.tem_acesso_app} onChange={(v: boolean) => setForm({...form, tem_acesso_app: v})} label="Tem acesso ao app?" />
                                </div>
                                {form.tem_acesso_app && (
                                    <div className="space-y-2.5 bg-[#FFFBF5] rounded-[16px] p-3 border border-[#E8DCCF]">
                                        <div><p className={labelClass}>PERFIL DE ACESSO *</p><CustomSelect value={form.perfil_id} onChange={(v: string) => setForm({...form, perfil_id: v})} options={perfilOptions} labelMap={perfilLabelMap} placeholder="Selecione perfil" /></div>
                                        <div><p className={labelClass}>{isEdit? "NOVA SENHA" : "SENHA *"}</p><input type="password" value={form.senha || ""} onChange={e => setForm({...form, senha: e.target.value})} placeholder={isEdit? "Deixe vazio para manter" : "Mínimo 6 caracteres"} className={inputClass} /></div>
                                        <p className="text-[9px] font-bold tracking-widest text-zinc-500 px-1">{isEdit? "Deixe em branco para manter a senha atual" : "Obrigatório definir senha para novo acesso"}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER FIXO */}
                <div className="shrink-0 bg-[#EDEBE6] p-[6px] pt-2 border-t border-black/5">
                    <div className="bg-white rounded-[18px] border border-black/5 p-2 flex gap-2">
                        <button onClick={() => setOpen(false)} className="flex-1 bg-white border border-black/10 rounded-full py-3 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.98] transition-all">Cancelar</button>
                        <button onClick={handleSaveClick} disabled={saving} className="flex-1 bg-black text-white rounded-full py-3 text-[11px] font-black disabled:opacity-50 hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                            {saving? <Loader2 size={14} className="animate-spin" /> : <><Check size={12} /> {isEdit? "Salvar" : "Criar"}</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
