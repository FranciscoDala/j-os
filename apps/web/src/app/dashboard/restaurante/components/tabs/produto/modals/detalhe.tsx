"use client";
import { X, Package, Barcode, QrCode, Clock, ChefHat, Box, Tag, DollarSign, Weight, Percent } from "lucide-react";
import { getImgUrl } from "../cards/produto";

export function ProdutoDetalheModal({ produto, open, onClose, canManage, onEdit }: any) {
    if (!open ||!produto) return null;
    const p = produto;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px]" onClick={onClose} />
            <div className="relative w-full max-w-[420px] bg-white rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col max-h-[92dvh] md:max-h-[90vh] animate-in fade-in zoom-in-95">

                {/* IMAGEM GRANDE ESTILO NIKE */}
                <div className="relative w-full h-[320px] md:h-[360px] bg-[#F5F0E9] overflow-hidden shrink-0">
                    <img src={getImgUrl(p.imagem_url)} alt={p.nome} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black tracking-widest">{p.ativo? "Ativo" : "Inativo"}</span>
                        {p.controlar_stock && Number(p.stock_atual) <= Number(p.stock_minimo) && <span className="bg-[#C62828] text-white px-3 py-1 rounded-full text-[10px] font-black">Baixo Stock</span>}
                    </div>
                    <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-white active:scale-95">
                        <X size={16} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full shadow" />
                        <span className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                        <span className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                    </div>
                </div>

                {/* CONTEÚDO */}
                <div className="flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-5">
                    <h2 className="font-black text-[18px] leading-tight text-black">{p.nome}</h2>
                    <p className="text-[12px] font-bold text-zinc-500 mt-1">{p.categoria || "Sem categoria"} • {p.tipo}</p>
                    <p className="text-[12px] leading-[16px] text-zinc-600 mt-2">{p.descricao || "Sem descrição detalhada."}</p>

                    {/* PREÇO */}
                    <div className="mt-4 flex items-center justify-between bg-[#FFFEF5] border border-[#FFEAA6] rounded-[16px] p-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#FFC91A] rounded-full flex items-center justify-center"><DollarSign size={14} /></div>
                            <div>
                                <p className="text-[10px] font-black tracking-widest text-zinc-500">PREÇO VENDA</p>
                                <p className="text-[18px] font-black">Kz {Number(p.preco_venda||0).toLocaleString("de-DE")}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-zinc-500">CUSTO</p>
                            <p className="text-[13px] font-black">Kz {Number(p.preco_custo||0).toLocaleString("de-DE")}</p>
                        </div>
                    </div>

                    {/* GRID INFOS */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="bg-zinc-50 border rounded-[14px] p-3"><p className="text-[9px] font-black tracking-widest text-zinc-500 flex items-center gap-1"><Package size={10}/> CÓDIGO</p><p className="text-[12px] font-bold mt-1 truncate">{p.codigo}</p></div>
                        <div className="bg-zinc-50 border rounded-[14px] p-3"><p className="text-[9px] font-black tracking-widest text-zinc-500 flex items-center gap-1"><Tag size={10}/> UNIDADE</p><p className="text-[12px] font-bold mt-1">{p.unidade}</p></div>
                        <div className="bg-zinc-50 border rounded-[14px] p-3"><p className="text-[9px] font-black tracking-widest text-zinc-500 flex items-center gap-1"><Box size={10}/> STOCK ATUAL</p><p className="text-[12px] font-bold mt-1">{Number(p.stock_atual||0)} / min {Number(p.stock_minimo||0)}</p><p className="text-[9px] text-zinc-500 mt-1">{p.controlar_stock? "Controlado" : "Não controlado"} {p.allow_negative? "• Negativo ok" : ""}</p></div>
                        <div className="bg-zinc-50 border rounded-[14px] p-3"><p className="text-[9px] font-black tracking-widest text-zinc-500 flex items-center gap-1"><Weight size={10}/> PESO / IVA</p><p className="text-[12px] font-bold mt-1">{p.peso? `${p.peso} kg` : "—"} • {p.tem_iva? `${p.iva}% IVA` : "Sem IVA"}</p></div>
                        <div className="bg-zinc-50 border rounded-[14px] p-3"><p className="text-[9px] font-black tracking-widest text-zinc-500 flex items-center gap-1"><Barcode size={10}/> BARRAS</p><p className="text-[11px] font-bold mt-1 truncate">{p.codigo_barras || "—"}</p></div>
                        <div className="bg-zinc-50 border rounded-[14px] p-3"><p className="text-[9px] font-black tracking-widest text-zinc-500 flex items-center gap-1"><QrCode size={10}/> QR CODE</p><p className="text-[11px] font-bold mt-1 truncate">{p.codigo_qr || "—"}</p></div>
                    </div>

                    {/* RESTAURANTE */}
                    {(p.prep_time || p.kitchen_station || p.is_modifiable) && (
                        <div className="mt-3 bg-[#FFF8E1] border border-amber-200 rounded-[14px] p-3">
                            <p className="text-[10px] font-black tracking-widest flex items-center gap-1"><ChefHat size={12}/> RESTAURANTE</p>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] font-bold">
                                <span>Prep: {p.prep_time? `${p.prep_time} min` : "—"}</span>
                                <span>Estação: {p.kitchen_station || "—"}</span>
                                <span>Modificável: {p.is_modifiable? "Sim" : "Não"}</span>
                                <span>Reserva: {p.requires_booking? "Sim" : "Não"}</span>
                            </div>
                            {p.service_duration && <p className="text-[11px] font-bold mt-1 flex items-center gap-1"><Clock size={11}/> Duração serviço: {p.service_duration} min</p>}
                        </div>
                    )}

                    {/* META */}
                    <div className="mt-3 text-[9px] text-zinc-400 font-bold">
                        Criado em {p.created_at? new Date(p.created_at).toLocaleDateString() : "—"} • ID: {String(p.id).slice(0,8)}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t bg-zinc-50 flex gap-2 shrink-0">
                    <div className="flex-1 bg-white border rounded-full px-4 h-11 flex items-center justify-between">
                        <span className="text-[13px] font-black">Kz {Number(p.preco_venda||0).toLocaleString("de-DE")}</span>
                        <span className="text-[10px] font-bold text-zinc-500">{p.stock_atual} unid</span>
                    </div>
                    {canManage? (
                        <button onClick={() => { onClose(); onEdit?.(p); }} className="h-11 px-6 rounded-full bg-black text-white text-[12px] font-black hover:bg-zinc-800 active:scale-95">Editar</button>
                    ) : (
                        <button onClick={onClose} className="h-11 px-6 rounded-full bg-black text-white text-[12px] font-black">Fechar</button>
                    )}
                </div>
            </div>
        </div>
    );
}
