"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Check, ChevronDown, Loader2, AlertCircle } from "lucide-react";

const TIPOS = ["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const;
const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };
const MODAL_TABS_FUNC = ["Geral", "Trabalho", "Acesso"];
const MODAL_TABS_FORN = ["Geral", "Fornecedor"];
const MODAL_TABS_CLIENTE = ["Geral"];

function CustomSelect({ value, onChange, options, labelMap, placeholder, loading }: any) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const getLabel = (opt: string) => {
    if (!opt) return placeholder;
    return labelMap?.[opt] || opt;
  };
  const displayValue = value? getLabel(value) : placeholder;

  return (
    <div ref={ref} className={`relative ${open? "z-[70]" : "z-0"}`}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 py-2.5 text-[12px] font-bold text-left flex items-center justify-between shadow-sm hover:border-[#A67C52] focus:border-[#A67C52] transition-all outline-none">
        <span className={`truncate ${!value? "opacity-50" : ""}`}>{displayValue}</span>
        <div className="flex items-center gap-1">
          {loading && <Loader2 size={12} className="animate-spin opacity-50" />}
          <ChevronDown size={14} className={`shrink-0 transition-transform ${open? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[100] p-1.5">
          <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-0.5">
            {options.length === 0? (
              <div className="px-4 py-3 text-[11px] opacity-50 text-center">Nenhum perfil encontrado.<br/>Vá em Config → Perfis e crie.</div>
            ) : (
              options.map((opt: string) => (
                <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-full text-[11px] font-bold transition ${value === opt? "bg-black text-white" : "hover:bg-[#F5E6D3] text-black/80"}`}>
                  {labelMap?.[opt] || opt}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StyledCheck({ checked, onChange, label }: any) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${checked? "bg-black border-black" : "bg-white border-black/10 group-hover:border-black/30"}`}>
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
  if (!open ||!mounted) return null;

  const tabs = form.tipo === "FUNCIONARIO"? MODAL_TABS_FUNC : form.tipo === "FORNECEDOR"? MODAL_TABS_FORN : MODAL_TABS_CLIENTE;
  const inputClass = "w-full bg-[#F5F7FB] border border-black/5 rounded-full px-4 py-2.5 text-[12px] outline-none focus:border-black/20 transition";

  const perfilOptions = perfis.map((p: any) => p.id);
  const perfilLabelMap = Object.fromEntries(perfis.map((p: any) => [p.id, `${p.nome} • ${p.slug}`]));

  return createPortal(
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#FAF6F1]/80 backdrop-blur-[14px] flex items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-[560px] bg-white rounded-[22px] border shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden max-h-[94dvh] flex flex-col">
        <div className="p-4 flex justify-between items-center border-b border-black/5 shrink-0">
          <p className="font-black text-[14px]">Nova Entidade • {TIPO_LABELS[form.tipo]}</p>
          <button onClick={() => setOpen(false)} className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center"><X size={14} /></button>
        </div>

        <div className="flex gap-1.5 px-4 py-2.5 border-b bg-[#F5F7FB]/70 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black border transition ${tab === t? "bg-black text-white border-black" : "bg-white border-black/10"}`}>{t}</button>
          ))}
        </div>

        <div className="p-4 space-y-3 flex-1 overflow-y-auto no-scrollbar">
          {tab === "Geral" && (
            <>
              <CustomSelect value={form.tipo} onChange={(v: string) => setForm({...form, tipo: v })} options={[...TIPOS]} labelMap={TIPO_LABELS} placeholder="Tipo" />
              <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value })} placeholder="Nome *" className={`${inputClass} font-bold`} />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value })} placeholder="Telefone" className={inputClass} />
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value })} placeholder="Email" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.documento} onChange={e => setForm({...form, documento: e.target.value })} placeholder="BI/NIF" className={inputClass} />
                <input value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value })} placeholder="Endereço" className={inputClass} />
              </div>
            </>
          )}

          {tab === "Trabalho" && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input value={form.cargo || ""} onChange={e => setForm({...form, cargo: e.target.value })} placeholder="Cargo *" className={`${inputClass} font-bold`} />
                <input value={form.departamento || ""} onChange={e => setForm({...form, departamento: e.target.value })} placeholder="Departamento" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={form.salario || ""} onChange={e => setForm({...form, salario: e.target.value })} placeholder="Salário" className={inputClass} />
                <input type="number" value={form.carga_horaria || ""} onChange={e => setForm({...form, carga_horaria: e.target.value })} placeholder="Carga h/semana" className={inputClass} />
              </div>
              <input type="date" value={form.data_admissao || ""} onChange={e => setForm({...form, data_admissao: e.target.value })} className={inputClass} />
            </div>
          )}

          {tab === "Fornecedor" && (
            <div className="space-y-2.5">
              <input value={form.empresa_fornecedora || ""} onChange={e => setForm({...form, empresa_fornecedora: e.target.value })} placeholder="Empresa fornecedora" className={inputClass} />
              <input value={form.categoria_fornecedor || ""} onChange={e => setForm({...form, categoria_fornecedor: e.target.value })} placeholder="Categoria ex: Bebidas" className={inputClass} />
            </div>
          )}

          {tab === "Acesso" && (
            <div className="space-y-3">
              <StyledCheck checked={form.tem_acesso_app} onChange={(v: boolean) => setForm({...form, tem_acesso_app: v })} label="Tem acesso ao app?" />
              {form.tem_acesso_app && (
                <div className="space-y-2.5 bg-[#FFFBF5] rounded-[16px] p-3 border border-[#E8DCCF]">
                  {perfis.length === 0 && (
                    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-2 text-[10px] font-bold text-amber-800">
                      <AlertCircle size={12} /> Nenhum perfil cadastrado. O backend vai criar automaticamente ao recarregar.
                    </div>
                  )}
                  <CustomSelect
                    value={form.perfil_id}
                    onChange={(v: string) => setForm({...form, perfil_id: v })}
                    options={perfilOptions}
                    labelMap={perfilLabelMap}
                    placeholder="Selecione perfil de acesso"
                  />
                  <input type="password" value={form.senha || ""} onChange={e => setForm({...form, senha: e.target.value })} placeholder="Senha min 6" className={inputClass} />
                  <p className="text-[10px] opacity-50 px-2 leading-tight">O perfil define a role: dono, gerente_restaurante, operador_caixa, caixa, garcom... O caixa não consegue apagar.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-black/5 flex gap-2 justify-end shrink-0 bg-white">
          <button onClick={() => setOpen(false)} className="w-10 h-10 bg-white border border-black/10 rounded-full flex items-center justify-center"><X size={16} /></button>
          <button onClick={onSave} disabled={saving} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-60">
            {saving? <Loader2 size={16} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
