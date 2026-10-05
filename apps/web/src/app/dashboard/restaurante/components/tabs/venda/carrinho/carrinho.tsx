"use client";
export function CarrinhoSection({ cart, total, mesaSelecionada, onAddMesa, onLimparMesa, forma, setForma, setShowPay, setRecebido, finalizando }: any) {
    const isMesa =!!mesaSelecionada;
    return (
        <div className="w-full lg:w-[340px] bg-white border-t lg:border-l flex flex-col h-[42dvh] lg:h-auto shrink-0">
            <div className="p-4 flex justify-between items-center border-b">
                <div>
                    <p className="font-black text-[13px]">{isMesa? `Mesa ${mesaSelecionada.numero}` : "Seu pedido"}</p>
                    {isMesa && <p className="text-[10px] text-amber-600 font-bold">pendente Kz {total.toLocaleString("de-DE")}</p>}
                </div>
                <span className="text-[11px] bg-black text-white px-3 py-1 rounded-full">{cart.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.length === 0 && <p className="text-center text-[12px] text-gray-400 mt-10">{isMesa? "Adicione produtos\npara somar na mesa" : "Dê 2 cliques no produto"}</p>}
                {cart.map((i: any) => (
                    <div key={i.id} className="flex gap-3 bg-[#F8FAFF] border rounded-[14px] p-2.5"><div className="flex-1"><p className="font-semibold text-[12px]">{i.name}</p><p className="text-[11px]">x{i.qtd}</p></div><p className="font-bold text-[12px]">Kz {(i.price * i.qtd).toLocaleString("de-DE")}</p></div>
                ))}
            </div>
            <div className="p-3 border-t space-y-2">
                {isMesa? (
                    <>
                        <div className="flex justify-between px-1"><span className="text-[12px]">A adicionar</span><span className="font-black">Kz {total.toLocaleString("de-DE")}</span></div>
                        <button disabled={cart.length === 0 || finalizando} onClick={onAddMesa} className="w-full bg-[#A67C52] disabled:bg-gray-300 text-white rounded-full py-3 font-black text-[13px]">{finalizando? "..." : `Adicionar na Mesa ${mesaSelecionada.numero}`}</button>
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
