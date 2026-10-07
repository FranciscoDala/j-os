"use client";
import { useState, useMemo } from "react";

function RemoveItemModal({ item, onClose, onConfirm }: { item: any, onClose: () => void, onConfirm: () => void }) {
    if (!item) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
            <div className="relative w-full max-w-[360px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden">
                <div className="bg-white m-[6px] rounded-[18px] p-5">
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-[16px] mb-3">✕</div>
                    <h3 className="font-black text-[18px] leading-none tracking-tight text-black">Remover item?</h3>
                    <p className="text-[12px] text-zinc-600 mt-2 leading-[16px]">Tens a certeza que queres remover <span className="font-black text-black">{item.name}</span> do carrinho?</p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] px-3 py-2 rounded-full bg-[#F5F7FB] border w-fit"><span>REF #{String(item.id)?.slice(0,4) || "1"}</span><span className="w-1 h-1 bg-black rounded-full" /><span>{item.qtd}x • Kz {(Number(item.price) * Number(item.qtd)).toLocaleString("de-DE")}</span></div>
                </div>
                <div className="p-3 flex gap-2"><button onClick={onClose} className="flex-1 bg-white border border-black/10 rounded-full py-3.5 text-[12px] font-bold active:scale-[0.97]">Cancelar</button><button onClick={onConfirm} className="flex-1 bg-black text-white rounded-full py-3.5 text-[12px] font-bold active:scale-[0.97]">Remover</button></div>
            </div>
        </div>
    );
}

