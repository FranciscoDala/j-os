"use client";
import { usePathname } from "next/navigation";
import { Settings, Power } from "lucide-react";
import { menuConfig, ModuleId } from "./menu_config";

export function Sidebar({ activeTab, setActiveTab, onLogout }: { activeTab: string; setActiveTab: (t: string) => void; onLogout: () => void }) {
  const pathname = usePathname();
  const moduleId = (pathname.split("/")[2] as ModuleId) || "dashboard";
  const tabs = menuConfig[moduleId] || menuConfig.dashboard;

  return (
    <aside className="w-[68px] h-full bg-white/20 backdrop-blur-xl rounded-[22px] flex flex-col border border-white/30 shadow-lg shrink-0 overflow-hidden">
      {/* LOGO FIXA */}
      <div className="flex flex-col items-center pt-4 pb-3 shrink-0">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#5A8AD4] font-black shadow-md">J</div>
      </div>

      {/* MEIO COM SCROLL INVISÍVEL - CALCULA ALTURA AUTOMATICAMENTE */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 scrollbar-hide touch-pan-y overscroll-contain"
           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <nav className="flex flex-col items-center gap-3 py-2 pb-4">
          {tabs.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition shrink-0 ${activeTab === id? "bg-[#FFE86A] text-black shadow-md" : "bg-white/30 text-white/80 hover:bg-white/50"}`}
            >
              <Icon size={19} />
            </button>
          ))}
        </nav>
      </div>

      {/* BOTTOM FIXO - NUNCA CORTA */}
      <div className="flex flex-col items-center gap-3 py-3 shrink-0 border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <button onClick={() => setActiveTab("settings")} className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition ${activeTab === "settings"? "bg-[#FFE86A] text-black" : "bg-white/30 text-white/70 hover:bg-white/40"}`}><Settings size={18} /></button>
        <button onClick={onLogout} className="w-11 h-11 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 shrink-0"><Power size={18} /></button>
      </div>

      <style jsx>{`
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </aside>
  );
}
