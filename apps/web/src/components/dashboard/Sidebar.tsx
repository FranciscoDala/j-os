"use client";
import { usePathname } from "next/navigation";
import { Settings, Power } from "lucide-react";
import { menuConfig, ModuleId } from "./menu_config";

export function Sidebar({ activeTab, setActiveTab, onLogout }: { activeTab: string; setActiveTab: (t: string) => void; onLogout: () => void }) {
    const pathname = usePathname(); // ex: /dashboard/restaurante
    const moduleId = (pathname.split("/")[2] as ModuleId) || "dashboard";
    const tabs = menuConfig[moduleId] || menuConfig.dashboard;

    return (
        <aside className="w-[64px] bg-white/20 backdrop-blur-xl rounded-[22px] flex flex-col items-center justify-between py-4 border border-white/30 shadow-lg shrink-0">
            <div className="flex flex-col items-center gap-6">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#5A8AD4] font-black shadow-md">J</div>
                <nav className="flex flex-col gap-3">
                    {tabs.map(({ id, icon: Icon }) => (
                        <button key={id} title={id} onClick={() => setActiveTab(id)} className={`w-10 h-10 rounded-full flex items-center justify-center transition ${activeTab === id ? "bg-[#FFE86A] text-black shadow-md" : "bg-white/30 text-white/80 hover:bg-white/50"}`}>
                            <Icon size={18} />
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex flex-col gap-3">
                <button onClick={() => setActiveTab("settings")} className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === "settings" ? "bg-[#FFE86A]" : "bg-white/30 text-white/70"}`}><Settings size={18} /></button>
                <button onClick={onLogout} className="w-10 h-10 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30"><Power size={18} /></button>
            </div>
        </aside>
    );
}
