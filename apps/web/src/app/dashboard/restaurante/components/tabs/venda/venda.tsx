"use client";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ProdutosSection } from "./cards/produto";
import { CarrinhoSection } from "./carrinho/carrinho";
import { Toasts, PayModal, ConfirmModal } from "./modals/venda";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const API_BASE = `${API_URL}/api/v1/produtos`;

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
        else setCart([...cart, { id: p.id, name: p.nome, price: Number(p.preco_venda) || 0, img: `${API_URL}${p.imagem_url}` || "", qtd: 1 }]);
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

    useEffect(() => {
        if (!showPay || forma !== "dinheiro") return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setShowPay(false);
            else if (e.key === "Enter") { if (recebidoNum >= total) setShowConfirm(true); }
            else if (e.key === "Backspace") { e.preventDefault(); handleCalc("DEL"); }
            else if (/^[0-9]$/.test(e.key)) handleCalc(e.key);
            else if (e.key === "." || e.key === ",") handleCalc(".");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showPay, forma, recebidoNum, total, recebido]);

    const filteredByCat = activeCat === "All" ? dbProducts : dbProducts.filter((p) => (p.categoria || "").toLowerCase() === activeCat.toLowerCase());

    const imprimirFatura = () => {
        const win = window.open("", "_blank", "width=320,height=600");
        if (!win) return;
        const html = `<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px;color:#000}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%}td{padding:2px 0}</style></head><body><div class="center bold">RESTAURANTE JENATH<br/>NIF: 123456789<br/>Talatona, Luanda<br/>${forma.toUpperCase()}</div><div class="line"></div><div>Data: ${new Date().toLocaleString()}<br/>Mesa: Balcão<br/>Operador: Admin</div><div class="line"></div><table>${cart.map(i => `<tr><td>${i.name} x${i.qtd}</td><td style="text-align:right">Kz ${(i.price * i.qtd).toLocaleString("de-DE")}</td></tr>`).join("")}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${total.toLocaleString("de-DE")}</td></tr>${forma === "dinheiro" ? `<tr><td>Recebido</td><td style="text-align:right">Kz ${recebidoNum.toLocaleString("de-DE")}</td></tr><tr><td class="bold">TROCO</td><td style="text-align:right" class="bold">Kz ${troco.toLocaleString("de-DE")}</td></tr>` : ``}<tr><td>Pagamento</td><td style="text-align:right">${forma}</td></tr></table><div class="line"></div><div class="center">Obrigado pela preferência!<br/>Volte sempre</div><script>window.print(); window.close();</script></body></html>`;
        win.document.write(html); win.document.close();
        setShowConfirm(false); setShowPay(false); setCart([]); setRecebido("");
    };

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
            <PayModal showPay={showPay} setShowPay={setShowPay} total={total} forma={forma} recebido={recebido} recebidoNum={recebidoNum} troco={troco} handleCalc={handleCalc} setShowConfirm={setShowConfirm} />
            <ConfirmModal showConfirm={showConfirm} setShowConfirm={setShowConfirm} total={total} forma={forma} troco={troco} imprimirFatura={imprimirFatura} />
            <style jsx>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
        </div>
    );
}
