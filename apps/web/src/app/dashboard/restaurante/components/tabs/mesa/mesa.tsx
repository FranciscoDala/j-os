"use client";
import { useEffect, useState, useCallback } from "react";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { MesaCard } from "./cards/mesa";
import { MesaModal } from "./modals/criar";
import { CustomSelect } from "./cards/CustomSelect";

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

export function MesasTab() {
  const { role } = useDashboard();
  const canManage = ["dono", "gerente", "gerente_restaurante", "admin", "owner"].includes((role || "").toLowerCase());
  const [mesas, setMesas] = useState<any[]>([]);
  const [zonas, setZonas] = useState<string[]>([]);
  const [zona, setZona] = useState(""); const [status, setStatus] = useState(""); const [search, setSearch] = useState("");
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false); const [numero, setNumero] = useState(""); const [capacidade, setCapacidade] = useState(4); const [zonaNew, setZonaNew] = useState("Salão"); const [saving, setSaving] = useState(false);

  useEffect(() => { setEmpresaId(getEmpresaId()); }, []);
  const load = useCallback(async () => {
    if (!empresaId) return;
    const params = new URLSearchParams(); if (zona) params.append("zona", zona); if (status) params.append("status", status); if (search) params.append("search", search);
    const res = await fetch(`${API_BASE}/mesas/${empresaId}?${params.toString()}`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, cache: "no-store" });
    if (res.ok) setMesas(await res.json());
  }, [empresaId, zona, status, search]);
  const loadZonas = useCallback(async () => {
    if (!empresaId) return;
    const res = await fetch(`${API_BASE}/mesas/${empresaId}/zonas`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any });
    if (res.ok) setZonas(await res.json());
  }, [empresaId]);
  useEffect(() => { if (empresaId) { load(); loadZonas(); } }, [load, loadZonas]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  const criarMesa = async () => {
    if (!numero.trim()) return toast.error("Número obrigatório"); if (!empresaId) return; setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/mesas/${empresaId}`, { method: "POST", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, body: JSON.stringify({ numero: numero.trim().toUpperCase(), capacidade: Number(capacidade), zona: zonaNew }) });
      const json = await res.json().catch(() => ({})); if (!res.ok) throw new Error(json.detail || "Erro");
      toast.success(`Mesa ${json.numero} criada`); setShowNew(false); setNumero(""); setCapacidade(4); load(); loadZonas();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  if (!empresaId) return <div className="p-6 text-[12px] font-bold opacity-60">Carregando...</div>;

  return (
    <>
      <div className="space-y-4 w-full">
        {/* FILTROS + BTN NA MESMA LINHA RIGHT */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <CustomSelect value={zona} onChange={setZona} options={["",...zonas]} labelMap={{ "": "Todas zonas",...Object.fromEntries(zonas.map(z => [z, z])) }} />
            <CustomSelect value={status} onChange={setStatus} options={[...STATUS_OPTS]} labelMap={STATUS_LABELS} />
            <div className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 py-2.5 flex items-center gap-2 shadow-sm">
              <Search size={14} className="opacity-40 shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Mesa M01..." className="bg-transparent outline-none text-[11px] font-bold w-full" />
            </div>
          </div>
          {canManage && <button onClick={() => setShowNew(true)} className="shrink-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-md hover:bg-zinc-800"><Plus size={18} /></button>}
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mesas.length === 0? <div className="col-span-full text-center py-10 text-[12px] opacity-50 font-bold">Nenhuma mesa</div> : mesas.map(m => <MesaCard key={m.id} m={m} />)}
        </div>
      </div>
      <MesaModal open={showNew} onClose={() => setShowNew(false)} numero={numero} setNumero={setNumero} capacidade={capacidade} setCapacidade={setCapacidade} zonaNew={zonaNew} setZonaNew={setZonaNew} onCreate={criarMesa} saving={saving} />
    </>
  );
}
