"use client";
export function MesaComandaModal({ open, mesa, onClose }: any) {
    if (!open || !mesa) return null;
    return (<div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-[24px] w-full max-w-[420px] p-6 border"><h3 className="font-black text-[15px]">Comanda • Mesa {mesa.numero}</h3><p className="text-[11px] opacity-60 font-bold mt-1">Venda #{String(mesa.venda_atual_id || "").slice(0, 8)} • {mesa.pessoas_atual} pessoas</p><div className="mt-6 py-10 text-center border-dashed rounded-[18px] text-[12px] font-bold opacity-50">Aqui entra lista de itens + botão fechar conta.<br />Próximo passo: ligar com /vendas/{'{id}'}/itens</div><button onClick={onClose} className="w-full mt-4 h-11 rounded-full bg-black text-white text-[12px] font-black">Fechar</button></div></div>);
}
