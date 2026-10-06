"use client";
import { X, User } from "lucide-react";

function safeKz(v: any) {
    const n = Number(v ?? 0);
    return isNaN(n) ? "0" : n.toLocaleString('de-DE');
}

export function PedidoDetalheModal({ pedido, onClose, onAtender, onRecusar }: { pedido: any, onClose: () => void, onAtender: (p: any) => void, onRecusar: (p: any) => void }) {
    if (!pedido) return null;
    const total = pedido.total ?? pedido.valor_total ?? 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] w-full max-w-[400px] overflow-hidden shadow-2xl">
                <div className="p-5 border-b flex justify-between items-center">
                    <h3 className="font-black text-[14px]">MESA {pedido.mesa_numero} • {pedido.cliente_nome}</h3>
                    <button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200">
                        <X size={14} />
                    </button>
                </div>

                <div className="p-4 space-y-2 max-h-[320px] overflow-y-auto">
                    {pedido.itens?.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between bg-[#F5F0E9] rounded-[14px] px-4 py-3 text-[12px]">
                            <span className="font-bold truncate pr-2">{it.quantidade}x {it.produto_nome}</span>
                            <span className="font-black shrink-0">Kz {safeKz(it.subtotal ?? it.total ?? it.preco_unit * it.quantidade)}</span>
                        </div>
                    ))}
                    {(!pedido.itens || pedido.itens.length === 0) && (
                        <div className="text-center py-6 text-[12px] opacity-60">Sem itens</div>
                    )}
                </div>

                <div className="p-4 border-t bg-[#FFFEFB]">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[11px] font-bold text-[#8A8A8A] flex items-center gap-1"><User size={12} />{pedido.cliente_nome} • Kz {safeKz(total)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => onRecusar(pedido)} className="bg-red-50 text-red-600 border border-red-100 rounded-full py-3 font-black text-[13px] hover:bg-red-100">Recusar</button>
                        <button onClick={() => onAtender(pedido)} className="bg-black text-white rounded-full py-3 font-black text-[13px] hover:bg-zinc-800">Atender</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
