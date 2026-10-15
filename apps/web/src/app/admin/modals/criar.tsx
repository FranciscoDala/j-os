"use client";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, X, ChevronDown, Store, User, Building2 } from "lucide-react";

function FilterSelect({ value, onChange, options, placeholder }: { value: string, onChange: (v: string) => void, options: { label: string, value: string }[], placeholder?: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    const label = options.find(o => o.value === value)?.label || placeholder || value;
    return (
        <div ref={ref} className={`relative w-full ${open? "z-[60]" : "z-0"}`}>
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 h-10 text-[11px] font-black flex items-center justify-between shadow-sm hover:border-[#A67C52] focus:ring-2 focus:ring-[#A67C52]/20 transition-all outline-none">
                <span className="truncate">{label}</span>
                <ChevronDown size={14} className={`shrink-0 ml-2 transition-transform ${open? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 min-w-[160px] bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[100] overflow-hidden p-1.5">
                    <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-0.5">
                        {options.map(opt => (
                            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-full text-[11px] font-bold transition-all ${value === opt.value? "bg-[#A67C52] text-white" : "bg-white text-black hover:bg-[#F5E6D3]"}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function AdminLojaModal({ open, onOpenChange, editingLoja, donos, formData, setFormData, onSave, saving }: any) {
    const [tab, setTab] = useState<"loja" | "dono">("loja");
    const handle = (f: string, v: any) => setFormData((s: any) => ({...s, [f]: v }));
    const handleDonoNovo = (f: string, v: any) => setFormData((s: any) => ({...s, dono_novo: {...s.dono_novo, [f]: v } }));

    const tipoOptions = [
        { label: "Varejo", value: "VAREJO" },
        { label: "Restaurante", value: "RESTAURANTE" },
        { label: "Segurança", value: "SEGURANCA" },
        { label: "Serviços", value: "SERVICOS" },
    ];

    const donoOptions = donos.map((d: any) => ({ label: `${d.nome} • ${d.email}`, value: d.id }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[580px] p-0 flex flex-col bg-[#FFFEFB] rounded-[22px] overflow-hidden border border-[#E8DCCF] shadow-[0_24px_64px_rgba(0,0,0,0.25)] [&>button]:hidden max-h-[90vh]">
                <form onSubmit={onSave} className="flex flex-col flex-1 min-h-0">
                    {/* Header - igual produto */}
                    <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#F3E9DF] text-left shrink-0">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <DialogTitle className="text-[15px] font-black flex items-center gap-2">
                                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center"><Store size={14} /></div>
                                    {editingLoja? "Editar Loja" : "Criar Nova Loja"}
                                </DialogTitle>
                                <DialogDescription className="text-[11px] text-[#9A9A9A] mt-1">
                                    {editingLoja? "Atualize os dados da empresa" : "Cria empresa + vincula um dono"}
                                </DialogDescription>
                            </div>
                            <button type="button" onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-full bg-[#F5F0E9] flex items-center justify-center hover:bg-[#E8DCCF]">
                                <X size={14} />
                            </button>
                        </div>

                        {/* Tabs igual ProdutoModal */}
                        <div className="flex gap-2 mt-4">
                            {[
                                { id: "loja", label: "Dados da Loja", icon: Building2 },
                                { id: "dono", label: "Dono", icon: User },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTab(t.id as any)}
                                    className={`flex items-center gap-1.5 px-4 h-8 rounded-full text-[11px] font-black border transition-all ${tab === t.id? "bg-black text-white border-black" : "bg-white text-[#8A8A8A] border-[#E8DCCF] hover:border-black/20"}`}
                                >
                                    <t.icon size={12} /> {t.label}
                                </button>
                            ))}
                        </div>
                    </DialogHeader>

                    {/* Body scrollável */}
                    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 no-scrollbar">
                        {tab === "loja" && (
                            <>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-[#8A8A8A] tracking-widest ml-1">Nome Fantasia *</Label>
                                    <Input value={formData.nome_fantasia} onChange={e => handle('nome_fantasia', e.target.value)} placeholder="Ex: Connect Segurança" className="h-10 rounded-full border-[#E8DCCF] bg-white px-4 text-[12px] font-bold focus:ring-2 focus:ring-[#A67C52]/20 focus:border-[#A67C52]" required />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-[#8A8A8A] ml-1">NIF</Label>
                                        <Input value={formData.nif} onChange={e => handle('nif', e.target.value)} placeholder="500876654" className="h-10 rounded-full border-[#E8DCCF] px-4 text-[12px] font-bold" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-[#8A8A8A] ml-1">Tipo</Label>
                                        <FilterSelect value={formData.tipo} onChange={(v) => handle('tipo', v)} options={tipoOptions} placeholder="Selecione tipo" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-[#8A8A8A] ml-1">Email</Label>
                                        <Input type="email" value={formData.email} onChange={e => handle('email', e.target.value)} placeholder="loja@email.ao" className="h-10 rounded-full border-[#E8DCCF] px-4 text-[12px]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-[#8A8A8A] ml-1">Telefone</Label>
                                        <Input value={formData.phone} onChange={e => handle('phone', e.target.value)} placeholder="+244..." className="h-10 rounded-full border-[#E8DCCF] px-4 text-[12px]" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-[#8A8A8A] ml-1">Cidade</Label>
                                        <Input value={formData.city} onChange={e => handle('city', e.target.value)} placeholder="Luanda" className="h-10 rounded-full border-[#E8DCCF] px-4 text-[12px]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase text-[#8A8A8A] ml-1">Endereço</Label>
                                        <Input value={formData.address} onChange={e => handle('address', e.target.value)} placeholder="Rua..." className="h-10 rounded-full border-[#E8DCCF] px-4 text-[12px]" />
                                    </div>
                                </div>
                            </>
                        )}

                        {tab === "dono" && (
                            <>
                                {!editingLoja? (
                                    <>
                                        <div className="flex gap-2 p-1 bg-[#F5F0E9] rounded-full">
                                            <button type="button" onClick={() => handle('modoDono', 'existente')} className={`flex-1 h-8 rounded-full text-[11px] font-black transition-all ${formData.modoDono === 'existente'? 'bg-black text-white shadow' : 'text-[#8A8A8A]'}`}>Dono Existente</button>
                                            <button type="button" onClick={() => handle('modoDono', 'novo')} className={`flex-1 h-8 rounded-full text-[11px] font-black transition-all ${formData.modoDono === 'novo'? 'bg-black text-white shadow' : 'text-[#8A8A8A]'}`}>Novo Dono</button>
                                        </div>

                                        {formData.modoDono === 'existente' && (
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase text-[#8A8A8A] ml-1">Selecionar Dono *</Label>
                                                <FilterSelect value={formData.dono_existente_id} onChange={(v) => handle('dono_existente_id', v)} options={donoOptions} placeholder="Selecione um dono..." />
                                            </div>
                                        )}

                                        {formData.modoDono === 'novo' && (
                                            <div className="space-y-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-[#8A8A8A] ml-1">Nome do Dono *</Label>
                                                    <Input value={formData.dono_novo.nome} onChange={e => handleDonoNovo('nome', e.target.value)} placeholder="Nome completo" className="h-10 rounded-full border-[#E8DCCF] px-4 text-[12px] font-bold" required={formData.modoDono === 'novo'} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-[#8A8A8A] ml-1">Email *</Label>
                                                    <Input type="email" value={formData.dono_novo.email} onChange={e => handleDonoNovo('email', e.target.value)} placeholder="dono@email.ao" className="h-10 rounded-full border-[#E8DCCF] px-4 text-[12px]" required={formData.modoDono === 'novo'} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-[#8A8A8A] ml-1">Senha *</Label>
                                                    <Input type="password" value={formData.dono_novo.senha} onChange={e => handleDonoNovo('senha', e.target.value)} placeholder="••••••••" className="h-10 rounded-full border-[#E8DCCF] px-4 text-[12px]" required={formData.modoDono === 'novo'} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase text-[#8A8A8A] ml-1">Telefone</Label>
                                                    <Input value={formData.dono_novo.telefone} onChange={e => handleDonoNovo('telefone', e.target.value)} placeholder="+244..." className="h-10 rounded-full border-[#E8DCCF] px-4 text-[12px]" />
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="py-8 text-center border border-dashed border-[#E8DCCF] rounded-[18px] bg-white">
                                        <p className="text-[12px] font-black">Edição de dono bloqueada</p>
                                        <p className="text-[11px] text-[#9A9A9A] mt-1">Na edição só altera dados da loja</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer - igual produto */}
                    <div className="p-4 border-t border-[#F3E9DF] flex gap-2 shrink-0 bg-white">
                        <Button type="button" onClick={() => onOpenChange(false)} className="flex-1 h-10 rounded-full bg-white border border-[#E8DCCF] text-black font-black text-[12px] hover:bg-[#F5F0E9]">Cancelar</Button>
                        <Button type="submit" disabled={saving} className="flex-1 h-10 rounded-full bg-[#FFC91A] text-black font-black text-[12px] gap-2 hover:bg-[#FFB800] shadow-sm active:scale-[0.98]">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingLoja? "Salvar Alterações" : "Criar Loja"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
