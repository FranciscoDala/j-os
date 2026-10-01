"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Bell, Mail } from "lucide-react";
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

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) { router.push("/login"); return; }
        setUser(JSON.parse(localStorage.getItem("user") || "{}"));
        const saved = localStorage.getItem(`${moduleId}_tab`);
        if (saved) setActiveTab(saved);
        else setActiveTab("home");
    }, [moduleId]);

    useEffect(() => { localStorage.setItem(`${moduleId}_tab`, activeTab); }, [activeTab, moduleId]);

    const logout = () => { localStorage.clear(); router.push("/login"); };

    return (
        <DashboardCtx.Provider value={{ activeTab, setActiveTab, user, moduleId }}>
            <div className="min-h-screen bg-[#5A8AD4] p-3">
                <div className="bg-white/30 backdrop-blur-2xl rounded-[28px] flex gap-3 p-3 min-h-[95vh] border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.2)]">
                    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
                    <main className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl rounded-full px-4 py-2.5 w-[380px] border border-white/50"><Search size={18} className="text-gray-400" /><input className="flex-1 outline-none text-[13px] bg-transparent" placeholder={`Buscar em ${moduleId}...`} /></div>
                            <div className="flex items-center gap-2">
                                <button className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center border border-white/50"><Bell size={16} /></button>
                                <button className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center border border-white/50"><Mail size={16} /></button>
                                <div className="bg-white/70 backdrop-blur-xl rounded-full pl-1 pr-3 py-1 flex items-center gap-2 border border-white/50"><img src="https://i.pravatar.cc/100?img=33" className="w-8 h-8 rounded-full" /><div><p className="text-[13px] font-bold leading-none">{user?.nome || "Gerente"}</p><p className="text-[11px] text-gray-500 capitalize">{moduleId}</p></div></div>
                            </div>
                        </div>
                        {children}
                    </main>
                </div>
            </div>
        </DashboardCtx.Provider>
    );
}
