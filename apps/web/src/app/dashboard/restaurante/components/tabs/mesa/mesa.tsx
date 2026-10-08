"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, QrCode, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { MesaCard } from "./cards/mesa";
import { MesaModal } from "./modals/criar";
import { MesaOcuparModal } from "./modals/ocupar";
import { MesaComandaModal } from "./modals/comanda";
import { MesaDeleteModal } from "./modals/deletar";
import { MesaQrModal } from "./modals/qr";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const STATUS_OPTS = ["", "LIVRE", "OCUPADA", "RESERVADA", "SUJA"] as const;
const STATUS_LABELS: Record<string, string> = { "": "Todos status", LIVRE: "Livre", OCUPADA: "Ocupada", RESERVADA: "Reservada", SUJA: "Suja" };

function getAuthHeaders() {
  const t = typeof window!== "undefined"? (localStorage.getItem("access_token") || localStorage.getItem("token")) : null;
  const e = typeof window!== "undefined"? (localStorage.getItem("empresa_id") || localStorage.getItem("empresaId")) : null;
  const h: any = {};
  if (t) h["Authorization"] = `Bearer ${t}`;
  if (e) h["X-Empresa-ID"] = e;
  return h;
}
function getEmpresaId() { return typeof window!== "undefined"? (localStorage.getItem("empresa_id") || localStorage.getItem("empresaId")) : null; }

