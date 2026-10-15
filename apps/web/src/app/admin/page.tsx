"use client";
import { useState, useEffect } from "react";
import { Building2, Users, Shield, LogOut, Plus, Search, Loader2, Crown } from "lucide-react";

type Empresa = {
    id: string;
    nome_fantasia: string;
    nif?: string;
    tipo?: string;
    created_at?: string;
}

type Stats = {
    total_empresas: number;
    total_users: number;
    total_donos: number;
}

export default function AdminPage() {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [userName, setUserName] = useState("Super Admin");

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const u = JSON.parse(userStr);
                if (u.role !== "superadmin" && u.role_slug !== "superadmin") {
                    window.location.href = "/login";
                    return;
                }
                setUserName(u.nome || "Super Admin");
            } catch { }
        }
        fetchData();
    }, []);

    const getToken = () => localStorage.getItem("access_token") || "";

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const headers = { Authorization: `Bearer ${token}` };
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

            // tenta buscar empresas
            const resEmpresas = await fetch(`${baseUrl}/api/empresas`, { headers });
            if (resEmpresas.ok) {
                const data = await resEmpresas.json();
                setEmpresas(Array.isArray(data) ? data : data.items || []);
            }

            // tenta buscar stats se existir endpoint admin
            const resStats = await fetch(`${baseUrl}/api/admin/stats`, { headers });
            if (resStats.ok) {
                setStats(await resStats.json());
            } else {
                // fallback se não tiver endpoint de stats
                setStats({
                    total_empresas: empresas.length,
                    total_users: 0,
                    total_donos: 0
                });
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    };

    const filtered = empresas.filter(e =>
        e.nome_fantasia.toLowerCase().includes(search.toLowerCase()) ||
        (e.nif && e.nif.includes(search))
    );

    return (
        <div className="min-h-screen bg-[#F5F7FB]">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#2F4A8A] rounded-full flex items-center justify-center text-white font-black">J</div>
                        <div>
                            <h1 className="font-bold text-slate-800 leading-none">J-OS Admin</h1>
                            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Superadmin Panel</p>
                        </div>
                        <span className="ml-3 px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <Crown size={12} /> SUPERADMIN
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600 hidden md:block">{userName}</span>
                        <button onClick={handleLogout} className="w-9 h-9 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-full flex items-center justify-center transition">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Total Lojas</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_empresas ?? empresas.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Building2 /></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Usuários Ativos</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_users ?? "-"}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600"><Users /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#2F4A8A] to-[#5A8AD4] rounded-[20px] p-5 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-white/70 uppercase font-semibold">Acesso Total</p>
                                <p className="text-2xl font-bold mt-1">Sem Limites</p>
                                <p className="text-[11px] text-white/70 mt-1">Superadmin não precisa de loja</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><Shield /></div>
                        </div>
                    </div>
                </div>

                {/* Empresas */}
                <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2"><Building2 size={18} /> Lojas Cadastradas</h2>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar loja ou NIF..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none w-64 focus:bg-white" />
                            </div>
                            <button onClick={() => window.location.href = '/dashboard/empresa/nova'} className="px-4 py-2 bg-[#2F4A8A] text-white rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-[#1E2F6B]">
                                <Plus size={16} /> Nova Loja
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="animate-spin mb-2" /> Carregando lojas...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                            <p>Nenhuma loja encontrada</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtered.map(emp => (
                                <div key={emp.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 group-hover:bg-white">
                                            {emp.nome_fantasia.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800 text-sm">{emp.nome_fantasia}</p>
                                            <p className="text-xs text-slate-500">{emp.nif || emp.id.slice(0, 8)} • {emp.tipo || "VAREJO"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                localStorage.setItem("empresa_selecionada", emp.id);
                                                window.location.href = "/dashboard/restaurante";
                                            }}
                                            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-full hover:bg-slate-800 hover:text-white transition"
                                        >
                                            Entrar na loja
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-[11px] text-slate-400 text-center mt-6">Logado como SUPERADMIN • Sem vínculo de loja • Acesso total ao sistema J-OS</p>
            </main>
        </div>
    );
}
