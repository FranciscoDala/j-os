"use client";
import { Search, SlidersHorizontal, X, Plus } from "lucide-react";
import { RefObject } from "react";
import { ProdutoCard } from "../../produto/cards/produto";

type Props = {
    dbProducts: any[]; filteredByCat: any[]; loadingProd: boolean; cats: string[]; activeCat: string; setActiveCat: (v: string) => void;
    searchV: string; setSearchV: (v: string) => void; showSearch: boolean; setShowSearch: (v: boolean) => void; searchRef: RefObject<HTMLInputElement | null>;
    getQty: (id: string) => number; getStockState: (p: any) => string; add: (p: any) => void;
    modoMesa: boolean; mesasOcupadas: any[]; loadingMesas: boolean; mesaSelecionada: any; onSelectMesa: (m: any) => void; fetchMesas: () => void;
    cart: any[]; cartTotal: number; onFecharMesa: (mesa: any) => void; onImprimirConta: (mesa: any) => void;
    pedidoQrAtivo?: any;
    mostrarCatalogoExtra?: boolean;
    setMostrarCatalogoExtra?: (v: boolean) => void;
};

export function ProdutosSection({ filteredByCat, loadingProd, cats, activeCat, setActiveCat, searchV, setSearchV, showSearch, setShowSearch, searchRef, getQty, add, pedidoQrAtivo, mostrarCatalogoExtra, setMostrarCatalogoExtra }: Props) {
    const isQrOnly =!!pedidoQrAtivo &&!mostrarCatalogoExtra;

    const handleOpenSearch = () => {
        setShowSearch(true);
        setTimeout(()=> searchRef.current?.focus(), 80);
    };

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {isQrOnly? (
                <>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black tracking-widest text-zinc-400">{filteredByCat.length} ITENS</span>
                        <button onClick={()=>setMostrarCatalogoExtra?.(true)} className="h-8 px-3.5 rounded-full bg-black text-white text-[11px] font-black flex items-center gap-1"><Plus size={11}/> Adicionar produto</button>
                    </div>
                    {loadingProd? <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-[14px] h-[140px] animate-pulse border" />)}</div> :
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                            {filteredByCat.map((p: any) => (<ProdutoCard key={p.id} p={p} cartQty={getQty(p.id)} onAdd={add} />))}
                        </div>
                    }
                </>
            ) : (
                <>
                    {/* CATEGORIAS ESQUERDA - UM POUCO MAIORES + BUSCA DIREITA MAIOR */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex-1 min-w-0">
                            {cats.map(c => (
                                <button key={c} onClick={() => setActiveCat(c)} className={`whitespace-nowrap px-3.5 h-8 rounded-full text-[11px] border font-bold leading-none transition-all ${activeCat === c? "bg-black text-white border-black shadow-sm" : "bg-white text-zinc-700 border-[#E8DCCF] hover:border-black"}`}>{c}</button>
                            ))}
                            <button className="w-8 h-8 rounded-full bg-white border border-[#E8DCCF] flex items-center justify-center shrink-0"><SlidersHorizontal size={12} /></button>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            {pedidoQrAtivo && mostrarCatalogoExtra && (
                                <button onClick={()=>setMostrarCatalogoExtra?.(false)} className="h-8 px-3 rounded-full bg-zinc-100 text-[11px] font-bold">Voltar</button>
                            )}
                            {!showSearch? (
                                <button onClick={handleOpenSearch} className="w-9 h-9 bg-white border border-[#E8DCCF] rounded-full flex items-center justify-center shadow-sm hover:border-black transition-all"><Search size={14} className="text-zinc-600" /></button>
                            ) : (
                                <div className="relative w-[380px] max-w-[42vw]">
                                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input ref={searchRef} value={searchV} onChange={e => setSearchV(e.target.value)} placeholder="Buscar produto..." autoFocus className="w-full h-9 bg-white rounded-full pl-10 pr-9 text-[12px] font-bold outline-none border border-black shadow-sm focus:ring-2 focus:ring-black/10" />
                                    <button onClick={() => { setSearchV(""); setShowSearch(false); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-100 hover:bg-black hover:text-white rounded-full flex items-center justify-center transition-colors"><X size={12} /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {cats.map(c => <button key={c} onClick={() => setActiveCat(c)} className={`whitespace-nowrap px-3 h-8 rounded-full text-[11px] border font-bold shrink-0 ${activeCat === c? "bg-black text-white border-black" : "bg-white border-[#E8DCCF]"}`}>{c}</button>)}
                    </div>

                    {pedidoQrAtivo && mostrarCatalogoExtra && (
                        <div className="mb-2 text-[11px] font-bold">Adicionando extra na Mesa {pedidoQrAtivo.mesa_numero}</div>
                    )}

                    {loadingProd? <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">{[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-[14px] h-[140px] animate-pulse border" />)}</div> :
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                            {filteredByCat.map((p: any) => (<ProdutoCard key={p.id} p={p} cartQty={getQty(p.id)} onAdd={add} />))}
                        </div>
                    }
                </>
            )}
        </div>
    );
}
