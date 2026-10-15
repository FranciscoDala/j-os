"use client";
import { useState, useEffect, useCallback } from "react";
import { Building2, Crown, LogOut, Search, Loader2, Plus, CheckCircle, AlertTriangle, Info, X, ShieldAlert } from "lucide-react";
import { AdminEmpresaCard } from "./cards/empresa";
import { AdminLojaModal } from "./modals/criar";
import { AdminDeleteModal } from "./modals/delete";
import { Button } from "@/components/ui/button";

type Toast = { id: string; msg: string; type: "success" | "error" | "info" };

const rawUrl = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/+$/, "");
const baseUrl = rawUrl.endsWith("/api/v1") ? rawUrl : rawUrl.endsWith("/api") ? rawUrl + "/v1" : rawUrl + "/api/v1";

function getToken() {
    if (typeof window === 'undefined') return "";
    return localStorage.getItem("access_token") || localStorage.getItem("token") || "";
}
function clearAndRedirect() {
    localStorage.clear();
    window.location.href = "/login";
}

// Mensagens humanas para cada erro do backend
function getReadableError(raw: string): string {
    const msg = raw.toLowerCase();
    if (msg.includes("nif já cadastrado") || msg.includes("nif already")) return "Este NIF já está cadastrado em outra loja.";
    if (msg.includes("email já existe") || msg.includes("email já cadastrado")) return "Este email já está em uso. Use outro email.";
    if (msg.includes("selecione dono")) return "Por favor selecione um dono para a loja.";
    if (msg.includes("id dono inválido")) return "Dono selecionado inválido.";
    if (msg.includes("dono não encontrado")) return "Dono não encontrado. Atualize a lista.";
    if (msg.includes("modo dono inválido")) return "Selecione se é dono existente ou novo.";
    if (msg.includes("dados do novo dono")) return "Preencha nome, email e senha do novo dono.";
    if (msg.includes("nome_fantasia") || msg.includes("field required")) return "Preencha o nome da loja.";
    if (msg.includes("não encontrada")) return "Loja não encontrada. Já pode ter sido apagada.";
    if (msg.includes("só superadmin")) return "Você não tem permissão de SUPERADMIN.";
    if (msg.includes("sem token") || msg.includes("unauthorized")) return "Sessão expirada. Faça login novamente.";
    if (msg.includes("422") || msg.includes("validation")) return "Verifique os campos preenchidos.";
    if (msg.includes("network") || msg.includes("failed to fetch")) return "Sem conexão com o servidor. Verifique internet.";
    // tenta extrair detail do FastAPI
    try {
        const j = JSON.parse(raw);
        if (j.detail) {
            if (Array.isArray(j.detail)) return j.detail[0]?.msg ? `Campo ${j.detail[0].loc?.at(-1)}: ${j.detail[0].msg}` : getReadableError(JSON.stringify(j.detail[0]));
            return getReadableError(String(j.detail));
        }
    } catch { }
    return raw.length > 200 ? raw.slice(0, 200) + "..." : raw;
}

