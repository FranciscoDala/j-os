"use client";
import { useEffect, useRef, useState } from "react";
import { X, Check, ChevronDown, Loader2 } from "lucide-react";

const TIPOS = ["GENERAL","RESTAURANT_DISH","RESTAURANT_INGREDIENT","RESTAURANT_DRINK","SERVICE","KIT"];
const UNIDADES = ["UNIT","UN","KG","LITER","PORTION","HOUR","DAY","TASK"];
const MODAL_TABS = ["Geral","Preços","Stock","Cozinha","Códigos"];
const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/,"");

const getImgUrl = (url?: string)=>{
  if(!url) return FALLBACK_IMG;
  if(url.startsWith("blob:")) return url;
  if(url.startsWith("http")) return url;
  if(url.startsWith("/media")) return `${API_URL}${url}`;
  return url;
};

function CustomSelect({ value, onChange, options, placeholder, className="" }: { value:string, onChange:(v:string)=>void, options:string[], placeholder?:string, className?:string }){
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const h = (e:MouseEvent)=> { if(ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return ()=> document.removeEventListener("mousedown", h);
  },[]);
  return (
    <div ref={ref} className={`relative ${open? "z-[60]" : "z-0"} ${className}`}>
      <button type="button" onClick={()=>setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 py-2 text-[12px] font-bold text-left flex items-center justify-between shadow-sm hover:border-[#A67C52] focus:border-[#A67C52] focus:ring-2 focus:ring-[#A67C52]/20 transition-all outline-none">
        <span className="truncate">{value || placeholder || "Selecionar"}</span>
        <ChevronDown size={14} className={`shrink-0 ml-2 transition-transform ${open? "rotate-180":""}`}/>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[100] overflow-hidden p-1.5">
          <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
            {options.map(opt=>(
              <button key={opt || "todas"} type="button" onClick={()=>{ onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2 rounded-full text-[11px] font-bold transition-all ${value===opt? "bg-[#A67C52] text-white shadow-sm" : "bg-white text-black hover:bg-[#F5E6D3] hover:text-[#5A3A22]"}`}>
                {opt === ""? "Todas" : opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StyledCheck({checked, onChange, label}:{checked:boolean, onChange:(v:boolean)=>void, label:string}){
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group select-none">
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${checked? "bg-[#A67C52] border-[#A67C52]" : "bg-white border-[#E5D5C0] group-hover:border-[#A67C52]"}`}>
        {checked && <Check size={12} className="text-white" strokeWidth={3}/>}
      </div>
      <input type="checkbox" className="hidden" checked={checked} onChange={e=>onChange(e.target.checked)}/>
      <span className="text-[11px] font-bold text-black">{label}</span>
    </label>
  )
}

type Props = {
  open:boolean;
  editId:string|null;
  tab:string;
  setTab:(t:string)=>void;
  form:any;
  setForm:(f:any)=>void;
  preview:string;
  setPreview:(s:string)=>void;
  setImgFile:(f:File|null)=>void;
  cats:string[];
  saving:boolean;
  onClose:()=>void;
  onSave:()=>void;
}

export function ProdutoModal({ open: isOpen, editId, tab, setTab, form, setForm, preview, setPreview, setImgFile, cats, saving, onClose, onSave }:Props){
  if(!isOpen) return null;
  const inputClass = "w-full bg-[#F5F7FB] border border-black/5 rounded-full px-4 py-2 text-[12px] outline-none focus:border-[#A67C52] focus:ring-1 focus:ring-[#A67C52]/20";

  return (
    <div className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-md flex items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-[560px] bg-white/95 backdrop-blur-2xl rounded-[22px] border border-white/60 shadow-2xl overflow-hidden max-h-[94dvh] flex flex-col">
        <div className="p-4 flex justify-between items-center border-b"><p className="font-black text-[14px]">{editId?"Editar":"Novo"} • {form.tipo}</p><button onClick={onClose} className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center"><X size={14}/></button></div>
        <div className="flex gap-1.5 px-4 py-2 border-b bg-[#F5F7FB]/70 overflow-x-auto no-scrollbar">
          {MODAL_TABS.map(t=><button key={t} onClick={()=>setTab(t)} className={`whitespace-nowrap px-4 py-1 rounded-full text-[11px] font-bold border ${tab===t?"bg-black text-white border-black":"bg-white border-black/10"}`}>{t}</button>)}
        </div>
        <div className="p-4 overflow-y-auto no-scrollbar space-y-3 flex-1">
          {tab==="Geral" && (
            <div className="space-y-2.5">
              <input type="hidden" value={form.codigo} />
              <div className="flex gap-2.5">
                <div className="w-[64px] h-[64px] bg-[#F5F7FB] rounded-[12px] border overflow-hidden flex items-center justify-center shrink-0">
                  <img src={getImgUrl(preview)} onError={(e)=> (e.currentTarget as HTMLImageElement).style.display='none'} className="w-full h-full object-cover" alt=""/>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <input value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} placeholder="Nome *" className={inputClass}/>
                  <input value={form.descricao} onChange={e=>setForm({...form, descricao:e.target.value})} placeholder="Descrição" className={inputClass}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <CustomSelect value={form.tipo} onChange={(v)=>setForm({...form, tipo:v})} options={TIPOS} />
                <CustomSelect value={form.unidade} onChange={(v)=>setForm({...form, unidade:v})} options={UNIDADES} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.categoria} onChange={e=>setForm({...form, categoria:e.target.value})} placeholder="Categoria" list="cats" className={inputClass}/><datalist id="cats">{cats.map(c=><option key={c} value={c}/>)}</datalist>
                <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ setImgFile(f); setPreview(URL.createObjectURL(f)); } }} className={`${inputClass} text-[11px] file:mr-2 file:border-0 file:bg-black file:text-white file:rounded-full file:px-3 file:py-0.5 file:text-[10px]`}/>
              </div>
              <div className="pt-1"><StyledCheck checked={form.ativo} onChange={v=>setForm({...form, ativo:v})} label="Ativo"/></div>
            </div>
          )}
          {tab==="Preços" && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[9px] font-bold ml-1">PREÇO VENDA *</label><input type="number" value={form.preco_venda} onChange={e=>setForm({...form, preco_venda:e.target.value})} className={`${inputClass} font-bold`}/></div>
                <div><label className="text-[9px] font-bold ml-1">PREÇO CUSTO</label><input type="number" value={form.preco_custo} onChange={e=>setForm({...form, preco_custo:e.target.value})} className={inputClass}/></div>
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <StyledCheck checked={form.tem_iva} onChange={v=>setForm({...form, tem_iva:v})} label="Tem IVA"/>
                <div className="flex gap-2">
                  <input type="number" disabled={!form.tem_iva} value={form.iva} onChange={e=>setForm({...form, iva:e.target.value})} placeholder="IVA %" className={`${inputClass} disabled:opacity-50`}/>
                  <input type="number" value={form.peso} onChange={e=>setForm({...form, peso:e.target.value})} placeholder="Peso" className={inputClass}/>
                </div>
              </div>
            </div>
          )}
          {tab==="Stock" && (
            <div className="space-y-2.5">
              <div className="flex gap-4">
                <StyledCheck checked={form.controlar_stock} onChange={v=>setForm({...form, controlar_stock:v})} label="Controlar stock"/>
                <StyledCheck checked={form.allow_negative} onChange={v=>setForm({...form, allow_negative:v})} label="Negativo"/>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={form.stock_atual} onChange={e=>setForm({...form, stock_atual:e.target.value})} placeholder="Stock atual" className={inputClass}/>
                <input type="number" value={form.stock_minimo} onChange={e=>setForm({...form, stock_minimo:e.target.value})} placeholder="Stock mínimo" className={inputClass}/>
              </div>
            </div>
          )}
          {tab==="Cozinha" && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={form.prep_time} onChange={e=>setForm({...form, prep_time:e.target.value})} placeholder="Tempo min" className={inputClass}/>
                <input value={form.kitchen_station} onChange={e=>setForm({...form, kitchen_station:e.target.value})} placeholder="Estação" className={inputClass}/>
              </div>
              <div className="grid grid-cols-2 gap-2 items-center">
                <StyledCheck checked={form.is_modifiable} onChange={v=>setForm({...form, is_modifiable:v})} label="Modificável"/>
                <input type="number" value={form.service_duration} onChange={e=>setForm({...form, service_duration:e.target.value})} placeholder="Duração" className={inputClass}/>
              </div>
            </div>
          )}
          {tab==="Códigos" && (
            <div className="space-y-2.5">
              <input value={form.codigo_barras} onChange={e=>setForm({...form, codigo_barras:e.target.value})} placeholder="Código barras" className={inputClass}/>
              <input value={form.codigo_qr} onChange={e=>setForm({...form, codigo_qr:e.target.value})} placeholder="Código QR" className={inputClass}/>
            </div>
          )}
        </div>
        <div className="p-3 border-t flex gap-3 justify-end">
          <button onClick={onClose} className="w-10 h-10 bg-white border border-[#E8DCCF] rounded-full flex items-center justify-center hover:bg-gray-50"><X size={16}/></button>
          <button onClick={onSave} disabled={saving} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 disabled:opacity-60">
            {saving? <Loader2 size={16} className="animate-spin"/> : <Check size={18} strokeWidth={3}/>}
          </button>
        </div>
      </div>
    </div>
  )
}