function FormaSelect({ value, onChange, disabled }: { value: string, onChange: (v: any) => void, disabled?: boolean }) {
    const [open, setOpen] = useState(false);
    const ops = [{ id: "dinheiro", label: "Dinheiro", icon: "💵" },{ id: "transferencia", label: "Transferência", icon: "🏦" },{ id: "tpa", label: "TPA", icon: "💳" },];
    const atual = ops.find(o => o.id === value) || ops[0];
    return (
        <div className="relative flex-1">
            <button disabled={disabled} onClick={() =>!disabled && setOpen(!open)} className="w-full bg-[#F5F7FB] border border-black/5 rounded-full px-4 py-3 text-[12px] font-bold flex items-center justify-between gap-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all">
                <span className="flex items-center gap-2"><span>{atual.icon}</span>{atual.label}</span><span className={`text-[10px] transition-transform ${open? "rotate-180" : ""}`}>▼</span>
            </button>
            {open && (<><div className="fixed inset-0 z-20" onClick={() => setOpen(false)} /><div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-30 bg-white border border-black/10 rounded-[16px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-1.5 overflow-hidden">{ops.map(op => (<button key={op.id} onClick={() => { onChange(op.id); setOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-full text-[12px] font-bold flex items-center gap-2 transition-colors ${value === op.id? "bg-black text-white" : "hover:bg-black/[0.06] text-black"}`}><span>{op.icon}</span>{op.label}</button>))}</div></>)}
        </div>
    );
}

export function CarrinhoSection({ cart, total, mesaSelecionada, onAddMesa, onLimparMesa, forma, setForma, setShowPay, setRecebido, finalizando, pedidoQrAtivo, fecharMesaAtiva, onRemoveItem }: any) {
    const isMesa =!!mesaSelecionada;
    const isQr =!!pedidoQrAtivo;
    const isFechar =!!fecharMesaAtiva;
    const [itemParaRemover, setItemParaRemover] = useState<any>(null);

    const groupedCart = useMemo(() => {
        const map = new Map<string, any>();
        for (const c of cart) {
            const key = String(c.id);
            if (map.has(key)) {
                map.get(key).qtd = Number(map.get(key).qtd) + Number(c.qtd);
            } else {
                map.set(key, {...c, qtd: Number(c.qtd) });
            }
        }
        return Array.from(map.values());
    }, [cart]);

    const totalAgrupado = useMemo(() => {
        return groupedCart.reduce((s, i) => s + Number(i.price) * Number(i.qtd), 0);
    }, [groupedCart]);

    const temItens = groupedCart.length > 0;

    return (
        <>
            <div className="w-full h-full bg-white flex flex-col overflow-hidden">
                <div className="p-3 flex justify-between items-start border-b shrink-0 bg-white">
                    <div>
                        <p className="font-black text-[13px]">{isFechar? `MESA ${fecharMesaAtiva.mesa_numero}` : isMesa? "Cliente" : "Seu pedido"}</p>
                        {isMesa && <p className="text-[11px] text-amber-600">{isFechar? "Fechando conta" : isQr? `${pedidoQrAtivo.cliente_nome} • pendente` : 'pendente'}</p>}
                    </div>
                    <span className="text-[11px] bg-black text-white px-3 py-1 rounded-full">{groupedCart.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-white">
                    {groupedCart.length > 0 && (<div className="flex text-[10px] tracking-widest text-zinc-500 px-2 py-2 border-b border-black/10 sticky top-0 bg-white z-10"><span className="w-[28px]">REF</span><span className="flex-1">DESCRIÇÃO</span><span className="w-[36px] text-center">QTD</span><span className="w-[70px] text-right">TOTAL</span></div>)}
                    {groupedCart.length === 0 && <p className="text-center text-[12px] text-gray-400 mt-10 whitespace-pre-line">{isFechar? "Carregando consumo..." : isMesa? "Adicione produtos\npara somar na mesa" : "Dê 2 cliques no produto"}</p>}
                    {groupedCart.map((i: any, idx: number) => {
                        const totalLinha = Number(i.price) * Number(i.qtd);
                        return (
                            <div key={i.id} onDoubleClick={() => { if(!isFechar) setItemParaRemover(i) }} title={isFechar? "" : "Duplo clique para remover"} className={`flex items-start px-2 py-2.5 border-b border-dashed border-black/10 text-[13px] leading-[16px] select-none ${isFechar? "" : "cursor-pointer hover:bg-black/[0.04] transition-colors"}`}>
                                <span className="w-[28px] shrink-0">{idx + 1}</span>
                                <span className="flex-1 pr-2 break-words whitespace-normal">{i.name}</span>
                                <span className="w-[36px] shrink-0 text-center font-bold">{i.qtd}</span>
                                <span className="w-[70px] shrink-0 text-right font-bold">{totalLinha.toLocaleString("de-DE")}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="shrink-0 p-3 border-t bg-white mt-auto">
                    <div className="flex justify-between items-center px-1 pb-2"><span className="text-[13px] font-bold">Kz</span><span className="text-[30px] leading-none text-[#2F4A8A] font-bold">{totalAgrupado.toLocaleString("de-DE")}</span></div>
                    {isFechar? (
                        <div className="flex gap-2">
                            <button onClick={onLimparMesa} className="flex-1 bg-zinc-100 rounded-full py-3 text-[12px] font-bold active:scale-[0.97]">Cancelar</button>
                            <button disabled={!temItens || finalizando} onClick={() => { setRecebido(""); setShowPay(true); }} className="flex-1 bg-black text-white rounded-full py-3 text-[12px] font-black active:scale-[0.97] disabled:opacity-40">{finalizando? "..." : `Fechar Mesa`}</button>
                        </div>
                    ) : isMesa? (
                        <div className="flex gap-2">
                            <button disabled={!temItens} onClick={onLimparMesa} className="flex-1 bg-zinc-100 rounded-full py-3 text-[12px] font-bold active:scale-[0.97] disabled:opacity-40">Cancelar</button>
                            <button disabled={!temItens || finalizando} onClick={onAddMesa} className="flex-1 bg-[#A67C52] text-white rounded-full py-3 text-[12px] font-bold active:scale-[0.97] disabled:bg-zinc-200 disabled:text-zinc-400">{finalizando? "..." : "Adicionar"}</button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <FormaSelect value={forma} onChange={setForma} disabled={!temItens} />
                            <button disabled={!temItens} onClick={() => { setRecebido(""); setShowPay(true); }} className="flex-1 bg-[#2F4A8A] text-white rounded-full py-3 text-[12px] font-bold active:scale-[0.97] disabled:bg-zinc-200 disabled:text-zinc-400">Finalizar</button>
                        </div>
                    )}
                </div>
            </div>
            {itemParaRemover && (<RemoveItemModal item={itemParaRemover} onClose={() => setItemParaRemover(null)} onConfirm={() => { onRemoveItem(itemParaRemover.id); setItemParaRemover(null); }} />)}
        </>
    );
}
