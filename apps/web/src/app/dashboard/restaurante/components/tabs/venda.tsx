"use client";
import { useState } from "react";
import { X, Plus, Minus, ShoppingCart, Search, UtensilsCrossed } from "lucide-react";

export function VendasTab({ onClose }: { onClose: () => void }) {
    const [cart, setCart] = useState<any[]>([
        { id: 1, nome: "Funje com Calulu", preco: 4500, qtd: 1 },
    ]);

    const total = cart.reduce((a, b) => a + b.preco * b.qtd, 0);

    return (
        <div className="h-full w-full flex flex-col bg-[#F8FAFF] no-scrollbar">
            {/* HEADER DO PDV */}
            <div className="h-[64px] md:h-[72px] px-3 md:px-6 flex items-center justify-between border-b border-black/5 shrink-0 bg-white/70 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="w-10 h-10 md:w-11 md:h-11 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition">
                        <X size={18} />
                    </button>
                    <div>
                        <h1 className="text-[16px] md:text-[18px] font-black leading-none flex items-center gap-2"><UtensilsCrossed size={18} /> PDV - Vendas</h1>
                        <p className="text-[11px] text-gray-500 mt-1">Mesa 04 • Balcão</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex bg-white rounded-full px-4 py-2.5 border border-black/5 items-center gap-2">
                        <Search size={16} className="text-gray-400" /><input placeholder="Buscar produto..." className="outline-none text-[13px] w-[200px] bg-transparent" />
                    </div>
                    <button className="bg-[#FFE86A] text-black rounded-full px-5 py-2.5 text-[13px] font-bold flex items-center gap-2">
                        <ShoppingCart size={16} /> {cart.length}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                {/* PRODUTOS */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-3 md:p-4 bg-[#EEF4FF]/50">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
                        {["Todos", "Pratos", "Bebidas", "Sobremesas"].map((c, i) => (
                            <button key={c} className={`px-5 py-2.5 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 border ${i === 0 ? "bg-[#2F4A8A] text-white border-[#2F4A8A]" : "bg-white border-white/50 text-gray-600"}`}>{c}</button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <button key={i} onClick={() => setCart([...cart, { id: Date.now(), nome: `Prato ${i}`, preco: 3500, qtd: 1 }])} className="bg-white rounded-[18px] p-3 text-left border border-white/60 shadow-sm hover:shadow-md active:scale-[0.98] transition">
                                <div className="h-[90px] bg-[#F1F5F9] rounded-[12px] mb-3 flex items-center justify-center text-3xl">🍛</div>
                                <p className="font-bold text-[13px] truncate">Muamba de Galinha</p>
                                <p className="text-[12px] text-gray-500">4.500 Kz</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* TICKET */}
                <div className="w-full lg:w-[360px] bg-white border-t lg:border-t-0 lg:border-l border-black/5 flex flex-col shrink-0 h-[45dvh] lg:h-auto">
                    <div className="p-4 border-b border-black/5 flex justify-between items-center"><h2 className="font-bold text-[14px]">Ticket</h2><span className="text-[11px] bg-black/5 px-2.5 py-1 rounded-full">{cart.length} itens</span></div>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-[#F8FAFF] rounded-[12px] p-3 border border-black/5">
                                <div className="min-w-0"><p className="font-semibold text-[13px] truncate">{item.nome}</p><p className="text-[11px] text-gray-500">{item.preco.toLocaleString()} Kz</p></div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={() => { const n = [...cart]; if (n[idx].qtd > 1) n[idx].qtd--; setCart(n) }} className="w-7 h-7 bg-white rounded-full border flex items-center justify-center"><Minus size={12} /></button>
                                    <span className="text-[13px] w-5 text-center font-bold">{item.qtd}</span>
                                    <button onClick={() => { const n = [...cart]; n[idx].qtd++; setCart(n) }} className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center"><Plus size={12} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-black/5 bg-white space-y-3">
                        <div className="flex justify-between text-[13px]"><span className="text-gray-500">Subtotal</span><span className="font-bold">{total.toLocaleString()} Kz</span></div>
                        <button className="w-full bg-[#2F4A8A] text-white rounded-full py-3.5 font-bold text-[14px] active:scale-[0.98] transition">Finalizar • {total.toLocaleString()} Kz</button>
                        <button onClick={onClose} className="w-full bg-white border border-black/10 rounded-full py-3 font-medium text-[13px] md:hidden">Sair da Venda</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
