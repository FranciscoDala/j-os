"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { EntidadeModal } from "./modals/criar";
import { Search, Trash2, Pencil, Plus } from "lucide-react";
import { toast, Toaster } from "sonner";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/^http/, "ws").replace(/\/$/, "");
const TIPOS = ["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const;
const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };

function getEmpresaId() {
    if (typeof window === "undefined") return null;
    const direct = localStorage.getItem("empresa_id") || localStorage.getItem("empresaId") || localStorage.getItem("empresaID");
    if (direct && direct!== "null" && direct!== "undefined") return direct;
    try {
        const userStr = localStorage.getItem("user") || localStorage.getItem("usuario") || "";
        if (userStr) {
            const user = JSON.parse(userStr);
            const id = user?.empresa_id || user?.empresaId || user?.empresa?.id;
            if (id) return String(id);
        }
    } catch {}
    return null;
}

// CARD IGUAL PRODUTO
function EntidadeCard({ ent, onDelete }: { ent: any, onDelete: (id: string, nome: string) => void }) {
    const initials = ent.nome?.slice(0,2).toUpperCase() || "EN";
    const isFunc = ent.tipo === "FUNCIONARIO";
    const cargo = ent.cargo || ent.departamento || ent.email || TIPO_LABELS[ent.tipo];

    return (
        <div className="group relative rounded-[22px] p-2.5 pt-3 pb-3.5 md:p-3 md:pt-3.5 md:pb-4 bg-white border border-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col items-center text-center hover:shadow-[0_14px_36px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden w-full select-none">
            <div className="absolute top-2.5 right-2.5 flex gap-[2px] opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button onClick={() => onDelete(ent.id, ent.nome)} className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"><Trash2 size={13} /></button>
            </div>

            <div className="relative w-[122px] h-[122px] md:w-[118px] md:h-[118px] shrink-0">
                <div className="w-full h-full rounded-full p-[3px] shadow-inner bg-[#F5E6D3]">
                    {ent.foto_url? (
                        <img src={ent.foto_url} className="w-full h-full rounded-full object-cover" alt={ent.nome} />
                    ) : (
                        <div className="w-full h-full rounded-full bg-black text-white flex items-center justify-center text-[28px] font-black">{initials}</div>
                    )}
                </div>
                <div className="absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black shadow-md border-2 border-white z-10 bg-[#A67C52] text-white">
                    {ent.tipo?.[0] || "F"}
                </div>
                {ent.tem_acesso_app && (
                    <div className="absolute top-[32px] -left-1 z-10 bg-black text-white text-[8px] font-black px-3 py-1 rounded-full shadow-sm border border-white">APP</div>
                )}
            </div>

            <h3 className="mt-2.5 font-black text-[12.5px] md:text-[12px] leading-[1.15] text-black tracking-tight w-full px-1.5 break-words line-clamp-2">{ent.nome}</h3>
            <p className="mt-1 text-[10px] leading-[1.15] text-[#6B6B6B] w-full px-2 h-[28px] line-clamp-2 overflow-hidden">{cargo}</p>

            <div className="mt-2.5 bg-black text-white rounded-full px-4 py-[4px] flex items-baseline gap-1 shadow-sm">
                <span className="text-[8px] font-bold opacity-90">{ent.telefone? "TEL" : "ID"}</span>
                <span className="text-[11px] font-black tracking-wide truncate max-w-[80px]">{ent.telefone || ent.documento || "—"}</span>
            </div>
            {!ent.ativo && <span className="mt-1.5 text-[7px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-bold">INATIVO</span>}
        </div>
    )
}

