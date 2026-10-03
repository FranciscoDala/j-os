"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { EntidadeModal } from "./modals/criar";
import { Search, Trash2, Plus } from "lucide-react";
import { toast, Toaster } from "sonner";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const TIPOS = ["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const;
const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };

function getEmpresaId() {
  if (typeof window === "undefined") return null;
  // tenta todas as chaves possíveis
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

export function EntidadesTab() {
    const [tipoFiltro, setTipoFiltro] = useState<"FUNCIONARIO" | "CLIENTE" | "FORNECEDOR">("FUNCIONARIO");
    const [lista, setLista] = useState<any[]>([]);
    const [perfis, setPerfis] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [empresaId, setEmpresaId] = useState<string | null>(null);

    const [form, setForm] = useState<any>({
      tipo: "FUNCIONARIO", nome: "", telefone: "", email: "", documento: "",
      endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "",
      data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "",
      tem_acesso_app: false, perfil_id: "", senha: ""
    });

    // pega empresa_id só no client
    useEffect(() => {
      setEmpresaId(getEmpresaId());
    }, []);

    const load = useCallback(async () => {
        if (!empresaId) return;
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/entidades/${empresaId}?tipo=${tipoFiltro}`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.status === 401) { toast.error("Sessão expirada, faça login novamente"); return; }
          if (res.ok) setLista(await res.json());
        } catch {}
    }, [tipoFiltro, empresaId]);

    const loadPerfis = useCallback(async () => {
        if (!empresaId) return;
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        if (!token) return;
        try {
          const res = await fetch(`${API_BASE}/entidades/${empresaId}/perfis`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
              const data = await res.json();
              setPerfis(data);
          } else if (res.status!== 401) {
              toast.error("Erro ao carregar perfis");
          }
        } catch {}
    }, [empresaId]);

    useEffect(() => { if (empresaId) { load(); loadPerfis(); } }, [load, loadPerfis, empresaId]);

    const handleSave = async () => {
        if (!empresaId) return toast.error("Empresa não encontrada - faça login novamente");
        if (!form.nome?.trim()) return toast.error("Nome obrigatório");
        if (form.tipo === "FUNCIONARIO" &&!form.cargo?.trim()) return toast.error("Cargo obrigatório");
        if (form.tem_acesso_app) {
            if (!form.perfil_id) return toast.error("Selecione o perfil");
            if (!form.senha || form.senha.length < 6) return toast.error("Senha mínimo 6 caracteres");
            if (!form.email) return toast.error("Email obrigatório para acesso");
        }
        setSaving(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const payload = {...form, salario: form.salario? parseFloat(form.salario) : null, carga_horaria: form.carga_horaria? parseInt(form.carga_horaria) : null, perfil_id: form.perfil_id || null, nome: form.nome.trim(), email: form.email?.trim() || null };
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
        if (!empresaId) return;
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/entidades/${empresaId}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 403) return toast.error("Sem permissão: só gerente/dono");
        if (!res.ok) return toast.error("Erro ao apagar");
        toast.success(`${nome} apagado`);
        load();
    };

    const filtered = lista.filter(l => l.nome.toLowerCase().includes(search.toLowerCase()));

    if (!empresaId) {
      return <div className="p-6 text-[12px] font-bold opacity-60">Carregando empresa... Se ficar aqui, deslogue e logue novamente.</div>
    }

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {filtered.length === 0? (
                      <div className="col-span-3 text-center py-10 text-[12px] opacity-50 font-bold">Nenhum {TIPO_LABELS[tipoFiltro]} encontrado</div>
                    ) : filtered.map(ent => (
                        <div key={ent.id} className="bg-white rounded-[16px] p-4 border flex justify-between">
                            <div><p className="font-black text-[13px]">{ent.nome}</p><p className="text-[11px] opacity-60">{ent.cargo || ent.email || "—"}</p></div>
                            <button onClick={() => handleDelete(ent.id, ent.nome)} className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100"><Trash2 size={12} /></button>
                        </div>
                    ))}
                </div>
            </div>
            <EntidadeModal open={open} setOpen={setOpen} form={form} setForm={setForm} perfis={perfis} saving={saving} onSave={handleSave} />
        </>
    );
}
