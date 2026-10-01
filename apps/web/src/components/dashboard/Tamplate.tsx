"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Bell, Mail, Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ModuleId } from "./menu_config";

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
        const saved = localStorage.getItem(`${moduleId}_tab`);
        setActiveTab(saved || "home");
    }, [moduleId]);

    useEffect(() => { localStorage.setItem(`${moduleId}_tab`, activeTab); }, [activeTab, moduleId]);
    const logout = () => { localStorage.clear(); router.push("/login"); };

    return (
        <DashboardCtx.Provider value={{ activeTab, setActiveTab, user, moduleId }}>
            <div className="h-[100dvh] w-screen overflow-hidden bg-[#5A8AD4] p-0 md:p-3 flex">
                <div className="flex-1 bg-[#EEF4FF]/60 md:bg-white/30 backdrop-blur-2xl md:rounded-[28px] rounded-none flex gap-0 md:gap-3 md:p-3 p-2 border-0 md:border border-white/40 shadow-none md:shadow-[0_8px_32px_rgba(31,38,135,0.2)] h-full overflow-hidden">

                    {/* SIDEBAR DESKTOP */}
                    <div className="hidden md:flex">
                        <Sidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileOpen(false) }} onLogout={logout} />
                    </div>

                    {/* SIDEBAR MOBILE DRAWER */}
                    {isMobileOpen && (
                        <>
                            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
                            <div className="fixed left-2 top-2 bottom-2 z-50 md:hidden animate-in slide-in-from-left">
                                <Sidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setIsMobileOpen(false) }} onLogout={logout} />
                            </div>
                        </>
                    )}

                    <div className="flex-1 flex flex-col gap-2 md:gap-3 overflow-hidden h-full min-w-0">
                        {/* HEADER */}
                        <div className="flex items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2 flex-1 md:flex-none min-w-0">
                                <button onClick={() => setIsMobileOpen(true)} className="md:hidden w-10 h-10 bg-white/80 rounded-full flex items-center justify-center border border-white/50 shrink-0">
                                    <Menu size={18} />
                                </button>
                                <div className="flex items-center gap-3 bg-white/80 md:bg-white/60 backdrop-blur-xl rounded-full px-4 py-2.5 flex-1 md:w-[380px] w-full border border-white/60 shadow-sm">
                                    <Search size={18} className="text-gray-400 shrink-0" />
                                    <input className="flex-1 outline-none text-[13px] bg-transparent min-w-0" placeholder={`Buscar em ${moduleId}...`} />
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                                <button className="hidden md:flex w-10 h-10 bg-white/60 rounded-full items-center justify-center border border-white/50"><Bell size={16} /></button>
                                <button className="hidden md:flex w-10 h-10 bg-white/60 rounded-full items-center justify-center border border-white/50"><Mail size={16} /></button>
                                <div className="bg-white/80 backdrop-blur-xl rounded-full pl-1 pr-3 py-1 flex items-center gap-2 border border-white/50 shadow-sm">
                                    <img src="https://i.pravatar.cc/100?img=33" className="w-8 h-8 rounded-full" />
                                    <div className="hidden md:block"><p className="text-[13px] font-bold leading-none">{user?.nome || "Admin Jenath"}</p><p className="text-[11px] text-gray-500 capitalize">{moduleId}</p></div>
                                </div>
                            </div>
                        </div>

                        {/* CONTEUDO */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pr-0 md:pr-1 pb-[env(safe-area-inset-bottom)]"
                            style={{ scrollbarWidth: 'none' }}>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
            <style jsx global>{`
        html,body{height:100%; overflow:hidden;}
       .scrollbar-hide::-webkit-scrollbar{display:none}
      `}</style>
        </DashboardCtx.Provider>
    );
}
