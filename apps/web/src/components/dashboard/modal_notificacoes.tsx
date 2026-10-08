"use client";
import { useEffect, useState, useRef } from "react";
import { Package, ShoppingBag, AlertTriangle, Ban } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

const getImgUrl = (url?: string) => {
  if (!url || url === "null" || url === "undefined" || url.trim() === "") return "";
  const u = url.trim();
  if (u.startsWith("blob:") || u.startsWith("http")) return u;
  if (u.startsWith("/media") || u.startsWith("media")) return u.startsWith("/")? `${API_URL}${u}` : `${API_URL}/${u}`;
  if (u.startsWith("/")) return `${API_URL}${u}`;
  return u;
};

const getProdutoImg = (p: any): string => {
  return p?.imagem_url || p?.imagem || p?.image_url || p?.produto_imagem_url || p?.produto?.imagem_url || "";
};

type Notificacao = {
  id: string;
  tipo: "STOCK_BAIXO" | "STOCK_ZERADO" | "PEDIDO_NOVO";
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
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('#btn-notif') || t.closest('#notif-dropdown')) return;
      onClose();
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    setTimeout(() => {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onEsc);
    }, 50);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      const token = localStorage.getItem("access_token") || "";
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      const emp = u.empresa_id || localStorage.getItem("empresa_id") || "";
      const headers: any = { Authorization: `Bearer ${token}` };
      if (emp) headers["X-Empresa-ID"] = emp;

      let novas: Notificacao[] = [];

      // 1. PEDIDOS - pega imagem verdadeira do item
      if (pedidosCount > 0) {
        try {
          const r = await fetch(`${API_BASE}/pedidos-qr/pendentes`, { headers, cache: "no-store" as any });
          if (r.ok) {
            const pedidos = await r.json();
            if (Array.isArray(pedidos) && pedidos.length > 0) {
              const todasImgs: string[] = [];
              pedidos.forEach((ped: any) => {
                (ped.itens || []).forEach((it: any) => {
                  const img = getProdutoImg(it);
                  if (img) todasImgs.push(img);
                });
              });
              const primeiro = pedidos[0];
              const itens = primeiro.itens || [];
              novas.push({
                id: "pedidos-pendentes",
                tipo: "PEDIDO_NOVO",
                titulo: `${pedidosCount} pedido(s) novo(s)`,
                desc: "Pedidos QR aguardando aprovação",
                time: "agora",
                lida: false,
                imagem_url: todasImgs[0] || getProdutoImg(itens[0]),
                imagens: todasImgs.slice(0, 3),
              });
            }
          }
        } catch {}
      }

      // 2. STOCK - monta lista sem imagem primeiro
      let stockLista: Notificacao[] = [];
      if (stockAlerts && stockAlerts.length > 0) {
        stockAlerts.forEach((p: any) => {
          const atual = Number(p.estoque?? p.stock_atual?? 0);
          const isZero = atual <= 0;
          stockLista.push({
            id: isZero? `zero-${p.id}` : `baixo-${p.id}`,
            tipo: isZero? "STOCK_ZERADO" : "STOCK_BAIXO",
            titulo: isZero? `${p.nome} zerado` : `${p.nome} stock baixo`,
            desc: isZero? `Stock em 0` : `Restam ${atual}`,
            time: "agora",
            lida: false,
            produto_id: String(p.id),
            imagem_url: getProdutoImg(p), // pode estar vazio, vamos buscar depois
          });
        });
      } else {
        try {
          const r = await fetch(`${API_BASE}/produtos/alerta/stock-baixo`, { headers, cache: "no-store" as any });
          if (r.ok) {
            const data = await r.json();
            (data || []).forEach((p: any) => {
              const atual = Number(p.stock_atual || 0);
              stockLista.push({
                id: atual === 0? `zero-${p.id}` : `baixo-${p.id}`,
                tipo: atual === 0? "STOCK_ZERADO" : "STOCK_BAIXO",
                titulo: atual === 0? `${p.nome} zerado` : `${p.nome} stock baixo`,
                desc: atual === 0? `Stock em 0` : `Restam ${atual}`,
                time: "hoje",
                lida: false,
                produto_id: String(p.id),
                imagem_url: getProdutoImg(p),
              });
            });
          }
        } catch {}
      }

      // 3. ENRIQUECE: se não tem imagem, busca produto real
      const semImagem = stockLista.filter(n =>!n.imagem_url && n.produto_id);
      if (semImagem.length > 0) {
        const enriched = await Promise.all(semImagem.map(async (n) => {
          try {
            const rp = await fetch(`${API_BASE}/produtos/${n.produto_id}`, { headers, cache: "no-store" as any });
            if (rp.ok) {
              const prodReal = await rp.json();
              return {...n, imagem_url: getProdutoImg(prodReal) };
            }
          } catch {}
          return n;
        }));
        const map = new Map(enriched.map(e => [e.produto_id, e.imagem_url]));
        stockLista = stockLista.map(n => n.imagem_url? n : {...n, imagem_url: map.get(n.produto_id) || "" });
      }

      novas = [...novas,...stockLista];
      setNotificacoes(novas);
      setLoading(false);
    };
    load();
  }, [open, pedidosCount, stockAlerts]);

  if (!open) return null;
  const filtered = filtro === "nao_lida"? notificacoes.filter(n =>!n.lida) : notificacoes;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-[9998] md:hidden" onClick={onClose} />
      <div id="notif-dropdown" ref={ref} className="fixed md:absolute top-[64px] md:top-[calc(100%+12px)] left-1/2 md:right-0 -translate-x-1/2 md:translate-x-0 w-[92vw] md:w-[380px] bg-white rounded-[20px] shadow-xl border border-black/5 z-[9999] overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <h2 className="font-black text-[18px]">Notificações</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-zinc-100">•••</button>
        </div>
        <div className="px-4 flex gap-2">
          <button onClick={() => setFiltro("tudo")} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${filtro === "tudo"? "bg-[#E7F3FF] text-[#0064D1]" : "bg-zinc-100"}`}>Tudo</button>
          <button onClick={() => setFiltro("nao_lida")} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${filtro === "nao_lida"? "bg-[#E7F3FF] text-[#0064D1]" : "bg-zinc-100"}`}>Não lida(s)</button>
        </div>
        <div className="px-4 mt-3 flex justify-between">
          <p className="font-bold text-[14px]">Novas</p>
          <button onClick={() => setNotificacoes(n => n.map(x => ({...x, lida: true })))} className="text-[12px] text-[#0064D1]">Marcar como lidas</button>
        </div>

        <div className="mt-2 max-h-[65vh] overflow-y-auto">
          {loading? <div className="p-8 text-center"><div className="w-5 h-5 border-2 border-t-black rounded-full animate-spin mx-auto" /></div> :
            filtered.map((n) => {
              const isZerado = n.tipo === "STOCK_ZERADO";
              const isBaixo = n.tipo === "STOCK_BAIXO";
              const border = isZerado? "border-[#FF3B30]" : isBaixo? "border-[#FF9500]" : "border-black";
              const bg = isZerado? "bg-[#FFF1F0]" : isBaixo? "bg-[#FFF8E6]" : "bg-white";
              const badge = isZerado? "bg-[#FF3B30]" : isBaixo? "bg-[#FF9500]" : "bg-[#0CC06B]";

              return (
                <button key={n.id} onClick={() => { if (n.tipo === "PEDIDO_NOVO" && onGoPedidos) { onClose(); onGoPedidos(); } else if (onGoProdutos) { onClose(); onGoProdutos(); } }}
                  className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-zinc-50 ${bg}`}>
                  <div className="relative shrink-0">
                    {n.imagem_url && getImgUrl(n.imagem_url)? (
                      <img src={getImgUrl(n.imagem_url)} className={`w-[52px] h-[52px] rounded-full object-cover border-2 ${border} bg-zinc-100`} alt={n.titulo} />
                    ) : (
                      <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-white ${isZerado? "bg-[#FF3B30]" : isBaixo? "bg-[#FF9500]" : "bg-black"}`}>
                        {isZerado? <Ban size={20} /> : isBaixo? <AlertTriangle size={20} /> : <ShoppingBag size={20} />}
                      </div>
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white ${badge}`}>
                      {n.tipo === "PEDIDO_NOVO"? "🛒" : isZerado? "🚫" : "⚠️"}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-tight"><span className="font-bold">{n.titulo}</span> <span className="text-zinc-600">{n.desc}</span></p>
                    <p className={`text-[11px] mt-0.5 ${isZerado? "text-[#FF3B30]" : isBaixo? "text-[#FF9500]" : "text-[#0064D1]"}`}>{n.time} • J-OS</p>
                  </div>
                  {!n.lida && <div className={`w-2 h-2 rounded-full mt-3 ${isZerado? "bg-[#FF3B30]" : isBaixo? "bg-[#FF9500]" : "bg-[#0064D1]"}`} />}
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
}
