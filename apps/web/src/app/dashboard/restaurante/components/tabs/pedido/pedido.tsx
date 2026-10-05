"use client";
import { useEffect, useState } from "react";
import { FileText, Check, X, Timer, Utensils, ShoppingBag, User } from "lucide-react";
import { useDashboard } from "@/components/dashboard/Tamplate";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";

function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "agora";
    const min = Math.floor(sec / 60);
    if (min < 60) return min === 1? "há 1min" : `há ${min}min`;
    const h = Math.floor(min / 60); const m = min % 60;
    if (h < 24) return m === 0? (h === 1? "há 1h" : `há ${h}h`) : `há ${h}h ${m}min`;
    return `há ${Math.floor(h / 24)}d`;
}
function safeKz(v: any) { const n = Number(v?? 0); return isNaN(n)? "0" : n.toLocaleString('de-DE'); }

export function PedidosTab() {
    const { setActiveTab } = useDashboard();
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [sel, setSel] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const token = localStorage.getItem("access_token") || "";
            const u = JSON.parse(localStorage.getItem("user") || "{}");
            const emp = u.empresa_id || "";
            const r = await fetch(`${API_URL}/pedidos-qr/pendentes`, { headers: { Authorization: `Bearer ${token}`, "X-Empresa-ID": emp }, cache: "no-store" });
            const data = await r.json();
            if (Array.isArray(data)) setPedidos(data);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => {
        load();
        const id = setInterval(load, 4000);
        // quando a venda realmente adicionar na mesa, remove o card
        const onAprovado = (e: any) => {
            const idAprovado = e.detail?.id;
            if (idAprovado) setPedidos(s => s.filter(x => x.id!== idAprovado));
        };
        window.addEventListener("pedido-qr:aprovado" as any, onAprovado);
        return () => {
            clearInterval(id);
            window.removeEventListener("pedido-qr:aprovado" as any, onAprovado);
        };
    }, []);

    // ATENDER NÃO APROVA MAIS - SÓ LEVA PRA VENDA
    const atender = (p: any) => {
        localStorage.setItem("atender_mesa_qr", JSON.stringify(p));
        setActiveTab("vendas");
    };

    const recusar = async (p: any) => {
        if (!confirm(`Recusar MESA ${p.mesa_numero}?`)) return;
        const token = localStorage.getItem("access_token") || "";
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        const emp = u.empresa_id || "";
        await fetch(`${API_URL}/pedidos-qr/${p.id}/recusar`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "X-Empresa-ID": emp }
        });
        setPedidos(s => s.filter(x => x.id!== p.id));
        setSel(null);
    };

    if (loading) return <div className="bg-white/70 rounded-[18px] p-10 text-center font-bold text-[13px]">Carregando...</div>;

    return (
        <div className="space-y-3">
            <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 border border-white/50 flex justify-between items-center">
                <div className="flex gap-3 items-center"><div className="w-10 h-10 bg-black rounded-full flex items-center justify-center"><Utensils size={18} className="text-white" /></div><div><h2 className="font-black text-[15px]">Pedidos QR • {pedidos.length}</h2><p className="text-[11px] text-zinc-500 font-bold">Tempo real</p></div></div><span className="text-[10px] font-black flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />LIVE</span>
            </div>
            {pedidos.length === 0 && <div className="bg-white/70 rounded-[18px] p-12 text-center border"><ShoppingBag className="mx-auto opacity-30 mb-2" /><p className="font-black text-[14px]">Nenhum pedido</p></div>}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pedidos.map((p: any) => {
                    const totalReal = p.total?? p.valor_total?? 0;
                    return (
                        <div key={p.id} className="bg-white rounded-[22px] border shadow-sm p-4">
                            <div className="flex justify-between items-center">
                                <div className="bg-black text-white text-[11px] font-black px-3.5 py-1.5 rounded-full">MESA {p.mesa_numero}</div>
                                <div className="flex items-center gap-2"><span className="text-[11px] font-bold text-zinc-600 flex items-center gap-1"><Timer size={13} />{timeAgo(p.created_at)}</span><button onClick={() => setSel(p)} className="w-9 h-9 bg-[#F5F7FB] rounded-full flex items-center justify-center"><FileText size={18} /></button></div>
                            </div>
                            <div className="mt-3.5 flex gap-3 items-center"><div className="w-11 h-11 bg-sky-50 border border-sky-100 rounded-full flex items-center justify-center font-black text-sky-700">{p.cliente_nome?.[0]?.toUpperCase()}</div><div className="flex-1 min-w-0"><p className="font-black text-[13px] flex items-center gap-1"><User size={12} />{p.cliente_nome}</p><p className="text-[11px] text-zinc-500">{p.itens?.length} itens • Kz {safeKz(totalReal)}</p></div></div>
                            <div className="mt-3 bg-[#F5F7FB] rounded-[14px] p-3 text-[11px]">{p.itens?.slice(0, 2).map((it: any, i: number) => <div key={i} className="flex justify-between"><span className="font-bold truncate">{it.quantidade}x {it.produto_nome}</span><span>Kz {safeKz(it.subtotal?? it.total?? it.preco_unit * it.quantidade)}</span></div>)}</div>
                            <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                                <button onClick={() => atender(p)} className="bg-black text-white rounded-full py-3.5 font-black text-[12px] flex justify-center gap-2"><Check size={16} />ATENDER</button>
                                <button onClick={() => recusar(p)} className="px-5 bg-red-50 border border-red-100 text-red-600 rounded-full font-black text-[11px] flex items-center justify-center gap-1"><X size={14} /> RECUSAR</button>
                            </div>
                        </div>
                    )
                })}
            </div>
            {sel && <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"><div className="bg-white rounded-[24px] w-full max-w-[400px]"><div className="p-5 border-b flex justify-between"><h3 className="font-black">MESA {sel.mesa_numero}</h3><button onClick={() => setSel(null)} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center"><X size={14} /></button></div><div className="p-4 space-y-2">{sel.itens?.map((it: any, i: number) => <div key={i} className="flex justify-between bg-[#F5F7FB] rounded-[14px] px-4 py-3 text-[13px]"><span>{it.quantidade}x {it.produto_nome}</span><span className="font-black">Kz {safeKz(it.subtotal)}</span></div>)}</div><div className="p-4 grid grid-cols-2 gap-2"><button onClick={() => recusar(sel)} className="bg-red-50 text-red-600 border rounded-full py-3.5 font-black text-[13px]">Recusar</button><button onClick={() => atender(sel)} className="bg-black text-white rounded-full py-3.5 font-black text-[13px]">Atender</button></div></div></div>}
        </div>
    )
}
