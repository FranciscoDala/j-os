"use client";
import { Pencil, Trash2 } from "lucide-react";

function fmtMoney(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return `${n.toLocaleString("pt-AO")} Kz`;
}

export function EntidadeCard({ ent, onEdit, onDelete, canManage }: { ent: any, onEdit: (e: any) => void, onDelete: (e: any) => void, canManage?: boolean }) {
    const initials = ent.nome?.slice(0,2).toUpperCase() || "EN";

    // tags - só cargo/departamento + nivel de acesso, sem App
    const nivel = ent.perfil_nome || ent.perfil_slug || ent.role || "";
    const tags: string[] = [];
    if (ent.tipo === "FUNCIONARIO") {
        if (ent.cargo) tags.push(ent.cargo);
        if (nivel) tags.push(nivel);
        else if (ent.departamento) tags.push(ent.departamento);
    } else if (ent.tipo === "CLIENTE") {
        tags.push("Cliente");
        if (ent.categoria) tags.push(ent.categoria);
    } else if (ent.tipo === "FORNECEDOR") {
        if (ent.categoria_fornecedor) tags.push(ent.categoria_fornecedor);
        if (ent.empresa_fornecedora) tags.push(ent.empresa_fornecedora);
    }

    const email = ent.email || "—";
    const telefone = ent.telefone || ent.documento || "";

    return (
        <div className="group relative w-full rounded-[22px] overflow-hidden bg-[#FFFEFB] border border-[#F0E6D8] shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
            {canManage && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={() => onEdit(ent)} className="w-7 h-7 bg-black/80 text-white rounded-full flex items-center justify-center hover:bg-black"><Pencil size={11} /></button>
                    <button onClick={() => onDelete(ent)} className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"><Trash2 size={11} /></button>
                </div>
            )}

            {/* IMAGEM MENOR */}
            <div className="relative w-full h-[132px] bg-[#FFEAA6] overflow-hidden flex items-center justify-center">
                {ent.foto_url? (
                    <img src={ent.foto_url} alt={ent.nome} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFF3C0] to-[#FFD86A]">
                        <span className="text-[32px] font-black text-[#1A1A1A] tracking-tight">{initials}</span>
                    </div>
                )}
            </div>

            {/* CONTEUDO COMPACTO */}
            <div className="px-3.5 py-3 flex flex-col flex-1">
                <h3 className="font-black text-[13px] leading-[1.15] text-[#1E1E1E] line-clamp-1">{ent.nome}</h3>

                <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    {tags.slice(0,2).map((t,i)=>(
                        <span key={i} className="text-[9px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2 py-0.5 rounded-full truncate max-w-[90px]">{t}</span>
                    ))}
                </div>

                {/* EMAIL + TELEFONE */}
                <div className="mt-2.5 space-y-0.5 min-h-[28px]">
                    <p className="text-[10px] leading-[1.2] text-[#8A8A8A] truncate">{email}</p>
                    {telefone && <p className="text-[10px] leading-[1.2] text-[#8A8A8A] font-medium truncate">{telefone}</p>}
                </div>

                {/* RODAPÉ */}
                <div className="mt-3 flex items-end justify-between gap-2">
                    <div className="leading-none">
                        <div className="w-4 h-0.5 bg-[#FFC91A] rounded-full mb-1" />
                        <p className="text-[10px] font-bold text-[#9A9A9A]">+ Salário</p>
                        {ent.salario? <p className="text-[11px] font-black text-[#1E1E1E] mt-0.5">{fmtMoney(ent.salario)}</p> : null}
                    </div>
                    <button
                        onClick={()=>onEdit(ent)}
                        className="h-[30px] px-4 rounded-full bg-[#FFC91A] hover:bg-[#FFB800] text-black text-[11px] font-black shadow-sm transition-colors shrink-0"
                    >
                        Detalhes
                    </button>
                </div>
            </div>
        </div>
    )
}
