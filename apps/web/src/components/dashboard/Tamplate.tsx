"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ModuleId } from "./menu_config";
import { VendasTab } from "@/app/dashboard/restaurante/components/tabs/venda/venda";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";

type Ctx = {
  activeTab: string;
  setActiveTab: (t: string) => void;
  user: any;
  moduleId: ModuleId;
  role: string;
  can: (perm: string) => boolean;
};

const DashboardCtx = createContext<Ctx>(null as any);
export const useDashboard = () => useContext(DashboardCtx);

const ROLE_PERMISSIONS: Record<string, string[]> = {
  dono: ["*"],
  gerente_restaurante: ["*"],
  operador_caixa: ["home", "caixa", "vendas", "produtos", "funcionarios", "pedidos", "mesas"],
  caixa: ["home", "caixa", "vendas"],
  garcom: ["home", "vendas", "pedidos", "mesas"],
  vigilante: ["home"],
  rh: ["home", "funcionarios"],
  funcionario: ["home", "produtos", "vendas"],
};

function normalizeRole(raw: any): string {
  if (!raw) return "funcionario";
  return String(raw).toLowerCase();
}

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const moduleId = (pathname.split("/")[2] as ModuleId) || "dashboard";
    const [activeTab, setActiveTab] = useState("home");
    const [user, setUser] = useState<any>(null);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [role, setRole] = useState("funcionario");

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) { router.push("/login"); return; }
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          setUser(u);
          const r = normalizeRole(u?.role || u?.role_equivalente || u?.perfil_slug || "funcionario");
          setRole(r);
          const savedTab = localStorage.getItem(`${moduleId}_tab`) || "home";
          const allowed = ROLE_PERMISSIONS[r] || ROLE_PERMISSIONS["funcionario"];
          if (allowed.includes("*") || allowed.includes(savedTab)) {
            setActiveTab(savedTab);
          } else {
            setActiveTab("home");
          }
        } catch { setUser({}); }
    }, [moduleId, router]);

    useEffect(() => {
        localStorage.setItem(`${moduleId}_tab`, activeTab);
        if (activeTab === "vendas") {
            const token = localStorage.getItem("access_token");
            fetch(`${API_BASE}/caixa/status`, { headers: { Authorization: `Bearer ${token}` } })
           .then(r => r.json())
           .then(d => { if(!d.aberto) setActiveTab("caixa"); })
           .catch(() => setActiveTab("caixa"));
        }
    }, [activeTab, moduleId]);

    const can = useMemo(() => {
      return (tab: string) => {
        const allowed = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["funcionario"];
        if (allowed.includes("*")) return true;
        return allowed.includes(tab);
      };
    }, [role]);

    useEffect(() => {
      if (role &&!can(activeTab)) {
        setActiveTab("home");
      }
    }, [role, activeTab, can]);

    const logout = () => { localStorage.clear(); router.push("/login"); };
    const isVendasOpen = activeTab === "vendas";

    return (
        <DashboardCtx.Provider value={{ activeTab, setActiveTab, user, moduleId, role, can }}>
            {/* COPIA EXATA - FUNDO BEGE #EDE9E3 */}
            <div className="h-[100dvh] w-screen overflow-hidden bg-[#EDE9E3] p-3 flex gap-3" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
                <div className="hidden md:flex">
                    <Sidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileOpen(false) }} onLogout={logout} role={role} can={can} />
                </div>
                {isMobileOpen &&!isVendasOpen && (
                    <>
                        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
                        <div className="fixed left-3 top-3 bottom-3 z-50 md:hidden">
                            <Sidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileOpen(false) }} onLogout={logout} role={role} can={can} />
                        </div>
                    </>
                )}
                <div className="flex-1 flex flex-col gap-3 overflow-hidden h-full min-w-0">
                    {/* HEADER IGUAL COPIA - Hello + Search pill com botão preto */}
                    <div className="flex items-center justify-between gap-3 bg-[#F5F3EF]/60 rounded-[20px] px-5 py-3 shrink-0">
                        <div className="flex items-center gap-3 min-w-0">
                            <button onClick={() => setIsMobileOpen(true)} className="md:hidden w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">☰</button>
                            <div className="w-11 h-11 rounded-full bg-[#DCE8D8] flex items-center justify-center text-[#5A7A6A] shrink-0">✳</div>
                            <div className="min-w-0">
                                <h1 className="text-[18px] font-bold leading-none text-[#1A1A1A] truncate">Hello, {user?.nome || "Carlic"}!</h1>
                                <p className="text-[12px] text-[#8A8A8A] mt-1 truncate hidden md:block">Explore information and activity about your property</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="hidden md:flex bg-white rounded-full items-center pl-4 pr-1 py-1 w-[280px] shadow-sm border border-white">
                                <input className="flex-1 outline-none text-[13px] bg-transparent placeholder:text-[#9A9A9A]" placeholder="Search..." />
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center ml-2">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="6"/><path d="m21 21-4.3-4.3"/></svg>
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">💬</div>
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">🔔</div>
                            <div className="bg-white rounded-full pl-1 pr-3 py-1 flex items-center gap-2 shadow-sm border border-white ml-1">
                                <img src="https://i.pravatar.cc/100?img=33" className="w-7 h-7 rounded-full object-cover" alt="user" />
                                <div className="hidden md:block"><p className="text-[12px] font-bold leading-none">{user?.nome?.split(" ")[0] || "Admin"}</p><p className="text-[10px] text-gray-500 capitalize">{role.replace('_',' ')}</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-[env(safe-area-inset-bottom)]">
                        {children}
                    </div>
                </div>
                {isVendasOpen && (
                  <div className="absolute inset-0 z-[100] bg-[#EDE9E3] p-3 flex flex-col overflow-hidden">
                    <VendasTab onClose={() => setActiveTab("home")} />
                  </div>
                )}
            </div>
            <style jsx global>{`
        html, body { height: 100%; overflow: hidden; scrollbar-width: none; -ms-overflow-style: none; background: #EDE9E3; }
        html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; width: 0; height: 0; }
       .no-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
       .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </DashboardCtx.Provider>
    );
}
