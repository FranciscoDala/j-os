"use client";
import { useState, useEffect } from "react";
import { Building2, Crown, LogOut, Search, Loader2, Plus } from "lucide-react";
import { AdminEmpresaCard } from "./cards/empresa";
import { AdminLojaModal } from "./modals/criar";
import { AdminDeleteModal } from "./modals/delete";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
    const [empresas, setEmpresas] = useState<any[]>([]);
    const [donos, setDonos] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLoja, setEditingLoja] = useState<any | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [lojaToDelete, setLojaToDelete] = useState<any | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [formData, setFormData] = useState<any>({
        nome_fantasia: "", nif: "", tipo: "RESTAURANTE", email: "", phone: "", city: "", address: "",
        modoDono: "existente", dono_existente_id: "", dono_novo: { nome: "", email: "", senha: "", telefone: "" }
    });

    const rawUrl = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/+$/, "");
    const baseUrl = rawUrl.endsWith("/api/v1")? rawUrl : rawUrl.endsWith("/api")? rawUrl + "/v1" : rawUrl + "/api/v1";

    const getToken = () => typeof window!== 'undefined'? localStorage.getItem("access_token") || "" : "";

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${getToken()}` };
            const [resEmp, resDonos, resStats] = await Promise.all([
                fetch(`${baseUrl}/admin/empresas`, { headers }),
                fetch(`${baseUrl}/admin/donos`, { headers }),
                fetch(`${baseUrl}/admin/stats`, { headers }),
            ]);
            if (resEmp.ok) setEmpresas(await resEmp.json());
            if (resDonos.ok) setDonos(await resDonos.json());
            if (resStats.ok) setStats(await resStats.json());
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

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
        e.preventDefault(); setSaving(true);
        try {
            const headers = { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
            let url = `${baseUrl}/admin/empresas`;
            let method = "POST";
            if (editingLoja) { url = `${baseUrl}/admin/empresas/${editingLoja.id}`; method = "PUT"; }
            const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
            if (!res.ok) throw new Error(await res.text());
            setModalOpen(false); fetchData();
        } catch (err: any) { alert("Erro: " + err.message); }
        finally { setSaving(false); }
    };

    const onConfirmDelete = async () => {
        if (!lojaToDelete) return; setDeleting(true);
        try {
            const res = await fetch(`${baseUrl}/admin/empresas/${lojaToDelete.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
            if (!res.ok) throw new Error(await res.text());
            setDeleteOpen(false); fetchData();
        } catch (err: any) { alert(err.message); }
        finally { setDeleting(false); }
    };

    const filtered = empresas.filter(e => e.nome_fantasia.toLowerCase().includes(search.toLowerCase()) || e.dono?.nome?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#F5F7FB]">
            <header className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#2F4A8A] rounded-full flex items-center justify-center text-white font-black">J</div>
                        <h1 className="font-bold">J-OS Admin</h1>
                        <span className="ml-3 px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1"><Crown size={12} /> SUPERADMIN</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={openCreate} className="rounded-full bg-black text-white h-9 px-4 text-xs font-black gap-1"><Plus size={14} /> Nova Loja</Button>
                        <button onClick={() => { localStorage.clear(); location.href = "/login"; }} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center"><LogOut size={16} /></button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-[20px] p-5 border shadow-sm"><p className="text-xs text-slate-500 uppercase font-semibold">Lojas</p><p className="text-2xl font-bold mt-1">{stats?.total_empresas?? empresas.length}</p></div>
                    <div className="bg-white rounded-[20px] p-5 border shadow-sm"><p className="text-xs text-slate-500 uppercase font-semibold">Usuários</p><p className="text-2xl font-bold mt-1">{stats?.total_users?? "-"}</p></div>
                    <div className="bg-black rounded-[20px] p-5 text-white"><p className="text-xs text-white/70 uppercase">Donos</p><p className="text-2xl font-bold mt-1">{stats?.total_donos?? "-"}</p></div>
                </div>

                <div className="bg-white rounded-[24px] border shadow-sm">
                    <div className="p-6 flex justify-between gap-4 border-b">
                        <h2 className="font-bold flex items-center gap-2"><Building2 size={18} /> Lojas • {filtered.length}</h2>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 pr-4 py-2 bg-slate-50 border rounded-full text-sm w-72 outline-none focus:border-black" />
                        </div>
                    </div>

                    {loading? (
                        <div className="p-12 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="p-4">
                            {/* AQUI O SCROLL INVISIVEL SÓ NOS CARDS */}
                            <div className="h-[calc(100vh-280px)] overflow-y-auto overflow-x-hidden pr-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-24">
                                    {filtered.map(emp => (
                                        <AdminEmpresaCard
                                            key={emp.id}
                                            emp={emp}
                                            onEnter={(e: any) => { localStorage.setItem("empresa_selecionada", e.id); location.href = "/dashboard/restaurante"; }}
                                            onEdit={openEdit}
                                            onDelete={openDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <AdminLojaModal open={modalOpen} onOpenChange={setModalOpen} editingLoja={editingLoja} donos={donos} formData={formData} setFormData={setFormData} onSave={onSave} saving={saving} />
            <AdminDeleteModal open={deleteOpen} onOpenChange={setDeleteOpen} loja={lojaToDelete} onConfirm={onConfirmDelete} deleting={deleting} />
        </div>
    );
}
