"use client";
import { useState, useEffect, useCallback } from "react";
import { Building2, Crown, LogOut, Search, Loader2, Plus, CheckCircle, AlertTriangle, Info, X, ShieldAlert } from "lucide-react";
import { AdminEmpresaCard } from "./cards/empresa";
import { AdminLojaModal } from "./modals/criar";
import { AdminDeleteModal } from "./modals/delete";

type Toast = { id: string; msg: string; type: "success" | "error" | "info" };
const rawUrl = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/+$/, "");
const baseUrl = rawUrl.endsWith("/api/v1")? rawUrl : rawUrl.endsWith("/api")? rawUrl + "/v1" : rawUrl + "/api/v1";
function getToken() { if (typeof window === 'undefined') return ""; return localStorage.getItem("access_token") || localStorage.getItem("token") || ""; }
function clearAndRedirect() { localStorage.clear(); window.location.href = "/login"; }
function getReadableError(raw: string): string {
    const msg = raw.toLowerCase();
    if (msg.includes("nif já cadastrado")) return "Este NIF já está cadastrado.";
    if (msg.includes("email já existe")) return "Email já em uso.";
    if (msg.includes("só superadmin")) return "Sem permissão SUPERADMIN.";
    if (msg.includes("failed to fetch")) return "Sem conexão com servidor.";
    try { const j = JSON.parse(raw); if (j.detail) return typeof j.detail === 'string'? j.detail : j.detail[0]?.msg || raw; } catch {}
    return raw.slice(0,200);
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
    const [formData, setFormData] = useState<any>({ nome_fantasia: "", nif: "", tipo: "RESTAURANTE", email: "", phone: "", city: "", address: "", modoDono: "existente", dono_existente_id: "", dono_novo: { nome: "", email: "", senha: "", telefone: "" } });

    const pushToast = useCallback((msg: string, type: Toast["type"] = "info") => {
        const id = Date.now().toString();
        setToasts(t => [...t, { id, msg: getReadableError(msg), type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id!== id)), 5000);
    }, []);

    const authFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
        const token = getToken(); if (!token) { clearAndRedirect(); throw new Error("Sem token"); }
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}`,...(opts.headers || {}) } as any;
        const res = await fetch(url, {...opts, headers });
        if (res.status === 401 || res.status === 403) { clearAndRedirect(); throw new Error("Unauthorized"); }
        return res;
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [resEmp, resDonos] = await Promise.all([authFetch(`${baseUrl}/admin/empresas`), authFetch(`${baseUrl}/admin/donos`)]);
            if (resEmp.ok) { const data = await resEmp.json(); setEmpresas(Array.isArray(data)? data : data.items || []); }
            if (resDonos.ok) setDonos(await resDonos.json());
        } catch {} finally { setLoading(false); }
    }, [authFetch]);

    useEffect(() => { if (!getToken()) { clearAndRedirect(); return; } fetchData(); }, [fetchData]);

    const openCreate = () => { setEditingLoja(null); setFormData({ nome_fantasia: "", nif: "", tipo: "RESTAURANTE", email: "", phone: "", city: "", address: "", modoDono: "existente", dono_existente_id: "", dono_novo: { nome: "", email: "", senha: "", telefone: "" } }); setModalOpen(true); };
    const openEdit = (emp: any) => { setEditingLoja(emp); setFormData({ nome_fantasia: emp.nome_fantasia, nif: emp.nif || "", tipo: emp.tipo || "RESTAURANTE", email: emp.email || "", phone: emp.phone || "", city: emp.city || "", address: emp.address || "", modoDono: "existente", dono_existente_id: "", dono_novo: { nome: "", email: "", senha: "", telefone: "" } }); setModalOpen(true); };
    const openDelete = (emp: any) => { setLojaToDelete(emp); setDeleteOpen(true); };
    const onSave = async (e: any) => { e.preventDefault(); if (saving) return; setSaving(true); try { let url = `${baseUrl}/admin/empresas`; let method = "POST"; if (editingLoja) { url = `${baseUrl}/admin/empresas/${editingLoja.id}`; method = "PUT"; } const res = await authFetch(url, { method, body: JSON.stringify(formData) }); const text = await res.text(); if (!res.ok) throw new Error(text); pushToast(editingLoja? "Atualizada!" : "Criada!", "success"); setModalOpen(false); fetchData(); } catch (err: any) { if (err.message!== "Unauthorized") pushToast(err.message, "error"); } finally { setSaving(false); } };
    const onConfirmDelete = async () => { if (!lojaToDelete || deleting) return; setDeleting(true); try { const res = await authFetch(`${baseUrl}/admin/empresas/${lojaToDelete.id}`, { method: "DELETE" }); const text = await res.text(); if (!res.ok) throw new Error(text); pushToast("Apagada", "success"); setDeleteOpen(false); setLojaToDelete(null); fetchData(); } catch (err: any) { if (err.message!== "Unauthorized") pushToast(err.message, "error"); } finally { setDeleting(false); } };

    const filtered = empresas.filter(e => e.nome_fantasia.toLowerCase().includes(search.toLowerCase()) || e.dono?.nome?.toLowerCase().includes(search.toLowerCase()));

    return (
        // IGUAL AO HomeTab QUE ROLA - sem min-h-screen, sem h-[calc], sem overflow
        <div className="flex flex-col gap-4 w-full min-w-0 pb-[160px] bg-[#F5F7FB]" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[92%] max-w-[380px] pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto flex gap-2.5 items-start p-3.5 rounded-[16px] border shadow-[0_12px_32px_rgba(0,0,0,0.15)] text-[12px] font-bold ${t.type === "success"? "bg-[#E8F5E9] border-green-200 text-green-800" : t.type === "error"? "bg-[#FDECEA] border-red-200 text-red-800" : "bg-white border-[#E8DCCF]"}`}>
                        <span className="flex-1">{t.msg}</span><button onClick={() => setToasts(x => x.filter(f => f.id!== t.id))}><X size={12} /></button>
                    </div>
                ))}
            </div>

            <header className="bg-white border-b sticky top-0 z-20 w-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-[#2F4A8A] rounded-full flex items-center justify-center text-white font-black shrink-0">J</div>
                        <h1 className="font-black text-[14px] truncate">J-OS Admin</h1>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full border border-amber-200 flex items-center gap-1"><Crown size={10} /> </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={openCreate} className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center sm:w-auto sm:h-9 sm:px-4 sm:text-xs sm:font-black sm:gap-1"><Plus size={18} className="sm:w-[14px] sm:h-[14px]" /><span className="hidden sm:inline">Nova Loja</span></button>
                        <button onClick={clearAndRedirect} className="w-9 h-9 bg-[#F5F0E9] border border-[#E8DCCF] rounded-full flex items-center justify-center"><LogOut size={16} /></button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="font-black text-[13px] flex items-center gap-2"><Building2 size={18} /> Lojas • {filtered.length}</h2>
                    <div className="relative w-full sm:w-72">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar loja ou dono..." className="w-full pl-9 pr-4 py-3 sm:py-2.5 bg-white border border-[#E8DCCF] rounded-full text-[13px] outline-none focus:border-black shadow-sm" />
                    </div>
                </div>

                {loading? <div className="py-20 flex justify-center"><Loader2 className="animate-spin" /></div> : filtered.length === 0? <div className="py-16 text-center bg-white rounded-[18px] border">Nenhuma loja</div> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
                        {filtered.map(emp => <AdminEmpresaCard key={emp.id} emp={emp} onEdit={openEdit} onDelete={openDelete} />)}
                    </div>
                )}
            </div>

            <AdminLojaModal open={modalOpen} onOpenChange={setModalOpen} editingLoja={editingLoja} donos={donos} formData={formData} setFormData={setFormData} onSave={onSave} saving={saving} pushToast={pushToast} />
            <AdminDeleteModal open={deleteOpen} onOpenChange={setDeleteOpen} loja={lojaToDelete} onConfirm={onConfirmDelete} deleting={deleting} />
        </div>
    );
}
