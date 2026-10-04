"use client";
import { Pencil, Trash2 } from "lucide-react";

const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };

export function EntidadeCard({ ent, onEdit, onDelete }: { ent: any, onEdit: (e: any) => void, onDelete: (e: any) => void }) {
    const initials = ent.nome?.slice(0,2).toUpperCase() || "EN";
    const cargo = ent.cargo || ent.departamento || ent.email || TIPO_LABELS[ent.tipo] || "—";

    return (
        <div className="group relative rounded-[22px] p-2.5 pt-3 pb-3.5 bg-white border shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:shadow-[0_14px_36px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden w-full select-none">
            <div className="absolute top-2.5 right-2.5 flex gap-[2px] opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button onClick={() => onEdit(ent)} className="w-8 h-8 bg-black/80 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-black shadow-lg"><Pencil size={13} /></button>
                <button onClick={() => onDelete(ent)} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"><Trash2 size={13} /></button>
            </div>
            <div className="relative w-[122px] h-[122px] shrink-0">
                <div className="w-full h-full rounded-full p-[3px] shadow-inner bg-[#F5E6D3]">
                    {ent.foto_url? <img src={ent.foto_url} className="w-full h-full rounded-full object-cover" alt={ent.nome} /> : <div className="w-full h-full rounded-full bg-black text-white flex items-center justify-center text-[28px] font-black">{initials}</div>}
                </div>
                <div className="absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black shadow-md border-2 border-white z-10 bg-[#A67C52] text-white">{ent.tipo?.[0] || "F"}</div>
                {ent.tem_acesso_app && <div className="absolute top-[32px] -left-1 z-10 bg-black text-white text-[8px] font-black px-3 py-1 rounded-full shadow-sm border border-white">APP</div>}
            </div>
            <h3 className="mt-2.5 font-black text-[12.5px] leading-[1.15] w-full px-1.5 line-clamp-2">{ent.nome}</h3>
            <p className="mt-1 text-[10px] text-[#6B6B6B] w-full px-2 h-[28px] line-clamp-2 overflow-hidden">{cargo}</p>
            <div className="mt-2.5 bg-black text-white rounded-full px-4 py-[4px] flex gap-1 shadow-sm">
                <span className="text-[8px] font-bold opacity-90">{ent.telefone? "TEL" : "ID"}</span>
                <span className="text-[11px] font-black truncate max-w-[80px]">{ent.telefone || ent.documento || "—"}</span>
            </div>
        </div>
    )
}
