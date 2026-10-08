"use client";
import { useEffect, useState, useRef } from "react";
import { Package, ShoppingBag, AlertTriangle, Ban } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const FALLBACK = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200";

const getImgUrl = (url?: string) => {
  if (!url || url === "null" || url === "undefined" || url.trim() === "") return FALLBACK;
  const u = url.trim();
  if (u.startsWith("blob:")) return u;
  if (u.startsWith("http")) return u;
  if (u.startsWith("/media") || u.startsWith("media")) {
    return u.startsWith("/")? `${API_URL}${u}` : `${API_URL}/${u}`;
  }
  if (u.startsWith("/")) return `${API_URL}${u}`;
  return u;
};

const getProdutoImg = (p: any): string => {
  const raw =
    p?.imagem_url ||
    p?.imagem ||
    p?.image_url ||
    p?.foto_url ||
    p?.foto ||
    p?.produto_imagem_url ||
    p?.produto?.imagem_url ||
    p?.produto?.imagem ||
    "";
  return raw? raw : "";
};

type Notificacao = {
  id: string;
  tipo: "STOCK_BAIXO" | "STOCK_ZERADO" | "PEDIDO_NOVO" | "CAIXA_SANGRIA" | "CAIXA_SUPRIMENTO";
  titulo: string;
  desc: string;
  time: string;
  lida?: boolean;
  produto_id?: string;
  imagem_url?: string;
  imagens?: string[];
};

interface Props {
  open: boolean;
  onClose: () => void;
  pedidosCount: number;
  stockAlerts?: any[];
  onGoPedidos?: () => void;
  onGoProdutos?: () => void;
}

