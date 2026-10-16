"use client";
import { useState, useRef, useEffect } from "react";
import { X, Check, ChevronDown, Store, User, Building2, AlertCircle, Loader2 } from "lucide-react";

const TIPO_OPTIONS = [
  { value: "VAREJO", label: "Varejo" },
  { value: "RESTAURANTE", label: "Restaurante" },
  { value: "SEGURANCA", label: "Segurança" },
  { value: "SERVICOS", label: "Serviços" },
];

function CustomSelect({ value, options, onChange, placeholder, disabled }: any) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find((o: any) => o.value === value);
  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() =>!disabled && setOpen(!open)}
        className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 h-9 text-[11px] font-bold flex items-center justify-between hover:border-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all disabled:opacity-50"
      >
        <span className={`truncate ${selected? 'text-black' : 'text-black/40'}`}>{selected? selected.label : placeholder}</span>
        <ChevronDown size={14} className={`ml-2 transition-transform ${open? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-[16px] border border-[#E8DCCF] shadow-[0_16px_32px_rgba(0,0,0,0.18)] p-1 max-h-[160px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {options.map((o: any) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-full text-[11px] font-bold transition-all ${value === o.value? 'bg-black text-white' : 'hover:bg-[#F5E6D3]'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminLojaModal({ open, onOpenChange, editingLoja, donos, formData, setFormData, onSave, saving, pushToast }: any) {
  const [tab, setTab] = useState<"loja" | "dono">("loja");
  const handle = (f: string, v: any) => setFormData((s: any) => ({...s, [f]: v }));
  const handleDonoNovo = (f: string, v: any) => setFormData((s: any) => ({...s, dono_novo: {...s.dono_novo, [f]: v } }));

  useEffect(() => {
    if (open) setTab("loja");
  }, [open]);

  const donoOptions = donos.map((d: any) => ({ label: `${d.nome} • ${d.email}`, value: d.id }));

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!formData.nome_fantasia?.trim()) {
      pushToast?.("O nome da loja é obrigatório", "error");
      setTab("loja");
      return;
    }
    if (!editingLoja && formData.modoDono === "existente" &&!formData.dono_existente_id) {
      pushToast?.("Selecione um dono para continuar", "error");
      setTab("dono");
      return;
    }
    if (!editingLoja && formData.modoDono === "novo") {
      if (!formData.dono_novo.nome?.trim()) { pushToast?.("Nome do dono é obrigatório", "error"); setTab("dono"); return; }
      if (!formData.dono_novo.email?.includes("@")) { pushToast?.("Email do dono inválido", "error"); setTab("dono"); return; }
      if ((formData.dono_novo.senha || "").length < 6) { pushToast?.("Senha deve ter pelo menos 6 caracteres", "error"); setTab("dono"); return; }
    }
    onSave(e);
  };

  if (!open) return null;

  const inputClass = "w-full h-9 rounded-full border border-[#E8DCCF] px-4 text-[11px] font-bold outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white placeholder:text-black/40";
  const labelClass = "text-[8px] font-black tracking-widest text-zinc-500 mb-1 ml-1 uppercase";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-[440px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col max-h-[92dvh] overflow-hidden">

        {/* HEADER FIXO + TABS */}
        <div className="bg-white m-[6px] rounded-[18px] p-3 border border-black/5 shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-black text-[13px] leading-none text-black flex items-center gap-2">
                <span className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center"><Store size={12} /></span>
                {editingLoja? "EDITAR LOJA" : "NOVA LOJA"}
              </p>
              <p className="text-[11px] text-zinc-600 mt-1.5 font-bold leading-tight">
                {editingLoja? "Altere apenas dados da loja. Dono não pode ser trocado aqui." : "Crie a loja e vincule um dono (existente ou novo)"}
              </p>
            </div>
            <button onClick={() => onOpenChange(false)} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95"><X size={14} /></button>
          </div>
          <div className="flex gap-1.5 mt-3 bg-[#F5F2ED] p-1 rounded-full">
            <button onClick={() => setTab("loja")} className={`flex-1 h-8 rounded-full text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${tab === "loja"? "bg-black text-white" : "text-zinc-500 hover:text-black"}`}>
              <Building2 size={12} /> Dados da Loja
            </button>
            <button onClick={() => setTab("dono")} className={`flex-1 h-8 rounded-full text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${tab === "dono"? "bg-black text-white" : "text-zinc-500 hover:text-black"}`}>
              <User size={12} /> Dono
            </button>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="bg-white m-[6px] mt-0 rounded-[18px] p-4 border border-black/5">
            {tab === "loja"? (
              <div className="space-y-3">
                <div><p className={labelClass}>Nome Fantasia *</p><input value={formData.nome_fantasia} onChange={e => handle('nome_fantasia', e.target.value)} placeholder="Ex: Restaurante Sabor" className={`${inputClass} font-black`} /></div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div><p className={labelClass}>NIF</p><input value={formData.nif} onChange={e => handle('nif', e.target.value)} placeholder="500012345" className={inputClass} /></div>
                  <div><p className={labelClass}>Tipo</p><CustomSelect value={formData.tipo} onChange={(v: any) => handle('tipo', v)} options={TIPO_OPTIONS} placeholder="Tipo da loja" /></div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div><p className={labelClass}>Email da Loja</p><input type="email" value={formData.email} onChange={e => handle('email', e.target.value)} placeholder="contato@loja.ao" className={inputClass} /></div>
                  <div><p className={labelClass}>Telefone</p><input value={formData.phone} onChange={e => handle('phone', e.target.value)} placeholder="+244 9xx xxx xxx" className={inputClass} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div><p className={labelClass}>Cidade</p><input value={formData.city} onChange={e => handle('city', e.target.value)} placeholder="Luanda" className={inputClass} /></div>
                  <div><p className={labelClass}>Endereço</p><input value={formData.address} onChange={e => handle('address', e.target.value)} placeholder="Rua, bairro..." className={inputClass} /></div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {!editingLoja? (
                  <>
                    <div className="flex gap-1.5 bg-[#F5F2ED] p-1 rounded-full">
                      <button type="button" onClick={() => handle('modoDono', 'existente')} className={`flex-1 h-8 rounded-full text-[11px] font-black transition-all ${formData.modoDono === 'existente'? 'bg-black text-white shadow' : 'text-zinc-500 hover:text-black'}`}>Dono Existente</button>
                      <button type="button" onClick={() => handle('modoDono', 'novo')} className={`flex-1 h-8 rounded-full text-[11px] font-black transition-all ${formData.modoDono === 'novo'? 'bg-black text-white shadow' : 'text-zinc-500 hover:text-black'}`}>Novo Dono</button>
                    </div>

                    {formData.modoDono === 'existente'? (
                      <div className="space-y-2">
                        <p className={labelClass}>Selecione o Dono *</p>
                        <CustomSelect value={formData.dono_existente_id} onChange={(v: any) => handle('dono_existente_id', v)} options={donoOptions} placeholder="Escolha um dono..." />
                        {donos.length === 0 && <p className="text-[10px] text-amber-600 font-bold flex gap-1 items-center mt-1"><AlertCircle size={12} /> Nenhum dono cadastrado, crie um novo</p>}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div><p className={labelClass}>Nome Completo *</p><input value={formData.dono_novo.nome} onChange={e => handleDonoNovo('nome', e.target.value)} placeholder="Ex: João Silva" className={`${inputClass} font-black`} /></div>
                        <div><p className={labelClass}>Email *</p><input type="email" value={formData.dono_novo.email} onChange={e => handleDonoNovo('email', e.target.value)} placeholder="dono@empresa.ao" className={inputClass} /></div>
                        <div><p className={labelClass}>Senha (mín 6) *</p><input type="password" value={formData.dono_novo.senha} onChange={e => handleDonoNovo('senha', e.target.value)} placeholder="Crie uma senha segura" className={inputClass} /></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-10 text-center border border-dashed border-[#E8DCCF] rounded-[16px] bg-[#FFFEFB]">
                    <p className="text-[12px] font-black">Dono não pode ser alterado na edição</p>
                    <p className="text-[11px] text-zinc-500 mt-1 font-bold">Se precisar trocar o dono, apague e crie novamente</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="shrink-0 bg-[#EDEBE6] p-[6px] pt-2 border-t border-black/5">
          <div className="bg-white rounded-[18px] border border-black/5 p-2 flex gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 bg-white border border-black/10 rounded-full py-3 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.98] transition-all">Cancelar</button>
            <button onClick={handleSubmit} disabled={saving} className="flex-1 bg-black text-white rounded-full py-3 text-[11px] font-black disabled:opacity-50 hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
              {saving? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={12} /> {editingLoja? "Salvar" : "Criar Loja"}</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
