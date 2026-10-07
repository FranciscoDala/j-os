"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, ChevronDown, Loader2 } from "lucide-react";

const TIPOS = ["GENERAL", "RESTAURANT_DISH", "RESTAURANT_INGREDIENT", "RESTAURANT_DRINK", "SERVICE", "KIT"];
const UNIDADES = ["UNIT", "UN", "KG", "LITER", "PORTION", "HOUR", "DAY", "TASK"];
const MODAL_TABS = ["Geral", "Preços", "Stock", "Cozinha", "Códigos"];

const TIPO_LABELS: Record<string, string> = {
  GENERAL: "Geral",
  RESTAURANT_DISH: "Prato",
  RESTAURANT_INGREDIENT: "Ingrediente",
  RESTAURANT_DRINK: "Bebida",
  SERVICE: "Serviço",
  KIT: "Kit / Combo",
};
const UNIDADE_LABELS: Record<string, string> = {
  UNIT: "Unidade", UN: "Unidade", KG: "Quilograma (KG)", LITER: "Litro (L)", PORTION: "Porção", HOUR: "Hora", DAY: "Dia", TASK: "Tarefa",
};

const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const getImgUrl = (url?: string) => {
    if (!url) return FALLBACK_IMG;
    if (url.startsWith("blob:")) return url;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/media")) return `${API_URL}${url}`;
    return url;
};

