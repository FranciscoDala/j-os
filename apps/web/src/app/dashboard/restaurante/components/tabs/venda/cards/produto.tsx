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

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* MODO QR PURO - SEM CATEGORIAS, SEM HEADER GRANDE, SÓ PRODUTOS + BOTÃO FINO */}
            {isQrOnly? (
                <>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black tracking-widest text-zinc-400">{filteredByCat.length} ITENS</span>
                        <button onClick={()=>setMostrarCatalogoExtra?.(true)} className="h-7 px-3 rounded-full bg-black text-white text-[10px] font-black flex items-center gap-1"><Plus size={10}/> Adicionar produto</button>
                    </div>
                    {loadingProd? <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-[14px] h-[140px] animate-pulse border" />)}</div> :
                        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                            {filteredByCat.map((p: any) => (<ProdutoCard key={p.id} p={p} cartQty={getQty(p.id)} onAdd={add} />))}
                        </div>
                    }
                </>
            ) : (
                <>
                    {/* MODO BALCÃO OU ADD EXTRA - COM CATEGORIAS FINAS */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            {!showSearch? (
                                <button onClick={() => setShowSearch(true)} className="w-7 h-7 bg-white border border-[#E8DCCF] rounded-full flex items-center justify-center"><Search size={11} className="text-zinc-500" /></button>
                            ) : (
                                <div className="relative w-[200px]">
                                    <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input ref={searchRef} value={searchV} onChange={e => setSearchV(e.target.value)} onBlur={() => { if (!searchV) setShowSearch(false) }} placeholder="Buscar..." className="w-full h-7 bg-white rounded-full pl-7 pr-6 text-[11px] font-bold outline-none border border-[#E8DCCF]" />
                                    <button onClick={() => { setSearchV(""); setShowSearch(false); }} className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 bg-zinc-100 rounded-full flex items-center justify-center"><X size={8} /></button>
                                </div>
                            )}
                            <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {cats.map(c => <button key={c} onClick={() => setActiveCat(c)} className={`whitespace-nowrap px-2.5 h-7 rounded-full text-[10px] border font-bold leading-none ${activeCat === c? "bg-black text-white border-black" : "bg-white text-zinc-600 border-[#E8DCCF]"}`}>{c}</button>)}
                                <button className="w-7 h-7 rounded-full bg-white border border-[#E8DCCF] flex items-center justify-center shrink-0"><SlidersHorizontal size={10} /></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {pedidoQrAtivo && mostrarCatalogoExtra && (
                                <button onClick={()=>setMostrarCatalogoExtra?.(false)} className="h-7 px-2.5 rounded-full bg-zinc-100 text-[10px] font-bold">Voltar</button>
                            )}
                            <span className="text-[10px] text-zinc-400 font-bold whitespace-nowrap">{filteredByCat.length}</span>
                        </div>
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
