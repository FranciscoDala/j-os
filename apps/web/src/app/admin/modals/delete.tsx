"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

export function AdminDeleteModal({ open, onOpenChange, loja, onConfirm, deleting }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[90vw] max-w-[380px] rounded-[22px] bg-white p-0 overflow-hidden [&>button]:hidden">
                <div className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3"><AlertTriangle /></div>
                    <DialogHeader>
                        <DialogTitle className="text-center text-[15px] font-black">Apagar loja?</DialogTitle>
                        <DialogDescription className="text-center text-xs">A loja <b>{loja?.nome_fantasia}</b> será apagada permanentemente.</DialogDescription>
                    </DialogHeader>
                </div>
                <DialogFooter className="p-4 bg-[#FFFBEB] border-t flex-row gap-2">
                    <Button onClick={() => onOpenChange(false)} className="flex-1 rounded-full h-10 bg-white border text-black">Cancelar</Button>
                    <Button onClick={onConfirm} disabled={deleting} className="flex-1 rounded-full h-10 bg-[#C62828] text-white font-black gap-2 hover:bg-[#B71C1C]">{deleting? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={14} />} Apagar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
