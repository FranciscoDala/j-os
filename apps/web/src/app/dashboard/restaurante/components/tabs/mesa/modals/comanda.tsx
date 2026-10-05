"use client";
import { useEffect, useState } from "react";
import { X, Clock, Users, Receipt, Printer, Wallet, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const VENDAS_API = `${API_URL}/api/v1/vendas`;

function getAuthHeaders() {
    const t = typeof window !== "undefined" ? localStorage.getItem("access_token") || localStorage.getItem("token") : null;
    const e = typeof window !== "undefined" ? localStorage.getItem("empresa_id") : null;
    const h: any = {};
    if (t) h["Authorization"] = `Bearer ${t}`;
    if (e) h["X-Empresa-ID"] = e;
    return h;
}

export function MesaComandaModal({ open, mesa, onClose }: any) {
    const [venda, setVenda] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open || !mesa) return;
        const load = async () => {
            setLoading(true);
            try {
                // tenta por venda_atual_id
                if (mesa.venda_atual_id) {
                    const r = await fetch(`${VENDAS_API}/${mesa.venda_atual_id}`, { headers: getAuthHeaders() });
                    if (r.ok) {
                        const v = await r.json();
                        if (v.status === "ABERTA") { setVenda(v); setLoading(false); return; }
                    }
                }
                // fallback: busca por mesa_id
                const rList = await fetch(`${VENDAS_API}/`, { headers: getAuthHeaders() });
                if (rList.ok) {
                    const all = await rList.json();
                    const v = all.find((x: any) => x.mesa_id === mesa.id && x.status === "ABERTA");
                    if (v) { setVenda(v); setLoading(false); return; }
                }
                setVenda(null);
            } catch { setVenda(null); }
            finally { setLoading(false); }
        };
        load();
    }, [open, mesa]);

    if (!open || !mesa) return null;

    const total = Number(venda?.total || mesa.venda_total || 0);
    const min = mesa.aberta_em ? Math.floor((Date.now() - new Date(mesa.aberta_em).getTime()) / 60000) : 0;

    return (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[28px] w-full max-w-[420px] max-h-[85vh] flex flex-col overflow-hidden border shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                {/* Header */}
                <div className="p-6 pb-4 flex justify-between items-start shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-black text-[14px]">{mesa.numero}</div>
                        <div>
                            <h3 className="font-black text-[16px] leading-none">MESA {mesa.numero}</h3>
                            <div className="flex items-center gap-2 text-[11px] font-bold opacity-60 mt-1">
                                <span className="flex items-center gap-1"><Users size={11} /> {mesa.pessoas_atual || 1}p</span>
                                <span className="flex items-center gap-1"><Clock size={11} /> {min} min</span>
                                <span>{mesa.zona}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200"><X size={16} /></button>
                </div>

                {/* Lista de produtos */}
                <div className="flex-1 overflow-y-auto px-6 pb-2">
                    {loading ? (
                        <div className="space-y-3 py-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-2xl bg-zinc-100 animate-pulse" />)}
                        </div>
                    ) : !venda || !venda.itens?.length ? (
                        <div className="py-16 text-center border border-dashed rounded-[20px]">
                            <Receipt className="mx-auto opacity-20" size={28} />
                            <div className="font-black text-[13px] mt-2">Sem consumo ainda</div>
                            <div className="text-[11px] opacity-60 font-bold mt-1">Adicione produtos no PDV</div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {venda.itens.map((it: any) => (
                                <div key={it.id} className="flex justify-between items-center p-3 rounded-2xl bg-[#F5F5F4] border border-black/5">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-[12px] truncate">{it.nome_produto || it.produto_nome}</div>
                                        <div className="text-[11px] opacity-60 font-bold">{Number(it.quantidade)} x Kz {Number(it.preco_unit).toLocaleString("de-DE")}</div>
                                        {it.observacao && <div className="text-[10px] opacity-50 italic">{it.observacao}</div>}
                                    </div>
                                    <div className="text-right ml-3">
                                        <div className="font-black text-[12px]">Kz {Number(it.total).toLocaleString("de-DE")}</div>
                                        <div className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold inline-block mt-0.5
                      ${it.status === 'PENDENTE' ? 'bg-amber-100 text-amber-700' : it.status === 'EM_PREPARO' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {it.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t bg-zinc-50 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-[11px] font-black opacity-60 tracking-widest">TOTAL CONSUMO</span>
                        <span className="text-[22px] font-black tracking-tight">Kz {total.toLocaleString("de-DE")}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                const win = window.open("", "_blank", "width=320,height=600");
                                if (!win || !venda) return;
                                const html = venda.itens.map((i: any) => `<tr><td>${i.nome_produto} x${i.quantidade}</td><td style="text-align:right">Kz ${Number(i.total).toLocaleString("de-DE")}</td></tr>`).join("");
                                win.document.write(`<html><body style="font-family:monospace;padding:10px;width:80mm"><div style="text-align:center;font-weight:bold">CONTA MESA ${mesa.numero}</div><hr/><table style="width:100%">${html}</table><hr/><div style="font-weight:bold">TOTAL Kz ${total.toLocaleString("de-DE")}</div><script>window.print();window.close();</script></body></html>`);
                                win.document.close();
                            }}
                            className="h-11 rounded-full bg-white border text-[11px] font-bold flex items-center justify-center gap-1"
                        >
                            <Printer size={14} /> Conta
                        </button>
                        <button onClick={onClose} className="h-11 rounded-full bg-black text-white text-[11px] font-black">
                            FECHAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
