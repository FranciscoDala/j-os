"use client";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ProdutosSection } from "./cards/produto";
import { CarrinhoSection } from "./carrinho/carrinho";
import { Toasts, PayModal, ConfirmModal } from "./modals/venda";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const API_BASE = `${API_URL}/api/v1/produtos`;
const VENDAS_API = `${API_URL}/api/v1/vendas`;

type Toast = { id: string; msg: string; type: "success" | "error" | "info" | "warning" };

export function VendasTab({ onClose }: { onClose: () => void }) {
    const [activeCat, setActiveCat] = useState("All");
    const [searchV, setSearchV] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);
    const [dbProducts, setDbProducts] = useState<any[]>([]);
    const [catsDb, setCatsDb] = useState<string[]>([]);
    const [loadingProd, setLoadingProd] = useState(true);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [showPay, setShowPay] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [recebido, setRecebido] = useState("");
    const [forma, setForma] = useState<"dinheiro" | "transferencia" | "tpa">("dinheiro");
    const [finalizando, setFinalizando] = useState(false);
    const [ultimaVenda, setUltimaVenda] = useState<any>(null);

    const pushToast = (msg: string, type: Toast["type"] = "info") => {
        const id = Date.now().toString() + Math.random().toString().slice(2);
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.key === "/" && !(e.target instanceof HTMLInputElement)) || (e.ctrlKey && e.key.toLowerCase() === "k")) {
                e.preventDefault(); setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50);
            }
            if (e.key === "Escape" && showSearch) { setShowSearch(false); setSearchV(""); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showSearch]);

    useEffect(() => { if (showSearch) searchRef.current?.focus(); }, [showSearch]);

    useEffect(() => {
        const fetchReal = async () => {
            setLoadingProd(true);
            try {
                const token = localStorage.getItem("access_token");
                const qs = new URLSearchParams({ skip: "0", limit: "100", search: searchV });
                const r = await fetch(`${API_BASE}/?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await r.json();
                if (r.ok) setDbProducts((data.items || []).filter((p: any) => p.ativo !== false));
            } catch { }
            setLoadingProd(false);
        };
        fetchReal();
    }, [searchV]);

    useEffect(() => {
        const fetchCats = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const r = await fetch(`${API_BASE}/categorias/lista`, { headers: { Authorization: `Bearer ${token}` } });
                if (r.ok) setCatsDb(await r.json());
            } catch { }
        };
        fetchCats();
    }, []);

    // REALTIME CIRÚRGICO - sem fetch, só atualiza o que mudou
    useEffect(() => {
        const onProdutoUpdate = (e: any) => {
            const p = e.detail;
            if (!p?.id) return;
            setDbProducts(prev => prev.map(x => x.id === p.id ? { ...x, ...p, stock_atual: p.stock_atual ?? p.quantidade ?? x.stock_atual } : x));
            setCart(prev => prev.map(c => {
                if (c.id === p.id) {
                    const atual = Number(p.stock_atual ?? p.quantidade ?? 0);
                    if (p.controlar_stock !== false && c.qtd > atual && atual > 0) {
                        pushToast(`Stock de "${p.nome || c.name}" atualizado para ${atual}. Ajustado no carrinho.`, "warning");
                        return { ...c, qtd: atual };
                    }
                }
                return c;
            }).filter(c => c.qtd > 0));
        };
        const onProdutoCreated = (e: any) => {
            const p = e.detail;
            if (!p?.id) return;
            if (p.ativo === false) return;
            if (!searchV || p.nome?.toLowerCase().includes(searchV.toLowerCase())) {
                setDbProducts(prev => {
                    if (prev.some(x => x.id === p.id)) return prev;
                    return [p, ...prev];
                });
            }
        };
        const onVendaNova = (e: any) => {
            const venda = e.detail;
            const itens = venda?.itens || venda?.data?.itens || [];
            if (!itens.length) {
                // se venda:nova veio sem itens, não faz nada aqui (produto:update já cuida)
                return;
            }
            itens.forEach((it: any) => {
                const pid = it.produto_id || it.produto?.id;
                const qtd = Number(it.quantidade || 0);
                setDbProducts(prev => prev.map(p =>
                    p.id === pid && p.controlar_stock
                        ? { ...p, stock_atual: Number(p.stock_atual || 0) - qtd }
                        : p
                ));
            });
        };
        window.addEventListener("produto:update" as any, onProdutoUpdate);
        window.addEventListener("produto:atualizado" as any, onProdutoUpdate);
        window.addEventListener("produto:created" as any, onProdutoCreated);
        window.addEventListener("venda:nova" as any, onVendaNova);
        window.addEventListener("venda:fechada" as any, onVendaNova);
        return () => {
            window.removeEventListener("produto:update" as any, onProdutoUpdate);
            window.removeEventListener("produto:atualizado" as any, onProdutoUpdate);
            window.removeEventListener("produto:created" as any, onProdutoCreated);
            window.removeEventListener("venda:nova" as any, onVendaNova);
            window.removeEventListener("venda:fechada" as any, onVendaNova);
        };
    }, [searchV]);

    const cats = ["All", ...catsDb];
    const getStockState = (p: any) => {
        if (!p.controlar_stock) return "ok";
        const atual = Number(p.stock_atual ?? 0);
        const minimo = Number(p.stock_minimo ?? 0);
        if (atual <= 0) return "zero";
        if (atual <= minimo || atual <= 5) return "low";
        return "ok";
    };

    const add = (p: any) => {
        const state = getStockState(p);
        const atual = Number(p.stock_atual ?? 0);
        const qtyInCart = cart.find(c => c.id === p.id)?.qtd || 0;
        if (state === "zero") { pushToast(`Sem stock: "${p.nome}" está esgotado. Repor stock para continuar a vender.`, "error"); return; }
        if (p.controlar_stock && qtyInCart >= atual) { pushToast(`Stock insuficiente: só temos ${atual} un. de "${p.nome}" disponível.`, "warning"); return; }
        const ex = cart.find((c) => c.id === p.id);
        if (ex) setCart(cart.map((c) => (c.id === p.id ? { ...c, qtd: c.qtd + 1 } : c)));
        else setCart([...cart, { id: p.id, name: p.nome, price: Number(p.preco_venda) || 0, img: p.imagem_url ? `${API_URL}${p.imagem_url}` : "", qtd: 1 }]);
    };

    const getQty = (id: string) => cart.find((c) => c.id === id)?.qtd || 0;
    const total = cart.reduce((s, i) => s + i.price * i.qtd, 0);
    const recebidoNum = recebido ? parseFloat(recebido) : 0;
    const troco = recebidoNum - total;

    const handleCalc = (val: string) => {
        if (val === "C") setRecebido("");
        else if (val === "DEL") setRecebido((s) => s.slice(0, -1));
        else if (val === "00") { if (recebido !== "") setRecebido((s) => s + "00"); }
        else if (val === ".") { if (!recebido.includes(".")) setRecebido((s) => (s === "" ? "0." : s + ".")); }
        else { setRecebido((s) => (s + val).slice(0, 10)); }
    };

    const finalizarVenda = async () => {
        if (cart.length === 0) return;
        if (forma === "dinheiro" && recebidoNum < total) {
            pushToast("Valor recebido insuficiente", "error");
            return;
        }
        setFinalizando(true);
        try {
            const token = localStorage.getItem("access_token");
            const payload = {
                itens: cart.map(c => ({ produto_id: c.id, quantidade: c.qtd })),
                mesa_id: null,
                dinheiro_recebido: forma === "dinheiro" ? recebidoNum : total,
                forma_pagamento: forma.toUpperCase()
            };
            const r = await fetch(`${VENDAS_API}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.detail || "Erro ao finalizar venda");
            setUltimaVenda(data);
            setShowPay(false);
            setShowConfirm(true);
            pushToast(`Venda #${data.numero} finalizada - Kz ${Number(data.total).toLocaleString("de-DE")}`, "success");
            // baixa local também, sem precisar esperar WS
            setDbProducts(prev => prev.map(p => {
                const inCart = cart.find(c => c.id === p.id);
                if (inCart && p.controlar_stock) {
                    return { ...p, stock_atual: Number(p.stock_atual || 0) - inCart.qtd };
                }
                return p;
            }));
        } catch (e: any) {
            pushToast(e.message, "error");
        } finally {
            setFinalizando(false);
        }
    };

    const imprimirFatura = () => {
        const win = window.open("", "_blank", "width=320,height=600");
        if (!win) return;
        const vendaNum = ultimaVenda?.numero ? ` #${ultimaVenda.numero}` : "";
        const html = `<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px;color:#000}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%}td{padding:2px 0}</style></head><body><div class="center bold">RESTAURANTE JENATH${vendaNum}<br/>NIF: 123456789<br/>Talatona, Luanda<br/>${forma.toUpperCase()}</div><div class="line"></div><div>Data: ${new Date().toLocaleString()}<br/>Mesa: Balcão<br/>Operador: Admin</div><div class="line"></div><table>${cart.map(i => `<tr><td>${i.name} x${i.qtd}</td><td style="text-align:right">Kz ${(i.price * i.qtd).toLocaleString("de-DE")}</td></tr>`).join("")}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${total.toLocaleString("de-DE")}</td></tr>${forma === "dinheiro" ? `<tr><td>Recebido</td><td style="text-align:right">Kz ${recebidoNum.toLocaleString("de-DE")}</td></tr><tr><td class="bold">TROCO</td><td style="text-align:right" class="bold">Kz ${troco.toLocaleString("de-DE")}</td></tr>` : ``}<tr><td>Pagamento</td><td style="text-align:right">${forma}</td></tr></table><div class="line"></div><div class="center">Obrigado pela preferência!<br/>Volte sempre</div><script>window.print(); window.close();</script></body></html>`;
        win.document.write(html); win.document.close();
    };

    const aposVenda = (comRecibo: boolean) => {
        if (comRecibo) imprimirFatura();
        setShowConfirm(false); setShowPay(false); setCart([]); setRecebido(""); setUltimaVenda(null);
    };

    useEffect(() => {
        if (!showPay || forma !== "dinheiro") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setShowPay(false);
            else if (e.key === "Enter") { if (recebidoNum >= total) finalizarVenda(); }
            else if (e.key === "Backspace") { e.preventDefault(); handleCalc("DEL"); }
            else if (/^[0-9]$/.test(e.key)) handleCalc(e.key);
            else if (e.key === "." || e.key === ",") handleCalc(".");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showPay, forma, recebidoNum, total, recebido]);

    const filteredByCat = activeCat === "All" ? dbProducts : dbProducts.filter((p) => (p.categoria || "").toLowerCase() === activeCat.toLowerCase());

    return (
        <div className="h-full w-full flex flex-col bg-[#F5F7FB] overflow-hidden relative">
            <Toasts toasts={toasts} setToasts={setToasts} />
            <div className="h-[48px] px-4 flex items-center justify-end bg-white/80 backdrop-blur-xl border-b border-black/5 shrink-0">
                <button onClick={onClose} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center active:scale-95 hover:bg-zinc-800"><X size={16} /></button>
            </div>
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                <ProdutosSection dbProducts={dbProducts} filteredByCat={filteredByCat} loadingProd={loadingProd} cats={cats} activeCat={activeCat} setActiveCat={setActiveCat} searchV={searchV} setSearchV={setSearchV} showSearch={showSearch} setShowSearch={setShowSearch} searchRef={searchRef} getQty={getQty} getStockState={getStockState} add={add} />
                <CarrinhoSection cart={cart} total={total} forma={forma} setForma={setForma} setShowPay={setShowPay} setRecebido={setRecebido} />
            </div>
            <PayModal showPay={showPay} setShowPay={setShowPay} total={total} forma={forma} recebido={recebido} recebidoNum={recebidoNum} troco={troco} handleCalc={handleCalc} setShowConfirm={finalizarVenda} loading={finalizando} />
            <ConfirmModal showConfirm={showConfirm} setShowConfirm={setShowConfirm} total={total} forma={forma} troco={troco} imprimirFatura={() => aposVenda(true)} onSemRecibo={() => aposVenda(false)} vendaNumero={ultimaVenda?.numero} />
            <style jsx>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
        </div>
    );
}