export function EntidadesTab() {
    const [tipoFiltro, setTipoFiltro] = useState<"FUNCIONARIO" | "CLIENTE" | "FORNECEDOR">("FUNCIONARIO");
    const [lista, setLista] = useState<any[]>([]);
    const [perfis, setPerfis] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    const [form, setForm] = useState<any>({
        tipo: "FUNCIONARIO", nome: "", telefone: "", email: "", documento: "",
        endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "",
        data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "",
        tem_acesso_app: false, perfil_id: "", senha: ""
    });

    useEffect(() => { setEmpresaId(getEmpresaId()); }, []);

    const load = useCallback(async () => {
        if (!empresaId) return;
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/entidades/${empresaId}?tipo=${tipoFiltro}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setLista(await res.json());
        } catch {}
    }, [tipoFiltro, empresaId]);

    const loadPerfis = useCallback(async () => {
        if (!empresaId) return;
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE}/entidades/${empresaId}/perfis`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                // DEDUP NO FRONTEND TAMBEM (se backend ainda não rodou SQL)
                const uniq = Object.values(data.reduce((acc:any, cur:any) => { acc[cur.slug] = cur; return acc; }, {}));
                setPerfis(uniq as any[]);
            }
        } catch {}
    }, [empresaId]);

    useEffect(() => { if (empresaId) { load(); loadPerfis(); } }, [load, loadPerfis, empresaId]);

    // REALTIME - atualiza sem refresh
    useEffect(() => {
        if (!empresaId) return;
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        if (!token) return;

        // Tenta conectar no seu sistema de realtime (você já tem [RT_RAW] no layout)
        // escuta eventos globais que seu layout já emite
        const handleRT = (e: any) => {
            const detail = e.detail || e;
            if (detail?.type === "entidade:created" || detail?.event === "entidade:created") {
                const nova = detail.data || detail;
                if (nova.tipo === tipoFiltro ||!nova.tipo) {
                    setLista(prev => [nova,...prev.filter(p => p.id!== nova.id)]);
                }
            }
            if (detail?.type === "entidade:deleted" || detail?.event === "entidade:deleted") {
                const id = detail.data?.id || detail.id;
                setLista(prev => prev.filter(p => p.id!== id));
            }
        };

        window.addEventListener("rt:entidade:created" as any, handleRT);
        window.addEventListener("rt:entidade:deleted" as any, handleRT);
        // fallback: seu layout emite via postMessage ou custom event genérico
        window.addEventListener("realtime" as any, handleRT);

        return () => {
            window.removeEventListener("rt:entidade:created" as any, handleRT);
            window.removeEventListener("rt:entidade:deleted" as any, handleRT);
            window.removeEventListener("realtime" as any, handleRT);
        };
    }, [empresaId, tipoFiltro]);

    const handleSave = async () => {
        if (!empresaId) return toast.error("Empresa não encontrada");
        if (!form.nome?.trim()) return toast.error("Nome obrigatório");
        if (form.tipo === "FUNCIONARIO" &&!form.cargo?.trim()) return toast.error("Cargo obrigatório");
        if (form.tem_acesso_app) {
            if (!form.perfil_id) return toast.error("Selecione o perfil");
            if (!form.senha || form.senha.length < 6) return toast.error("Senha mínimo 6");
            if (!form.email) return toast.error("Email obrigatório");
        }
        setSaving(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const clean = (v: any) => {
                if (v === "" || v === undefined || v === "undefined" || v === "null") return null;
                if (typeof v === 'string') { const t = v.trim(); return t === ""? null : t; }
                return v;
            };
            const payload: any = {
                tipo: form.tipo, nome: form.nome.trim(),
                telefone: clean(form.telefone), email: clean(form.email)?.toLowerCase() || null,
                documento: clean(form.documento), endereco: clean(form.endereco),
                cargo: clean(form.cargo), departamento: clean(form.departamento),
                empresa_fornecedora: clean(form.empresa_fornecedora),
                categoria_fornecedor: clean(form.categoria_fornecedor),
                tem_acesso_app:!!form.tem_acesso_app,
                perfil_id: clean(form.perfil_id), senha: clean(form.senha),
                data_admissao: clean(form.data_admissao),
                salario: form.salario? Number(form.salario) : null,
                carga_horaria: form.carga_horaria? Number(form.carga_horaria) : null,
            };
            if (!payload.tem_acesso_app) { payload.perfil_id = null; payload.senha = null; }

            const res = await fetch(`${API_BASE}/entidades/${empresaId}`, {
                method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (Array.isArray(json.detail)) throw new Error(json.detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join(', '));
                throw new Error(json.detail || "Erro ao criar");
            }
            // ATUALIZA NA HORA - sem load()
            const novo = json;
            setLista(prev => [novo,...prev]);
            toast.success(`${form.nome} criado!`);
            setOpen(false);
            setForm({ tipo: tipoFiltro, nome: "", telefone: "", email: "", documento: "", endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "", tem_acesso_app: false, perfil_id: "", senha: "" });
        } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string, nome: string) => {
        if (!confirm(`Apagar ${nome}?`)) return;
        // otimista
        const backup = lista;
        setLista(prev => prev.filter(p => p.id!== id));
        try {
            if (!empresaId) return;
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/entidades/${empresaId}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Erro ao apagar");
            toast.success(`${nome} apagado`);
        } catch {
            setLista(backup);
            toast.error("Erro ao apagar");
        }
    };

    const filtered = lista.filter(l => l.nome.toLowerCase().includes(search.toLowerCase()));

    if (!empresaId) return <div className="p-6 text-[12px] font-bold opacity-60">Carregando empresa...</div>

    return (
        <>
            <Toaster position="top-right" richColors />
            <div className="bg-white/70 rounded-[18px] p-4 md:p-6 border space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value as any)} className="bg-white border rounded-full px-5 py-2.5 text-[11px] font-black">
                        {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border rounded-full px-3 gap-2"><Search size={14} className="opacity-40" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." className="bg-transparent outline-none text-[12px] py-2.5 w-[140px]" /></div>
                        <button onClick={() => { setForm({...form, tipo: tipoFiltro }); setOpen(true); }} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"><Plus size={18} /></button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filtered.length === 0? (
                        <div className="col-span-full text-center py-10 text-[12px] opacity-50 font-bold">Nenhum {TIPO_LABELS[tipoFiltro]} encontrado</div>
                    ) : filtered.map(ent => (
                        <EntidadeCard key={ent.id} ent={ent} onDelete={handleDelete} />
                    ))}
                </div>
            </div>
            <EntidadeModal open={open} setOpen={setOpen} form={form} setForm={setForm} perfis={perfis} saving={saving} onSave={handleSave} />
        </>
    );
}
