"use client";
export function CarrinhoSection({ cart, total, mesaSelecionada, onAddMesa, onLimparMesa, forma, setForma, setShowPay, setRecebido, finalizando, pedidoQrAtivo }: any) {
    const isMesa =!!mesaSelecionada;
    const isQr =!!pedidoQrAtivo;
    return (
        <div className="w-full lg:w-[340px] bg-white border-t lg:border-l flex flex-col h-[42dvh] lg:h-auto shrink-0">
            <div className="p-4 flex justify-between items-start border-b">
                <div>
                    <p className="font-black text-[13px]">{isMesa? "Cliente" : "Seu pedido"}</p>
                    {isMesa && <p className="text-[11px] text-amber-600">{isQr? `${pedidoQrAtivo.cliente_nome} • ` : ''}pendente</p>}
                    {!isMesa && <p className="text-[10px] text-zinc-400">Dê 2 cliques no produto</p>}
                </div>
                <span className="text-[11px] bg-black text-white px-3 py-1 rounded-full">{cart.length}</span>
            </div>

            {/* LISTA - SEM NEGRITO, QUEBRA LINHA */}
            <div className="flex-1 overflow-y-auto">
                {cart.length > 0 && (
                    <div className="flex text-[9px] tracking-widest text-zinc-400 px-2 py-1.5 border-b border-black/10">
                        <span className="w-[28px]">REF</span>
                        <span className="flex-1">DESCRIÇÃO</span>
                        <span className="w-[36px] text-center">QTD</span>
                        <span className="w-[70px] text-right">P/UNIT</span>
                    </div>
                )}

                {cart.length === 0 && <p className="text-center text-[12px] text-gray-400 mt-10 whitespace-pre-line">{isMesa? "Adicione produtos\npara somar na mesa" : "Dê 2 cliques no produto"}</p>}

                {cart.map((i: any, idx: number) => (
                    <div key={i.id} className="flex items-start px-2 py-2 border-b border-dashed border-black/10 text-[11px]">
                        <span className="w-[28px] shrink-0 text-[11px]">{idx + 1}</span>
                        <span className="flex-1 pr-2 break-words whitespace-normal leading-[13px]">{i.name}</span>
                        <span className="w-[36px] shrink-0 text-center">{i.qtd}</span>
                        <span className="w-[70px] shrink-0 text-right">{i.price.toLocaleString("de-DE")}</span>
                    </div>
                ))}
            </div>

            <div className="p-3 border-t space-y-2">
                {isMesa? (
                    <>
                        <div className="flex justify-between items-center px-1 py-1">
                            <span className="text-[12px]">Kz</span>
                            <span className="text-[30px] leading-none text-[#2F4A8A]">{total.toLocaleString("de-DE")}</span>
                        </div>
                        <button disabled={cart.length === 0 || finalizando} onClick={onAddMesa} className="w-full bg-[#A67C52] disabled:bg-gray-300 text-white rounded-full py-2.5 text-[12px] font-bold">{finalizando? "..." : "Adicionar"}</button>
                        <button onClick={onLimparMesa} className="w-full bg-zinc-100 rounded-full py-2.5 text-[11px] font-bold">Cancelar</button>
                    </>
                ) : (
                    <>
                        <div className="bg-white border rounded-[14px] p-2.5">
                            <select value={forma} onChange={(e) => setForma(e.target.value)} className="w-full bg-[#F5F7FB] rounded-full px-4 py-2.5 text-[12px] font-bold outline-none"><option value="dinheiro">Dinheiro</option><option value="transferencia">Transferência</option><option value="tpa">TPA</option></select>
                        </div>
                        <button disabled={cart.length === 0} onClick={() => { setRecebido(""); setShowPay(true); }} className="w-full bg-[#2F4A8A] text-white rounded-full py-3 font-bold">Pagar • Kz {total.toLocaleString("de-DE")}</button>
                    </>
                )}
            </div>
        </div>
    );
}
