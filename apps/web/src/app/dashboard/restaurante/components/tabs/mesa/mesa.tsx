"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { MesaCard } from "./cards/mesa";
import { MesaModal } from "./modals/criar";
import { MesaOcuparModal } from "./modals/ocupar";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const STATUS_OPTS = ["", "LIVRE", "OCUPADA", "RESERVADA", "SUJA"] as const;
const STATUS_LABELS: Record<string, string> = { "": "Todos status", LIVRE: "Livre", OCUPADA: "Ocupada", RESERVADA: "Reservada", SUJA: "Suja" };

// --- INLINE PARA NAO QUEBRAR BUILD ---
function CustomSelect({ value, onChange, options, labelMap }: { value: string, onChange: (v: string) => void, options: string[], labelMap: Record<string, string> }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    return (
        <div ref={ref} className={`relative ${open? "z-[60]" : "z-0"} w-full`}>
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 py-2.5 text-[11px] font-black text-left flex items-center justify-between shadow-sm outline-none">
                <span className="truncate">{labelMap[value] || value}</span>
                <ChevronDown size={14} className={`shrink-0 ml-2 transition-transform ${open? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[100] p-1.5">
                    <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
                        {options.map(opt => (<button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2 rounded-full text-[11px] font-bold ${value === opt? "bg-[#A67C52] text-white" : "bg-white hover:bg-[#F5E6D3]"}`}>{labelMap[opt] || opt}</button>))}
                    </div>
                </div>
            )}
        </div>
    )
}

function getAuthHeaders() { const t = typeof window!== "undefined"? (localStorage.getItem("access_token") || localStorage.getItem("token")) : null; const e = typeof window!== "undefined"? (localStorage.getItem("empresa_id") || localStorage.getItem("empresaId")) : null; const h: any = {}; if (t) h["Authorization"] = `Bearer ${t}`; if (e) h["X-Empresa-ID"] = e; return h; }
function getEmpresaId() { if (typeof window === "undefined") return null; return localStorage.getItem("empresa_id") || localStorage.getItem("empresaId") || null; }

