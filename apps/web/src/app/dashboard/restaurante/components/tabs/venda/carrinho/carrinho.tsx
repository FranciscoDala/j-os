"use client";

type Props = {
    cart: any[];
    total: number;
    forma: "dinheiro" | "transferencia" | "tpa";
    setForma: (v: any) => void;
    setShowPay: (v: boolean) => void;
    setRecebido: (v: string) => void;
    mesaSelecionada?: any;
    onFecharConta?: () => void;
    onLimparMesa?: () => void;
};

export function CarrinhoSection({ cart, total, forma, setForma, setShowPay, setRecebido, mesaSelecionada, onLimparMesa }: any) {
    const isMesa = !!mesaSelecionada;
    return (
        <div className="w-full lg:w-[340px] bg-white border-t lg:border-l flex flex-col h-[42dvh] lg:h-auto shrink-0">
            <div className="p-4 flex justify-between items-center border-b">
                <div>
                    <p className="font-black text-[13px]">{isMesa ? `Mesa ${mesaSelecionada.numero} • ${mesaSelecionada.pessoas_atual}p` : "Seu pedido"}</p>
                    {isMesa && <p className="text-[10px] text-amber-600 font-bold">+ Kz {total.toLocaleString("de-DE")} pendente para adicionar</p>}
                </div>
                <span className="text-[11px] bg-black text-white px-3 py-1 rounded-full">{cart.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.map(i => (
                    <div key={i.id} className="flex gap-3 bg-[#F8FAFF] border rounded-[14px] p-2.5">
                        <div className="flex-1"><p className="font-semibold text-[12px]">{i.name}</p><p className="text-[11px]">Kz {i.price.toLocaleString("de-DE")} x {i.qtd}</p></div>
                        <p className="font-bold text-[12px]">Kz {(i.price * i.qtd).toLocaleString("de-DE")}</p>
                    </div>
                ))}
            </div>
            <div className="p-3 border-t space-y-2">
                <div className="flex justify-between text-[12px] px-1"><span>Total pendente</span><span className="font-black text-[15px]">Kz {total.toLocaleString("de-DE")}</span></div>
                <button disabled={cart.length === 0} onClick={() => setShowPay(true)} className={`w-full text-white rounded-full py-3 font-bold text-[13px] ${isMesa ? "bg-[#A67C52]" : "bg-[#2F4A8A]"}`}>
                    {isMesa ? `Adicionar na Mesa ${mesaSelecionada.numero}` : `Pagar • Kz ${total.toLocaleString("de-DE")}`}
                </button>
                {isMesa && <button onClick={onLimparMesa} className="w-full bg-zinc-100 rounded-full py-2.5 text-[11px] font-bold">Cancelar seleção</button>}
            </div>
        </div>
    )
}
