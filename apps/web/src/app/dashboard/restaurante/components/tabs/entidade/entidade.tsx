"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { EntidadeModal } from "./modals/criar";
import { Search, Trash2 } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";

export function EntidadesTab() {
  const [tipoFiltro, setTipoFiltro] = useState<"FUNCIONARIO" | "CLIENTE" | "FORNECEDOR">("FUNCIONARIO");
  const [lista, setLista] = useState<any[]>([]);
  const [perfis, setPerfis] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const mounted = useRef(true);
  const [form, setForm] = useState<any>({
    tipo: "FUNCIONARIO", nome: "", telefone: "", email: "", documento: "", endereco: "",
    cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "",
    empresa_fornecedora: "", categoria_fornecedor: "",
    tem_acesso_app: false, perfil_id: "", senha: ""
  });

  const empresaId = typeof window!== "undefined"? localStorage.getItem("empresa_id") : null;

  const load = useCallback(async () => {
    if (!empresaId) return;
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_BASE}/entidades/${empresaId}?tipo=${tipoFiltro}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (res.ok && mounted.current) setLista(await res.json());
  }, [tipoFiltro, empresaId]);

  const loadPerfis = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API_BASE}/entidades/${empresaId}/perfis`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok && mounted.current) setPerfis(await res.json());
  }, [empresaId]);

  useEffect(() => {
    mounted.current = true;
    load(); loadPerfis();
    return () => { mounted.current = false; };
  }, [load, loadPerfis]);

  // REALTIME
  useEffect(() => {
    const onCreated = (e: any) => {
      const d = e.detail;
      if (!d?.tipo) return;
      if (d.tipo === tipoFiltro && mounted.current) load();
      // dispara pro dashboard tb
      window.dispatchEvent(new CustomEvent("entidade:created", { detail: d }));
    };
    const onDeleted = () => load();
    window.addEventListener("entidade:created" as any, onCreated);
    window.addEventListener("entidade:deleted" as any, onDeleted);
    return () => {
      window.removeEventListener("entidade:created" as any, onCreated);
      window.removeEventListener("entidade:deleted" as any, onDeleted);
    };
  }, [tipoFiltro, load]);

  const handleSave = async () => {
    if (!form.nome?.trim()) return alert("Nome obrigatório");
    if (form.tipo === "FUNCIONARIO" &&!form.cargo?.trim()) return alert("Cargo obrigatório para funcionário");
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const payload = {
       ...form,
        salario: form.salario? parseFloat(form.salario) : null,
        carga_horaria: form.carga_horaria? parseInt(form.carga_horaria) : null,
        perfil_id: form.perfil_id || null,
        nome: form.nome.trim(),
        email: form.email?.trim() || null,
      };
      const res = await fetch(`${API_BASE}/entidades/${empresaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Erro" }));
        throw new Error(err.detail || JSON.stringify(err));
      }
      setOpen(false);
      setForm({
        tipo: tipoFiltro, nome: "", telefone: "", email: "", documento: "", endereco: "",
        cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "",
        empresa_fornecedora: "", categoria_fornecedor: "",
        tem_acesso_app: false, perfil_id: "", senha: ""
      });
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Apagar ${nome}?`)) return;
    const token = localStorage.getItem("access_token");
    await fetch(`${API_BASE}/entidades/${empresaId}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    load();
  };

  const filtered = lista.filter(l => l.nome.toLowerCase().includes(search.toLowerCase()) || (l.email||"").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-6 border border-white/50 space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div className="flex gap-2">
          {(["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const).map(t => (
            <button key={t} onClick={() => setTipoFiltro(t)} className={`px-4 py-2 rounded-full text-[11px] font-black border transition ${tipoFiltro === t? "bg-black text-white border-black shadow" : "bg-white border-black/10 hover:bg-black/5"}`}>{t}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center bg-white border border-black/5 rounded-full px-3 gap-2">
            <Search size={14} className="opacity-40" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." className="bg-transparent outline-none text-[12px] py-2 w-[140px]" />
          </div>
          <button onClick={() => { setForm({...form, tipo: tipoFiltro }); setOpen(true); }} className="px-5 py-2 bg-[#2F4A8A] text-white rounded-full text-[11px] font-bold shadow">+ Novo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(ent => (
          <div key={ent.id} className="bg-white rounded-[16px] p-4 border border-black/5 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <p className="font-black text-[13px] truncate">{ent.nome}</p>
                <p className="text-[11px] opacity-60 truncate">{ent.cargo || ent.empresa_fornecedora || ent.email || ent.telefone || "—"}</p>
              </div>
              <button onClick={() => handleDelete(ent.id, ent.nome)} className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100"><Trash2 size={12} /></button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-black text-white">{ent.tipo}</span>
              {ent.tem_acesso_app && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">ACESSO APP</span>}
              {ent.salario && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FFF68F]">Kz {Number(ent.salario).toLocaleString('pt-PT')}</span>}
              {ent.carga_horaria && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50">{ent.carga_horaria}h/sem</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-[12px] text-gray-400 col-span-3 p-6 text-center">Nenhum {tipoFiltro} encontrado.</p>}
      </div>

      <EntidadeModal open={open} setOpen={setOpen} form={form} setForm={setForm} perfis={perfis} saving={saving} onSave={handleSave} />
    </div>
  );
}
