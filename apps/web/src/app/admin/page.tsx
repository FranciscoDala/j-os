"use client";
import { useState, useEffect } from "react";
import { Building2, MapPin, Phone, Mail, Crown, Shield, LogOut, Search, Loader2, CheckCircle, XCircle, Calendar, User } from "lucide-react";

type Dono = { id: string; nome: string; email: string; avatar_url?: string }
type EmpresaFull = {
  id: string; nome_fantasia: string; nif?: string; tipo: string;
  email?: string; phone?: string; address?: string; city?: string;
  logo_url?: string; whatsapp_conectado: boolean; nif_verified: boolean;
  created_at: string; dono?: Dono | null;
}

export default function AdminPage() {
  const [empresas, setEmpresas] = useState<EmpresaFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchData() }, []);

  const getToken = () => localStorage.getItem("access_token") || "";
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${baseUrl}/api/admin/empresas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmpresas(data);
      } else {
        // fallback tenta /empresas antigo
        const res2 = await fetch(`${baseUrl}/api/empresas`, { headers: { Authorization: `Bearer ${token}` } });
        if (res2.ok) setEmpresas(await res2.json());
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  };

  const filtered = empresas.filter(e =>
    e.nome_fantasia.toLowerCase().includes(search.toLowerCase()) ||
    (e.nif && e.nif.includes(search)) ||
    (e.dono?.nome.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#2F4A8A] rounded-full flex items-center justify-center text-white font-black">J</div>
            <h1 className="font-bold">J-OS Admin</h1>
            <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full flex items-center gap-1"><Crown size={12}/> SUPERADMIN</span>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href="/login"; }} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center"><LogOut size={16}/></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between mb-6">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Building2 size={18}/> {empresas.length} Lojas</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar loja, NIF ou dono..." className="pl-9 pr-4 py-2 bg-white border rounded-full text-sm w-80"/>
          </div>
        </div>

        {loading? <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto"/></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map(emp => (
              <div key={emp.id} className="bg-white rounded-[24px] border border-slate-200 p-5 shadow-sm hover:shadow-md transition group">
                {/* Header Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-600">
                      {emp.logo_url? <img src={emp.logo_url} className="w-full h-full object-cover"/> : emp.nome_fantasia[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">{emp.nome_fantasia}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        {emp.nif_verified? <CheckCircle size={12} className="text-green-500"/> : <XCircle size={12} className="text-slate-300"/>}
                        {emp.nif || "Sem NIF"} • {emp.tipo}
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><Calendar size={10}/> {new Date(emp.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${emp.whatsapp_conectado? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {emp.whatsapp_conectado? 'WhatsApp ON' : 'WhatsApp OFF'}
                  </span>
                </div>

                {/* Dono */}
                <div className="bg-[#F8FAFF] border border-[#E8EEFF] rounded-2xl p-3 mb-4">
                  <p className="text-[10px] font-bold text-[#2F4A8A] uppercase tracking-widest mb-2 flex items-center gap-1"><Crown size={12}/> Dono da Loja</p>
                  {emp.dono? (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#2F4A8A] text-white flex items-center justify-center font-bold text-sm">
                        {emp.dono.avatar_url? <img src={emp.dono.avatar_url} className="rounded-full"/> : emp.dono.nome[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{emp.dono.nome}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={10}/> {emp.dono.email}</p>
                      </div>
                    </div>
                  ) : <p className="text-xs text-slate-400">Sem dono vinculado</p>}
                </div>

                {/* Detalhes */}
                <div className="space-y-2 text-xs text-slate-600 mb-4">
                  {emp.phone && <p className="flex items-center gap-2"><Phone size={12}/> {emp.phone}</p>}
                  {emp.email && <p className="flex items-center gap-2"><Mail size={12}/> {emp.email}</p>}
                  {emp.address && <p className="flex items-center gap-2"><MapPin size={12}/> {emp.address} {emp.city? `- ${emp.city}` : ''}</p>}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { localStorage.setItem("empresa_selecionada", emp.id); window.location.href="/dashboard/restaurante"; }} className="flex-1 py-2 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-black">Entrar na loja</button>
                  <button onClick={() => window.location.href=`/dashboard/empresa/${emp.id}`} className="px-4 py-2 bg-white border rounded-full text-xs font-bold">Detalhes</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
