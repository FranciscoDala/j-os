"use client";
import { useEffect, useState } from "react";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
function getHeaders() { return { "Authorization": `Bearer ${localStorage.getItem("access_token") || localStorage.getItem("token")}`, "X-Empresa-ID": localStorage.getItem("empresa_id") || "" } as any; }

export function PedidosQrPendentes({ onAprovado }: { onAprovado: () => void }) {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const fetchPend = async () => {
        const r = await fetch(`${API_URL}/api/v1/pedidos-qr/pendentes`, { headers: getHeaders() });
        if (r.ok) setPedidos(await r.json());
    };
    useEffect(() => { fetchPend(); const id = setInterval(fetchPend, 5000); return () => clearInterval(id); }, []);

    const aprovar = async (id: string) => {
        await fetch(`${API_URL}/api/v1/pedidos-qr/${id}/aprovar`, { method: "POST", headers: getHeaders() });
        fetchPend(); onAprovado();
    };
    const recusar = async (id: string) => {
        await fetch(`${API_URL}/api/v1/pedidos-qr/${id}/recusar`, { method: "POST", headers: getHeaders() });
        fetchPend();
    };

    if (pedidos.length === 0) return null;
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-3 mb-3">
            <h3 className="font-black text-[12px] mb-2">🔔 {pedidos.length} pedidos via QR aguardando</h3>
            <div className="space-y-2">
                {pedidos.map(p => (
                    <div key={p.id} className="bg-white rounded-xl p-3 flex justify-between items-center border">
                        <div><div className="font-bold text-[13px]">MESA {p.mesa_numero} - {p.cliente_nome}</div><div className="text-[11px] text-zinc-500">{p.itens.map((i: any) => `${i.quantidade}x ${i.nome}`).join(", ")} • Kz {Number(p.total_estimado).toLocaleString("de-DE")}</div></div>
                        <div className="flex gap-2"><button onClick={() => recusar(p.id)} className="w-8 h-8 bg-red-100 rounded-full text-red-600">✕</button><button onClick={() => aprovar(p.id)} className="w-8 h-8 bg-green-600 text-white rounded-full">✓</button></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
