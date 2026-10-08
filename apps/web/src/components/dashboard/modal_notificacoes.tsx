"use client";
import { useEffect, useState, useRef } from "react";
import { ShoppingBag, AlertTriangle, Ban } from "lucide-react";

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

      // PEDIDOS - PEGA IMG DO PRIMEIRO PRODUTO DA LISTA
      if (pedidosCount > 0) {
        try {
          const r = await fetch(`${API_BASE}/pedidos-qr/pendentes`, { headers, cache: "no-store" as any });
          if (r.ok) {
            const pedidos = await r.json();
            if (Array.isArray(pedidos) && pedidos.length > 0) {
              // se tem muitos pedidos, pega a img do primeiro produto do primeiro pedido
              const primeiroPedido = pedidos[0];
              const itensPrimeiro = primeiroPedido.itens || [];
              let imgPrimeiroProduto = "";
              let todasImgs: string[] = [];

              // pega imagem do primeiro produto
              if (itensPrimeiro.length > 0) {
                imgPrimeiroProduto = getProdutoImg(itensPrimeiro[0]);
                // se não tem imagem no item, busca o produto real
                if (!imgPrimeiroProduto && itensPrimeiro[0].produto_id) {
                  try {
                    const rp = await fetch(`${API_BASE}/produtos/${itensPrimeiro[0].produto_id}`, { headers });
                    if (rp.ok) {
                      const prodReal = await rp.json();
                      imgPrimeiroProduto = getProdutoImg(prodReal);
                    }
                  } catch {}
                }
              }

              // coleta todas as imgs dos pedidos pra mostrar stack
              for (const ped of pedidos) {
                for (const it of (ped.itens || [])) {
                  const img = getProdutoImg(it);
                  if (img) todasImgs.push(img);
                  if (todasImgs.length >= 3) break;
                }
                if (todasImgs.length >= 3) break;
              }
              if (!todasImgs[0] && imgPrimeiroProduto) todasImgs = [imgPrimeiroProduto];

              const qtdItens = itensPrimeiro.reduce((s: number, it: any) => s + Number(it.quantidade || 1), 0);

              novas.push({
                id: "pedidos-pendentes",
                tipo: "PEDIDO_NOVO",
                titulo: `${pedidosCount} pedido(s) novo(s)`,
                desc: qtdItens > 1? `${itensPrimeiro[0]?.produto_nome || itensPrimeiro[0]?.nome || 'Pedido'} +${qtdItens - 1} itens` : "Aguardando aprovação",
                time: "agora",
                lida: false,
                imagem_url: imgPrimeiroProduto || todasImgs[0] || "",
                imagens: todasImgs.slice(0, 3),
              });
            }
          }
        } catch (e) {
          console.log("erro pedidos", e);
        }
      }

      // STOCK
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
            imagem_url: getProdutoImg(p),
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

      // enriquece stock sem imagem
      const semImagem = stockLista.filter(n =>!n.imagem_url && n.produto_id);
      if (semImagem.length > 0) {
        const enriched = await Promise.all(semImagem.map(async (n) => {
          try {
            const rp = await fetch(`${API_BASE}/produtos/${n.produto_id}`, { headers });
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

      setNotificacoes([...novas,...stockLista]);
      setLoading(false);
    };
    load();
  }, [open, pedidosCount, stockAlerts]);

  if (!open) return null;
  const filtered = filtro === "nao_lida"? notificacoes.filter(n =>!n.lida) : notificacoes;

  return (
    <>
      {/* overlay mobile */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[9998] md:hidden" onClick={onClose} />

      {/* DESKTOP FIX: absolute dentro do header, não fixed no meio da tela */}
      <div
        id="notif-dropdown"
        ref={ref}
        className="
          fixed left-1/2 top-[64px] -translate-x-1/2 w-[92vw] max-w-[380px]
          md:absolute md:left-auto md:right-0 md:top-[calc(100%+12px)] md:translate-x-0 md:w-[380px]
          bg-white rounded-[20px] md:rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.20)] border border-black/5
          z-[9999] overflow-hidden
        "
      >
        <div className="hidden md:block absolute -top-[6px] right-[18px] w-3 h-3 bg-white rotate-45 border-l border-t border-black/5" />

        <div className="p-4 pb-2 flex justify-between items-center">
          <h2 className="font-black text-[18px] md:text-[20px] tracking-tight">Notificações</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center">•••</button>
        </div>

        <div className="px-4 flex gap-2">
          <button onClick={() => setFiltro("tudo")} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${filtro === "tudo"? "bg-[#E7F3FF] text-[#0064D1]" : "bg-zinc-100 text-zinc-600"}`}>Tudo</button>
          <button onClick={() => setFiltro("nao_lida")} className={`px-3.5 py-1.5 rounded-full text-[13px] font-bold ${filtro === "nao_lida"? "bg-[#E7F3FF] text-[#0064D1]" : "bg-zinc-100 text-zinc-600"}`}>Não lida(s)</button>
        </div>

        <div className="px-4 mt-3 flex justify-between items-center">
          <p className="font-bold text-[14px]">Novas</p>
          <button onClick={() => setNotificacoes(n => n.map(x => ({...x, lida: true })))} className="text-[12px] text-[#0064D1] font-medium">Marcar como lidas</button>
        </div>

        <div className="mt-2 max-h-[60vh] overflow-y-auto">
          {loading? (
            <div className="p-8 text-center"><div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto" /></div>
          ) : filtered.length === 0? (
            <div className="p-10 text-center text-[13px] font-bold text-zinc-500">Nenhuma notificação</div>
          ) : (
            filtered.map((n) => {
              const isZerado = n.tipo === "STOCK_ZERADO";
              const isBaixo = n.tipo === "STOCK_BAIXO";
              const border = isZerado? "border-[#FF3B30]" : isBaixo? "border-[#FF9500]" : "border-black";
              const bg = isZerado? "bg-[#FFF1F0]" : isBaixo? "bg-[#FFF8E6]" : "";
              const badge = isZerado? "bg-[#FF3B30]" : isBaixo? "bg-[#FF9500]" : "bg-[#0CC06B]";

              const imgSrc = getImgUrl(n.imagem_url);

              return (
                <button
                  key={n.id}
                  onClick={() => {
                    if (n.tipo === "PEDIDO_NOVO" && onGoPedidos) { onClose(); onGoPedidos(); }
                    else if (onGoProdutos) { onClose(); onGoProdutos(); }
                  }}
                  className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-[#F2F4F7] ${bg} transition-colors`}
                >
                  <div className="relative shrink-0">
                    {imgSrc? (
                      <img src={imgSrc} className={`w-[52px] h-[52px] rounded-full object-cover border-2 ${border} bg-zinc-100`} alt={n.titulo} />
                    ) : (
                      <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center text-white ${isZerado? "bg-[#FF3B30]" : isBaixo? "bg-[#FF9500]" : "bg-black"}`}>
                        {isZerado? <Ban size={18} /> : isBaixo? <AlertTriangle size={18} /> : <ShoppingBag size={18} />}
                      </div>
                    )}
                    {n.imagens && n.imagens.length > 1 && imgSrc && (
                      <img src={getImgUrl(n.imagens[1])} className="absolute -bottom-1 -right-2 w-7 h-7 rounded-full object-cover border-2 border-white shadow bg-zinc-100" alt="" />
                    )}
                    <div className={`absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white ${badge}`}>
                      {n.tipo === "PEDIDO_NOVO"? "🛒" : isZerado? "🚫" : "⚠️"}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[13px] leading-[1.25] text-[#050505] line-clamp-2"><span className="font-bold">{n.titulo}</span> <span className="font-normal text-zinc-600"> {n.desc}</span></p>
                    <p className={`text-[11px] font-medium mt-1 ${isZerado? "text-[#FF3B30]" : isBaixo? "text-[#FF9500]" : "text-[#0064D1]"}`}>{n.time} • J-OS</p>
                  </div>
                  {!n.lida && <div className={`w-2 h-2 rounded-full mt-3 shrink-0 ${isZerado? "bg-[#FF3B30]" : isBaixo? "bg-[#FF9500]" : "bg-[#0064D1]"}`} />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
