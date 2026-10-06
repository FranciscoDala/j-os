"use client";
import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ModuleId } from "./menu_config";
import { VendasTab } from "@/app/dashboard/restaurante/components/tabs/venda/venda";
import { useGlobalSearch } from "@/features/search/context";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

type Ctx = {
    activeTab: string;
    setActiveTab: (t: string) => void;
    user: any;
    moduleId: ModuleId;
    role: string;
    can: (p: string) => boolean;
    pedidosCount: number;
    setPedidosCount: (n: number) => void;
};
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
    configuracoes: { title: "Configurações", desc: "Ajustes da sua loja" },
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
    dono: ["*"], gerente_restaurante: ["*"],
    operador_caixa: ["home", "caixa", "vendas", "produtos", "funcionarios", "pedidos", "mesas"],
    caixa: ["home", "caixa", "vendas"], garcom: ["home", "vendas", "pedidos", "mesas"],
    vigilante: ["home"], rh: ["home", "funcionarios"], funcionario: ["home", "produtos", "vendas"],
};
function normalizeRole(raw: any) { return String(raw || "funcionario").toLowerCase(); }

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const moduleId = (pathname.split("/")[2] as ModuleId) || "dashboard";
    const [activeTab, setActiveTab] = useState("home");
    const [user, setUser] = useState<any>(null);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [role, setRole] = useState("funcionario");
    const [showWelcome, setShowWelcome] = useState(true);
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

    useEffect(() => {
        if (!user?.nome) return;
        setShowWelcome(true);
        const t = setTimeout(() => setShowWelcome(false), 3200);
        return () => clearTimeout(t);
    }, [user]);

    // polling real dos pedidos QR pendentes
    useEffect(() => {
        audioRef.current = new Audio("/sounds/new-order.wav");
        audioRef.current.volume = 0.8;

        const fetchPedidosCount = async () => {
            try {
                const token = localStorage.getItem("access_token") || "";
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                const emp = u.empresa_id || localStorage.getItem("empresa_id") || "";
                if (!emp) return;
                const r = await fetch(`${API_URL}/api/v1/pedidos-qr/pendentes`, {
                    headers: { Authorization: `Bearer ${token}`, "X-Empresa-ID": emp },
                    cache: "no-store" as any
                });
                if (!r.ok) return;
                const data = await r.json();
                const newCount = Array.isArray(data) ? data.length : 0;

                // toca som só quando aumenta e não é primeiro load
                if (!isFirstLoad.current && newCount > prevCountRef.current) {
                    audioRef.current?.play().catch(() => { });
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                }
                prevCountRef.current = newCount;
                setPedidosCount(newCount);
                isFirstLoad.current = false;
            } catch { }
        };

        fetchPedidosCount();
        const interval = setInterval(fetchPedidosCount, 4000);

        // escuta eventos de aprovação/recusa pra baixar na hora
        const onAprovado = (e: any) => {
            const id = e.detail?.id;
            if (id) {
                setPedidosCount(c => Math.max(0, c - 1));
                prevCountRef.current = Math.max(0, prevCountRef.current - 1);
            } else {
                fetchPedidosCount();
            }
        };
        window.addEventListener("pedido-qr:aprovado" as any, onAprovado);
        window.addEventListener("pedido-qr:recusado" as any, onAprovado);

        return () => {
            clearInterval(interval);
            window.removeEventListener("pedido-qr:aprovado" as any, onAprovado);
            window.removeEventListener("pedido-qr:recusado" as any, onAprovado);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(`${moduleId}_tab`, activeTab);
        setSearchTab(activeTab);
        setSearch("");
        if (activeTab === "vendas") {
            const token = localStorage.getItem("access_token");
            fetch(`${API_BASE}/caixa/status`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { if (!d.aberto) setActiveTab("caixa"); }).catch(() => setActiveTab("caixa"));
        }
    }, [activeTab, moduleId, setSearchTab, setSearch]);

    const can = useMemo(() => (tab: string) => { const a = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["funcionario"]; return a.includes("*") || a.includes(tab); }, [role]);
    useEffect(() => { if (role && !can(activeTab)) setActiveTab("home"); }, [role, activeTab, can]);
    const logout = () => { localStorage.clear(); router.push("/login"); };
    const isVendasOpen = activeTab === "vendas";

    const meta = TAB_META[activeTab] || { title: "Painel", desc: "Visão geral" };
    const headerTitle = showWelcome ? `Bem-vindo, ${user?.nome || "Francisco Dala"}!` : meta.title;
    const headerDesc = showWelcome ? `Explore as informações e atividades do seu restaurante` : meta.desc;

    return (
        <DashboardCtx.Provider value={{ activeTab, setActiveTab, user, moduleId, role, can, pedidosCount, setPedidosCount }}>
            <div className="h-[100dvh] w-screen overflow-hidden bg-[#EDEBE6] flex p-[14px] gap-[14px]" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
                <div className="hidden md:flex shrink-0"><Sidebar activeTab={activeTab} setActiveTab={(t: any) => { setActiveTab(t); setIsMobileOpen(false) }} onLogout={logout} role={role} can={can} /></div>

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {!isVendasOpen && (
                        <div className="flex items-center justify-between gap-3 py-3 shrink-0 bg-transparent">
                            <div className="flex-1">
                                <h1 className="text-[15px] md:text-[18px] font-[900] text-[#1E1E1E] leading-[0.9] tracking-[-0.02em] capitalize">
                                    {headerTitle}
                                </h1>
                                <p className="text-[12px] md:text-[13px] text-[#8A8A8A] mt-1 font-medium">
                                    {headerDesc}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="bg-white rounded-full flex items-center pl-4 pr-1.5 py-1 w-[300px] h-9 shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
                                    <input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="flex-1 outline-none text-[11px] bg-transparent placeholder:text-[#AAAAAA]"
                                        placeholder={`Pesquisar em ${meta.title}...`}
                                    />
                                    <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="6" /><path d="m21 21-4.3-4.3" /></svg>
                                    </div>
                                </div>
                                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(0,0,0,0.05)]">💬</div>

                                {/* SINO COM BADGE */}
                                <div className="relative w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(0,0,0,0.05)]">
                                    🔔
                                    {pedidosCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#EDEBE6] animate-pulse">
                                            {pedidosCount > 9 ? "9+" : pedidosCount}
                                        </span>
                                    )}
                                </div>

                                <div className="bg-white rounded-full pl-1 pr-3 py-1 flex items-center gap-2 shadow-[0_1px_6px_rgba(0,0,0,0.05)] h-9 ml-1">
                                    <img src="https://i.pravatar.cc/100?img=33" className="w-7 h-7 rounded-full" alt="user" />
                                    <div className="hidden md:block leading-none"><p className="text-[11px] font-bold">{user?.nome || "Francisco"}</p><p className="text-[9px] text-[#9A9A9A] capitalize">{role.replace('_', ' ')}</p></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto no-scrollbar mt-2 pr-1">{children}</div>
                </div>

                {isVendasOpen && (
                    <div className="absolute inset-0 z-[100] bg-[#EDEBE6] p-[14px] flex flex-col overflow-hidden"><VendasTab onClose={() => setActiveTab("home")} /></div>
                )}
            </div>
            <style jsx global>{`html,body{height:100%;overflow:hidden;background:#EDEBE6;scrollbar-width:none}::-webkit-scrollbar{display:none}.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
        </DashboardCtx.Provider>
    );
}
