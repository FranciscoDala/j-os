"use client";
import { Pencil, Trash2 } from "lucide-react";

const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };

function fmtMoney(v: any) {
    if (!v && v !== 0) return "—";
    const n = Number(v);
    if (isNaN(n)) return String(v);
    return n.toLocaleString("pt-AO", { style: "currency", currency: "AOA" }).replace("AOA", "Kz");
    // se quiser em dólar: return `$${n.toFixed(2)}`
}

export function EntidadeCard({ ent, onEdit, onDelete, canManage }: { ent: any, onEdit: (e: any) => void, onDelete: (e: any) => void, canManage?: boolean }) {
    const initials = ent.nome?.slice(0, 2).toUpperCase() || "EN";

    // TAGS por tipo - igual os chips "Vegan / Gluten free"
    const tags: string[] = [];
    if (ent.tipo === "FUNCIONARIO") {
        if (ent.cargo) tags.push(ent.cargo);
        if (ent.departamento) tags.push(ent.departamento);
        if (ent.tem_acesso_app) tags.push("App");
    } else if (ent.tipo === "CLIENTE") {
        tags.push("Cliente");
        if (ent.documento) tags.push(ent.documento.slice(0, 14));
    } else if (ent.tipo === "FORNECEDOR") {
        if (ent.categoria_fornecedor) tags.push(ent.categoria_fornecedor);
        if (ent.empresa_fornecedora) tags.push(ent.empresa_fornecedora);
    }
    const tagsShow = tags.slice(0, 3);

    // DESCRIÇÃO = Lorem ipsum...
    const descricao = ent.tipo === "FUNCIONARIO"
        ? (ent.email || ent.telefone || ent.endereco || "Sem descrição")
        : ent.tipo === "CLIENTE"
            ? (ent.email || ent.telefone || "Cliente sem contacto")
            : (ent.email || ent.telefone || ent.endereco || "Fornecedor");

    // PREÇO = $10.00
    const price = ent.tipo === "FUNCIONARIO"
        ? fmtMoney(ent.salario)
        : ent.tipo === "CLIENTE"
            ? (ent.telefone || ent.documento || "—")
            : (ent.empresa_fornecedora || ent.telefone || "—");

    // SUB PREÇO = +$2 delivery
    const subLabel = ent.tipo === "FUNCIONARIO"
        ? "Salário"
        : ent.tipo === "CLIENTE"
            ? (ent.email ? "Contacto" : "Documento")
            : "Fornecedor";

    return (
        <div className="group relative w-full rounded-[28px] overflow-hidden bg-[#FFFEFB] border border-[#F3E9DF] shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_14px_32px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
            {/* EDIT / DELETE */}
            {canManage && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={() => onEdit(ent)} className="w-8 h-8 bg-black/80 backdrop-blur text-white rounded-full flex items-center justify-center hover:bg-black shadow-lg"><Pencil size={13} /></button>
                    <button onClick={() => onDelete(ent)} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"><Trash2 size={13} /></button>
                </div>
            )}

            {/* IMAGEM - igual sorvete do print */}
            <div className="relative w-full aspect-[1.15/0.9] bg-[#FFEAA6] overflow-hidden">
                {ent.foto_url ? (
                    <img src={ent.foto_url} alt={ent.nome} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFF1B8] to-[#FFD86A]">
                        <span className="text-[42px] font-black text-black/80 tracking-tight">{initials}</span>
                    </div>
                )}
                {/* badge tipo */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black shadow-sm">
                    {TIPO_LABELS[ent.tipo] || ent.tipo}
                </div>
            </div>

            {/* CONTEUDO - igual parte de baixo do sorvete */}
            <div className="p-[16px] pt-[14px] flex flex-col flex-1">
                <h3 className="font-black text-[16px] leading-[1.1] text-[#1E1E1E] line-clamp-1">{ent.nome}</h3>

                {/* TAGS */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {tagsShow.length > 0 ? tagsShow.map((t, i) => (
                        <span key={i} className="text-[10px] font-bold text-[#8A8A] bg-[#F5F0E9] px-2.5 py-1 rounded-full">{t}</span>
                    )) : <span className="text-[10px] font-bold text-[#8A8A8A] bg-[#F5F0E9] px-2.5 py-1 rounded-full">{TIPO_LABELS[ent.tipo]}</span>}
                </div>

                <p className="mt-3 text-[11px] leading-[1.35] text-[#7A7A7A] line-clamp-2 min-h-[30px]">
                    {descricao}
                </p>

                {/* PREÇO + BOTÃO - igual $10.00 + Add to cart */}
                <div className="mt-3 flex items-end justify-between gap-3">
                    <div className="leading-none">
                        <p className="text-[18px] font-black text-[#EBA500] tracking-tight">{price}</p>
                        <p className="text-[11px] font-bold text-[#9A9A9A] mt-1">+ {subLabel}</p>
                    </div>
                    <button
                        onClick={() => onEdit(ent)}
                        className="h-[38px] px-6 rounded-full bg-[#FFC91A] hover:bg-[#FFB800] text-black text-[12px] font-black shadow-[0_2px_8px_rgba(255,201,26,0.4)] transition-colors shrink-0"
                    >
                        Detalhes
                    </button>
                </div>
            </div>
        </div>
    )
}