export function NotificationsModal({ open, onClose, pedidosCount, stockAlerts = [], onGoPedidos, onGoProdutos }: Props) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [filtro, setFiltro] = useState<"tudo" | "nao_lida">("tudo");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#btn-notif') || target.closest('#notif-dropdown')) return;
      onClose();
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }, 50);
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
          try {
            const r = await fetch(`${API_BASE.replace('/produtos','')}/pedidos-qr/pendentes`, { headers, cache: "no-store" as any });
            if (r.ok) {
              const pedidos = await r.json();
              if (Array.isArray(pedidos) && pedidos.length > 0) {
                const todasImgs: string[] = [];
                pedidos.forEach((ped: any) => {
                  (ped.itens || ped.produtos || []).forEach((it: any) => {
                    const img = getProdutoImg(it);
                    if (img) todasImgs.push(img);
                  });
                });
                const primeiro = pedidos[0];
                const itens = primeiro.itens || primeiro.produtos || [];
                const qtdItens = itens.reduce((s: number, it: any) => s + Number(it.quantidade || it.qtd || 1), 0);
                novas.push({
                  id: "pedidos-pendentes",
                  tipo: "PEDIDO_NOVO",
                  titulo: `${pedidosCount} pedido(s) novo(s)`,
                  desc: qtdItens > 1? `${itens[0]?.produto_nome || itens[0]?.nome || 'Pedido'} +${qtdItens-1} itens` : "Pedidos QR aguardando aprovação",
                  time: "agora",
                  lida: false,
                  imagem_url: todasImgs[0] || "",
                  imagens: todasImgs.slice(0, 3),
                });
              } else {
                novas.push({ id: "pedidos-pendentes", tipo: "PEDIDO_NOVO", titulo: `${pedidosCount} pedido(s) novo(s)`, desc: "Pedidos QR aguardando aprovação", time: "agora", lida: false });
              }
            }
          } catch {
            novas.push({ id: "pedidos-pendentes", tipo: "PEDIDO_NOVO", titulo: `${pedidosCount} pedido(s) novo(s)`, desc: "Pedidos QR aguardando aprovação", time: "agora", lida: false });
          }
        }

        if (stockAlerts && stockAlerts.length > 0) {
          stockAlerts.forEach((p: any) => {
            const atual = Number(p.estoque?? p.stock_atual?? p.quantidade?? 0);
            const isZero = atual <= 0;
            novas.push({
              id: isZero? `zero-${p.id}` : `baixo-${p.id}`,
              tipo: isZero? "STOCK_ZERADO" : "STOCK_BAIXO",
              titulo: isZero? `${p.nome} zerado` : `${p.nome} stock baixo`,
              desc: isZero? `Stock em 0` : `Restam ${atual}`,
              time: "agora",
              lida: false,
              produto_id: p.id,
              imagem_url: getProdutoImg(p),
            });
          });
        } else {
          try {
            const r = await fetch(`${API_BASE}/produtos/alerta/stock-baixo`, { headers, cache: "no-store" as any });
            if (r.ok) {
              const data = await r.json();
              (data || []).forEach((p: any) => {
                const atual = Number(p.stock_atual || p.estoque || 0);
                novas.push({
                  id: atual === 0? `zero-${p.id}` : `baixo-${p.id}`,
                  tipo: atual === 0? "STOCK_ZERADO" : "STOCK_BAIXO",
                  titulo: atual === 0? `${p.nome} zerado` : `${p.nome} stock baixo`,
                  desc: atual === 0? `Stock em 0` : `Restam ${atual}`,
                  time: "hoje",
                  lida: false,
                  produto_id: p.id,
                  imagem_url: getProdutoImg(p),
                });
              });
            }
          } catch {}
        }

        setNotificacoes(novas);
      } finally { setLoading(false); }
    };
    load();
  }, [open, pedidosCount, stockAlerts]);

  useEffect(() => {
    if (!open) return;
    const onBaixo = (e: any) => {
      const p = e.detail?.data || e.detail;
      if (!p?.id) return;
      const img = getProdutoImg(p);
      setNotificacoes(prev => {
        const id = `baixo-${p.id}`;
        if (prev.some(n => n.id === id || n.id === `zero-${p.id}`)) {
          return prev.map(n => n.produto_id === p.id || n.id.includes(p.id)? {...n, titulo: `${p.nome} stock baixo`, desc: `Restam ${p.estoque?? p.stock_atual}`, time: "agora", imagem_url: img || n.imagem_url } : n);
        }
        return [{ id, tipo: "STOCK_BAIXO", titulo: `${p.nome} stock baixo`, desc: `Restam ${p.estoque?? p.stock_atual}`, time: "agora", lida: false, produto_id: p.id, imagem_url: img },...prev];
      });
    };
    const onZerado = (e: any) => {
      const p = e.detail?.data || e.detail;
      if (!p?.id) return;
      const img = getProdutoImg(p);
      setNotificacoes(prev => {
        const id = `zero-${p.id}`;
        const filtered = prev.filter(n => n.id!== `baixo-${p.id}`);
        if (filtered.some(n => n.id === id)) {
          return filtered.map(n => n.id === id? {...n, titulo: `${p.nome} zerado`, desc: `Stock em 0`, time: "agora", imagem_url: img || n.imagem_url } : n);
        }
        return [{ id, tipo: "STOCK_ZERADO", titulo: `${p.nome} zerado`, desc: `Stock em 0`, time: "agora", lida: false, produto_id: p.id, imagem_url: img },...filtered];
      });
    };
    const onPedido = (e: any) => {
      const p = e.detail?.data || e.detail;
      if (!p?.id &&!p?.pedido_id) return;
      const realId = p.id || p.pedido_id;
      const itens = p.itens || p.produtos || [];
      const imgs = itens.map((it: any) => getProdutoImg(it)).filter(Boolean);
      const imgPrincipal = getProdutoImg(p) || imgs[0] || p.imagem_url || p.imagens?.[0] || "";
      setNotificacoes(prev => {
        if (prev.some(n => n.id === `pedido-${realId}` || n.id === "pedidos-pendentes")) return prev;
        return [{
          id: `pedido-${realId}`,
          tipo: "PEDIDO_NOVO",
          titulo: `Novo pedido - Mesa ${p.mesa_numero || p.mesa || ''}`,
          desc: `${p.cliente_nome || p.cliente || 'Cliente'} - ${p.qtd_itens || itens.length || ''} itens`,
          time: "agora",
          lida: false,
          imagem_url: imgPrincipal,
          imagens: imgs.length? imgs.slice(0, 3) : (p.imagens || []),
        },...prev];
      });
    };

    window.addEventListener("produto:estoque_baixo" as any, onBaixo);
    window.addEventListener("produto:zerado" as any, onZerado);
    window.addEventListener("pedido_qr:novo" as any, onPedido);
    window.addEventListener("notificacao:nova" as any, (e: any) => {
      const d = e.detail?.data || e.detail;
      if (!d) return;
      if (d?.tipo === "PEDIDO_QR" || d?.tipo === "PEDIDO_NOVO" || d?.mesa_numero) onPedido(e);
      if (d?.tipo === "STOCK_BAIXO") onBaixo(e);
      if (d?.tipo === "STOCK_ZERADO") onZerado(e);
    });
    return () => {
      window.removeEventListener("produto:estoque_baixo" as any, onBaixo);
      window.removeEventListener("produto:zerado" as any, onZerado);
      window.removeEventListener("pedido_qr:novo" as any, onPedido);
    };
  }, [open]);

  if (!open) return null;
  const filtered = filtro === "nao_lida"? notificacoes.filter(n =>!n.lida) : notificacoes;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[9998] md:hidden" onClick={onClose} />
      <div id="notif-dropdown" ref={ref} className="fixed md:absolute top-[64px] md:top-[calc(100%+12px)] left-1/2 md:left-auto right-auto md:right-0 -translate-x-1/2 md:translate-x-0 w-[92vw] md:w-[380px] max-w-[380px] bg-white rounded-[20px] md:rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.20)] border border-black/5 overflow-hidden z-[9999]">
        <div className="hidden md:block absolute -top-[6px] right-[14px] w-3 h-3 bg-white rotate-45 border-l border-t border-black/5" />
        <div className="p-4 pb-2 flex justify-between items-center">
          <h2 className="text-[18px] md:text-[20px] font-black tracking-tight">Notificações</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center">•••</button>
        </div>
        <div className="px-4 flex gap-2">
          <button onClick={() => setFiltro("tudo")} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${filtro === "tudo"? "bg-[#E7F3FF] text-[#0064D1]" : "bg-zinc-100 text-zinc-600"}`}>Tudo</button>
          <button onClick={() => setFiltro("nao_lida")} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${filtro === "nao_lida"? "bg-[#E7F3FF] text-[#0064D1]" : "bg-zinc-100 text-zinc-600"}`}>Não lida(s)</button>
        </div>
        <div className="px-4 mt-3 flex justify-between items-center">
          <p className="text-[14px] font-bold">Novas</p>
          <button onClick={() => setNotificacoes(n => n.map(x => ({...x, lida: true })))} className="text-[12px] text-[#0064D1] font-medium">Marcar como lidas</button>
        </div>

        <div className="mt-2 max-h-[65vh] md:max-h-[60vh] overflow-y-auto">
          {loading? (
            <div className="p-8 text-center"><div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0? (
            <div className="p-10 text-center"><p className="text-[13px] font-bold text-zinc-500">Nenhuma notificação</p></div>
          ) : (
            <div className="pb-2">
              {filtered.map((n) => {
                const isZerado = n.tipo === "STOCK_ZERADO";
                const isBaixo = n.tipo === "STOCK_BAIXO";
                const isPedido = n.tipo === "PEDIDO_NOVO";
                const hasImg =!!getProdutoImg(n) ||!!n.imagem_url;

                const border = isZerado? "border-[#FF3B30]" : isBaixo? "border-[#FF9500]" : "border-black";
                const badge = isZerado? "bg-[#FF3B30]" : isBaixo? "bg-[#FF9500]" : "bg-[#0CC06B]";
                const dot = isZerado? "bg-[#FF3B30]" : isBaixo? "bg-[#FF9500]" : "bg-[#0064D1]";
                const timeColor = isZerado? "text-[#FF3B30]" : isBaixo? "text-[#FF9500]" : "text-[#0064D1]";

                return (
                  <button key={n.id} onClick={() => {
                    if (isPedido && onGoPedidos) { onClose(); onGoPedidos(); }
                    else if ((isBaixo || isZerado) && onGoProdutos) { onClose(); onGoProdutos(); }
                  }} className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-[#F2F4F7] ${isZerado? "bg-[#FFF1F0]" : isBaixo? "bg-[#FFF8E1]" : ""} transition-colors`}>
                    <div className="relative shrink-0">
                      <img
                        src={getImgUrl(n.imagem_url)}
                        className={`w-[52px] h-[52px] rounded-full object-cover border-2 ${border} shadow-sm bg-zinc-100`}
                        alt={n.titulo}
                        onError={(e) => { e.currentTarget.src = FALLBACK; }}
                      />
                      {n.imagens && n.imagens.length > 1 && (
                        <img src={getImgUrl(n.imagens[1])} className="absolute -bottom-1 -right-2 w-7 h-7 rounded-full object-cover border-2 border-white shadow bg-zinc-100" alt="" onError={(e) => { (e.currentTarget as any).style.display = 'none'; }} />
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center shadow-sm ${badge} text-white text-[10px]`}>
                        {isPedido? "🛒" : isBaixo? "⚠️" : "🚫"}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[13px] leading-[1.25] text-[#050505]"><span className="font-bold">{n.titulo}</span> <span className="font-normal text-zinc-600"> {n.desc}</span></p>
                      <p className={`text-[11px] font-medium mt-0.5 ${timeColor}`}>{n.time} • J-OS</p>
                    </div>
                    {!n.lida && <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-3 ${dot}`} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
