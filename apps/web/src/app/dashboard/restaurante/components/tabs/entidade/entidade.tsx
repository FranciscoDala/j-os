"use client";
import { useEffect, useState, useCallback } from "react";
import { EntidadeModal } from "./modals/criar";
import { DeleteConfirmModal } from "./modals/deletar";
import { EntidadeCard } from "./cards/entidade";
import { Search, Plus } from "lucide-react";
import { toast, Toaster } from "sonner";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const TIPOS = ["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const;
const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };

function getEmpresaId() {
    if (typeof window === "undefined") return null;
    const direct = localStorage.getItem("empresa_id") || localStorage.getItem("empresaId");
    if (direct && direct!== "null") return direct;
    try {
        const userStr = localStorage.getItem("user") || "";
        const user = JSON.parse(userStr);
        return user?.empresa_id || user?.empresaId || null;
    } catch { return null; }
}

export function EntidadesTab() {
    const [tipoFiltro, setTipoFiltro] = useState<"FUNCIONARIO" | "CLIENTE" | "FORNECEDOR">("FUNCIONARIO");
    const [lista, setLista] = useState<any[]>([]);
    const [perfis, setPerfis] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [selected, setSelected] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState("");
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const [form, setForm] = useState<any>({
        id: null, tipo: "FUNCIONARIO", nome: "", telefone: "", email: "", documento: "",
        endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "",
        data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "",
        tem_acesso_app: false, perfil_id: "", senha: ""
    });

    useEffect(() => { setEmpresaId(getEmpresaId()); }, []);

    const load = useCallback(async () => {
        if (!empresaId) return;
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/entidades/${empresaId}?tipo=${tipoFiltro}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setLista(await res.json());
    }, [tipoFiltro, empresaId]);

    const loadPerfis = useCallback(async () => {
        if (!empresaId) return;
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/entidades/${empresaId}/perfis`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            const uniq = Object.values(data.reduce((acc:any, cur:any) => { acc[cur.slug] = cur; return acc; }, {}));
            setPerfis(uniq as any[]);
        }
    }, [empresaId]);

    useEffect(() => { if (empresaId) { load(); loadPerfis(); } }, [load, loadPerfis]);

    const handleEdit = (ent: any) => {
        setForm({
            id: ent.id, tipo: ent.tipo, nome: ent.nome, telefone: ent.telefone || "", email: ent.email || "",
            documento: ent.documento || "", endereco: ent.endereco || "", cargo: ent.cargo || "",
            departamento: ent.departamento || "", salario: ent.salario || "", carga_horaria: ent.carga_horaria || "",
            data_admissao: ent.data_admissao || "", empresa_fornecedora: ent.empresa_fornecedora || "",
            categoria_fornecedor: ent.categoria_fornecedor || "", tem_acesso_app: ent.tem_acesso_app || false,
            perfil_id: ent.perfil_id || "", senha: ""
        });
        setOpen(true);
    };

    const handleDeleteClick = (ent: any) => {
        setSelected(ent);
        setOpenDelete(true);
    };

    const handleSave = async () => {
        if (!empresaId) return toast.error("Empresa não encontrada");
        if (!form.nome?.trim()) return toast.error("Nome obrigatório");
        setSaving(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const clean = (v: any) => (v === "" || v === undefined? null : typeof v === 'string'? (v.trim() || null) : v);
            const payload: any = {
                tipo: form.tipo, nome: form.nome.trim(), telefone: clean(form.telefone),
                email: clean(form.email)?.toLowerCase() || null, documento: clean(form.documento),
                endereco: clean(form.endereco), cargo: clean(form.cargo), departamento: clean(form.departamento),
                empresa_fornecedora: clean(form.empresa_fornecedora), categoria_fornecedor: clean(form.categoria_fornecedor),
                tem_acesso_app:!!form.tem_acesso_app, perfil_id: clean(form.perfil_id), senha: clean(form.senha),
                data_admissao: clean(form.data_admissao), salario: form.salario? Number(form.salario) : null,
                carga_horaria: form.carga_horaria? Number(form.carga_horaria) : null,
            };
            if (!payload.tem_acesso_app) { payload.perfil_id = null; payload.senha = null; }

            const isEdit =!!form.id;
            const url = isEdit? `${API_BASE}/entidades/${empresaId}/${form.id}` : `${API_BASE}/entidades/${empresaId}`;
            const method = isEdit? "PUT" : "POST";

            const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.detail || "Erro ao salvar");

            if (isEdit) {
                setLista(prev => prev.map(p => p.id === json.id? json : p));
                toast.success("Atualizado!");
            } else {
                setLista(prev => [json,...prev]);
                toast.success("Criado!");
            }
            setOpen(false);
            setForm({ id: null, tipo: tipoFiltro, nome: "", telefone: "", email: "", documento: "", endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "", tem_acesso_app: false, perfil_id: "", senha: "" });
        } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
    };

    const confirmDelete = async () => {
        if (!selected ||!empresaId) return;
        setDeleting(true);
        const backup = lista;
        setLista(prev => prev.filter(p => p.id!== selected.id));
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/entidades/${empresaId}/${selected.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Erro ao apagar");
            toast.success(`${selected.nome} apagado`);
            setOpenDelete(false);
        } catch {
            setLista(backup);
            toast.error("Erro ao apagar");
        } finally { setDeleting(false); }
    };

    const filtered = lista.filter(l => l.nome.toLowerCase().includes(search.toLowerCase()));

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
                        <button onClick={() => { setForm({ id: null, tipo: tipoFiltro, nome: "", telefone: "", email: "", documento: "", endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "", tem_acesso_app: false, perfil_id: "", senha: "" }); setOpen(true); }} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"><Plus size={18} /></button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filtered.length === 0? <div className="col-span-full text-center py-10 text-[12px] opacity-50 font-bold">Nenhum {TIPO_LABELS[tipoFiltro]}</div> : filtered.map(ent => (
                        <EntidadeCard key={ent.id} ent={ent} onEdit={handleEdit} onDelete={handleDeleteClick} />
                    ))}
                </div>
            </div>
            <EntidadeModal open={open} setOpen={setOpen} form={form} setForm={setForm} perfis={perfis} saving={saving} onSave={handleSave} />
            <DeleteConfirmModal open={openDelete} setOpen={setOpenDelete} entidade={selected} onConfirm={confirmDelete} loading={deleting} />
        </>
    );
}
