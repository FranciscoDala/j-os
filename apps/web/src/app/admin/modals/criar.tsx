"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function AdminLojaModal({ open, onOpenChange, editingLoja, donos, formData, setFormData, onSave, saving }: any) {
    const handle = (f: string, v: any) => setFormData((s: any) => ({...s, [f]: v }));
    const handleDonoNovo = (f: string, v: any) => setFormData((s: any) => ({...s, dono_novo: {...s.dono_novo, [f]: v } }));
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-[600px] p-0 flex flex-col bg-white rounded-[22px] overflow-hidden [&>button]:hidden">
                <form onSubmit={onSave} className="flex flex-col flex-1 min-h-0">
                    <DialogHeader className="p-5 pb-3 text-left">
                        <DialogTitle className="text-[15px] font-black">{editingLoja? "Editar Loja" : "Criar Nova Loja"}</DialogTitle>
                        <DialogDescription className="text-xs">{editingLoja? "Edita empresa" : "Cria empresa + dono"}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 px-5 overflow-y-auto flex-1">
                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-xs text-right">Nome *</Label><Input value={formData.nome_fantasia} onChange={e => handle('nome_fantasia', e.target.value)} className="col-span-3 h-9 rounded-full" required /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-xs text-right">NIF</Label><Input value={formData.nif} onChange={e => handle('nif', e.target.value)} className="col-span-3 h-9 rounded-full" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-xs text-right">Tipo</Label>
                            <select value={formData.tipo} onChange={e => handle('tipo', e.target.value)} className="col-span-3 h-9 rounded-full border px-3 text-xs bg-white">
                                <option value="VAREJO">VAREJO</option><option value="RESTAURANTE">RESTAURANTE</option><option value="SEGURANCA">SEGURANCA</option><option value="SERVICOS">SERVICOS</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-xs text-right">Email</Label><Input value={formData.email} onChange={e => handle('email', e.target.value)} className="col-span-3 h-9 rounded-full" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-xs text-right">Telefone</Label><Input value={formData.phone} onChange={e => handle('phone', e.target.value)} className="col-span-3 h-9 rounded-full" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-xs text-right">Cidade</Label><Input value={formData.city} onChange={e => handle('city', e.target.value)} className="col-span-3 h-9 rounded-full" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-xs text-right">Endereço</Label><Input value={formData.address} onChange={e => handle('address', e.target.value)} className="col-span-3 h-9 rounded-full" /></div>

                        {!editingLoja && (
                            <>
                                <div className="border-t pt-4 flex gap-2">
                                    <button type="button" onClick={() => handle('modoDono', 'existente')} className={`flex-1 h-9 rounded-full text-xs font-bold border ${formData.modoDono === 'existente'? 'bg-black text-white' : 'bg-white'}`}>Existente</button>
                                    <button type="button" onClick={() => handle('modoDono', 'novo')} className={`flex-1 h-9 rounded-full text-xs font-bold border ${formData.modoDono === 'novo'? 'bg-black text-white' : 'bg-white'}`}>Novo Dono</button>
                                </div>
                                {formData.modoDono === 'existente' && (
                                    <div className="grid grid-cols-4 items-center gap-4"><Label className="text-xs text-right">Dono</Label>
                                        <select value={formData.dono_existente_id} onChange={e => handle('dono_existente_id', e.target.value)} className="col-span-3 h-9 rounded-full border px-3 text-xs" required>
                                            <option value="">Seleciona...</option>{donos.map((d: any) => <option key={d.id} value={d.id}>{d.nome} - {d.email}</option>)}
                                        </select>
                                    </div>
                                )}
                                {formData.modoDono === 'novo' && (
                                    <>
                                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-xs text-right">Nome *</Label><Input value={formData.dono_novo.nome} onChange={e => handleDonoNovo('nome', e.target.value)} className="col-span-3 h-9 rounded-full" required /></div>
                                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-xs text-right">Email *</Label><Input type="email" value={formData.dono_novo.email} onChange={e => handleDonoNovo('email', e.target.value)} className="col-span-3 h-9 rounded-full" required /></div>
                                        <div className="grid grid-cols-4 items-center gap-4"><Label className="text-xs text-right">Senha *</Label><Input type="password" value={formData.dono_novo.senha} onChange={e => handleDonoNovo('senha', e.target.value)} className="col-span-3 h-9 rounded-full" required /></div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <DialogFooter className="p-4 border-t flex-row gap-2">
                        <Button type="submit" disabled={saving} className="flex-1 h-10 rounded-full bg-[#FFC91A] text-black font-black gap-2 hover:bg-[#FFB800]">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingLoja? "Salvar" : "Criar"}</Button>
                        <DialogClose asChild><Button type="button" className="flex-1 h-10 rounded-full bg-white border text-black">Cancelar</Button></DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
