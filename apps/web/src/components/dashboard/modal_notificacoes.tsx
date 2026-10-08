"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Package, ShoppingBag, Check, Trash2 } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

type Notificacao = {
    id: string;
    tipo: "STOCK_BAIXO" | "STOCK_ZERADO" | "PEDIDO_NOVO";
    titulo: string;
    desc: string;
    time: string;
    lida?: boolean;
};

interface Props {
    open: boolean;
    onClose: () => void;
    pedidosCount: number;
    onGoPedidos?: () => void;
}

export function NotificationsModal({ open, onClose, pedidosCount, onGoPedidos }: Props) {
    const [mounted, setMounted] = useState(false);
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open) return;
        const load = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("access_token") || "";
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                const emp = u.empresa_id || localStorage.getItem("empresa_id") || "";
                const headers: any = { Authorization: `Bearer ${token}` };
                if (emp) headers["X-Empresa-ID"] = emp;

                const novas: Notificacao[] = [];

                // 1. Pedidos pendentes
                if (pedidosCount > 0) {
                    novas.push({
                        id: "pedidos-pendentes",
                        tipo: "PEDIDO_NOVO",
                        titulo: `${pedidosCount} pedido(s) novo(s)`,
                        desc: "Pedidos QR aguardando aprovação",
                        time: "agora",
                    });
                }

                // 2. Produtos stock baixo / zerado - busca segura
                try {
                    const r = await fetch(`${API_BASE}/produtos?limit=100`, { headers, cache: "no-store" as any });
                    if (r.ok) {
                        const data = await r.json();
                        const produtos = Array.isArray(data) ? data : data.items || data.produtos || [];
                        produtos.forEach((p: any) => {
                            if (!p.controlar_stock) return;
                            const atual = Number(p.stock_atual || 0);
                            const minimo = Number(p.stock_minimo || 5);
                            if (atual === 0) {
                                novas.push({
                                    id: `zero-${p.id}`,
                                    tipo: "STOCK_ZERADO",
                                    titulo: `${p.nome} zerado`,
                                    desc: `Stock em 0 - repor urgente`,
                                    time: "hoje",
                                });
                            } else if (atual <= minimo) {
                                novas.push({
                                    id: `baixo-${p.id}`,
                                    tipo: "STOCK_BAIXO",
                                    titulo: `${p.nome} stock baixo`,
                                    desc: `Restam ${atual} de mínimo ${minimo}`,
                                    time: "hoje",
                                });
                            }
                        });
                    }
                } catch { }

                // Se vazio, placeholder informativo
                if (novas.length === 0) {
                    novas.push({
                        id: "empty",
                        tipo: "PEDIDO_NOVO",
                        titulo: "Tudo em dia",
                        desc: "Nenhuma notificação pendente",
                        time: "",
                    });
                }

                setNotificacoes(novas);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [open, pedidosCount]);

    if (!open || !mounted) return null;

    const iconByType = (tipo: string) => {
        if (tipo === "STOCK_ZERADO") return <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"><Package size={14} /></div>;
        if (tipo === "STOCK_BAIXO") return <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center"><AlertTriangle size={14} /></div>;
        return <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center"><ShoppingBag size={14} /></div>;
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-3 md:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={onClose} />
            <div className="relative w-full max-w-[420px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col max-h-[92dvh] overflow-hidden animate-in fade-in zoom-in-95">

                {/* HEADER FIXO */}
                <div className="bg-white m-[6px] rounded-[18px] p-3 flex justify-between items-center border border-black/5 shrink-0">
                    <div>
                        <p className="font-black text-[13px] leading-none text-black">NOTIFICAÇÕES</p>
                        <p className="text-[8px] font-black tracking-widest text-zinc-500 mt-1">{notificacoes.length} ITENS • J-OS</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95"><X size={14} /></button>
                </div>

                {/* CONTEÚDO SCROLL INVISÍVEL */}
                <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    <div className="bg-white m-[6px] mt-0 rounded-[18px] p-2 border border-black/5">
                        {loading ? (
                            <div className="p-6 text-center"><div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto" /></div>
                        ) : (
                            <div className="space-y-1">
                                {notificacoes.map((n) => (
                                    <button
                                        key={n.id}
                                        onClick={() => {
                                            if (n.tipo === "PEDIDO_NOVO" && onGoPedidos) { onClose(); onGoPedidos(); }
                                        }}
                                        className="w-full text-left flex items-start gap-3 p-3 rounded-[16px] hover:bg-[#F5F2ED] border border-transparent hover:border-[#E8DCCF] transition-all"
                                    >
                                        {iconByType(n.tipo)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-black leading-tight truncate">{n.titulo}</p>
                                            <p className="text-[10px] font-bold text-zinc-500 mt-0.5 leading-tight">{n.desc}</p>
                                            {n.time && <p className="text-[8px] font-black tracking-widest text-zinc-400 mt-1">{n.time.toUpperCase()}</p>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER FIXO */}
                <div className="shrink-0 bg-[#EDEBE6] p-[6px] pt-2 border-t border-black/5">
                    <div className="bg-white rounded-[18px] border border-black/5 p-2 flex gap-2">
                        <button onClick={() => setNotificacoes([])} className="flex-1 bg-white border border-black/10 rounded-full py-3 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                            <Trash2 size={12} /> Limpar
                        </button>
                        <button onClick={onClose} className="flex-1 bg-black text-white rounded-full py-3 text-[11px] font-black hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                            <Check size={12} /> Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
