"use client";
import { useState, useEffect } from "react";
import { Building2, MapPin, Phone, Mail, Crown, Shield, LogOut, Search, Loader2, CheckCircle, XCircle, Calendar, Plus } from "lucide-react";

type Dono = { id: string; nome: string; email: string; avatar_url?: string }
type EmpresaFull = {
    id: string;
    nome_fantasia: string;
    nif?: string;
    tipo: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    logo_url?: string;
    whatsapp_conectado: boolean;
    whatsapp_instance?: string;
    nif_verified: boolean;
    created_at: string;
    dono?: Dono | null;
}

type Stats = {
    total_empresas: number;
    total_users: number;
    total_donos: number;
}

export default function AdminPage() {
    const [empresas, setEmpresas] = useState<EmpresaFull[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [userName, setUserName] = useState("Super Admin");

    // FIX DEFINITIVO: normaliza a URL, seja https://j-os.onrender.com ou https://j-os.onrender.com/api/v1
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com";
    const baseUrl = (() => {
        let url = rawUrl.replace(/\/+$/, "");
        if (url.endsWith("/api/v1")) return url;
        if (url.endsWith("/api")) return url + "/v1";
        return url + "/api/v1";
    })();

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                const u = JSON.parse(userStr);
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

            const resEmpresas = await fetch(`${baseUrl}/admin/empresas`, { headers });
            console.log("STATUS admin/empresas:", resEmpresas.status, "URL:", `${baseUrl}/admin/empresas`);

            if (resEmpresas.ok) {
                const data = await resEmpresas.json();
                setEmpresas(Array.isArray(data)? data : []);
            } else {
                const txt = await resEmpresas.text();
                console.error("Erro admin/empresas:", resEmpresas.status, txt);
            }

            const resStats = await fetch(`${baseUrl}/admin/stats`, { headers });
            if (resStats.ok) {
                setStats(await resStats.json());
            }

        } catch (e) {
            console.error("fetchData erro:", e);
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
        (e.nif && e.nif.includes(search)) ||
        (e.dono?.nome && e.dono.nome.toLowerCase().includes(search.toLowerCase())) ||
        (e.dono?.email && e.dono.email.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-[#F5F7FB]">
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
                                <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_empresas?? empresas.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Building2 /></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Total Usuários</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{stats?.total_users?? "-"}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600"><Shield size={20} /></div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#2F4A8A] to-[#5A8AD4] rounded-[20px] p-5 shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-white/70 uppercase font-semibold">Total Donos</p>
                                <p className="text-2xl font-bold mt-1">{stats?.total_donos?? "-"}</p>
                                <p className="text-[11px] text-white/70 mt-1">Superadmin não precisa de loja</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><Crown /></div>
                        </div>
                    </div>
                </div>

                {/* Busca */}
                <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2"><Building2 size={18} /> Lojas Cadastradas • {filtered.length}</h2>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar loja, NIF ou dono..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm outline-none w-72 focus:bg-white" />
                            </div>
                        </div>
                    </div>

                    {loading? (
                        <div className="p-12 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="animate-spin mb-2" /> Carregando lojas...
                        </div>
                    ) : filtered.length === 0? (
                        <div className="p-12 text-center text-slate-400">
                            <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                            <p>Nenhuma loja encontrada</p>
                            <p className="text-xs mt-2">Verifica o console (F12) - STATUS deve ser 200</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 divide-x divide-y divide-slate-100">
                            {filtered.map(emp => (
                                <div key={emp.id} className="p-5 hover:bg-slate-50 transition group">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-3">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-600 shrink-0">
                                                {emp.logo_url? <img src={emp.logo_url} className="w-full h-full object-cover" /> : emp.nome_fantasia.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 leading-tight text-[14px]">{emp.nome_fantasia}</p>
                                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                                                    {emp.nif_verified? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-slate-300" />}
                                                    {emp.nif || "Sem NIF"} • {emp.tipo}
                                                </p>
                                                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><Calendar size={10} /> {emp.created_at? new Date(emp.created_at).toLocaleDateString() : "-"}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] px-2 py-1 rounded-full font-bold shrink-0 ${emp.whatsapp_conectado? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {emp.whatsapp_conectado? 'WHATSAPP ON' : 'OFF'}
                                        </span>
                                    </div>

                                    {/* Dono */}
                                    <div className="bg-[#F8FAFF] border border-[#E8EEFF] rounded-2xl p-3 mb-4">
                                        <p className="text-[10px] font-bold text-[#2F4A8A] uppercase tracking-widest mb-2 flex items-center gap-1"><Crown size={12} /> Dono</p>
                                        {emp.dono? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#2F4A8A] text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                                                    {emp.dono.avatar_url? <img src={emp.dono.avatar_url} className="w-full h-full object-cover" /> : emp.dono.nome.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">{emp.dono.nome}</p>
                                                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1"><Mail size={10} /> {emp.dono.email}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400">Sem dono vinculado</p>
                                        )}
                                    </div>

                                    {/* Detalhes */}
                                    <div className="space-y-1.5 text-[11px] text-slate-600 mb-4 min-h-[40px]">
                                        {emp.phone && <p className="flex items-center gap-2"><Phone size={12} /> {emp.phone}</p>}
                                        {emp.email && <p className="flex items-center gap-2"><Mail size={12} /> {emp.email}</p>}
                                        {emp.address && <p className="flex items-center gap-2"><MapPin size={12} /> {emp.address} {emp.city? `- ${emp.city}` : ''}</p>}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                localStorage.setItem("empresa_selecionada", emp.id);
                                                window.location.href = "/dashboard/restaurante";
                                            }}
                                            className="flex-1 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-black transition"
                                        >
                                            Entrar na loja
                                        </button>
                                        <button onClick={() => window.location.href = `/dashboard/empresa/${emp.id}`} className="px-4 py-2.5 bg-white border border-slate-200 rounded-full text-xs font-bold hover:bg-slate-50">
                                            Detalhes
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-[11px] text-slate-400 text-center mt-6">Logado como SUPERADMIN • Base: {baseUrl} • Sem vínculo de loja</p>
            </main>
        </div>
    );
}
