"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Bell, Mail, Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ModuleId } from "./menu_config";
import { VendasTab } from "@/app/dashboard/restaurante/components/tabs/venda/venda";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";

type Ctx = { activeTab: string; setActiveTab: (t: string) => void; user: any; moduleId: ModuleId; };
const DashboardCtx = createContext<Ctx>(null as any);
export const useDashboard = () => useContext(DashboardCtx);

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const moduleId = (pathname.split("/")[2] as ModuleId) || "dashboard";
    const [activeTab, setActiveTab] = useState("home");
    const [user, setUser] = useState<any>(null);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) { router.push("/login"); return; }
        setUser(JSON.parse(localStorage.getItem("user") || "{}"));
        setActiveTab(localStorage.getItem(`${moduleId}_tab`) || "home");
    }, [moduleId]);

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

    const logout = () => { localStorage.clear(); router.push("/login"); };
    const isVendasOpen = activeTab === "vendas";

    return (
        <DashboardCtx.Provider value={{ activeTab, setActiveTab, user, moduleId }}>
            <div className="h-[100dvh] w-screen overflow-hidden bg-[#5A8AD4] p-0 md:p-3 flex">
                <div className="relative flex-1 bg-[#EEF4FF]/60 md:bg-white/30 backdrop-blur-2xl md:rounded-[28px] rounded-none flex gap-0 md:gap-3 md:p-3 p-2 border-0 md:border border-white/40 h-full overflow-hidden">
                    <div className="hidden md:flex">
                        <Sidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileOpen(false) }} onLogout={logout} />
                    </div>
                    {isMobileOpen &&!isVendasOpen && (
                        <>
                            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
                            <div className="fixed left-2 top-2 bottom-2 z-50 md:hidden">
                                <Sidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileOpen(false) }} onLogout={logout} />
                            </div>
                        </>
                    )}
                    <div className="flex-1 flex flex-col gap-2 md:gap-3 overflow-hidden h-full min-w-0">
                        <div className="flex items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <button onClick={() => setIsMobileOpen(true)} className="md:hidden w-10 h-10 bg-white/90 rounded-full flex items-center justify-center border border-white/60 shrink-0"><Menu size={18} /></button>
                                <div className="flex items-center gap-3 bg-white/90 md:bg-white/60 backdrop-blur-xl rounded-full px-4 py-2.5 flex-1 md:w-[380px] w-full border border-white/60 shadow-sm">
                                    <Search size={18} className="text-gray-400 shrink-0" />
                                    <input className="flex-1 outline-none text-[13px] bg-transparent min-w-0" placeholder={`Buscar em ${moduleId}...`} />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                <button className="hidden md:flex w-10 h-10 bg-white/60 rounded-full items-center justify-center border border-white/50"><Bell size={16} /></button>
                                <button className="hidden md:flex w-10 h-10 bg-white/60 rounded-full items-center justify-center border border-white/50"><Mail size={16} /></button>
                                <div className="bg-white/80 backdrop-blur-xl rounded-full pl-1 pr-2 md:pr-3 py-1 flex items-center gap-2 border border-white/50 shadow-sm">
                                    <img src="https://i.pravatar.cc/100?img=33" className="w-8 h-8 rounded-full object-cover shrink-0" style={{ border: '2px solid #ffffff' }} alt="user" />
                                    <div className="hidden md:block"><p className="text-[13px] font-bold leading-none">{user?.nome || "Admin Jenath"}</p><p className="text-[11px] text-gray-500 capitalize">{moduleId}</p></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-[env(safe-area-inset-bottom)]">
                            {children}
                        </div>
                    </div>
                    {isVendasOpen && (
                      <div className="absolute inset-0 z-[100] bg-[#F8FAFF] md:rounded-[28px] rounded-none flex flex-col overflow-hidden animate-in fade-in">
                        <VendasTab onClose={() => setActiveTab("home")} />
                      </div>
                    )}
                </div>
            </div>
            <style jsx global>{`
        html, body { height: 100%; overflow: hidden; scrollbar-width: none; -ms-overflow-style: none; }
        html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; width: 0; height: 0; }
     .no-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
     .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </DashboardCtx.Provider>
    );
}
