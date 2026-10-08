"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { EntidadeModal } from "./modals/criar";
import { DeleteConfirmModal } from "./modals/deletar";
import { EntidadeCard } from "./cards/entidade";
import { Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const TIPOS = ["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const;
const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };

function getAuthHeaders() {
    const token = typeof window!== "undefined"? (localStorage.getItem("access_token") || localStorage.getItem("token")) : null;
    const empresa_id = typeof window!== "undefined"? (localStorage.getItem("empresa_id") || localStorage.getItem("empresaId")) : null;
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (empresa_id) h["X-Empresa-ID"] = empresa_id;
    return h;
}
function getEmpresaId() { if (typeof window === "undefined") return null; return localStorage.getItem("empresa_id") || localStorage.getItem("empresaId") || null; }

function CustomSelect({ value, onChange, options, labelMap }: { value: string, onChange: (v: string) => void, options: string[], labelMap: Record<string,string> }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    return (
        <div ref={ref} className={`relative ${open? "z-[60]" : "z-0"} w-full`}>
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 h-10 text-[11px] font-black text-left flex items-center justify-between shadow-sm hover:border-[#A67C52] focus:ring-2 focus:ring-[#A67C52]/20 transition-all outline-none">
                <span className="truncate">{labelMap[value] || value}</span>
                <ChevronDown size={14} className={`shrink-0 ml-2 transition-transform ${open? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[100] overflow-hidden p-1.5">
                    <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
                        {options.map(opt => (<button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-full text-[11px] font-bold transition-all ${value === opt? "bg-[#A67C52] text-white shadow-sm" : "bg-white text-black hover:bg-[#F5E6D3] hover:text-[#5A3A22]"}`}>{labelMap[opt]}</button>))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function EntidadesTab() {
    const { role } = useDashboard();
    const { search: globalSearch } = useGlobalSearch();
    const canManage = ["dono","gerente","gerente_restaurante","rh","vigilante","admin","owner"].includes((role||"").toLowerCase());

    const [tipoFiltro, setTipoFiltro] = useState<"FUNCIONARIO" | "CLIENTE" | "FORNECEDOR">("FUNCIONARIO");
    const [lista, setLista] = useState<any[]>([]);
    const [perfis, setPerfis] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selected, setSelected] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [form, setForm] = useState<any>({ id: null, tipo: "FUNCIONARIO", nome: "", telefone: "", email: "", documento: "", endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "", tem_acesso_app: false, perfil_id: "", senha: "" });

    useEffect(() => { setEmpresaId(getEmpresaId()); }, []);

    const load = useCallback(async () => {
        if (!empresaId) return;
        try {
            const res = await fetch(`${API_BASE}/entidades/${empresaId}?tipo=${tipoFiltro}`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, cache: "no-store" });
            if (res.ok) setLista(await res.json());
        } catch {}
    }, [tipoFiltro, empresaId]);

    const loadPerfis = useCallback(async () => {
        if (!empresaId) return;
        try {
            const res = await fetch(`${API_BASE}/entidades/${empresaId}/perfis`, { headers: { "Content-Type": "application/json",...getAuthHeaders() } as any, cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                const m:any={};
                data.forEach((p:any)=>{m[p.slug]=p});
                setPerfis(Object.values(m) as any[]);
            }
        } catch {}
    }, [empresaId]);

    useEffect(() => { if (empresaId) { load(); loadPerfis(); } }, [load, loadPerfis]);

    // REALTIME
    useEffect(() => {
        const onCreate = (e:any) => {
            const d = e.detail?.data || e.detail;
            if (!d) return;
            // só adiciona se for do tipo atual
            if (d.tipo && d.tipo!== tipoFiltro) return;
            if (d.id &&!lista.some(x=> x.id === d.id)) {
                // se backend só mandou id/nome, faz fetch leve
                if (!d.nome) { load(); return; }
                setLista(prev => [d,...prev]);
            }
        };
        const onUpdate = (e:any) => {
            const d = e.detail?.data || e.detail;
            if (!d?.id) { load(); return; }
            setLista(prev => prev.map(x=> x.id === d.id? {...x,...d} : x));
        };
        const onDelete = (e:any) => {
            const d = e.detail?.data || e.detail;
            if (!d?.id) { load(); return; }
            setLista(prev => prev.filter(x=> x.id!== d.id));
        };
        const onFullReload = () => load();

        window.addEventListener("entidade:created" as any, onCreate);
        window.addEventListener("entidade:update" as any, onUpdate);
        window.addEventListener("entidade:deleted" as any, onDelete);
        window.addEventListener("entidade:created" as any, onCreate);
        window.addEventListener("usuario:created" as any, onFullReload);
        window.addEventListener("usuario:update" as any, onFullReload);
        // compat antigo
        window.addEventListener("usuario:created" as any, onCreate);

        return () => {
            window.removeEventListener("entidade:created" as any, onCreate);
            window.removeEventListener("entidade:update" as any, onUpdate);
            window.removeEventListener("entidade:deleted" as any, onDelete);
            window.removeEventListener("usuario:created" as any, onFullReload);
            window.removeEventListener("usuario:update" as any, onFullReload);
        };
    }, [tipoFiltro, lista, load]);

    const handleEdit = (ent: any) => { if (!canManage) return toast.error("Sem permissão"); setForm({ id: ent.id, tipo: ent.tipo, nome: ent.nome, telefone: ent.telefone||"", email: ent.email||"", documento: ent.documento||"", endereco: ent.endereco||"", cargo: ent.cargo||"", departamento: ent.departamento||"", salario: ent.salario||"", carga_horaria: ent.carga_horaria||"", data_admissao: ent.data_admissao?ent.data_admissao.split("T")[0]:"", empresa_fornecedora: ent.empresa_fornecedora||"", categoria_fornecedor: ent.categoria_fornecedor||"", tem_acesso_app: ent.tem_acesso_app||false, perfil_id: ent.perfil_id||"", senha: "" }); setOpen(true); };
    const handleDeleteClick = (ent: any) => { if (!canManage) return toast.error("Sem permissão"); setSelected(ent); setOpenDelete(true); };

    const handleSave = async () => {
        if (!empresaId) return;
        if (!canManage) return;
        setSaving(true);
        try {
            const clean=(v:any)=>v===""||v===undefined?null:typeof v==='string'?(v.trim()||null):v;
            const payload:any={
                tipo:form.tipo, nome:form.nome.trim(), telefone:clean(form.telefone), email:clean(form.email)?.toLowerCase()||null,
                documento:clean(form.documento), endereco:clean(form.endereco), cargo:clean(form.cargo), departamento:clean(form.departamento),
                empresa_fornecedora:clean(form.empresa_fornecedora), categoria_fornecedor:clean(form.categoria_fornecedor),
                tem_acesso_app:!!form.tem_acesso_app, perfil_id:clean(form.perfil_id), data_admissao:clean(form.data_admissao),
                salario:form.salario?Number(form.salario):null, carga_horaria:form.carga_horaria?Number(form.carga_horaria):null,
            };
            if(form.senha?.trim().length>=6) payload.senha=form.senha.trim();
            if(!payload.tem_acesso_app) payload.perfil_id=null;
            const url=form.id?`${API_BASE}/entidades/${empresaId}/${form.id}`:`${API_BASE}/entidades/${empresaId}`;
            const method=form.id?"PUT":"POST";
            const res=await fetch(url,{method,headers:{"Content-Type":"application/json",...getAuthHeaders()} as any,body:JSON.stringify(payload)});
            const json=await res.json().catch(()=>({}));
            if(!res.ok) throw new Error(json.detail||"Erro");
            if(form.id){ setLista(p=>p.map(x=>x.id===json.id?json:x)); toast.success("Atualizado"); }
            else { setLista(p=>[json,...p]); toast.success("Criado"); }
            setOpen(false);
        } catch(e:any){ toast.error(e.message); } finally { setSaving(false); }
    };

    const confirmDelete = async () => {
        if(!selected||!empresaId) return;
        setDeleting(true);
        const backup=lista;
        setLista(p=>p.filter(x=>x.id!==selected.id));
        try {
            const res=await fetch(`${API_BASE}/entidades/${empresaId}/${selected.id}`,{method:"DELETE",headers:{"Content-Type":"application/json",...getAuthHeaders()} as any});
            if(!res.ok) throw new Error();
            toast.success("Apagado");
            setOpenDelete(false);
        } catch { setLista(backup); toast.error("Erro"); } finally { setDeleting(false); }
    };

    const filtered = lista.filter(l => {
        const s = globalSearch.toLowerCase();
        return l.nome.toLowerCase().includes(s) || (l.telefone||"").includes(s) || (l.email||"").toLowerCase().includes(s);
    });

    if (!empresaId) return <div className="p-6 text-[12px] font-bold opacity-60">Carregando...</div>;

    return (
        <>
            <div className="w-full space-y-3 md:space-y-4 relative">
                <div className="w-full flex items-center justify-between gap-2.5 md:gap-3">
                    <div className="flex-1 sm:flex-none sm:w-[180px] md:w-[200px]">
                        <CustomSelect value={tipoFiltro} onChange={(v) => setTipoFiltro(v as any)} options={[...TIPOS]} labelMap={TIPO_LABELS} />
                    </div>
                    <div className="flex-1 hidden sm:block" />
                    {canManage && (
                        <button onClick={() => { setForm({ id: null, tipo: tipoFiltro, nome: "", telefone: "", email: "", documento: "", endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "", tem_acesso_app: false, perfil_id: "", senha: "" }); setOpen(true); }} className="h-10 px-4 md:w-10 md:px-0 bg-black text-white rounded-full flex items-center justify-center gap-1.5 shadow-md hover:bg-zinc-800 active:scale-95 transition-all shrink-0">
                            <Plus size={18} strokeWidth={3} /><span className="md:hidden text-[12px] font-black">Novo</span>
                        </button>
                    )}
                </div>

                <div className="grid gap-2.5 md:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {filtered.length === 0? <div className="col-span-full text-center py-12 md:py-10 text-[12px] opacity-50 font-bold border border-dashed border-[#E8DCCF] rounded-[18px] md:rounded-[22px] bg-white/50">Nenhum {TIPO_LABELS[tipoFiltro]} {globalSearch && `para "${globalSearch}"`}</div> : filtered.map(ent => <EntidadeCard key={ent.id} ent={ent} onEdit={handleEdit} onDelete={handleDeleteClick} canManage={canManage} />)}
                </div>
            </div>
            <EntidadeModal open={open} setOpen={setOpen} form={form} setForm={setForm} perfis={perfis} saving={saving} onSave={handleSave} />
            <DeleteConfirmModal open={openDelete} setOpen={setOpenDelete} entidade={selected} onConfirm={confirmDelete} loading={deleting} />
        </>
    );
}
