"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Package, ShoppingBag, AlertTriangle } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";

type Notificacao = {
    id: string;
    tipo: "STOCK_BAIXO" | "STOCK_ZERADO" | "PEDIDO_NOVO";
    titulo: string;
    desc: string;
    time: string;
    lida?: boolean;
    avatar?: string;
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
    const [filtro, setFiltro] = useState<"tudo" | "nao_lida">("tudo");
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => setMounted(true), []);

    // Fechar ao clicar fora
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleEsc);
        }, 100);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, [open, onClose]);

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

                if (pedidosCount > 0) {
                    novas.push({
                        id: "pedidos-pendentes",
                        tipo: "PEDIDO_NOVO",
                        titulo: `${pedidosCount} pedido(s) novo(s)`,
                        desc: "Pedidos QR aguardando aprovação",
                        time: "agora",
                        lida: false,
                    });
                }

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
                                    lida: false,
                                });
                            } else if (atual <= minimo) {
                                novas.push({
                                    id: `baixo-${p.id}`,
                                    tipo: "STOCK_BAIXO",
                                    titulo: `${p.nome} com stock baixo`,
                                    desc: `Restam ${atual} de mínimo ${minimo}`,
                                    time: "hoje",
                                    lida: false,
                                });
                            }
                        });
                    }
                } catch { }

                setNotificacoes(novas);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [open, pedidosCount]);

    if (!open || !mounted) return null;

    const filtered = filtro === "nao_lida" ? notificacoes.filter(n => !n.lida) : notificacoes;

    const getAvatar = (tipo: string) => {
        if (tipo === "STOCK_ZERADO") return { bg: "bg-red-500", icon: <Package size={16} /> };
        if (tipo === "STOCK_BAIXO") return { bg: "bg-amber-500", icon: <AlertTriangle size={16} /> };
        return { bg: "bg-black", icon: <ShoppingBag size={16} /> };
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            {/* Dropdown estilo Facebook - canto direito */}
            <div
                ref={ref}
                className="pointer-events-auto absolute top-[58px] right-2 md:right-4 w-[360px] max-w-[calc(100vw-16px)] bg-white rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.20)] border border-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            >
                {/* HEADER */}
                <div className="p-4 pb-2 flex justify-between items-center">
                    <h2 className="text-[20px] font-black text-black tracking-tight">Notificações</h2>
                    <button className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center">
                        <span className="text-[18px]">•••</span>
                    </button>
                </div>

                {/* TABS - Igual Facebook */}
                <div className="px-4 flex gap-2">
                    <button
                        onClick={() => setFiltro("tudo")}
                        className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-all ${filtro === "tudo" ? "bg-[#E7F3FF] text-[#0064D1]" : "bg-transparent text-zinc-600 hover:bg-zinc-100"}`}
                    >
                        Tudo
                    </button>
                    <button
                        onClick={() => setFiltro("nao_lida")}
                        className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-all ${filtro === "nao_lida" ? "bg-[#E7F3FF] text-[#0064D1]" : "bg-transparent text-zinc-600 hover:bg-zinc-100"}`}
                    >
                        Não lida(s)
                    </button>
                </div>

                <div className="px-4 mt-3 flex justify-between items-center">
                    <p className="text-[15px] font-bold text-black">Novas</p>
                    <button onClick={() => { }} className="text-[12px] text-[#0064D1] font-medium hover:bg-[#F0F2F5] px-2 py-1 rounded">Ver tudo</button>
                </div>

                {/* LISTA */}
                <div className="mt-2 max-h-[60vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {loading ? (
                        <div className="p-8 text-center"><div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-[13px] font-bold text-zinc-500">Nenhuma notificação</p>
                        </div>
                    ) : (
                        <div className="pb-2">
                            {filtered.map((n) => {
                                const av = getAvatar(n.tipo);
                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => {
                                            if (n.tipo === "PEDIDO_NOVO" && onGoPedidos) { onClose(); onGoPedidos(); }
                                        }}
                                        className="w-full text-left flex gap-3 px-4 py-2.5 hover:bg-[#F2F4F7] transition-colors group"
                                    >
                                        <div className="relative shrink-0">
                                            <div className={`w-14 h-14 rounded-full ${av.bg} text-white flex items-center justify-center`}>
                                                {av.icon}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white ${n.tipo === "STOCK_ZERADO" ? "bg-red-500" : n.tipo === "STOCK_BAIXO" ? "bg-amber-500" : "bg-[#0CC06B]"}`}>
                                                <span className="text-[10px]">{n.tipo === "PEDIDO_NOVO" ? "🛒" : "📦"}</span>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <p className="text-[13px] leading-[1.25] text-[#050505]"><span className="font-bold">{n.titulo}</span> <span className="font-normal">{n.desc}</span></p>
                                            <p className="text-[11px] text-[#0064D1] font-medium mt-0.5">{n.time} • J-OS</p>
                                        </div>
                                        {!n.lida && <div className="w-2.5 h-2.5 bg-[#0064D1] rounded-full shrink-0 mt-4" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
