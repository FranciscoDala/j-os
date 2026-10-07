"use client";
import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ModuleId } from "./menu_config";
import { VendasTab } from "@/app/dashboard/restaurante/components/tabs/venda/venda";
import { useGlobalSearch } from "@/features/search/context";
import { Menu, X, Upload, Building2 } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

type Ctx = { activeTab: string; setActiveTab: (t: string) => void; user: any; moduleId: ModuleId; role: string; can: (p: string) => boolean; pedidosCount: number; setPedidosCount: (n: number) => void; };
const DashboardCtx = createContext<Ctx>(null as any);
export const useDashboard = () => useContext(DashboardCtx);

const TAB_META: Record<string, { title: string; desc: string }> = {
    home: { title: "Painel", desc: "Visão geral do seu restaurante" },
    pedidos: { title: "Pedidos QR", desc: "Gerencie seus pedidos feitos em tempo real • LIVE" },
    produtos: { title: "Produtos", desc: "Gerencie seus produtos, catálogo e preços" },
    mesas: { title: "Mesas", desc: "Controle de mesas e atendimento" },
    caixa: { title: "Caixa", desc: "Controle financeiro do dia" },
    funcionarios: { title: "Equipe", desc: "Gestão de funcionários e acessos" },
    vendas: { title: "Vendas", desc: "" },
    relatorios: { title: "Relatórios", desc: "Análises e desempenho" },
};
const ROLE_PERMISSIONS: Record<string, string[]> = {
    dono: ["*"], gerente_restaurante: ["*"],
    operador_caixa: ["home", "caixa", "vendas", "produtos", "funcionarios", "pedidos", "mesas"],
    caixa: ["home", "caixa", "vendas"], garcom: ["home", "vendas", "pedidos", "mesas"],
    vigilante: ["home"], rh: ["home", "funcionarios"], funcionario: ["home", "produtos", "vendas"],
};
function normalizeRole(raw: any) { return String(raw || "funcionario").toLowerCase(); }

function EmpresaConfigModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [empresa, setEmpresa] = useState<any>(null);
    const [form, setForm] = useState<any>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        const load = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("access_token");
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                const empId = u.empresa_id || localStorage.getItem("empresa_id");
                if (!empId) { setLoading(false); return; }
                const res = await fetch(`${API_BASE}/empresas/${empId}`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) { const data = await res.json(); setEmpresa(data); setForm(data); if (data.logo_url) setLogoPreview(data.logo_url); }
            } catch { } finally { setLoading(false); }
        }; load();
    }, [open]);

    const onFile = (f: File | null) => { if (!f) return; setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); };
    const save = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("access_token");
            const fd = new FormData();
            ["nome_fantasia","nif","email","phone","address","city","province","iban","banco1"].forEach(k=>{ if(form[k]) fd.append(k, form[k]); });
            if (logoFile) fd.append("logo", logoFile);
            const res = await fetch(`${API_BASE}/empresas/${empresa?.id}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: fd });
            if (!res.ok) throw new Error("Erro ao salvar");
            onClose();
        } catch (e: any) { alert(e.message); } finally { setSaving(false); }
    };
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-[520px] rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden max-h-[90vh] flex flex-col" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
                <div className="flex items-center justify-between p-5 border-b border-black/5">
                    <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center"><Building2 size={18} /></div><div><p className="text-[14px] font-black">Configurar Empresa</p><p className="text-[11px] text-[#8A8A8A]">Dados para fatura</p></div></div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#F5F2ED] flex items-center justify-center"><X size={16} /></button>
                </div>
                {loading? <div className="p-10 text-center text-[12px]">Carregando...</div> : (
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-24 h-24 rounded-[20px] bg-[#F5F2ED] overflow-hidden flex items-center justify-center border">{logoPreview? <img src={logoPreview} className="w-full h-full object-cover" /> : <Building2 size={28} className="text-[#C5C5C5]" />}</div>
                            <label className="text-[11px] font-bold px-4 h-8 rounded-full bg-black text-white flex items-center gap-2 cursor-pointer"><Upload size={12} /> Trocar logo<input type="file" hidden accept="image/*" onChange={e=>onFile(e.target.files?.[0]||null)} /></label>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <input value={form.nome_fantasia||""} onChange={e=>setForm({...form, nome_fantasia:e.target.value})} placeholder="Nome fantasia" className="h-11 px-4 rounded-full bg-[#F5F2ED] text-[12px] outline-none" />
                            <div className="grid grid-cols-2 gap-3"><input value={form.nif||""} onChange={e=>setForm({...form, nif:e.target.value})} placeholder="NIF" className="h-11 px-4 rounded-full bg-[#F5F2ED] text-[12px] outline-none" /><input value={form.phone||""} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="Telefone" className="h-11 px-4 rounded-full bg-[#F5F2ED] text-[12px] outline-none" /></div>
                            <input value={form.email||""} onChange={e=>setForm({...form, email:e.target.value})} placeholder="Email" className="h-11 px-4 rounded-full bg-[#F5F2ED] text-[12px] outline-none" />
                            <input value={form.address||""} onChange={e=>setForm({...form, address:e.target.value})} placeholder="Endereço" className="h-11 px-4 rounded-full bg-[#F5F2ED] text-[12px] outline-none" />
                            <div className="grid grid-cols-2 gap-3"><input value={form.city||""} onChange={e=>setForm({...form, city:e.target.value})} placeholder="Cidade" className="h-11 px-4 rounded-full bg-[#F5F2ED] text-[12px] outline-none" /><input value={form.province||""} onChange={e=>setForm({...form, province:e.target.value})} placeholder="Província" className="h-11 px-4 rounded-full bg-[#F5F2ED] text-[12px] outline-none" /></div>
                            <div className="grid grid-cols-2 gap-3"><input value={form.iban||""} onChange={e=>setForm({...form, iban:e.target.value})} placeholder="IBAN" className="h-11 px-4 rounded-full bg-[#F5F2ED] text-[12px] outline-none" /><input value={form.banco1||""} onChange={e=>setForm({...form, banco1:e.target.value})} placeholder="Banco" className="h-11 px-4 rounded-full bg-[#F5F2ED] text-[12px] outline-none" /></div>
                        </div>
                    </div>
                )}
                <div className="p-4 border-t border-black/5 flex gap-2"><button onClick={onClose} className="flex-1 h-11 rounded-full bg-[#F5F2ED] text-[12px] font-bold">Cancelar</button><button onClick={save} disabled={saving} className="flex-1 h-11 rounded-full bg-black text-white text-[12px] font-bold disabled:opacity-50">{saving? "Salvando..." : "Salvar"}</button></div>
            </div>
        </div>
    )
}

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const moduleId = (pathname.split("/")[2] as ModuleId) || "dashboard";
    const [activeTab, setActiveTab] = useState("home");
    const [user, setUser] = useState<any>(null);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [role, setRole] = useState("funcionario");
    const [showWelcome, setShowWelcome] = useState(true);
    const [showConfig, setShowConfig] = useState(false);
    const { search, setSearch, setActiveTab: setSearchTab } = useGlobalSearch();
    const [pedidosCount, setPedidosCount] = useState(0);
    const prevCountRef = useRef(0);
    const isFirstLoad = useRef(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) { router.push("/login"); return; }
        try {
            const u = JSON.parse(localStorage.getItem("user") || "{}");
            setUser(u);
            const r = normalizeRole(u?.role || u?.role_equivalente || u?.perfil_slug || "funcionario");
            setRole(r);
            const saved = localStorage.getItem(`${moduleId}_tab`) || "home";
            const allowed = ROLE_PERMISSIONS[r] || ROLE_PERMISSIONS["funcionario"];
            if (allowed.includes("*") || allowed.includes(saved)) setActiveTab(saved); else setActiveTab("home");
        } catch { setUser({}); }
    }, [moduleId, router]);

    useEffect(() => { if (!user?.nome) return; setShowWelcome(true); const t = setTimeout(() => setShowWelcome(false), 3200); return () => clearTimeout(t); }, [user]);
    useEffect(() => {
        audioRef.current = new Audio("/sounds/new-order.wav");
        audioRef.current.volume = 0.8;
        const fetchPedidosCount = async () => {
            try {
                const token = localStorage.getItem("access_token") || "";
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                const emp = u.empresa_id || localStorage.getItem("empresa_id") || "";
                if (!emp) return;
                const r = await fetch(`${API_URL}/api/v1/pedidos-qr/pendentes`, { headers: { Authorization: `Bearer ${token}`, "X-Empresa-ID": emp }, cache: "no-store" as any });
                if (!r.ok) return;
                const data = await r.json();
                const newCount = Array.isArray(data)? data.length : 0;
                if (!isFirstLoad.current && newCount > prevCountRef.current) { audioRef.current?.play().catch(() => { }); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
                prevCountRef.current = newCount; setPedidosCount(newCount); isFirstLoad.current = false;
            } catch { }
        };
        fetchPedidosCount();
        const interval = setInterval(fetchPedidosCount, 4000);
        const onAprovado = (e: any) => { const id = e.detail?.id; if (id) { setPedidosCount(c => Math.max(0, c - 1)); prevCountRef.current = Math.max(0, prevCountRef.current - 1); } else fetchPedidosCount(); };
        window.addEventListener("pedido-qr:aprovado" as any, onAprovado);
        window.addEventListener("pedido-qr:recusado" as any, onAprovado);
        return () => { clearInterval(interval); window.removeEventListener("pedido-qr:aprovado" as any, onAprovado); window.removeEventListener("pedido-qr:recusado" as any, onAprovado); };
    }, []);
    useEffect(() => {
        localStorage.setItem(`${moduleId}_tab`, activeTab);
        setSearchTab(activeTab); setSearch("");
        if (activeTab === "vendas") { const token = localStorage.getItem("access_token"); fetch(`${API_BASE}/caixa/status`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { if (!d.aberto) setActiveTab("caixa"); }).catch(() => setActiveTab("caixa")); }
    }, [activeTab, moduleId, setSearchTab, setSearch]);
    const can = useMemo(() => (tab: string) => { const a = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["funcionario"]; return a.includes("*") || a.includes(tab); }, [role]);
    useEffect(() => { if (role &&!can(activeTab)) setActiveTab("home"); }, [role, activeTab, can]);
    const logout = () => { localStorage.clear(); router.push("/login"); };
    const isVendasOpen = activeTab === "vendas";
    const meta = TAB_META[activeTab] || { title: "Painel", desc: "Visão geral" };
    const headerTitle = showWelcome? `Bem-vindo, ${user?.nome || "Francisco Dala"}!` : meta.title;
    const headerDesc = showWelcome? `Explore as informações e atividades do seu restaurante` : meta.desc;

    return (
        <DashboardCtx.Provider value={{ activeTab, setActiveTab, user, moduleId, role, can, pedidosCount, setPedidosCount }}>
            <div className="h-[100dvh] w-screen overflow-hidden bg-[#EDEBE6] flex p-0 md:p-[14px] md:gap-[14px]" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
                <div className="hidden md:flex shrink-0"><Sidebar activeTab={activeTab} setActiveTab={(t: any) => { setActiveTab(t); setIsMobileOpen(false) }} onLogout={logout} role={role} can={can} onOpenConfig={() => setShowConfig(true)} /></div>
                {!isVendasOpen && (
                    <div className={`fixed inset-0 z-[300] md:hidden transition ${isMobileOpen? "visible" : "invisible"}`}>
                        <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity ${isMobileOpen? "opacity-100" : "opacity-0"}`} onClick={() => setIsMobileOpen(false)} />
                        <div className={`absolute left-0 top-0 h-full w-[84%] max-w-[330px] bg-[#EDEBE6] p-4 shadow-[8px_0_30px_rgba(0,0,0,0.15)] transition-transform duration-300 overflow-y-auto no-scrollbar ${isMobileOpen? "translate-x-0" : "-translate-x-full"}`}>
                            <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-black text-white rounded-full grid place-items-center text-[10px] font-black">JD</div><div className="leading-none"><p className="text-[12px] font-black">Menu</p><p className="text-[10px] text-[#8A8A8A] capitalize">{role.replace('_', ' ')}</p></div></div><button onClick={() => setIsMobileOpen(false)} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center active:scale-95"><X size={16} /></button></div>
                            <Sidebar isMobile={true} activeTab={activeTab} setActiveTab={(t: any) => { setActiveTab(t); setIsMobileOpen(false) }} onLogout={logout} role={role} can={can} onOpenConfig={() => { setIsMobileOpen(false); setShowConfig(true) }} />
                        </div>
                    </div>
                )}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {!isVendasOpen && (
                        <div className="flex items-center justify-between gap-3 px-4 md:px-0 py-3 shrink-0 bg-[#EDEBE6] md:bg-transparent border-b md:border-0 border-black/5">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button onClick={() => setIsMobileOpen(true)} className="md:hidden w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(0,0,0,0.08)] shrink-0 active:scale-95"><Menu size={18} /></button>
                                <div className="flex-1 min-w-0"><h1 className="text-[14px] md:text-[18px] font-[900] text-[#1E1E1E] leading-[0.9] tracking-[-0.02em] truncate">{headerTitle}</h1><p className="text-[11px] md:text-[13px] text-[#8A8A8A] mt-1 font-medium truncate hidden sm:block">{headerDesc}</p></div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0"><div className="relative w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(0,0,0,0.05)]">🔔{pedidosCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#EDEBE6] animate-pulse">{pedidosCount > 9? "9+" : pedidosCount}</span>}</div><div className="bg-white rounded-full pl-1 pr-3 py-1 flex items-center gap-2 shadow-[0_1px_6px_rgba(0,0,0,0.05)] h-9 ml-1"><img src="https://i.pravatar.cc/100?img=33" className="w-7 h-7 rounded-full" alt="user" /><div className="hidden md:block leading-none"><p className="text-[11px] font-bold">{user?.nome || "Francisco"}</p><p className="text-[9px] text-[#9A9A9A] capitalize">{role.replace('_', ' ')}</p></div></div></div>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-0 md:pr-1 pb-4 md:pb-0 mt-0 md:mt-2">{children}</div>
                </div>
                {isVendasOpen && <div className="absolute inset-0 z-[100] bg-[#EDEBE6] flex flex-col overflow-hidden"><div className="flex-1 overflow-hidden p-0 md:p-[14px]"><VendasTab onClose={() => setActiveTab("home")} /></div></div>}
            </div>
            <EmpresaConfigModal open={showConfig} onClose={() => setShowConfig(false)} />
            <style jsx global>{`html,body{height:100%;overflow:hidden;background:#EDEBE6;scrollbar-width:none}::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
        </DashboardCtx.Provider>
    );
}