function CustomSelect({ value, onChange, options, labelMap, placeholder, className = "" }: { value: string, onChange: (v: string) => void, options: string[], labelMap?: Record<string,string>, placeholder?: string, className?: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    const getLabel = (opt: string) => {
        if (opt === "") return "Todas";
        if (labelMap && labelMap[opt]) return labelMap[opt];
        return opt;
    };
    return (
        <div ref={ref} className={`relative ${open? "z-[60]" : "z-0"} ${className}`}>
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 h-9 text-[11px] font-bold text-left flex items-center justify-between hover:border-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all">
                <span className="truncate">{value? getLabel(value) : (placeholder || "Selecionar")}</span>
                <ChevronDown size={14} className={`shrink-0 ml-2 transition-transform ${open? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[16px] border border-[#E8DCCF] shadow-[0_16px_32px_rgba(0,0,0,0.18)] z-[100] overflow-hidden p-1">
                    <div className="max-h-[160px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-0.5">
                        {options.map(opt => (
                            <button key={opt || "todas"} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-full text-[11px] font-bold transition-all ${value === opt? "bg-black text-white" : "hover:bg-[#F5E6D3]"}`}>
                                {getLabel(opt)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function StyledCheck({ checked, onChange, label }: { checked: boolean, onChange: (v: boolean) => void, label: string }) {
    return (
        <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${checked? "bg-black border-black" : "bg-white border-[#E5D5C0] group-hover:border-black"}`}>
                {checked && <Check size={12} className="text-white" strokeWidth={3} />}
            </div>
            <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
            <span className="text-[11px] font-bold text-black">{label}</span>
        </label>
    )
}

type Props = {
    open: boolean;
    editId: string | null;
    tab: string;
    setTab: (t: string) => void;
    form: any;
    setForm: (f: any) => void;
    preview: string;
    setPreview: (s: string) => void;
    setImgFile: (f: File | null) => void;
    cats: string[];
    saving: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function ProdutoModal({ open: isOpen, editId, tab, setTab, form, setForm, preview, setPreview, setImgFile, cats, saving, onClose, onSave }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!isOpen ||!mounted) return null;

    const inputClass = "w-full h-9 bg-white border border-[#E8DCCF] rounded-full px-4 text-[11px] font-bold outline-none focus:border-black focus:ring-1 focus:ring-black placeholder:text-black/40 transition-all";
    const labelClass = "text-[8px] font-black tracking-widest text-zinc-500 mb-1 ml-1";

    return createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-3 md:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={onClose} />
            <div className="relative w-full max-w-[560px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col max-h-[92dvh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* HEADER FIXO */}
                <div className="bg-white m-[6px] rounded-[18px] p-3 flex justify-between items-center border border-black/5 shrink-0">
                    <div>
                        <p className="font-black text-[13px] leading-none text-black">{editId? "EDITAR" : "NOVO"} • {TIPO_LABELS[form.tipo] || form.tipo}</p>
                        <p className="text-[8px] font-black tracking-widest text-zinc-500 mt-1">PRODUTO • J-OS</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95"><X size={14} /></button>
                </div>

                {/* TABS FIXAS */}
                <div className="mx-[6px] bg-white rounded-[18px] border border-black/5 p-1.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
                    {MODAL_TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap px-4 h-8 rounded-full text-[11px] font-black transition-all ${tab === t? "bg-black text-white" : "bg-[#F5F2ED] text-black hover:bg-[#F5E6D3]"}`}>{t}</button>)}
                </div>

                {/* CONTEÚDO COM SCROLL INVISÍVEL */}
                <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="bg-white m-[6px] mt-[6px] rounded-[18px] p-4 border border-black/5">
                        {tab === "Geral" && (
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="w-[64px] h-[64px] bg-[#F5F2ED] rounded-[16px] border border-[#E8DCCF] overflow-hidden flex items-center justify-center shrink-0">
                                        <img src={getImgUrl(preview)} onError={(e) => (e.currentTarget as HTMLImageElement).style.display = 'none'} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2.5">
                                        <div><p className={labelClass}>NOME DO PRODUTO *</p><input value={form.nome} onChange={e => setForm({...form, nome: e.target.value })} placeholder="Ex: Hamburguer Especial" className={`${inputClass} font-black`} /></div>
                                        <div><p className={labelClass}>DESCRIÇÃO</p><input value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value })} placeholder="Descrição curta" className={inputClass} /></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div><p className={labelClass}>TIPO</p><CustomSelect value={form.tipo} onChange={(v) => setForm({...form, tipo: v })} options={TIPOS} labelMap={TIPO_LABELS} /></div>
                                    <div><p className={labelClass}>UNIDADE</p><CustomSelect value={form.unidade} onChange={(v) => setForm({...form, unidade: v })} options={UNIDADES} labelMap={UNIDADE_LABELS} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div><p className={labelClass}>CATEGORIA</p><input value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value })} placeholder="Categoria" list="cats" className={inputClass} /><datalist id="cats">{cats.map(c => <option key={c} value={c} />)}</datalist></div>
                                    <div><p className={labelClass}>IMAGEM</p><input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setImgFile(f); setPreview(URL.createObjectURL(f)); } }} className={`${inputClass} text-[10px] pt-[5px] file:mr-2 file:border-0 file:bg-black file:text-white file:rounded-full file:px-3 file:py-1 file:text-[10px] file:font-black`} /></div>
                                </div>
                                <div className="pt-1"><StyledCheck checked={form.ativo} onChange={v => setForm({...form, ativo: v })} label="Produto ativo" /></div>
                            </div>
                        )}
                        {tab === "Preços" && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div><p className={labelClass}>PREÇO VENDA *</p><input type="number" value={form.preco_venda} onChange={e => setForm({...form, preco_venda: e.target.value })} className={`${inputClass} font-black`} /></div>
                                    <div><p className={labelClass}>PREÇO CUSTO</p><input type="number" value={form.preco_custo} onChange={e => setForm({...form, preco_custo: e.target.value })} className={inputClass} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div><p className={labelClass}>IVA %</p><div className="flex gap-2"><div className="flex-1 flex items-center"><StyledCheck checked={form.tem_iva} onChange={v => setForm({...form, tem_iva: v })} label="IVA" /></div><input type="number" disabled={!form.tem_iva} value={form.iva} onChange={e => setForm({...form, iva: e.target.value })} placeholder="%" className={`${inputClass} disabled:opacity-50`} /></div></div>
                                    <div><p className={labelClass}>PESO</p><input type="number" value={form.peso} onChange={e => setForm({...form, peso: e.target.value })} placeholder="Peso" className={inputClass} /></div>
                                </div>
                            </div>
                        )}
                        {tab === "Stock" && (
                            <div className="space-y-3">
                                <div className="flex gap-6 p-2.5 bg-[#F5F2ED] border border-[#E8DCCF] rounded-[16px]">
                                    <StyledCheck checked={form.controlar_stock} onChange={v => setForm({...form, controlar_stock: v })} label="Controlar stock" />
                                    <StyledCheck checked={form.allow_negative} onChange={v => setForm({...form, allow_negative: v })} label="Permitir negativo" />
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div><p className={labelClass}>STOCK ATUAL</p><input type="number" value={form.stock_atual} onChange={e => setForm({...form, stock_atual: e.target.value })} placeholder="0" className={inputClass} /></div>
                                    <div><p className={labelClass}>STOCK MÍNIMO</p><input type="number" value={form.stock_minimo} onChange={e => setForm({...form, stock_minimo: e.target.value })} placeholder="0" className={inputClass} /></div>
                                </div>
                            </div>
                        )}
                        {tab === "Cozinha" && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div><p className={labelClass}>TEMPO PREP (MIN)</p><input type="number" value={form.prep_time} onChange={e => setForm({...form, prep_time: e.target.value })} placeholder="Ex: 15" className={inputClass} /></div>
                                    <div><p className={labelClass}>ESTAÇÃO COZINHA</p><input value={form.kitchen_station} onChange={e => setForm({...form, kitchen_station: e.target.value })} placeholder="Ex: Grelha" className={inputClass} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="flex items-center h-9"><StyledCheck checked={form.is_modifiable} onChange={v => setForm({...form, is_modifiable: v })} label="Modificável na comanda" /></div>
                                    <div><p className={labelClass}>DURAÇÃO SERVIÇO</p><input type="number" value={form.service_duration} onChange={e => setForm({...form, service_duration: e.target.value })} placeholder="Min" className={inputClass} /></div>
                                </div>
                            </div>
                        )}
                        {tab === "Códigos" && (
                            <div className="space-y-3">
                                <div><p className={labelClass}>CÓDIGO DE BARRAS</p><input value={form.codigo_barras} onChange={e => setForm({...form, codigo_barras: e.target.value })} placeholder="EAN13, etc" className={inputClass} /></div>
                                <div><p className={labelClass}>CÓDIGO QR</p><input value={form.codigo_qr} onChange={e => setForm({...form, codigo_qr: e.target.value })} placeholder="QR interno" className={inputClass} /></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER FIXO */}
                <div className="shrink-0 bg-[#EDEBE6] p-[6px] pt-2 border-t border-black/5">
                    <div className="bg-white rounded-[18px] border border-black/5 p-2 flex gap-2">
                        <button onClick={onClose} className="flex-1 bg-white border border-black/10 rounded-full py-3 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.98] transition-all">Cancelar</button>
                        <button onClick={onSave} disabled={saving} className="flex-1 bg-black text-white rounded-full py-3 text-[11px] font-black disabled:opacity-50 hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                            {saving? <Loader2 size={14} className="animate-spin" /> : <><Check size={12} /> {editId? "Salvar" : "Criar"}</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}
