"use client";
import { useState } from "react";
import { X, Plus, Minus, Search, Clock3, SlidersHorizontal } from "lucide-react";

const PRODUCTS = [
    { id: 1, name: "Tomato with Tofu Salad", price: 97750, avail: 10, cat: "Main", img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400", discount: "15%" },
    { id: 2, name: "Japanese Chicken Gyoza", price: 81700, avail: 15, cat: "Main", img: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=400", discount: "15%" },
    { id: 3, name: "2pcs of Amazing Avocado", price: 68000, avail: 10, cat: "Appetizer", img: "https://images.unsplash.com/photo-1526948128573-703ee1aeb6f8?q=80&w=400", discount: "" },
    { id: 4, name: "Lettuce with Stuff", price: 170000, avail: 8, cat: "Main", img: "https://images.unsplash.com/photo-1512621776952-a57141f2eefd?q=80&w=400", discount: "15%" },
    { id: 5, name: "Biscuit Mama with Susu", price: 60000, avail: 12, cat: "Dessert", img: "https://images.unsplash.com/photo-1559620192-032c4bc4674e?q=80&w=400", discount: "" },
    { id: 6, name: "Krosang Thats it", price: 78000, avail: 9, cat: "Dessert", img: "https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=400", discount: "" },
    { id: 7, name: "Strawberry Float", price: 45000, avail: 20, cat: "Beverages", img: "https://images.unsplash.com/photo-1488477181946-64290103bbd6?q=80&w=400", discount: "" },
    { id: 8, name: "Healthy Kids Meal", price: 83000, avail: 7, cat: "Kids", img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400", discount: "" },
];

export function VendasTab({ onClose }: { onClose: () => void }) {
    const [activeCat, setActiveCat] = useState("All");
    const [cart, setCart] = useState<any[]>([]);
    const cats = ["All", "Main Course", "Appetizer", "Dessert", "Side Dishes", "Beverages", "Kids"];

    const add = (p: any) => {
        const ex = cart.find(c => c.id === p.id);
        if (ex) setCart(cart.map(c => c.id === p.id ? { ...c, qtd: c.qtd + 1 } : c));
        else setCart([...cart, { ...p, qtd: 1 }]);
    };
    const sub = (p: any) => {
        const ex = cart.find(c => c.id === p.id);
        if (!ex) return;
        if (ex.qtd === 1) setCart(cart.filter(c => c.id !== p.id));
        else setCart(cart.map(c => c.id === p.id ? { ...c, qtd: c.qtd - 1 } : c));
    };
    const getQty = (id: number) => cart.find(c => c.id === id)?.qtd || 0;
    const total = cart.reduce((s, i) => s + i.price * i.qtd, 0);

    const filtered = activeCat === "All" ? PRODUCTS : PRODUCTS.filter(p => p.cat === activeCat || activeCat.includes(p.cat));

    return (
        <div className="h-full w-full flex flex-col bg-[#F5F7FB] overflow-hidden">
            {/* HEADER */}
            <div className="h-[64px] px-4 md:px-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-black/5 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center active:scale-95"><X size={16} /></button>
                    <p className="font-black text-[15px]">Restaurante PDV</p>
                    <span className="hidden md:flex items-center gap-1 text-[11px] bg-black/5 px-3 py-1 rounded-full"><Clock3 size={12} />Ends in 12:10:09</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex bg-[#EEF2F8] rounded-full px-4 py-2.5 items-center gap-2 w-[260px]">
                        <Search size={14} className="text-gray-400" /><input placeholder="Buscar prato..." className="bg-transparent outline-none text-[13px] w-full" />
                    </div>
                    <button onClick={onClose} className="bg-black text-white rounded-full px-4 py-2 text-[12px] font-bold md:hidden">Sair</button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                {/* LISTA PRODUTOS */}
                <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F5F7FB] p-3 md:p-5">

                    {/* Special Discount */}
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-[14px] md:text-[15px]">Special Discount Today</h2>
                        <span className="text-[11px] text-gray-500">Ends in 12:10:09</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
                        {filtered.slice(0, 4).map(p => {
                            const qty = getQty(p.id);
                            return (
                                <div key={p.id} className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-[18px] p-2.5 shadow-sm hover:shadow-md transition-all group">
                                    <div className="relative">
                                        <img src={p.img} alt={p.name} className="w-full h-[110px] md:h-[120px] object-cover rounded-[12px]" style={{ border: '2px solid #ffffff' }} />
                                        <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-md border border-white/50 text-[10px] px-2.5 py-1 rounded-full font-medium shadow-sm">Available: {p.avail}</span>
                                    </div>
                                    <div className="px-1 mt-2.5">
                                        <p className="font-semibold text-[12px] leading-[1.2] line-clamp-2 h-[28px]">{p.name}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <div>
                                                {p.discount && <p className="text-[9px] text-gray-400 line-through">{p.discount}</p>}
                                                <p className="text-[12px] font-black">Rp {p.price.toLocaleString("de-DE")}</p>
                                            </div>
                                            {qty === 0 ? (
                                                <button onClick={() => add(p)} className="bg-black text-white rounded-full px-3.5 py-1.5 text-[11px] font-medium active:scale-95 shadow-sm">Order</button>
                                            ) : (
                                                <div className="flex items-center gap-1 bg-black text-white rounded-full px-1 py-1">
                                                    <button onClick={() => sub(p)} className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center"><Minus size={12} /></button>
                                                    <span className="text-[11px] w-4 text-center">{qty}</span>
                                                    <button onClick={() => add(p)} className="w-5 h-5 bg-white text-black rounded-full flex items-center justify-center"><Plus size={12} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Best Menu */}
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-[14px] md:text-[15px]">Explore Our Best Menu</h2>
                        <button className="text-[11px] font-medium bg-white border border-black/10 px-3 py-1 rounded-full">View All</button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1">
                        {cats.map(c => (
                            <button key={c} onClick={() => setActiveCat(c === "All" ? "All" : c.split(" ")[0])} className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-medium border transition-all shrink-0 ${activeCat.startsWith(c.split(" ")[0]) || c === "All" && activeCat === "All" ? "bg-black text-white border-black shadow" : "bg-white/80 backdrop-blur text-gray-600 border-white/60"}`}>{c}</button>
                        ))}
                        <button className="whitespace-nowrap px-3 py-2 rounded-full bg-white border border-black/10 shrink-0"><SlidersHorizontal size={14} /></button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                        {PRODUCTS.map(p => {
                            const qty = getQty(p.id);
                            return (
                                <div key={`all-${p.id}`} className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[18px] p-2.5 shadow-sm hover:shadow-md transition">
                                    <div className="relative">
                                        <img src={p.img} className="w-full h-[110px] object-cover rounded-[12px] bg-[#F1F5F9]" style={{ border: '2px solid #ffffff' }} alt="" />
                                        <span className="absolute top-2 left-2 bg-white/90 text-[10px] px-2 py-1 rounded-full font-medium border border-white/50">Available: {p.avail}</span>
                                    </div>
                                    <p className="font-semibold text-[12px] mt-2.5 px-1 truncate">{p.name}</p>
                                    <div className="flex items-center justify-between mt-2 px-1">
                                        <p className="text-[12px] font-black">Rp {p.price.toLocaleString("de-DE")}</p>
                                        {qty === 0 ? (
                                            <button onClick={() => add(p)} className="border border-black/10 bg-white rounded-full px-3 py-1 text-[11px]">Order</button>
                                        ) : (
                                            <div className="flex items-center gap-1 bg-black text-white rounded-full px-1 py-1">
                                                <button onClick={() => sub(p)} className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center"><Minus size={12} /></button>
                                                <span className="text-[11px] w-4 text-center">{qty}</span>
                                                <button onClick={() => add(p)} className="w-5 h-5 bg-white text-black rounded-full flex items-center justify-center"><Plus size={12} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* TICKET GLASS */}
                <div className="w-full lg:w-[340px] bg-white/90 backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-black/5 flex flex-col h-[42dvh] lg:h-auto shrink-0">
                    <div className="p-4 flex justify-between items-center border-b border-black/5"><p className="font-bold text-[14px]">Seu pedido</p><span className="text-[11px] bg-black text-white px-3 py-1 rounded-full">{cart.length} itens</span></div>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                        {cart.length === 0 && <p className="text-center text-[12px] text-gray-400 mt-10">Nenhum item ainda</p>}
                        {cart.map(i => (
                            <div key={i.id} className="flex gap-3 bg-[#F8FAFF] border border-black/5 rounded-[14px] p-2.5">
                                <img src={i.img} className="w-12 h-12 rounded-[10px] object-cover shrink-0" style={{ border: '2px solid #fff' }} alt="" />
                                <div className="flex-1 min-w-0"><p className="font-semibold text-[12px] truncate">{i.name}</p><p className="text-[11px] text-gray-500">Rp {i.price.toLocaleString("de-DE")} x {i.qtd}</p></div>
                                <p className="font-bold text-[12px] shrink-0">Rp {(i.price * i.qtd).toLocaleString("de-DE")}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-black/5 bg-white/90 backdrop-blur-xl">
                        <div className="flex justify-between text-[12px] mb-3"><span className="text-gray-500">Total</span><span className="font-black text-[15px]">Rp {total.toLocaleString("de-DE")}</span></div>
                        <button className="w-full bg-[#2F4A8A] text-white rounded-full py-3.5 font-bold text-[13px]">Pagar • Rp {total.toLocaleString("de-DE")}</button>
                    </div>
                </div>
            </div>

            <style jsx>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
        </div>
    );
}
