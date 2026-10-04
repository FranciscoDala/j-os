"use client";
import { useEffect, useState, useCallback } from "react";
import { EntidadeModal } from "./modals/criar";
import { DeleteConfirmModal } from "./modals/deletar";
import { EntidadeCard } from "./cards/entidade";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const TIPOS = ["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const;
const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };

function getEmpresaId() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("empresa_id") || localStorage.getItem("empresaId") || null;
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
    const [form, setForm] = useState<any>({ id: null, tipo: "FUNCIONARIO", nome: "", telefone: "", email: "", documento: "", endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "", tem_acesso_app: false, perfil_id: "", senha: "" });

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
        if (res.ok) { const data = await res.json(); const uniq = Object.values(data.reduce((acc:any, cur:any) => { acc[cur.slug] = cur; return acc; }, {})); setPerfis(uniq as any[]); }
    }, [empresaId]);
    useEffect(() => { if (empresaId) { load(); loadPerfis(); } }, [load, loadPerfis]);

    const handleEdit = (ent: any) => {
        setForm({ id: ent.id, tipo: ent.tipo, nome: ent.nome, telefone: ent.telefone || "", email: ent.email || "", documento: ent.documento || "", endereco: ent.endereco || "", cargo: ent.cargo || "", departamento: ent.departamento || "", salario: ent.salario || "", carga_horaria: ent.carga_horaria || "", data_admissao: ent.data_admissao? ent.data_admissao.split("T")[0] : "", empresa_fornecedora: ent.empresa_fornecedora || "", categoria_fornecedor: ent.categoria_fornecedor || "", tem_acesso_app: ent.tem_acesso_app || false, perfil_id: ent.perfil_id || "", senha: "" });
        setOpen(true);
    };
    const handleDeleteClick = (ent: any) => { setSelected(ent); setOpenDelete(true); };

    const handleSave = async () => {
        if (!empresaId) return toast.error("Empresa não encontrada");

        // VALIDAÇÃO FORTE - NÃO DEIXA SALVAR SEM SENHA QUANDO TEM ACESSO
        const isEdit =!!form.id;
        if (form.tem_acesso_app) {
            if (!form.perfil_id) return toast.error("Selecione o perfil de acesso");
            if (!form.email?.trim()) return toast.error("Email obrigatório para acesso ao app");
            if (!isEdit && (!form.senha || form.senha.trim().length < 6)) return toast.error("Senha obrigatória - mínimo 6 caracteres");
            if (form.senha && form.senha.trim().length > 0 && form.senha.trim().length < 6) return toast.error("Senha mínimo 6 caracteres");
        }

        setSaving(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const clean = (v: any) => (v === "" || v === undefined? null : typeof v === 'string'? (v.trim() || null) : v);
            const payload: any = {
                tipo: form.tipo, nome: form.nome.trim(), telefone: clean(form.telefone), email: clean(form.email)?.toLowerCase() || null, documento: clean(form.documento), endereco: clean(form.endereco), cargo: clean(form.cargo), departamento: clean(form.departamento), empresa_fornecedora: clean(form.empresa_fornecedora), categoria_fornecedor: clean(form.categoria_fornecedor), tem_acesso_app:!!form.tem_acesso_app, perfil_id: clean(form.perfil_id), data_admissao: clean(form.data_admissao), salario: form.salario? Number(form.salario) : null, carga_horaria: form.carga_horaria? Number(form.carga_horaria) : null,
            };
            if (form.senha && form.senha.trim().length >= 6) payload.senha = form.senha.trim();
            else if (!isEdit && payload.tem_acesso_app) {
                // segurança extra - se for criação e não tem senha, bloqueia
                throw new Error("Senha obrigatória para acesso ao app");
            }
            if (!payload.tem_acesso_app) payload.perfil_id = null;

            const url = isEdit? `${API_BASE}/entidades/${empresaId}/${form.id}` : `${API_BASE}/entidades/${empresaId}`;
            const method = isEdit? "PUT" : "POST";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.detail || "Erro ao salvar");

            if (isEdit) { setLista(prev => prev.map(p => p.id === json.id? json : p)); toast.success("Atualizado com sucesso", { id: "entidade-save" }); }
            else { setLista(prev => [json,...prev]); toast.success("Criado com sucesso", { id: "entidade-save" }); }
            setOpen(false);
            setForm({ id: null, tipo: tipoFiltro, nome: "", telefone: "", email: "", documento: "", endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "", tem_acesso_app: false, perfil_id: "", senha: "" });
        } catch (e: any) { toast.error(e.message, { id: "entidade-error" }); } finally { setSaving(false); }
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
            toast.success(`${selected.nome} apagado`, { id: "delete" });
            setOpenDelete(false);
        } catch { setLista(backup); toast.error("Erro ao apagar", { id: "delete-error" }); } finally { setDeleting(false); }
    };

    const filtered = lista.filter(l => l.nome.toLowerCase().includes(search.toLowerCase()));
    if (!empresaId) return <div className="p-6 text-[12px] font-bold opacity-60">Carregando...</div>;

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <select value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value as any)} className="bg-white border rounded-full px-5 py-2.5 text-[11px] font-black shadow-sm">
                        {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABELS[t]}</option>)}
                    </select>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border rounded-full px-3 gap-2 shadow-sm"><Search size={14} className="opacity-40" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." className="bg-transparent outline-none text-[12px] py-2.5 w-[140px]" /></div>
                        <button onClick={() => { setForm({ id: null, tipo: tipoFiltro, nome: "", telefone: "", email: "", documento: "", endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "", tem_acesso_app: false, perfil_id: "", senha: "" }); setOpen(true); }} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-md"><Plus size={18} /></button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filtered.length === 0? <div className="col-span-full text-center py-10 text-[12px] opacity-50 font-bold">Nenhum {TIPO_LABELS[tipoFiltro]}</div> : filtered.map(ent => <EntidadeCard key={ent.id} ent={ent} onEdit={handleEdit} onDelete={handleDeleteClick} />)}
                </div>
            </div>
            <EntidadeModal open={open} setOpen={setOpen} form={form} setForm={setForm} perfis={perfis} saving={saving} onSave={handleSave} />
            <DeleteConfirmModal open={openDelete} setOpen={setOpenDelete} entidade={selected} onConfirm={confirmDelete} loading={deleting} />
        </>
    );
}
