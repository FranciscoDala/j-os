"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { EntidadeModal } from "./modals/criar";
import { Search, Trash2, Plus, ChevronDown } from "lucide-react";
import { toast, Toaster } from "sonner";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const TIPOS = ["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const;
const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };

export function EntidadesTab() {
    const [tipoFiltro, setTipoFiltro] = useState<"FUNCIONARIO" | "CLIENTE" | "FORNECEDOR">("FUNCIONARIO");
    const [lista, setLista] = useState<any[]>([]);
    const [perfis, setPerfis] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const mounted = useRef(true);
    const [form, setForm] = useState<any>({ tipo: "FUNCIONARIO", nome: "", telefone: "", email: "", documento: "", endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "", tem_acesso_app: false, perfil_id: "", senha: "" });
    const empresaId = typeof window !== "undefined" ? localStorage.getItem("empresa_id") : null;

    const load = useCallback(async () => {
        if (!empresaId) return;
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/entidades/${empresaId}?tipo=${tipoFiltro}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setLista(await res.json());
    }, [tipoFiltro, empresaId]);

    const loadPerfis = useCallback(async () => {
        if (!empresaId) return;
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/entidades/${empresaId}/perfis`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            setPerfis(data);
            if (data.length === 0) toast.warning("Nenhum perfil encontrado - contate o suporte");
            else toast.success(`${data.length} perfis carregados`);
        } else {
            toast.error("Erro ao carregar perfis");
        }
    }, [empresaId]);

    useEffect(() => { load(); loadPerfis(); }, [load, loadPerfis]);

    const handleSave = async () => {
        if (!form.nome?.trim()) return toast.error("Nome obrigatório");
        if (form.tipo === "FUNCIONARIO" && !form.cargo?.trim()) return toast.error("Cargo obrigatório");
        if (form.tem_acesso_app) {
            if (!form.perfil_id) return toast.error("Selecione o perfil");
            if (!form.senha || form.senha.length < 6) return toast.error("Senha mínimo 6 caracteres");
            if (!form.email) return toast.error("Email obrigatório para acesso");
        }
        setSaving(true);
        try {
            const token = localStorage.getItem("access_token");
            const payload = { ...form, salario: form.salario ? parseFloat(form.salario) : null, carga_horaria: form.carga_horaria ? parseInt(form.carga_horaria) : null, perfil_id: form.perfil_id || null, nome: form.nome.trim(), email: form.email?.trim() || null };
            const res = await fetch(`${API_BASE}/entidades/${empresaId}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.detail || "Erro ao criar");
            toast.success(`${form.nome} criado com sucesso!`);
            setOpen(false);
            setForm({ tipo: tipoFiltro, nome: "", telefone: "", email: "", documento: "", endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "", tem_acesso_app: false, perfil_id: "", senha: "" });
            load();
        } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string, nome: string) => {
        if (!confirm(`Apagar ${nome}?`)) return;
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/entidades/${empresaId}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 403) return toast.error("Sem permissão: só gerente/dono");
        if (!res.ok) return toast.error("Erro ao apagar");
        toast.success(`${nome} apagado`);
        load();
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
                        <button onClick={() => { setForm({ ...form, tipo: tipoFiltro }); setOpen(true); }} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"><Plus size={18} /></button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {filtered.map(ent => (
                        <div key={ent.id} className="bg-white rounded-[16px] p-4 border flex justify-between">
                            <div><p className="font-black text-[13px]">{ent.nome}</p><p className="text-[11px] opacity-60">{ent.cargo || ent.email || "—"}</p></div>
                            <button onClick={() => handleDelete(ent.id, ent.nome)} className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center text-red-500"><Trash2 size={12} /></button>
                        </div>
                    ))}
                </div>
            </div>
            <EntidadeModal open={open} setOpen={setOpen} form={form} setForm={setForm} perfis={perfis} saving={saving} onSave={handleSave} />
        </>
    );
}
