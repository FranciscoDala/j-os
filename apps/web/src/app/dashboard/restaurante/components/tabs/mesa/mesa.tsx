"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { MesaCard } from "./cards/mesa";
import { MesaModal } from "./modals/criar";
import { MesaOcuparModal } from "./modals/ocupar";
import { MesaComandaModal } from "./modals/comanda";
import { CustomSelect } from "./cards/custom";
import { QrMesaPrint } from "../../../../../../components/mesas/QrMesaPrint";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const STATUS_OPTS = ["", "LIVRE", "OCUPADA", "RESERVADA", "SUJA"] as const;
const STATUS_LABELS: Record<string, string> = { "": "Todos status", LIVRE: "Livre", OCUPADA: "Ocupada", RESERVADA: "Reservada", SUJA: "Suja" };

function getAuthHeaders() { const t = typeof window!== "undefined"? (localStorage.getItem("access_token") || localStorage.getItem("token")) : null; const e = typeof window!== "undefined"? (localStorage.getItem("empresa_id") || localStorage.getItem("empresaId")) : null; const h: any = {}; if (t) h["Authorization"] = `Bearer ${t}`; if (e) h["X-Empresa-ID"] = e; return h; }
function getEmpresaId() { return typeof window!== "undefined"? (localStorage.getItem("empresa_id") || localStorage.getItem("empresaId")) : null; }

export function MesasTab() {
    const { role } = useDashboard();
    const { search: globalSearch } = useGlobalSearch();
    const canManage = ["dono", "gerente", "gerente_restaurante", "admin", "owner"].includes((role || "").toLowerCase());
    const [mesas, setMesas] = useState<any[]>([]); const [zonas, setZonas] = useState<string[]>([]); const [zona, setZona] = useState(""); const [status, setStatus] = useState("");
    const [empresaId, setEmpresaId] = useState<string | null>(null); const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false); const [numero, setNumero] = useState(""); const [capacidade, setCapacidade] = useState(4); const [zonaNew, setZonaNew] = useState("Salão"); const [saving, setSaving] = useState(false);
    const [mesaAlvo, setMesaAlvo] = useState<any>(null); const [showOcupar, setShowOcupar] = useState(false); const [showComanda, setShowComanda] = useState(false);
    const [showQr, setShowQr] = useState(false);

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
            const res = await fetch(`${API_BASE}/mesas/${empresaId}/${mesaAlvo.id}/ocupar`, {
                method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any,
                body: JSON.stringify({ pessoas })
            });
            const j = await res.json().catch(() => ({})); if (!res.ok) throw new Error(j.detail || "Erro ao ocupar");
            setMesas(prev => prev.map(m => m.id === j.id? {...m, status: "OCUPADA", pessoas_atual: pessoas, aberta_em: new Date().toISOString() } : m));
            toast.success(`Mesa ${j.numero} ocupada`); setShowOcupar(false); setMesaAlvo(null);
            window.dispatchEvent(new CustomEvent("mesa:update"));
            setTimeout(load, 300);
        } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
    };

    const handleLimpar = async (m: any) => { try { const res = await fetch(`${API_BASE}/mesas/${empresaId}/${m.id}/limpar`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any }); if (!res.ok) throw new Error("Erro"); toast.success("Mesa limpa"); setMesas(prev => prev.map(x => x.id === m.id? {...x, status: "LIVRE" } : x)); window.dispatchEvent(new CustomEvent("mesa:update")); load(); } catch (e: any) { toast.error(e.message); } };
    const handleLiberar = async (m: any) => { try { const res = await fetch(`${API_BASE}/mesas/${empresaId}/${m.id}/liberar?limpar=true`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any }); if (!res.ok) throw new Error("Erro"); toast.success("Mesa liberada"); setMesas(prev => prev.map(x => x.id === m.id? {...x, status: "LIVRE", venda_atual_id: null } : x)); window.dispatchEvent(new CustomEvent("mesa:update")); load(); } catch (e: any) { toast.error(e.message); } };

    if (!empresaId) return <div className="p-6 text-[12px] font-bold opacity-60">Carregando empresa...</div>;

    return (
        <>
            <div className="space-y-4 w-full">
                {/* HEADER SÓ FILTROS + AÇÕES */}
                <div className="w-full flex items-center gap-3">
                    <div className="w-[160px]"><CustomSelect value={zona} onChange={setZona} options={["",...zonas]} labelMap={{ "": "Todas zonas",...Object.fromEntries(zonas.map(z => [z, z])) }} /></div>
                    <div className="w-[160px]"><CustomSelect value={status} onChange={setStatus} options={[...STATUS_OPTS]} labelMap={STATUS_LABELS} /></div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setShowQr(true)} className="w-[42px] h-[42px] bg-white border border-black/10 text-black rounded-full flex items-center justify-center shadow-sm hover:bg-black hover:text-white transition-all" title="Imprimir QRs">
                            <QrCode size={18} />
                        </button>
                        {canManage && <button onClick={() => setShowNew(true)} className="w-[42px] h-[42px] bg-black text-white rounded-full flex items-center justify-center shadow-md hover:bg-zinc-800 hover:scale-105 transition-all"><Plus size={18} /></button>}
                    </div>
                </div>
                {loading? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-[192px] rounded-[22px] bg-zinc-100 animate-pulse" />)}</div> :
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {mesas.length === 0? <div className="col-span-full py-16 text-center border border-dashed border-[#E8DCCF] rounded-[22px]"><div className="text-[13px] font-black">Nenhuma mesa encontrada {globalSearch && `para "${globalSearch}"`}</div><div className="text-[11px] opacity-60 font-bold mt-1">Crie a primeira mesa ou limpe os filtros</div></div> : mesas.map(m => (
                            <MesaCard key={m.id} m={m} onOcupar={(mm: any) => { setMesaAlvo(mm); setShowOcupar(true); }} onComanda={(mm: any) => { setMesaAlvo(mm); setShowComanda(true); }} onLimpar={handleLimpar} onLiberar={handleLiberar} onDetalhe={(mm: any) => { setMesaAlvo(mm); setShowComanda(true); }} />
                        ))}
                    </div>
                }
            </div>
            <MesaModal open={showNew} onClose={() => setShowNew(false)} numero={numero} setNumero={setNumero} capacidade={capacidade} setCapacidade={setCapacidade} zonaNew={zonaNew} setZonaNew={setZonaNew} onCreate={criarMesa} saving={saving} />
            <MesaOcuparModal open={showOcupar} mesa={mesaAlvo} onClose={() => { setShowOcupar(false); setMesaAlvo(null); }} onConfirm={handleOcupar} saving={saving} />
            <MesaComandaModal open={showComanda} mesa={mesaAlvo} onClose={() => { setShowComanda(false); setMesaAlvo(null); }} />

            {showQr && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[24px] max-w-[800px] w-full max-h-[90vh] overflow-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-black text-[16px]">QR Codes - Mesas</h2>
                            <button onClick={() => setShowQr(false)} className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">✕</button>
                        </div>
                        <QrMesaPrint empresaId={empresaId} mesas={mesas} dominio={typeof window!== "undefined"? window.location.origin : ""} />
                    </div>
                </div>
            )}
        </>
    );
}
