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

export function CarrinhoSection({ cart, total, forma, setForma, setShowPay, setRecebido, mesaSelecionada, onFecharConta, onLimparMesa }: Props) {
    const isMesa =!!mesaSelecionada;
    return (
        <div className="w-full lg:w-[340px] bg-white/90 backdrop-blur-2xl border-t lg:border-l border-black/5 flex flex-col h-[42dvh] lg:h-auto shrink-0">
            <div className="p-4 flex justify-between items-center border-b border-black/5">
                <div>
                    <p className="font-black text-[13px]">{isMesa? `Mesa ${mesaSelecionada.numero}` : "Seu pedido"}</p>
                    {isMesa && <p className="text-[10px] text-gray-500 font-bold">{mesaSelecionada.pessoas_atual} pessoas • {mesaSelecionada.zona} {mesaSelecionada.venda_total? `• Kz ${Number(mesaSelecionada.venda_total).toLocaleString("de-DE")}` : ""}</p>}
                </div>
                <div className="flex items-center gap-2">
                    {isMesa && <button onClick={onLimparMesa} className="text-[10px] font-black bg-zinc-100 px-2.5 py-1 rounded-full">X</button>}
                    <span className="text-[11px] bg-black text-white px-3 py-1 rounded-full">{cart.length} itens</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                {cart.length === 0 && <p className="text-center text-[12px] text-gray-400 mt-10">{isMesa? "Carregando comanda...\nDê 2 cliques para adicionar mais" : "Dê 2 cliques no produto\npara adicionar"}</p>}
                {cart.map(i => (
                    <div key={i.id} className="flex gap-3 bg-[#F8FAFF] border rounded-[14px] p-2.5"><img src={i.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200"} className="w-12 h-12 rounded-full object-cover border-2 border-white" alt="" /><div className="flex-1 min-w-0"><p className="font-semibold text-[12px] truncate">{i.name}</p><p className="text-[11px] text-gray-500">Kz {i.price.toLocaleString("de-DE")} x {i.qtd}</p></div><p className="font-bold text-[12px]">Kz {(i.price * i.qtd).toLocaleString("de-DE")}</p></div>
                ))}
            </div>
            <div className="p-3 border-t bg-white/90 backdrop-blur-xl space-y-2.5">
                <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[14px] p-2.5 shadow-sm">
                    <p className="text-[10px] font-bold tracking-widest text-gray-400 ml-1 mb-1.5">FORMA DE PAGAMENTO</p>
                    <div className="relative">
                        <select value={forma} onChange={(e) => setForma(e.target.value as any)} className="w-full appearance-none bg-[#F5F7FB] border border-black/5 rounded-full px-4 py-2.5 text-[12px] font-bold outline-none">
                            <option value="dinheiro">Dinheiro</option><option value="transferencia">Transferência</option><option value="tpa">TPA</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">▼</div>
                    </div>
                </div>
                <div className="flex justify-between text-[12px] px-1"><span className="text-gray-500">Total</span><span className="font-black text-[15px]">Kz {total.toLocaleString("de-DE")}</span></div>
                <button disabled={cart.length === 0} onClick={() => { if (forma === "dinheiro") setRecebido(""); else setRecebido(String(total)); setShowPay(true); }} className={`w-full disabled:bg-gray-300 text-white rounded-full py-3 font-bold text-[13px] ${isMesa? "bg-[#A67C52]" : "bg-[#2F4A8A]"}`}>
                    {isMesa? `Adicionar na Mesa • Kz ${total.toLocaleString("de-DE")}` : `Pagar • Kz ${total.toLocaleString("de-DE")}`}
                </button>
                {isMesa && <button disabled={cart.length === 0} onClick={() => { setRecebido(""); setShowPay(true); }} className="w-full bg-black text-white rounded-full py-3 font-bold text-[13px]">Fechar Conta Mesa {mesaSelecionada.numero}</button>}
            </div>
        </div>
    );
}
