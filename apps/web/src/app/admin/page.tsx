"use client";
import { useState, useEffect } from "react";
import { Building2, Crown, Shield, LogOut, Search, Loader2 } from "lucide-react";
import { AdminEmpresaCard } from "./cards/empresa";

type Stats = { total_empresas: number; total_users: number; total_donos: number; }

export default function AdminPage() {
    const [empresas, setEmpresas] = useState<any[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [userName, setUserName] = useState("Super Admin");

    const rawUrl = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/+$/, "");
    const baseUrl = rawUrl.endsWith("/api/v1")? rawUrl : rawUrl.endsWith("/api")? rawUrl + "/v1" : rawUrl + "/api/v1";

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) { try { setUserName(JSON.parse(userStr).nome || "Super Admin"); } catch {} }
        fetchData();
    }, []);

    const getToken = () => localStorage.getItem("access_token") || "";

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { Authorization: `Bearer ${getToken()}` };
            const resEmpresas = await fetch(`${baseUrl}/admin/empresas`, { headers });
            console.log("STATUS admin/empresas:", resEmpresas.status, "URL:", `${baseUrl}/admin/empresas`);
            if (resEmpresas.ok) {
                const data = await resEmpresas.json();
                setEmpresas(Array.isArray(data)? data : []);
            }
            const resStats = await fetch(`${baseUrl}/admin/stats`, { headers });
            if (resStats.ok) setStats(await resStats.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleEnter = (emp: any) => {
        localStorage.setItem("empresa_selecionada", emp.id);
        window.location.href = "/dashboard/restaurante";
    };

    const filtered = empresas.filter(e =>
        e.nome_fantasia.toLowerCase().includes(search.toLowerCase()) ||
        (e.nif && e.nif.includes(search)) ||
        (e.dono?.nome && e.dono.nome.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#F5F7FB]">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#2F4A8A] rounded-full flex items-center justify-center text-white font-black">J</div>
                        <div><h1 className="font-bold text-slate-800 leading-none">J-OS Admin</h1><p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Superadmin Panel</p></div>
                        <span className="ml-3 px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1"><Crown size={12} /> SUPERADMIN</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 hidden md:block">{userName}</span>
                        <button onClick={() => { localStorage.clear(); window.location.href = "/login"; }} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center"><LogOut size={16} /></button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 uppercase font-semibold">Total Lojas</p><p className="text-2xl font-bold mt-1">{stats?.total_empresas?? empresas.length}</p></div>
                    <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 uppercase font-semibold">Total Usuários</p><p className="text-2xl font-bold mt-1">{stats?.total_users?? "-"}</p></div>
                    <div className="bg-gradient-to-br from-[#2F4A8A] to-[#5A8AD4] rounded-[20px] p-5 text-white"><p className="text-xs text-white/70 uppercase">Total Donos</p><p className="text-2xl font-bold mt-1">{stats?.total_donos?? "-"}</p></div>
                </div>

                <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
                        <h2 className="font-bold flex items-center gap-2"><Building2 size={18} /> Lojas Cadastradas • {filtered.length}</h2>
                        <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar loja, NIF ou dono..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none w-72 focus:bg-white" /></div>
                    </div>

                    {loading? (
                        <div className="p-12 flex flex-col items-center text-slate-400"><Loader2 className="animate-spin mb-2" /> Carregando lojas...</div>
                    ) : filtered.length === 0? (
                        <div className="p-12 text-center text-slate-400"><Building2 size={32} className="mx-auto mb-2 opacity-30" /><p>Nenhuma loja encontrada</p></div>
                    ) : (
                        <div className="p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 bg-[#F5F0E9]/30">
                            {filtered.map(emp => (
                                <AdminEmpresaCard key={emp.id} emp={emp} onEnter={handleEnter} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