function CustomSelect({ value, onChange, options, labelMap }: { value: string, onChange: (v: string) => void, options: string[], labelMap: Record<string, string> }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    return (
        <div ref={ref} className={`relative ${open? "z-[60]" : "z-0"} w-full`}>
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 py-2.5 text-[11px] font-black text-left flex items-center justify-between shadow-sm hover:border-[#A67C52] h-10 md:h-auto">
                <span className="truncate">{labelMap[value] || value || "Todos"}</span>
                <ChevronDown size={14} className={`ml-2 ${open? "rotate-180" : ""} transition-transform`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[100] p-1.5">
                    <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
                        {options.map(opt => (<button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-full text-[11px] font-bold ${value === opt? "bg-[#A67C52] text-white" : "bg-white hover:bg-[#F5E6D3]"}`}>{labelMap[opt]?? (opt===""? "Todos" : opt)}</button>))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function MesasTab() {
    const { role, setActiveTab } = useDashboard();
    const { search: globalSearch } = useGlobalSearch();
    const canManage = ["dono","gerente","gerente_restaurante","admin","owner"].includes((role||"").toLowerCase());
    const [mesas, setMesas] = useState<any[]>([]);
    const [zonas, setZonas] = useState<string[]>([]);
    const [zona, setZona] = useState("");
    const [status, setStatus] = useState("");
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showNew, setShowNew] = useState(false);
    const [numero, setNumero] = useState("");
    const [capacidade, setCapacidade] = useState(4);
    const [zonaNew, setZonaNew] = useState("Salão");
    const [saving, setSaving] = useState(false);
    const [mesaAlvo, setMesaAlvo] = useState<any>(null);
    const [showOcupar, setShowOcupar] = useState(false);
    const [showComanda, setShowComanda] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [editingMesa, setEditingMesa] = useState<any>(null);
    const [showDelete, setShowDelete] = useState(false);
    const [mesaParaDeletar, setMesaParaDeletar] = useState<any>(null);

    useEffect(() => { setEmpresaId(getEmpresaId()); }, []);

    const load = useCallback(async () => {
        if (!empresaId) return;
        setLoading(true);
        try {
            const p = new URLSearchParams();
            if (zona) p.append("zona", zona);
            if (status) p.append("status", status);
            if (globalSearch) p.append("search", globalSearch);
            const res = await fetch(`${API_BASE}/mesas/${empresaId}?${p.toString()}`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, cache: "no-store" });
            if (res.ok) setMesas(await res.json());
        } finally { setLoading(false); }
    }, [empresaId, zona, status, globalSearch]);

    const loadZonas = useCallback(async () => {
        if (!empresaId) return;
        const r = await fetch(`${API_BASE}/mesas/${empresaId}/zonas`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any });
        if (r.ok) setZonas(await r.json());
    }, [empresaId]);

    useEffect(() => { if (empresaId) { load(); loadZonas(); } }, [load, loadZonas]);
    useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [globalSearch]);

    // REALTIME MESAS
    useEffect(() => {
        const onMesa = (e:any) => {
            const d = e.detail?.data || e.detail;
            if (!d) { load(); return; }
            // evento completo com id
            if (d.id) {
                setMesas(prev => {
                    const exists = prev.find(m=> m.id === d.id);
                    if (!exists) return [...prev, d];
                    return prev.map(m=> m.id === d.id? {...m,...d} : m);
                });
                // se mudar zona, atualiza lista de zonas
                if (d.zona &&!zonas.includes(d.zona)) setZonas(z=> [...z, d.zona]);
            } else {
                load();
            }
        };
        const onDelete = (e:any) => {
            const d = e.detail?.data || e.detail;
            if (d?.id) setMesas(prev=> prev.filter(m=> m.id!== d.id));
            else load();
        };
        const onFull = () => load();

        window.addEventListener("mesa:update" as any, onMesa);
        window.addEventListener("mesa:atualizado" as any, onMesa);
        window.addEventListener("mesa:created" as any, onMesa);
        window.addEventListener("mesa:deleted" as any, onDelete);
        window.addEventListener("mesa:ocupada" as any, onMesa);
        window.addEventListener("mesa:liberada" as any, onMesa);

        return () => {
            window.removeEventListener("mesa:update" as any, onMesa);
            window.removeEventListener("mesa:atualizado" as any, onMesa);
            window.removeEventListener("mesa:created" as any, onMesa);
            window.removeEventListener("mesa:deleted" as any, onDelete);
            window.removeEventListener("mesa:ocupada" as any, onMesa);
            window.removeEventListener("mesa:liberada" as any, onMesa);
        };
    }, [load, zonas]);

    const criarMesa = async () => {
        if (!numero.trim()) return toast.error("Número obrigatório");
        if (!empresaId) return;
        setSaving(true);
        try {
            const isEditing =!!editingMesa;
            const url = isEditing? `${API_BASE}/mesas/${empresaId}/${editingMesa.id}` : `${API_BASE}/mesas/${empresaId}`;
            const method = isEditing? "PUT" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, body: JSON.stringify({ numero: numero.trim().toUpperCase(), capacidade: Number(capacidade), zona: zonaNew }) });
            const j = await res.json().catch(()=>({}));
            if (!res.ok) throw new Error(j.detail||"Erro");
            toast.success(isEditing? `Mesa ${j.numero} atualizada` : `Mesa ${j.numero} criada`);
            setShowNew(false); setNumero(""); setEditingMesa(null);
            // otimista
            setMesas(prev=> isEditing? prev.map(m=> m.id===j.id? j : m) : [...prev, j]);
            loadZonas();
        } catch (e:any) { toast.error(e.message); } finally { setSaving(false); }
    };

    const handleEditClick = (m:any) => { if (!canManage) return toast.error("Sem permissão"); setEditingMesa(m); setNumero(m.numero); setCapacidade(m.capacidade); setZonaNew(m.zona||"Salão"); setShowNew(true); };
    const handleDeleteClick = (m:any) => { if (!canManage) return toast.error("Sem permissão"); if (m.status==="OCUPADA") return toast.error("Não pode apagar mesa ocupada"); setMesaParaDeletar(m); setShowDelete(true); };
    const confirmDelete = async () => {
        if (!mesaParaDeletar||!empresaId) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/mesas/${empresaId}/${mesaParaDeletar.id}`, { method: "DELETE", headers: { "Content-Type": "application/json",...getAuthHeaders() } as any });
            if (!res.ok) throw new Error("Erro ao apagar");
            toast.success(`Mesa ${mesaParaDeletar.numero} apagada`);
            setMesas(prev=>prev.filter(x=>x.id!==mesaParaDeletar.id));
            setShowDelete(false); setMesaParaDeletar(null);
        } catch (e:any){ toast.error(e.message); } finally { setSaving(false); }
    };
    const handleOcupar = async (pessoas:number) => {
        if (!mesaAlvo||!empresaId) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/mesas/${empresaId}/${mesaAlvo.id}/ocupar`, { method:"POST", headers:{"Content-Type":"application/json",...getAuthHeaders()} as any, body: JSON.stringify({ pessoas }) });
            const j = await res.json().catch(()=>({}));
            if (!res.ok) throw new Error(j.detail||"Erro ao ocupar");
            setMesas(prev=>prev.map(m=>m.id===j.id? j : m));
            toast.success(`Mesa ${j.numero} ocupada`); setShowOcupar(false); setMesaAlvo(null);
        } catch (e:any){ toast.error(e.message); } finally { setSaving(false); }
    };
    const handleLimpar = async (m:any) => {
        try{
            const res=await fetch(`${API_BASE}/mesas/${empresaId}/${m.id}/limpar`,{method:"POST",headers:{"Content-Type":"application/json",...getAuthHeaders()} as any});
            if(!res.ok) throw new Error("Erro");
            const j = await res.json().catch(()=> ({...m, status:"LIVRE"}));
            toast.success("Mesa limpa");
            setMesas(prev=>prev.map(x=>x.id===m.id? j : x));
        }catch(e:any){toast.error(e.message);}
    };
    const handleLiberar = async (m:any) => {
        try{
            const res=await fetch(`${API_BASE}/mesas/${empresaId}/${m.id}/liberar?limpar=true`,{method:"POST",headers:{"Content-Type":"application/json",...getAuthHeaders()} as any});
            if(!res.ok) throw new Error("Erro");
            const j = await res.json().catch(()=> ({...m, status:"LIVRE", venda_atual_id:null}));
            toast.success("Mesa liberada");
            setMesas(prev=>prev.map(x=>x.id===m.id? j : x));
        }catch(e:any){toast.error(e.message);}
    };

    const handleFecharMesa = (m:any) => {
        if(!m.venda_atual_id) return toast.error("Mesa sem venda ativa");
        localStorage.setItem("fechar_mesa", JSON.stringify({
            mesa_id: m.id,
            mesa_numero: m.numero,
            venda_id: m.venda_atual_id,
            cliente_nome: m.cliente_atual || `Mesa ${m.numero}`,
            total: m.venda_total || m.total_consumo || 0
        }));
        toast.success(`Fechando Mesa ${m.numero}...`);
        setActiveTab("vendas");
    };

    if (!empresaId) return <div className="p-6 text-[12px] font-bold opacity-60">Carregando empresa...</div>;

    return (
        <>
            <div className="w-full space-y-3 md:space-y-4">
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 md:gap-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex-1 sm:w-[180px]"><CustomSelect value={zona} onChange={setZona} options={["",...zonas]} labelMap={{"":"Todas zonas",...Object.fromEntries(zonas.map(z=>[z,z]))}} /></div>
                        <div className="flex-1 sm:w-[180px]"><CustomSelect value={status} onChange={setStatus} options={[...STATUS_OPTS]} labelMap={STATUS_LABELS} /></div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button onClick={()=>setShowQr(true)} className="w-10 h-10 bg-white border border-black/10 rounded-full flex items-center justify-center shadow-sm hover:bg-black hover:text-white active:scale-95"><QrCode size={18} /></button>
                        {canManage && <button onClick={()=>{setEditingMesa(null); setNumero(""); setCapacidade(4); setZonaNew("Salão"); setShowNew(true);}} className="h-10 px-4 md:w-10 md:px-0 bg-black text-white rounded-full flex items-center justify-center gap-1.5 shadow-md hover:bg-zinc-800 active:scale-95"><Plus size={18} strokeWidth={3} /><span className="md:hidden text-[12px] font-black">Nova</span></button>}
                    </div>
                </div>

                {loading? (
                    <div className="grid gap-2.5 md:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{[1,2,3,4,5,6,7,8,9,10].map(i=><div key={i} className="h-[260px] rounded-[22px] bg-zinc-100 animate-pulse" />)}</div>
                ) : (
                    <div className="grid gap-2.5 md:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                        {mesas.length===0? <div className="col-span-full py-12 text-center border border-dashed rounded-[22px] bg-white/50 text-[13px] font-black">Nenhuma mesa encontrada</div> : mesas.map(m=>(
                            <div key={m.id} className="flex flex-col gap-2">
                                <MesaCard m={m} canManage={canManage} onEdit={handleEditClick} onDelete={handleDeleteClick} onOcupar={(mm:any)=>{setMesaAlvo(mm); setShowOcupar(true);}} onComanda={(mm:any)=>{setMesaAlvo(mm); setShowComanda(true);}} onFechar={handleFecharMesa} onLimpar={handleLimpar} onLiberar={handleLiberar} onDetalhe={(mm:any)=>{setMesaAlvo(mm); setShowComanda(true);}} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <MesaModal open={showNew} onClose={()=>{setShowNew(false); setEditingMesa(null); setNumero("");}} numero={numero} setNumero={setNumero} capacidade={capacidade} setCapacidade={setCapacidade} zonaNew={zonaNew} setZonaNew={setZonaNew} onCreate={criarMesa} saving={saving} isEditing={!!editingMesa} />
            <MesaOcuparModal open={showOcupar} mesa={mesaAlvo} onClose={()=>{setShowOcupar(false); setMesaAlvo(null);}} onConfirm={handleOcupar} saving={saving} />
            <MesaComandaModal open={showComanda} mesa={mesaAlvo} onClose={()=>{setShowComanda(false); setMesaAlvo(null);}} />
            <MesaDeleteModal open={showDelete} mesa={mesaParaDeletar} saving={saving} onClose={()=>setShowDelete(false)} onConfirm={confirmDelete} />
            <MesaQrModal open={showQr} onClose={()=>setShowQr(false)} empresaId={empresaId!} mesas={mesas} />
        </>
    );
}