export function MesasTab() {
    const { role } = useDashboard();
    const canManage = ["dono", "gerente", "gerente_restaurante", "admin", "owner"].includes((role || "").toLowerCase());
    const [mesas, setMesas] = useState<any[]>([]); const [zonas, setZonas] = useState<string[]>([]);
    const [zona, setZona] = useState(""); const [status, setStatus] = useState(""); const [search, setSearch] = useState("");
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [showNew, setShowNew] = useState(false); const [numero, setNumero] = useState(""); const [capacidade, setCapacidade] = useState(4); const [zonaNew, setZonaNew] = useState("Salão"); const [saving, setSaving] = useState(false);
    const [mesaAlvo, setMesaAlvo] = useState<any>(null); const [showOcupar, setShowOcupar] = useState(false);

    useEffect(() => { setEmpresaId(getEmpresaId()); }, []);
    const load = useCallback(async () => {
        if (!empresaId) return;
        const p = new URLSearchParams(); if (zona) p.append("zona", zona); if (status) p.append("status", status); if (search) p.append("search", search);
        const res = await fetch(`${API_BASE}/mesas/${empresaId}?${p.toString()}`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, cache: "no-store" });
        if (res.ok) setMesas(await res.json());
    }, [empresaId, zona, status, search]);
    const loadZonas = useCallback(async () => { if (!empresaId) return; const r = await fetch(`${API_BASE}/mesas/${empresaId}/zonas`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any }); if (r.ok) setZonas(await r.json()); }, [empresaId]);
    useEffect(() => { if (empresaId) { load(); loadZonas(); } }, [load, loadZonas]);
    useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

    const criarMesa = async () => {
        if (!numero.trim()) return toast.error("Número obrigatório"); if (!empresaId) return; setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/mesas/${empresaId}`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, body: JSON.stringify({ numero: numero.trim().toUpperCase(), capacidade: Number(capacidade), zona: zonaNew }) });
            const j = await res.json().catch(() => ({})); if (!res.ok) throw new Error(j.detail || "Erro");
            toast.success(`Mesa ${j.numero} criada`); setShowNew(false); setNumero(""); setCapacidade(4); load(); loadZonas();
        } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
    };
    const handleOcupar = async (pessoas: number) => {
        if (!mesaAlvo ||!empresaId) return; setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/mesas/${empresaId}/${mesaAlvo.id}/ocupar`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, body: JSON.stringify({ pessoas, garcom_id: null }) });
            const j = await res.json().catch(() => ({})); if (!res.ok) throw new Error(j.detail || "Erro ao ocupar");
            toast.success(`Mesa ${j.numero} ocupada`); setShowOcupar(false); setMesaAlvo(null); load();
        } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
    };
    const handleLimpar = async (m: any) => {
        if (!empresaId) return;
        try {
            const res = await fetch(`${API_BASE}/mesas/${empresaId}/${m.id}/limpar`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any });
            if (!res.ok) throw new Error("Erro ao limpar"); toast.success("Mesa limpa"); load();
        } catch (e: any) { toast.error(e.message); }
    };
    const handleLiberar = async (m: any) => {
        if (!empresaId) return;
        try {
            const res = await fetch(`${API_BASE}/mesas/${empresaId}/${m.id}/liberar?limpar=true`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any });
            if (!res.ok) throw new Error("Erro ao liberar"); toast.success("Mesa liberada -> Suja"); load();
        } catch (e: any) { toast.error(e.message); }
    };

    if (!empresaId) return <div className="p-6 text-[12px] font-bold opacity-60">Carregando...</div>;

    return (
        <>
            <div className="space-y-4 w-full">
                {/* BTN NA MESMA LINHA DOS INPUTS */}
                <div className="w-full grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-12 md:col-span-3"><CustomSelect value={zona} onChange={setZona} options={["",...zonas]} labelMap={{ "": "Todas zonas",...Object.fromEntries(zonas.map(z => [z, z])) }} /></div>
                    <div className="col-span-12 md:col-span-3"><CustomSelect value={status} onChange={setStatus} options={[...STATUS_OPTS]} labelMap={STATUS_LABELS} /></div>
                    <div className="col-span-10 md:col-span-5">
                        <div className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 py-2.5 flex items-center gap-2 shadow-sm h-[42px]">
                            <Search size={14} className="opacity-40 shrink-0" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mesa M01..." className="bg-transparent outline-none text-[11px] font-bold w-full" />
                        </div>
                    </div>
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                        {canManage && <button onClick={() => setShowNew(true)} className="w-[42px] h-[42px] bg-black text-white rounded-full flex items-center justify-center shadow-md hover:bg-zinc-800 shrink-0"><Plus size={18} /></button>}
                    </div>
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {mesas.length === 0? <div className="col-span-full text-center py-10 text-[12px] opacity-50 font-bold">Nenhuma mesa</div> : mesas.map(m => (
                        <MesaCard key={m.id} m={m} onOcupar={(mm: any) => { setMesaAlvo(mm); setShowOcupar(true); }} onComanda={(mm: any) => toast.info(`Abrir comanda ${mm.numero}`)} onLimpar={handleLimpar} onLiberar={handleLiberar} onDetalhe={(mm: any) => toast.info(`Detalhes ${mm.numero}`)} />
                    ))}
                </div>
            </div>
            <MesaModal open={showNew} onClose={() => setShowNew(false)} numero={numero} setNumero={setNumero} capacidade={capacidade} setCapacidade={setCapacidade} zonaNew={zonaNew} setZonaNew={setZonaNew} onCreate={criarMesa} saving={saving} />
            <MesaOcuparModal open={showOcupar} mesa={mesaAlvo} onClose={() => { setShowOcupar(false); setMesaAlvo(null); }} onConfirm={handleOcupar} saving={saving} />
        </>
    );
}
