"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Plus, ChevronDown, MapPin, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/components/dashboard/Tamplate";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";

const STATUS_OPTS = ["", "LIVRE", "OCUPADA", "RESERVADA", "SUJA"] as const;
const STATUS_LABELS: Record<string, string> = { "": "Todos status", LIVRE: "Livre", OCUPADA: "Ocupada", RESERVADA: "Reservada", SUJA: "Suja" };

function getAuthHeaders() {
    const token = typeof window!== "undefined"? (localStorage.getItem("access_token") || localStorage.getItem("token")) : null;
    const empresa_id = typeof window!== "undefined"? (localStorage.getItem("empresa_id") || localStorage.getItem("empresaId")) : null;
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (empresa_id) h["X-Empresa-ID"] = empresa_id;
    return h;
}
function getEmpresaId() { if (typeof window === "undefined") return null; return localStorage.getItem("empresa_id") || localStorage.getItem("empresaId") || null; }

function CustomSelect({ value, onChange, options, labelMap }: { value: string, onChange: (v: string) => void, options: string[], labelMap: Record<string, string> }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    return (
        <div ref={ref} className={`relative ${open? "z-[60]" : "z-0"} w-full`}>
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 py-2.5 text-[11px] font-black text-left flex items-center justify-between shadow-sm hover:border-[#A67C52] focus:border-[#A67C52] focus:ring-2 focus:ring-[#A67C52]/20 transition-all outline-none">
                <span className="truncate">{labelMap[value] || value}</span>
                <ChevronDown size={14} className={`shrink-0 ml-2 transition-transform ${open? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[100] overflow-hidden p-1.5">
                    <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
                        {options.map(opt => (<button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2 rounded-full text-[11px] font-bold transition-all ${value === opt? "bg-[#A67C52] text-white shadow-sm" : "bg-white text-black hover:bg-[#F5E6D3] hover:text-[#5A3A22]"}`}>{labelMap[opt] || opt}</button>))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function MesasTab() {
    const { role } = useDashboard();
    const canManage = ["dono", "gerente", "gerente_restaurante", "admin", "owner"].includes((role || "").toLowerCase());

    const [mesas, setMesas] = useState<any[]>([]);
    const [zonas, setZonas] = useState<string[]>([]);
    const [zona, setZona] = useState("");
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const [showNew, setShowNew] = useState(false);
    const [numero, setNumero] = useState("");
    const [capacidade, setCapacidade] = useState(4);
    const [zonaNew, setZonaNew] = useState("Salão");
    const [saving, setSaving] = useState(false);

    useEffect(() => { setEmpresaId(getEmpresaId()); }, []);

    const load = useCallback(async () => {
        if (!empresaId) return;
        try {
            const params = new URLSearchParams();
            if (zona) params.append("zona", zona);
            if (status) params.append("status", status);
            if (search) params.append("search", search);
            const res = await fetch(`${API_BASE}/mesas/${empresaId}?${params.toString()}`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, cache: "no-store" });
            if (res.ok) setMesas(await res.json());
        } catch {}
    }, [empresaId, zona, status, search]);

    const loadZonas = useCallback(async () => {
        if (!empresaId) return;
        try {
            const res = await fetch(`${API_BASE}/mesas/${empresaId}/zonas`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any });
            if (res.ok) setZonas(await res.json());
        } catch {}
    }, [empresaId]);

    useEffect(() => { if (empresaId) { load(); loadZonas(); } }, [load, loadZonas]);
    useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

    const criarMesa = async () => {
        if (!numero.trim()) return toast.error("Número obrigatório");
        if (!empresaId) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/mesas/${empresaId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json",...getAuthHeaders() } as any,
                body: JSON.stringify({ numero: numero.trim().toUpperCase(), capacidade: Number(capacidade), zona: zonaNew })
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.detail || "Erro");
            toast.success(`Mesa ${json.numero} criada`);
            setShowNew(false); setNumero(""); setCapacidade(4);
            load(); loadZonas();
        } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
    };

    const statusColor: any = {
        LIVRE: "border-[#C8E6C9] bg-[#F1F8E9]",
        OCUPADA: "border-[#FFCDD2] bg-[#FFEBEE]",
        RESERVADA: "border-[#FFE0B2] bg-[#FFF3E0]",
        SUJA: "border-[#E0E0E0] bg-[#FAFA]",
    };

    if (!empresaId) return <div className="p-6 text-[12px] font-bold opacity-60">Carregando...</div>;

    return (
        <>
            <div className="space-y-4 w-full">
                {/* FILTROS - MESMO GRID + BTN NA MESMA LINHA */}
                <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-center">
                    {/* 1 card - zona */}
                    <div className="col-span-1">
                        <CustomSelect value={zona} onChange={setZona} options={["",...zonas]} labelMap={{ "": "Todas zonas",...Object.fromEntries(zonas.map(z => [z, z])) }} />
                    </div>
                    {/* 1 card - status */}
                    <div className="col-span-1">
                        <CustomSelect value={status} onChange={setStatus} options={[...STATUS_OPTS]} labelMap={STATUS_LABELS} />
                    </div>
                    {/* 2 cards - busca */}
                    <div className="col-span-2 md:col-span-1 lg:col-span-1">
                        <div className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 py-2.5 flex items-center gap-2 shadow-sm focus-within:border-[#A67C52] focus-within:ring-2 focus-within:ring-[#A67C52]/20 transition-all">
                            <Search size={14} className="opacity-40 shrink-0" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mesa M01..." className="bg-transparent outline-none text-[11px] font-bold w-full" />
                        </div>
                    </div>
                    <div className="hidden lg:block" />
                    <div className="hidden md:flex lg:col-span-1 justify-end">
                        {canManage && <button onClick={() => setShowNew(true)} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-md hover:bg-zinc-800"><Plus size={18} /></button>}
                    </div>
                    <div className="flex md:hidden col-span-2 items-center gap-3">
                        <div className="flex-1 grid grid-cols-3 gap-2">
                            <CustomSelect value={zona} onChange={setZona} options={["",...zonas]} labelMap={{ "": "Todas zonas",...Object.fromEntries(zonas.map(z => [z, z])) }} />
                            <CustomSelect value={status} onChange={setStatus} options={[...STATUS_OPTS]} labelMap={STATUS_LABELS} />
                            <div className="bg-white border border-[#E8DCCF] rounded-full px-3 py-2.5 flex items-center gap-2"><Search size={12} className="opacity-40" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar" className="bg-transparent outline-none text-[11px] font-bold w-full" /></div>
                        </div>
                        {canManage && <button onClick={() => setShowNew(true)} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"><Plus size={18} /></button>}
                    </div>
                </div>

                {/* GRID - MESMO GAP */}
                <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {mesas.length === 0? <div className="col-span-full text-center py-10 text-[12px] opacity-50 font-bold">Nenhuma mesa</div> :
                        mesas.map(m => {
                            const min = m.aberta_em? Math.floor((Date.now() - new Date(m.aberta_em).getTime()) / 60000) : 0;
                            return (
                                <div key={m.id} className={`rounded-[22px] border p-4 shadow-sm hover:shadow-md transition-all ${statusColor[m.status] || "bg-white border-[#E8DCCF]"}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="font-black text-[15px]">Mesa {m.numero}</div>
                                        <span className="text-[9px] px-2.5 py-1 rounded-full bg-black text-white font-black tracking-wider">{m.status}</span>
                                    </div>
                                    <div className="mt-3 space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold opacity-70"><MapPin size={12} /> {m.zona} • <Users size={12} /> {m.capacidade} lug • {m.pessoas_atual || 0} p</div>
                                        {m.status === "OCUPADA" && <div className="flex items-center gap-1 text-[11px] font-bold text-red-600"><Clock size={12} /> {min} min aberta</div>}
                                        {m.venda_atual_id && <div className="text-[10px] font-bold opacity-60 truncate">Venda #{String(m.venda_atual_id).slice(0,8)}</div>}
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {m.status === "LIVRE" && <button className="h-8 rounded-full bg-black text-white text-[10px] font-black">OCUPAR</button>}
                                        {m.status === "OCUPADA" && <button className="h-8 rounded-full bg-white border border-black text-black text-[10px] font-black">COMANDA</button>}
                                        {m.status === "SUJA" && <button className="h-8 rounded-full bg-emerald-600 text-white text-[10px] font-black">LIMPAR</button>}
                                        {m.status === "RESERVADA" && <button className="h-8 rounded-full bg-[#A67C52] text-white text-[10px] font-black">CHECK-IN</button>}
                                        <button className="h-8 rounded-full bg-white border border-[#E8DCCF] text-[10px] font-bold">Detalhes</button>
                                    </div>
                                </div>
                            )
                        })}
                </div>
            </div>

            {showNew && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[22px] w-full max-w-[380px] p-6 border border-[#E8DCCF] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                        <h3 className="font-black text-[14px] mb-4">Nova Mesa</h3>
                        <div className="space-y-3">
                            <input value={numero} onChange={e => setNumero(e.target.value)} placeholder="Número ex: M01" className="w-full h-11 rounded-full border border-[#E8DCCF] px-4 text-[12px] font-bold outline-none focus:border-[#A67C52]" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" value={capacidade} onChange={e => setCapacidade(Number(e.target.value))} className="w-full h-11 rounded-full border border-[#E8DCCF] px-4 text-[12px] font-bold" placeholder="Capacidade" />
                                <select value={zonaNew} onChange={e => setZonaNew(e.target.value)} className="w-full h-11 rounded-full border border-[#E8DCCF] px-4 text-[12px] font-bold bg-white">
                                    <option>Salão</option><option>Varanda</option><option>VIP</option><option>Bar</option><option>Terraço</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowNew(false)} className="flex-1 h-11 rounded-full border border-[#E8DCCF] text-[12px] font-bold">Cancelar</button>
                                <button onClick={criarMesa} disabled={saving} className="flex-1 h-11 rounded-full bg-black text-white text-[12px] font-black disabled:opacity-50">{saving? "..." : "Criar"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
