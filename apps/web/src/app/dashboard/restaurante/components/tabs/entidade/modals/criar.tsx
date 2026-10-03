"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Check, ChevronDown, Loader2 } from "lucide-react";

const TIPOS = ["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const;
const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };

function CustomSelect({ value, onChange, options, labelMap, placeholder }: any) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className={`relative ${open? "z-[60]" : "z-0"}`}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 py-2 text-[12px] font-bold text-left flex items-center justify-between">
        <span>{labelMap?.[value] || value || placeholder}</span><ChevronDown size={14} className={`${open? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[18px] border border-[#E8DCCF] shadow-xl z-[100] p-1.5">
          {options.map((opt: string) => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2 rounded-full text-[11px] font-bold ${value === opt? "bg-[#A67C52] text-white" : "hover:bg-[#F5E6D3]"}`}>{labelMap?.[opt] || opt}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function StyledCheck({ checked, onChange, label }: any) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${checked? "bg-[#A67C52] border-[#A67C52]" : "bg-white border-[#E5D5C0]"}`}>
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </div>
      <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="text-[11px] font-bold">{label}</span>
    </label>
  );
}

export function EntidadeModal({ open, setOpen, form, setForm, perfis, saving, onSave }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open ||!mounted) return null;
  const inputClass = "w-full bg-[#F5F7FB] border border-black/5 rounded-full px-4 py-2 text-[12px] outline-none focus:border-[#A67C52]";

  return createPortal(
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-[#FAF6F1]/80 backdrop-blur-[14px] flex items-center justify-center p-2">
      <div className="w-full max-w-[560px] bg-white/95 rounded-[22px] border shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden max-h-[94dvh] flex flex-col">
        <div className="p-4 flex justify-between items-center border-b">
          <p className="font-black text-[14px]">Nova Entidade • {TIPO_LABELS[form.tipo]}</p>
          <button onClick={() => setOpen(false)} className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center"><X size={14} /></button>
        </div>
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          <CustomSelect value={form.tipo} onChange={(v: string) => setForm({...form, tipo: v })} options={[...TIPOS]} labelMap={TIPO_LABELS} placeholder="Tipo" />

          <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value })} placeholder="Nome *" className={inputClass} />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value })} placeholder="Telefone" className={inputClass} />
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value })} placeholder="Email" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.documento} onChange={e => setForm({...form, documento: e.target.value })} placeholder="BI/NIF" className={inputClass} />
            <input value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value })} placeholder="Endereço" className={inputClass} />
          </div>

          {form.tipo === "FUNCIONARIO" && (
            <div className="space-y-2 p-3 bg-[#F5F7FB] rounded-[16px] border border-black/5">
              <p className="text-[10px] font-black opacity-60">DADOS FUNCIONÁRIO</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.cargo || ""} onChange={e => setForm({...form, cargo: e.target.value })} placeholder="Cargo *" className={inputClass} />
                <input value={form.departamento || ""} onChange={e => setForm({...form, departamento: e.target.value })} placeholder="Departamento" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={form.salario || ""} onChange={e => setForm({...form, salario: e.target.value })} placeholder="Salário" className={inputClass} />
                <input type="number" value={form.carga_horaria || ""} onChange={e => setForm({...form, carga_horaria: e.target.value })} placeholder="Carga h/semana" className={inputClass} />
              </div>
              <input type="date" value={form.data_admissao || ""} onChange={e => setForm({...form, data_admissao: e.target.value })} className={inputClass} />
              <StyledCheck checked={form.tem_acesso_app} onChange={(v: boolean) => setForm({...form, tem_acesso_app: v })} label="Tem acesso ao app?" />
              {form.tem_acesso_app && (
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.perfil_id || ""} onChange={e => setForm({...form, perfil_id: e.target.value })} className={inputClass}>
                    <option value="">Selecione perfil</option>
                    {perfis.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  <input type="password" value={form.senha || ""} onChange={e => setForm({...form, senha: e.target.value })} placeholder="Senha min 6" className={inputClass} />
                </div>
              )}
            </div>
          )}

          {form.tipo === "FORNECEDOR" && (
            <div className="space-y-2 p-3 bg-[#F5F7FB] rounded-[16px] border">
              <p className="text-[10px] font-black opacity-60">DADOS FORNECEDOR</p>
              <input value={form.empresa_fornecedora || ""} onChange={e => setForm({...form, empresa_fornecedora: e.target.value })} placeholder="Empresa fornecedora" className={inputClass} />
              <input value={form.categoria_fornecedor || ""} onChange={e => setForm({...form, categoria_fornecedor: e.target.value })} placeholder="Categoria ex: Bebidas, Carnes" className={inputClass} />
            </div>
          )}
        </div>
        <div className="p-3 border-t flex gap-3 justify-end">
          <button onClick={() => setOpen(false)} className="w-10 h-10 bg-white border rounded-full flex items-center justify-center"><X size={16} /></button>
          <button onClick={onSave} disabled={saving} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center disabled:opacity-60">
            {saving? <Loader2 size={16} className="animate-spin" /> : <Check size={18} strokeWidth={3} />}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
