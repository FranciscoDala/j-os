"use client";
export function CarrinhoSection({ cart, total, mesaSelecionada, onAddMesa, onLimparMesa, forma, setForma, setShowPay, setRecebido, finalizando, pedidoQrAtivo }: any) {
    const isMesa =!!mesaSelecionada;
    const isQr =!!pedidoQrAtivo;
    return (
        <div className="w-full lg:w-[340px] bg-white border-t lg:border-l flex flex-col h-[42dvh] lg:h-[100dvh] shrink-0">
            <div className="p-3 flex justify-between items-start border-b shrink-0">
                <div>
                    <p className="font-black text-[13px]">{isMesa? "Cliente" : "Seu pedido"}</p>
                    {isMesa && <p className="text-[11px] text-amber-600">{isQr? `${pedidoQrAtivo.cliente_nome} • ` : ''}pendente</p>}
                </div>
                <span className="text-[11px] bg-black text-white px-3 py-1 rounded-full">{cart.length}</span>
            </div>

            {/* LISTA COM SCROLL INVISIVEL */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {cart.length > 0 && (
                    <div className="flex text-[9px] tracking-widest text-zinc-400 px-2 py-1.5 border-b border-black/10 sticky top-0 bg-white z-10">
                        <span className="w-[28px]">REF</span>
                        <span className="flex-1">DESCRIÇÃO</span>
                        <span className="w-[36px] text-center">QTD</span>
                        <span className="w-[70px] text-right">P/UNIT</span>
                    </div>
                )}

                {cart.length === 0 && <p className="text-center text-[12px] text-gray-400 mt-10 whitespace-pre-line">{isMesa? "Adicione produtos\npara somar na mesa" : "Dê 2 cliques no produto"}</p>}

                {cart.map((i: any, idx: number) => (
                    <div key={i.id} className="flex items-start px-2 border-b border-dashed border-black/10 text-[11px] leading-[14px]">
                        <span className="w-[28px] shrink-0">{idx + 1}</span>
                        <span className="flex-1 pr-2 break-words whitespace-normal">{i.name}</span>
                        <span className="w-[36px] shrink-0 text-center">{i.qtd}</span>
                        <span className="w-[70px] shrink-0 text-right">{i.price.toLocaleString("de-DE")}</span>
                    </div>
                ))}
            </div>

            {/* FIXO EMBAIXO */}
            <div className="shrink-0 p-2 border-t bg-white space-y-2">
                {isMesa? (
                    <>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[12px]">Kz</span>
                            <span className="text-[30px] leading-none text-[#2F4A8A]">{total.toLocaleString("de-DE")}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onLimparMesa} className="flex-1 bg-zinc-100 rounded-full py-2.5 text-[11px] font-bold">Cancelar</button>
                            <button disabled={cart.length === 0 || finalizando} onClick={onAddMesa} className="flex-1 bg-[#A67C52] disabled:bg-gray-300 text-white rounded-full py-2.5 text-[12px] font-bold">{finalizando? "..." : "Adicionar"}</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[12px]">Kz</span>
                            <span className="text-[30px] leading-none text-[#2F4A8A]">{total.toLocaleString("de-DE")}</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-white border rounded-full px-2">
                                <select value={forma} onChange={(e) => setForma(e.target.value)} className="w-full bg-transparent rounded-full py-2.5 text-[11px] font-bold outline-none"><option value="dinheiro">Dinheiro</option><option value="transferencia">Transferência</option><option value="tpa">TPA</option></select>
                            </div>
                            <button disabled={cart.length === 0} onClick={() => { setRecebido(""); setShowPay(true); }} className="flex-1 bg-[#2F4A8A] text-white rounded-full py-2.5 text-[12px] font-bold">Finalizar</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
