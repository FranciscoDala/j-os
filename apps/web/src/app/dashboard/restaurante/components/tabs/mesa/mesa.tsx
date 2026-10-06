"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, QrCode, ChevronDown, X, Delete, Banknote, Check, Printer } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { MesaCard } from "./cards/mesa";
import { MesaModal } from "./modals/criar";
import { MesaOcuparModal } from "./modals/ocupar";
import { MesaComandaModal } from "./modals/comanda";
import { QrMesaPrint } from "../../../../../../components/mesas/QrMesaPrint";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const VENDAS_API = `${API_BASE}/vendas`;
const STATUS_OPTS = ["", "LIVRE", "OCUPADA", "RESERVADA", "SUJA"] as const;
const STATUS_LABELS: Record<string, string> = { "": "Todos status", LIVRE: "Livre", OCUPADA: "Ocupada", RESERVADA: "Reservada", SUJA: "Suja" };

function getAuthHeaders() { const t = typeof window!== "undefined"? (localStorage.getItem("access_token") || localStorage.getItem("token")) : null; const e = typeof window!== "undefined"? (localStorage.getItem("empresa_id") || localStorage.getItem("empresaId")) : null; const h: any = {}; if (t) h["Authorization"] = `Bearer ${t}`; if (e) h["X-Empresa-ID"] = e; return h; }
function getEmpresaId() { return typeof window!== "undefined"? (localStorage.getItem("empresa_id") || localStorage.getItem("empresaId")) : null; }

