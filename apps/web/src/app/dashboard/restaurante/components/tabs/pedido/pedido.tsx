"use client";
import { useEffect, useState, useRef } from "react";
import { Utensils, ShoppingBag } from "lucide-react";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { PedidoCard } from "./cards/pedido";
import { PedidoDetalheModal } from "./modals/detalhe";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";

export function PedidosTab() {
    const { setActiveTab } = useDashboard();
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [sel, setSel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const atendendoRef = useRef<string | null>(null);

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

    const atender = (p: any) => {
        if (atendendoRef.current === p.id) return;
        atendendoRef.current = p.id;
        localStorage.setItem("atender_mesa_qr", JSON.stringify(p));
        setActiveTab("vendas");
        setTimeout(()=>{ atendendoRef.current = null; }, 1000);
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

    if (loading) {
        return (
            <div className="w-full space-y-3 md:space-y-4 relative">
                <div className="w-full flex items-center justify-between gap-3">
                    <div className="w-[200px] h-[38px] bg-zinc-100 rounded-full animate-pulse" />
                    <div className="w-10 h-10 bg-zinc-100 rounded-full animate-pulse" />
                </div>
                <div className="grid gap-2.5 md:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <div key={i} className="h-[260px] md:h-[272px] rounded-[22px] bg-zinc-100 animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-3 md:space-y-4 relative">
            <div className="w-full flex items-center justify-between gap-3 px-1 md:px-0">
                <div className="flex items-center gap-2.5 md:gap-3">
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-black rounded-full flex items-center justify-center shadow-sm shrink-0">
                        <Utensils size={15} className="text-white md:w-[16px] md:h-[16px]" />
                    </div>
                    <div className="leading-none">
                        <h2 className="font-black text-[13px] md:text-[13px]">Pedidos QR • {pedidos.length}</h2>
                        <p className="text-[10px] font-bold text-[#8A8A8A] mt-1 flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Tempo real • LIVE
                        </p>
                    </div>
                </div>
            </div>

            {pedidos.length === 0? (
                <div className="w-full py-12 md:py-16 text-center border border-dashed border-[#E8DCCF] rounded-[18px] md:rounded-[22px] bg-white">
                    <ShoppingBag className="mx-auto opacity-30 mb-2" size={28} />
                    <p className="font-black text-[13px]">Nenhum pedido QR</p>
                    <p className="text-[11px] opacity-60 font-bold mt-1">Aguardando pedidos das mesas</p>
                </div>
            ) : (
                <div className="grid gap-2.5 md:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {pedidos.map((p: any) => (
                        <PedidoCard key={p.id} p={p} onAtender={atender} onRecusar={recusar} onDetalhe={setSel} />
                    ))}
                </div>
            )}

            {sel && (
                <PedidoDetalheModal
                    pedido={sel}
                    onClose={() => setSel(null)}
                    onAtender={(pr) => { setSel(null); atender(pr); }}
                    onRecusar={recusar}
                />
            )}
        </div>
    )
}
