"use client";
import { X } from "lucide-react";

function safeKz(v: any) {
    const n = Number(v ?? 0);
    return isNaN(n) ? "0" : n.toLocaleString("de-DE");
}

export function PedidoDetalheModal({
    pedido,
    onClose,
}: {
    pedido: any;
    onClose: () => void;
}) {
    if (!pedido) return null;
    const total = pedido.total ?? pedido.valor_total ?? pedido.total_estimado ?? 0;
    const itens = pedido.itens || [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
            <div className="relative w-full max-w-[420px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[92dvh] md:max-h-[90vh]">

                <div className="bg-white m-[6px] rounded-[18px] p-3 flex justify-between items-start border border-black/5 shrink-0">
                    <div>
                        <p className="font-black text-[13px] leading-none text-black">
                            MESA {pedido.mesa_numero}
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-1 font-bold truncate max-w-[220px]">
                            {pedido.cliente_nome || "Cliente"} • {itens.length} itens
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="bg-white m-[6px] mt-0 rounded-[18px] border border-black/5 overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="flex text-[10px] tracking-widest text-zinc-500 px-2 py-2 border-b border-black/10 shrink-0 bg-white">
                        <span className="w-[28px]">REF</span>
                        <span className="flex-1">DESCRIÇÃO</span>
                        <span className="w-[36px] text-center">QTD</span>
                        <span className="w-[70px] text-right">P/UNIT</span>
                    </div>

                    <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {itens.length === 0 && (
                            <p className="text-center text-[12px] text-gray-400 mt-10">Sem itens</p>
                        )}
                        {itens.map((it: any, idx: number) => {
                            const nome = it.produto_nome || it.nome || "Produto";
                            const qtd = Number(it.quantidade || 1);
                            const unit = Number(it.preco_unit || it.preco || it.subtotal / qtd || 0);
                            return (
                                <div
                                    key={idx}
                                    className="flex items-start px-2 py-2.5 border-b border-dashed border-black/10 text-[13px] leading-[16px]"
                                >
                                    <span className="w-[28px] shrink-0">{idx + 1}</span>
                                    <span className="flex-1 pr-2 break-words whitespace-normal font-medium text-black">
                                        {nome}
                                    </span>
                                    <span className="w-[36px] shrink-0 text-center">{qtd}</span>
                                    <span className="w-[70px] shrink-0 text-right">{safeKz(unit)}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="shrink-0 p-3 border-t bg-white mt-auto">
                        <div className="flex justify-between items-center px-1 pb-3">
                            <span className="text-[13px] font-bold">Kz</span>
                            <span className="text-[30px] leading-none text-[#2F4A8A] font-bold">
                                {safeKz(total)}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full bg-black text-white rounded-full py-3.5 text-[12px] font-bold active:scale-[0.97] hover:bg-zinc-800"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
