"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { EntidadeModal } from "./modals/criar";
import { Search, Trash2, Plus, ChevronDown } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const TIPOS = ["FUNCIONARIO", "CLIENTE", "FORNECEDOR"] as const;
const TIPO_LABELS: Record<string, string> = { FUNCIONARIO: "Funcionário", CLIENTE: "Cliente", FORNECEDOR: "Fornecedor" };

function getRole() {
    if (typeof window === "undefined") return "";
    try {
        const token = localStorage.getItem("access_token");
        if (!token) return "";
        const payload = JSON.parse(atob(token.split(".")[1]));
        return (payload.role || payload.slug || "").toLowerCase();
    } catch { return ""; }
}

function CustomSelect({ value, onChange }: any) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
    }, []);
    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen(!open)} className="bg-white border border-[#E8DCCF] rounded-full px-5 py-2.5 text-[11px] font-black flex items-center gap-3 shadow-sm min-w-[160px] justify-between hover:border-[#A67C52] transition-all">
                <span>{TIPO_LABELS[value] || value}</span><ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[50] p-1.5 w-[190px]">
                    {TIPOS.map((opt) => (
                        <button key={opt} onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-full text-[11px] font-black transition ${value === opt ? "bg-black text-white" : "hover:bg-[#F5E6D3] text-black/70"}`}>{TIPO_LABELS[opt]}</button>
                    ))}
                </div>
            )}
        </div>
    );
}

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

    const empresaId = typeof window !== "undefined" ? localStorage.getItem("empresa_id") : null;
    const role = getRole();
    const canDelete = !["caixa", "operador_caixa", "garcom", "vigilante", "funcionario"].includes(role);

    const load = useCallback(async () => {
        if (!empresaId) return;
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/entidades/${empresaId}?tipo=${tipoFiltro}`, {
            headers: { Authorization: `Bearer ${token}` }, cache: "no-store"
        });
        if (res.ok && mounted.current) setLista(await res.json());
    }, [tipoFiltro, empresaId]);

    const loadPerfis = useCallback(async () => {
        if (!empresaId) return;
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/entidades/${empresaId}/perfis`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok && mounted.current) {
            const data = await res.json();
            setPerfis(data);
        }
    }, [empresaId]);

    useEffect(() => { mounted.current = true; load(); loadPerfis(); return () => { mounted.current = false; }; }, [load, loadPerfis]);

    const handleSave = async () => {
        if (!form.nome?.trim()) return alert("Nome obrigatório");
        if (form.tipo === "FUNCIONARIO" && !form.cargo?.trim()) return alert("Cargo obrigatório");
        if (form.tem_acesso_app) {
            if (!form.perfil_id) return alert("Selecione o perfil de acesso");
            if (!form.senha || form.senha.length < 6) return alert("Senha min 6 caracteres");
            if (!form.email) return alert("Email obrigatório para acesso");
        }
        setSaving(true);
        try {
            const token = localStorage.getItem("access_token");
            const payload = { ...form, salario: form.salario ? parseFloat(form.salario) : null, carga_horaria: form.carga_horaria ? parseInt(form.carga_horaria) : null, perfil_id: form.perfil_id || null, nome: form.nome.trim(), email: form.email?.trim() || null };
            const res = await fetch(`${API_BASE}/entidades/${empresaId}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.detail || "Erro ao criar");
            setOpen(false);
            setForm({ tipo: tipoFiltro, nome: "", telefone: "", email: "", documento: "", endereco: "", cargo: "", departamento: "", salario: "", carga_horaria: "", data_admissao: "", empresa_fornecedora: "", categoria_fornecedor: "", tem_acesso_app: false, perfil_id: "", senha: "" });
            load();
        } catch (e: any) { alert(e.message); } finally { setSaving(false); }
    };

    const handleDelete = async (id: string, nome: string) => {
        if (!canDelete) return alert("Sem permissão: só gerente/dono pode apagar");
        if (!confirm(`Apagar ${nome}?`)) return;
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/entidades/${empresaId}/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 403) return alert("Sem permissão: só gerente/dono pode apagar");
        load();
    };

    const filtered = lista.filter(l => l.nome.toLowerCase().includes(search.toLowerCase()) || (l.email || "").toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-6 border border-white/50 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <CustomSelect value={tipoFiltro} onChange={setTipoFiltro} />
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-[#E8DCCF] rounded-full px-3 gap-2 shadow-sm">
                        <Search size={14} className="opacity-40" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..." className="bg-transparent outline-none text-[12px] py-2.5 w-[120px] md:w-[160px]" />
                    </div>
                    <button onClick={() => { setForm({ ...form, tipo: tipoFiltro }); setOpen(true); }} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-md active:scale-[0.96] transition hover:bg-zinc-800"><Plus size={18} strokeWidth={3} /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map(ent => (
                    <div key={ent.id} className="bg-white rounded-[16px] p-4 border border-[#E8DCCF]/60 shadow-sm flex flex-col gap-2 hover:border-black/10 transition">
                        <div className="flex justify-between items-start">
                            <div className="min-w-0"><p className="font-black text-[13px] truncate">{ent.nome}</p><p className="text-[11px] opacity-60 truncate">{ent.cargo || ent.empresa_fornecedora || ent.email || ent.telefone || "—"}</p></div>
                            {canDelete && <button onClick={() => handleDelete(ent.id, ent.nome)} className="w-7 h-7 bg-red-50 rounded-full flex items-center justify-center text-red-500 hover:bg-red-100"><Trash2 size={12} /></button>}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-black text-white">{TIPO_LABELS[ent.tipo] || ent.tipo}</span>
                            {ent.tem_acesso_app && <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-green-100 text-green-700">APP</span>}
                            {ent.salario && <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-[#FFF68F]">Kz {Number(ent.salario).toLocaleString('pt-PT')}</span>}
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-[12px] text-gray-400 col-span-3 p-6 text-center">Nenhum {TIPO_LABELS[tipoFiltro]} encontrado.</p>}
            </div>
            <EntidadeModal open={open} setOpen={setOpen} form={form} setForm={setForm} perfis={perfis} saving={saving} onSave={handleSave} />
        </div>
    );
}