function CustomSelect({ value, onChange, options, labelMap }: { value: string, onChange: (v: string) => void, options: string[], labelMap: Record<string, string> }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    return (
        <div ref={ref} className={`relative ${open? "z-[60]" : "z-0"} w-full`}>
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 py-2.5 text-[11px] font-black text-left flex items-center justify-between shadow-sm hover:border-[#A67C52] focus:ring-2 focus:ring-[#A67C52]/20 transition-all outline-none">
                <span className="truncate">{labelMap[value] || value || "Todos"}</span>
                <ChevronDown size={14} className={`shrink-0 ml-2 transition-transform ${open? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[100] overflow-hidden p-1.5">
                    <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
                        {options.map(opt => (<button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2 rounded-full text-[11px] font-bold transition-all ${value === opt? "bg-[#A67C52] text-white shadow-sm" : "bg-white text-black hover:bg-[#F5E6D3] hover:text-[#5A3A22]"}`}>{labelMap[opt]?? (opt === ""? "Todos" : opt)}</button>))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function MesasTab() {
    const { role } = useDashboard();
    const { search: globalSearch } = useGlobalSearch();
    const canManage = ["dono", "gerente", "gerente_restaurante", "admin", "owner"].includes((role || "").toLowerCase());
    const [mesas, setMesas] = useState<any[]>([]); const [zonas, setZonas] = useState<string[]>([]); const [zona, setZona] = useState(""); const [status, setStatus] = useState("");
    const [empresaId, setEmpresaId] = useState<string | null>(null); const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false); const [numero, setNumero] = useState(""); const [capacidade, setCapacidade] = useState(4); const [zonaNew, setZonaNew] = useState("Salão"); const [saving, setSaving] = useState(false);
    const [mesaAlvo, setMesaAlvo] = useState<any>(null); const [showOcupar, setShowOcupar] = useState(false); const [showComanda, setShowComanda] = useState(false);
    const [showQr, setShowQr] = useState(false);

    // FECHAR MESA - NOVO
    const [showPay, setShowPay] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [forma, setForma] = useState<"dinheiro" | "transferencia" | "tpa">("dinheiro");
    const [recebido, setRecebido] = useState("");
    const [finalizando, setFinalizando] = useState(false);
    const [ultimaVenda, setUltimaVenda] = useState<any>(null);
    const [mesaParaFechar, setMesaParaFechar] = useState<any>(null);

    useEffect(() => { setEmpresaId(getEmpresaId()); }, []);
    const load = useCallback(async () => {
        if (!empresaId) return; setLoading(true);
        try {
            const p = new URLSearchParams();
            if (zona) p.append("zona", zona);
            if (status) p.append("status", status);
            if (globalSearch) p.append("search", globalSearch);
            const res = await fetch(`${API_BASE}/mesas/${empresaId}?${p.toString()}`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, cache: "no-store" });
            if (res.ok) setMesas(await res.json());
        } finally { setLoading(false); }
    }, [empresaId, zona, status, globalSearch]);

    const loadZonas = useCallback(async () => { if (!empresaId) return; const r = await fetch(`${API_BASE}/mesas/${empresaId}/zonas`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any }); if (r.ok) setZonas(await r.json()); }, [empresaId]);
    useEffect(() => { if (empresaId) { load(); loadZonas(); } }, [load, loadZonas]);
    useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [globalSearch]);

    const criarMesa = async () => {
        if (!numero.trim()) return toast.error("Número obrigatório");
        if (!empresaId) return; setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/mesas/${empresaId}`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, body: JSON.stringify({ numero: numero.trim().toUpperCase(), capacidade: Number(capacidade), zona: zonaNew }) });
            const j = await res.json().catch(() => ({})); if (!res.ok) throw new Error(j.detail || "Erro");
            toast.success(`Mesa ${j.numero} criada`); setShowNew(false); setNumero(""); load(); loadZonas();
            window.dispatchEvent(new CustomEvent("mesa:update"));
        } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
    };

    const handleOcupar = async (pessoas: number) => {
        if (!mesaAlvo ||!empresaId) return; setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/mesas/${empresaId}/${mesaAlvo.id}/ocupar`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, body: JSON.stringify({ pessoas }) });
            const j = await res.json().catch(() => ({})); if (!res.ok) throw new Error(j.detail || "Erro ao ocupar");
            setMesas(prev => prev.map(m => m.id === j.id? {...m, status: "OCUPADA", pessoas_atual: pessoas, aberta_em: new Date().toISOString() } : m));
            toast.success(`Mesa ${j.numero} ocupada`); setShowOcupar(false); setMesaAlvo(null);
            window.dispatchEvent(new CustomEvent("mesa:update"));
            setTimeout(load, 300);
        } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
    };

    const handleLimpar = async (m: any) => { try { const res = await fetch(`${API_BASE}/mesas/${empresaId}/${m.id}/limpar`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any }); if (!res.ok) throw new Error("Erro"); toast.success("Mesa limpa"); setMesas(prev => prev.map(x => x.id === m.id? {...x, status: "LIVRE" } : x)); window.dispatchEvent(new CustomEvent("mesa:update")); load(); } catch (e: any) { toast.error(e.message); } };
    const handleLiberar = async (m: any) => { try { const res = await fetch(`${API_BASE}/mesas/${empresaId}/${m.id}/liberar?limpar=true`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any }); if (!res.ok) throw new Error("Erro"); toast.success("Mesa liberada"); setMesas(prev => prev.map(x => x.id === m.id? {...x, status: "LIVRE", venda_atual_id: null } : x)); window.dispatchEvent(new CustomEvent("mesa:update")); load(); } catch (e: any) { toast.error(e.message); } };

    // LOGICA FECHAR MESA
    const totalFechamento = Number(mesaParaFechar?.venda_total || mesaParaFechar?.total || 0);
    const recebidoNum = recebido? parseFloat(recebido) : 0;
    const troco = recebidoNum - totalFechamento;

    const handleCalc = (val: string) => {
        if (val === "C") setRecebido(""); else if (val === "DEL") setRecebido((s) => s.slice(0, -1));
        else if (val === "00") { if (recebido!== "") setRecebido((s) => s + "00"); }
        else if (val === ".") { if (!recebido.includes(".")) setRecebido((s) => (s === ""? "0." : s + ".")); }
        else { setRecebido((s) => (s + val).slice(0, 10)); }
    };

    const abrirFechar = (m: any) => {
        setMesaParaFechar(m);
        setRecebido(String(Number(m.venda_total || m.total || 0)));
        setForma("dinheiro");
        setShowPay(true);
    };

    const fecharContaMesa = async () => {
        const vendaId = mesaParaFechar?.venda_atual_id;
        if (!vendaId) { toast.error("Mesa sem venda para fechar"); return; }
        if (forma === "dinheiro" && recebidoNum < totalFechamento) { toast.error("Valor insuficiente"); return; }
        setFinalizando(true);
        try {
            const r = await fetch(`${VENDAS_API}/${vendaId}/fechar`, {
                method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() as any },
                body: JSON.stringify({ forma_pagamento: forma.toUpperCase(), dinheiro_recebido: recebidoNum || 0 })
            });
            const txt = await r.text(); let data: any = {}; try { data = JSON.parse(txt); } catch { data = { detail: txt }; }
            if (!r.ok) throw new Error(data.detail || "Erro ao fechar");
            setUltimaVenda({...data, mesa_numero: mesaParaFechar.numero });
            setShowPay(false);
            setShowConfirm(true);
            toast.success(`Mesa ${mesaParaFechar.numero} fechada!`);
            load();
        } catch (e: any) { toast.error(e.message); }
        finally { setFinalizando(false); }
    };

    const imprimirFaturaFinal = () => {
        const v = ultimaVenda; if (!v) return;
        const win = window.open("", "_blank", "width=320,height=600"); if (!win) return;
        const itensHtml = (v.itens || []).map((i: any) => {
            const nome = i.nome_produto || i.produto_nome || i.nome;
            const qtd = i.quantidade || 1;
            const tot = i.total || 0;
            return `<tr><td>${nome} x${qtd}</td><td style="text-align:right">Kz ${Number(tot).toLocaleString("de-DE")}</td></tr>`;
        }).join("");
        win.document.write(`<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%}</style></head><body><div class="center bold">FATURA MESA ${v.mesa_numero}<br/>#${v.numero || ""}</div><div class="line"></div><table>${itensHtml}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${Number(v.total || 0).toLocaleString("de-DE")}</td></tr></table><script>window.print();</script></body></html>`);
        win.document.close();
    };

    const aposVenda = (comRecibo: boolean) => {
        if (comRecibo) imprimirFaturaFinal();
        setShowConfirm(false);
        setShowPay(false);
        setRecebido("");
        setUltimaVenda(null);
        setMesaParaFechar(null);
    };

    if (!empresaId) return <div className="p-6 text-[12px] font-bold opacity-60">Carregando empresa...</div>;

    return (
        <>
            <div className="w-full space-y-4 relative">
                <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-[200px]"><CustomSelect value={zona} onChange={setZona} options={["",...zonas]} labelMap={{ "": "Todas zonas",...Object.fromEntries(zonas.map(z => [z, z])) }} /></div>
                        <div className="w-[200px]"><CustomSelect value={status} onChange={setStatus} options={[...STATUS_OPTS]} labelMap={STATUS_LABELS} /></div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setShowQr(true)} className="w-10 h-10 bg-white border border-black/10 text-black rounded-full flex items-center justify-center shadow-sm hover:bg-black hover:text-white active:scale-95 transition-all" title="Imprimir QRs"><QrCode size={18} /></button>
                        {canManage && <button onClick={() => setShowNew(true)} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-md hover:bg-zinc-800 active:scale-95 transition-all"><Plus size={18} strokeWidth={3} /></button>}
                    </div>
                </div>
                {loading? <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => <div key={i} className="h-[272px] rounded-[22px] bg-zinc-100 animate-pulse" />)}</div> :
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        {mesas.length === 0? <div className="col-span-full py-16 text-center border border-dashed border-[#E8DCCF] rounded-[22px]"><div className="text-[13px] font-black">Nenhuma mesa encontrada {globalSearch && `para "${globalSearch}"`}</div><div className="text-[11px] opacity-60 font-bold mt-1">Crie a primeira mesa ou limpe os filtros</div></div> : mesas.map(m => (
                            <div key={m.id} className="flex flex-col gap-2">
                                <MesaCard m={m} onOcupar={(mm: any) => { setMesaAlvo(mm); setShowOcupar(true); }} onComanda={(mm: any) => { setMesaAlvo(mm); setShowComanda(true); }} onLimpar={handleLimpar} onLiberar={handleLiberar} onDetalhe={(mm: any) => { setMesaAlvo(mm); setShowComanda(true); }} />
                                {m.status === "OCUPADA" && m.venda_atual_id && (
                                    <button onClick={()=>abrirFechar(m)} className="w-full h-11 rounded-full bg-[#16A34A] text-white font-black text-[11px] flex items-center justify-center gap-2 hover:bg-green-700 active:scale-[0.98]">
                                        <Printer size={14} /> FECHAR • Kz {Number(m.venda_total || m.total || 0).toLocaleString("de-DE")}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                }
            </div>
            <MesaModal open={showNew} onClose={() => setShowNew(false)} numero={numero} setNumero={setNumero} capacidade={capacidade} setCapacidade={setCapacidade} zonaNew={zonaNew} setZonaNew={setZonaNew} onCreate={criarMesa} saving={saving} />
            <MesaOcuparModal open={showOcupar} mesa={mesaAlvo} onClose={() => { setShowOcupar(false); setMesaAlvo(null); }} onConfirm={handleOcupar} saving={saving} />
            <MesaComandaModal open={showComanda} mesa={mesaAlvo} onClose={() => { setShowComanda(false); setMesaAlvo(null); }} />
            {showQr && (<div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"><div className="bg-white rounded-[24px] max-w-[800px] w-full max-h-[90vh] overflow-auto p-6"><div className="flex justify-between items-center mb-4"><h2 className="font-black text-[16px]">QR Codes - Mesas</h2><button onClick={() => setShowQr(false)} className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">✕</button></div><QrMesaPrint empresaId={empresaId} mesas={mesas} dominio={typeof window!== "undefined"? window.location.origin : ""} /></div></div>)}

            {/* MODAL PAGAMENTO FECHAR MESA */}
            {showPay && (
                <div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-md flex items-center justify-center p-3">
                    <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-2xl rounded-[22px] border border-white/60 shadow-2xl overflow-hidden">
                        <div className="p-3.5 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-black text-[14px]">Fechar Mesa {mesaParaFechar?.numero}</h3>
                                <button onClick={()=>setShowPay(false)} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center"><X size={14}/></button>
                            </div>
                            <div className="bg-[#F5F7FB] rounded-[14px] p-3 border border-black/5 space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black uppercase text-gray-600">MESA {mesaParaFechar?.numero} • {forma}</span>
                                    <span className="font-black text-[14px]">Kz {totalFechamento.toLocaleString("de-DE")}</span>
                                </div>
                                <div className="bg-white rounded-[12px] px-3 py-2.5 border flex justify-between items-center shadow-sm">
                                    <div><p className="text-[8px] text-gray-400 tracking-widest font-bold">VALOR RECEBIDO</p><p className="text-[18px] font-black leading-none mt-1">Kz {recebido || "0"}</p></div>
                                    <div className="w-8 h-8 bg-[#EEF4FF] rounded-full flex items-center justify-center"><Banknote size={14} className="text-[#2F4A8A]" /></div>
                                </div>
                                {forma === "dinheiro" && (
                                    <div className={`rounded-[12px] px-3 py-2 flex justify-between items-center border ${troco >= 0? "bg-[#E8F5E9] border-green-200" : "bg-[#FFEBEE] border-red-200"}`}>
                                        <span className="text-[10px] font-black">{troco >= 0? "TROCO" : "FALTA"}</span>
                                        <span className={`text-[13px] font-black ${troco >= 0? "text-green-700" : "text-red-600"}`}>Kz {Math.abs(troco).toLocaleString("de-DE")}</span>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    {["dinheiro","transferencia","tpa"].map(f=>(
                                        <button key={f} onClick={()=>setForma(f as any)} className={`flex-1 h-9 rounded-full text-[11px] font-black border ${forma===f? "bg-black text-white border-black" : "bg-white border-black/10"}`}>{f.toUpperCase()}</button>
                                    ))}
                                </div>
                            </div>
                            {forma === "dinheiro" && (
                                <div className="grid grid-cols-4 gap-2">
                                    {["7","8","9","DEL","4","5","6","C","1","2","3","00"].map(k=>(
                                        <button key={k} onClick={()=>handleCalc(k)} className={`h-[40px] rounded-[12px] border shadow-sm font-bold text-[14px] ${k==="DEL"||k==="C"? "bg-black text-white" : "bg-white"}`}>
                                            {k==="DEL"? <Delete size={16} className="mx-auto"/> : k}
                                        </button>
                                    ))}
                                    <button onClick={() => handleCalc("0")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] col-span-2">0</button>
                                    <button onClick={() => handleCalc(".")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[16px] col-span-2">.</button>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2.5">
                              <button onClick={() => setShowPay(false)} className="h-[40px] bg-[#EF4444] text-white rounded-full flex items-center justify-center"><X size={18} /></button>
                              <button disabled={(forma === "dinheiro" && recebidoNum < totalFechamento) || finalizando} onClick={fecharContaMesa} className="h-[40px] bg-[#16A34A] disabled:bg-gray-300 text-white rounded-full flex items-center justify-center font-bold text-[13px]">
                                {finalizando? "..." : <><Check size={18} /> FECHAR</>}
                              </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showConfirm && (
                <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-[360px] bg-white rounded-[24px] p-6 border shadow-2xl text-center">
                        <div className="w-14 h-14 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200"><Check size={26} className="text-green-600" /></div>
                        <h3 className="font-black text-[16px]">Mesa {ultimaVenda?.mesa_numero} fechada!</h3>
                        <p className="text-[12px] text-gray-600 mt-2">Total Kz {Number(ultimaVenda?.total || 0).toLocaleString("de-DE")} via {forma}</p>
                        {forma === "dinheiro" && troco > 0 && <p className="text-[11px] text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1 mt-2 inline-block font-black">Troco Kz {Number(troco).toLocaleString("de-DE")}</p>}
                        <p className="text-[12px] font-bold mt-4">Deseja imprimir o recibo?</p>
                        <div className="flex gap-2.5 mt-5">
                          <button onClick={()=>aposVenda(false)} className="flex-1 bg-white border border-black/10 rounded-full py-3.5 text-[13px] font-bold">Não</button>
                          <button onClick={()=>aposVenda(true)} className="flex-1 bg-black text-white rounded-full py-3.5 text-[13px] font-black flex items-center justify-center gap-2"><Printer size={14} /> Imprimir</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
