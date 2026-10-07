"use client";
import { useEffect, useState, useMemo } from "react";
import { X, Printer } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const VENDAS_API = `${API_URL}/api/v1/vendas`;

function getAuthHeaders() {
    const t = typeof window!== "undefined"? localStorage.getItem("access_token") || localStorage.getItem("token") : null;
    const e = typeof window!== "undefined"? localStorage.getItem("empresa_id") : null;
    const h: any = {};
    if (t) h["Authorization"] = `Bearer ${t}`;
    if (e) h["X-Empresa-ID"] = e;
    return h;
}

function safeKz(v: any) {
    const n = Number(v?? 0);
    return isNaN(n)? "0" : n.toLocaleString("de-DE");
}

export function MesaComandaModal({ open, mesa, onClose }: any) {
    const [venda, setVenda] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open ||!mesa) return;
        const load = async () => {
            setLoading(true);
            try {
                if (mesa.venda_atual_id) {
                    const r = await fetch(`${VENDAS_API}/${mesa.venda_atual_id}`, { headers: getAuthHeaders() });
                    if (r.ok) {
                        const v = await r.json();
                        if (v.status === "ABERTA") { setVenda(v); setLoading(false); return; }
                    }
                }
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

    // AGRUPA MESMO PRODUTO E MULTIPLICA
    const itensAgrupados = useMemo(() => {
        const raw = venda?.itens || [];
        const map = new Map<string, any>();
        for (const it of raw) {
            const key = `${it.produto_id || it.nome_produto}-${(it.observacao||"").trim().toLowerCase()}`;
            const qtd = Number(it.quantidade || 1);
            const unit = Number(it.preco_unit || it.preco || (it.total / qtd) || 0);
            if (map.has(key)) {
                const ex = map.get(key);
                ex.quantidade += qtd;
                ex.total_linha = ex.quantidade * ex.preco_unit;
            } else {
                map.set(key, {
                    id: it.id || key,
                    nome_produto: it.nome_produto || it.produto_nome || "Produto",
                    quantidade: qtd,
                    preco_unit: unit,
                    total_linha: unit * qtd,
                    observacao: it.observacao || "",
                });
            }
        }
        return Array.from(map.values());
    }, [venda]);

    const total = Number(venda?.total || mesa?.venda_total || 0);

    const imprimirConta = () => {
        if (!venda &&!mesa) return;
        const totalPrint = venda?.total || mesa?.venda_total || 0;
        const win = window.open("", "_blank", "width=320,height=600");
        if (!win) return;
        const itensHtml = itensAgrupados.map((it:any)=>{
            const nome = it.nome_produto || "Produto";
            const qtd = Number(it.quantidade || 0);
            const tot = Number(it.total_linha || 0);
            return `<tr><td style="padding:4px 0">${nome} x${qtd}</td><td style="text-align:right">Kz ${tot.toLocaleString('de-DE')}</td></tr>`;
        }).join("");
        const min = mesa?.aberta_em? Math.floor((Date.now() - new Date(mesa.aberta_em).getTime())/60000) : 0;
        win.document.write(`
          <html><head><style>
            body{font-family:monospace;width:80mm;padding:10px;font-size:11px;color:#000}
          .center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}
            table{width:100%;border-collapse:collapse}
          .small{font-size:10px;opacity:0.7}
          </style></head><body>
            <div class="center bold">CONTA • MESA ${mesa.numero}<br/><span class="small">${mesa.zona || "Salão"} • ${min}min • ${mesa.pessoas_atual || 1}p</span></div>
            <div class="line"></div>
            <table>${itensHtml || '<tr><td>Sem consumo</td></tr>'}</table>
            <div class="line"></div>
            <table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${Number(totalPrint).toLocaleString('de-DE')}</td></tr></table>
            <div class="line"></div>
            <div class="center small">Obrigado pela preferência!<br/>#${venda?.numero || mesa.numero}</div>
            <script>window.print();setTimeout(()=>window.close(),500)</script>
          </body></html>
        `);
        win.document.close();
    };

    if (!open ||!mesa) return null;

    const min = mesa.aberta_em? Math.floor((Date.now() - new Date(mesa.aberta_em).getTime()) / 60000) : 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={onClose} />
            <div className="relative w-full max-w-[420px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[92dvh] md:max-h-[90vh]">

                <div className="bg-white m-[6px] rounded-[18px] p-3 flex justify-between items-start border border-black/5 shrink-0">
                    <div>
                        <p className="font-black text-[13px] leading-none text-black">MESA {mesa.numero} • {mesa.zona || "Salão"}</p>
                        <p className="text-[11px] text-zinc-600 mt-1 font-bold truncate max-w-[220px]">{mesa.pessoas_atual || 1}p • {min} min • {itensAgrupados.length} tipos • CONTA</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95"><X size={14} /></button>
                </div>

                <div className="bg-white m-[6px] mt-0 rounded-[18px] border border-black/5 overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="flex text-[10px] tracking-widest text-zinc-500 px-2 py-2 border-b border-black/10 shrink-0 bg-white">
                        <span className="w-[28px]">REF</span><span className="flex-1">DESCRIÇÃO</span><span className="w-[36px] text-center">QTD</span><span className="w-[70px] text-right">TOTAL</span>
                    </div>
                    <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {loading? (<div className="space-y-0 p-0">{[1,2,3].map(i=> <div key={i} className="h-[44px] border-b border-dashed border-black/10 bg-zinc-50 animate-pulse" />)}</div>) : itensAgrupados.length === 0? (<p className="text-center text-[12px] text-gray-400 mt-10">Sem consumo ainda</p>) : (
                            itensAgrupados.map((it: any, idx: number) => (
                                <div key={it.id || idx} className="flex items-start px-2 py-2.5 border-b border-dashed border-black/10 text-[13px] leading-[16px]">
                                    <span className="w-[28px] shrink-0">{idx + 1}</span>
                                    <span className="flex-1 pr-2 break-words whitespace-normal font-medium text-black">{it.nome_produto}{it.observacao && <span className="block text-[10px] font-normal text-zinc-500 leading-[12px] mt-0.5 italic truncate">{it.observacao}</span>}</span>
                                    <span className="w-[36px] shrink-0 text-center font-bold">{it.quantidade}</span>
                                    <span className="w-[70px] shrink-0 text-right font-bold">{safeKz(it.total_linha)}</span>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="shrink-0 p-3 border-t bg-white mt-auto">
                        <div className="flex justify-between items-center px-1 pb-3"><span className="text-[13px] font-bold">Kz</span><span className="text-[30px] leading-none text-[#2F4A8A] font-bold">{safeKz(total)}</span></div>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="flex-1 bg-white border border-black/10 rounded-full py-3.5 text-[12px] font-bold active:scale-[0.97]">Fechar</button>
                            <button onClick={imprimirConta} className="flex-1 bg-black text-white rounded-full py-3.5 text-[12px] font-black flex items-center justify-center gap-2 active:scale-[0.97] hover:bg-zinc-800"><Printer size={14} /> Imprimir conta</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