export default function AdminPage() {
    const [empresas, setEmpresas] = useState<any[]>([]);
    const [donos, setDonos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLoja, setEditingLoja] = useState<any | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [lojaToDelete, setLojaToDelete] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const [formData, setFormData] = useState<any>({
        nome_fantasia: "", nif: "", tipo: "RESTAURANTE", email: "", phone: "", city: "", address: "",
        modoDono: "existente", dono_existente_id: "", dono_novo: { nome: "", email: "", senha: "", telefone: "" }
    });

    const pushToast = useCallback((msg: string, type: Toast["type"] = "info") => {
        const id = Date.now().toString() + Math.random().toString().slice(2);
        const clean = getReadableError(msg);
        setToasts(t => [...t, { id, msg: clean, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000);
    }, []);

    const authFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
        const token = getToken();
        if (!token) { clearAndRedirect(); throw new Error("Sem token"); }
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) } as any;
        const res = await fetch(url, { ...opts, headers });
        if (res.status === 401 || res.status === 403) {
            const data = await res.json().catch(() => null);
            const detail = data?.detail || "";
            if (String(detail).toLowerCase().includes("superadmin") || res.status === 403) {
                pushToast("Acesso negado: apenas SUPERADMIN pode acessar", "error");
                setTimeout(clearAndRedirect, 1500);
            } else {
                pushToast("Sessão expirada. Faça login novamente", "error");
                clearAndRedirect();
            }
            throw new Error("Unauthorized");
        }
        return res;
    }, [pushToast]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resEmp, resDonos] = await Promise.all([
                authFetch(`${baseUrl}/admin/empresas`),
                authFetch(`${baseUrl}/admin/donos`),
            ]);
            if (resEmp.ok) {
                const data = await resEmp.json();
                setEmpresas(Array.isArray(data) ? data : data.items || []);
            } else {
                pushToast(`Erro ao carregar lojas: ${resEmp.status}`, "error");
            }
            if (resDonos.ok) setDonos(await resDonos.json());
        } catch (e: any) {
            if (e.message !== "Unauthorized") pushToast("Falha ao carregar dados do servidor", "error");
        } finally { setLoading(false); }
    }, [authFetch, pushToast]);

    useEffect(() => {
        if (!getToken()) { clearAndRedirect(); return; }
        fetchData();
    }, [fetchData]);

    const openCreate = () => {
        setEditingLoja(null);
        setFormData({ nome_fantasia: "", nif: "", tipo: "RESTAURANTE", email: "", phone: "", city: "", address: "", modoDono: "existente", dono_existente_id: "", dono_novo: { nome: "", email: "", senha: "", telefone: "" } });
        setModalOpen(true);
    };

    const openEdit = (emp: any) => {
        setEditingLoja(emp);
        setFormData({ nome_fantasia: emp.nome_fantasia, nif: emp.nif || "", tipo: emp.tipo || "RESTAURANTE", email: emp.email || "", phone: emp.phone || "", city: emp.city || "", address: emp.address || "", modoDono: "existente", dono_existente_id: "", dono_novo: { nome: "", email: "", senha: "", telefone: "" } });
        setModalOpen(true);
    };

    const openDelete = (emp: any) => { setLojaToDelete(emp); setDeleteOpen(true); };

    const onSave = async (e: any) => {
        e.preventDefault();
        if (saving) return;

        // Validação frontend humana
        if (!formData.nome_fantasia?.trim()) return pushToast("Digite o nome da loja", "error");
        if (!editingLoja) {
            if (formData.modoDono === "existente" && !formData.dono_existente_id) return pushToast("Selecione um dono existente", "error");
            if (formData.modoDono === "novo") {
                if (!formData.dono_novo.nome?.trim()) return pushToast("Digite o nome do novo dono", "error");
                if (!formData.dono_novo.email?.trim()) return pushToast("Digite o email do novo dono", "error");
                if (!formData.dono_novo.senha?.trim() || formData.dono_novo.senha.length < 6) return pushToast("Senha do dono deve ter no mínimo 6 caracteres", "error");
            }
        }

        setSaving(true);
        try {
            let url = `${baseUrl}/admin/empresas`;
            let method = "POST";
            if (editingLoja) { url = `${baseUrl}/admin/empresas/${editingLoja.id}`; method = "PUT"; }
            const res = await authFetch(url, { method, body: JSON.stringify(formData) });
            const text = await res.text();
            if (!res.ok) throw new Error(text);
            pushToast(editingLoja ? `Loja "${formData.nome_fantasia}" atualizada!` : `Loja "${formData.nome_fantasia}" criada com sucesso!`, "success");
            setModalOpen(false);
            fetchData();
        } catch (err: any) {
            if (err.message !== "Unauthorized") pushToast(err.message || "Erro ao salvar loja", "error");
        } finally { setSaving(false); }
    };

    const onConfirmDelete = async () => {
        if (!lojaToDelete || deleting) return;
        setDeleting(true);
        try {
            const res = await authFetch(`${baseUrl}/admin/empresas/${lojaToDelete.id}`, { method: "DELETE" });
            const text = await res.text();
            if (!res.ok) throw new Error(text);
            pushToast(`Loja "${lojaToDelete.nome_fantasia}" apagada com sucesso`, "success");
            setDeleteOpen(false);
            setLojaToDelete(null);
            fetchData();
        } catch (err: any) {
            if (err.message !== "Unauthorized") pushToast(err.message || "Erro ao apagar loja", "error");
        } finally { setDeleting(false); }
    };

    const filtered = empresas.filter(e =>
        e.nome_fantasia.toLowerCase().includes(search.toLowerCase()) ||
        e.dono?.nome?.toLowerCase().includes(search.toLowerCase()) ||
        e.dono?.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F5F7FB]">
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[92%] max-w-[380px] pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto flex gap-2.5 items-start p-3.5 rounded-[16px] border backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.15)] text-[12px] font-bold animate-in slide-in-from-right duration-300 ${t.type === "success" ? "bg-[#E8F5E9] border-green-200 text-green-800" : t.type === "error" ? "bg-[#FDECEA] border-red-200 text-red-800" : "bg-white border-[#E8DCCF] text-[#1E1E1E]"}`}>
                        {t.type === "success" && <CheckCircle size={16} className="shrink-0 mt-0.5" />}{t.type === "error" && <AlertTriangle size={16} className="shrink-0 mt-0.5" />}{t.type === "info" && <Info size={16} className="shrink-0 mt-0.5" />}
                        <span className="flex-1 leading-[1.4]">{t.msg}</span>
                        <button onClick={() => setToasts(x => x.filter(f => f.id !== t.id))} className="opacity-60 hover:opacity-100 shrink-0"><X size={12} /></button>
                    </div>
                ))}
            </div>

            <header className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#2F4A8A] rounded-full flex items-center justify-center text-white font-black">J</div>
                        <h1 className="font-bold">J-OS Admin</h1>
                        <span className="ml-3 px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1 border border-amber-200"><Crown size={12} /> SUPERADMIN <ShieldAlert size={12} className="ml-1" /></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={openCreate} className="rounded-full bg-black text-white h-9 px-4 text-xs font-black gap-1 hover:bg-zinc-800"><Plus size={14} /> Nova Loja</Button>
                        <button onClick={clearAndRedirect} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200"><LogOut size={16} /></button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-[24px] border border-[#E8DCCF] shadow-sm overflow-hidden">
                    <div className="p-5 flex justify-between gap-4 border-b border-[#F3E9DF] bg-[#FFFEFB]">
                        <h2 className="font-black text-[13px] flex items-center gap-2"><Building2 size={18} /> Lojas • {filtered.length}</h2>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar loja ou dono..." className="pl-9 pr-4 py-2 bg-[#F5F0E9] border border-[#E8DCCF] rounded-full text-[12px] w-72 outline-none focus:border-black focus:bg-white transition-all" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 flex flex-col items-center gap-3 text-slate-400"><Loader2 className="animate-spin" /><p className="text-[11px] font-bold">Carregando lojas...</p></div>
                    ) : (
                        <div className="p-4">
                            <div className="h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden pr-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
                                {filtered.length === 0 ? (
                                    <div className="py-16 text-center border border-dashed border-[#E8DCCF] rounded-[18px] bg-[#FFFBF0]/50">
                                        <p className="font-black text-[13px]">Nenhuma loja encontrada</p>
                                        <p className="text-[11px] opacity-60 mt-1">Tente outro termo de busca</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
                                        {filtered.map(emp => (
                                            <AdminEmpresaCard key={emp.id} emp={emp} onEdit={openEdit} onDelete={openDelete} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <AdminLojaModal open={modalOpen} onOpenChange={setModalOpen} editingLoja={editingLoja} donos={donos} formData={formData} setFormData={setFormData} onSave={onSave} saving={saving} pushToast={pushToast} />
            <AdminDeleteModal open={deleteOpen} onOpenChange={setDeleteOpen} loja={lojaToDelete} onConfirm={onConfirmDelete} deleting={deleting} />
        </div>
    );
}
