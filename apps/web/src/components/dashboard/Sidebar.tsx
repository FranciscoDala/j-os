"use client";
import { usePathname } from "next/navigation";
import { menuConfig, ModuleId } from "./menu_config";
import { useEffect, useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";

const TAB_ROLES: Record<string, string[]> = {
    home: ["*"], caixa: ["dono", "gerente_restaurante", "operador_caixa", "caixa"],
    vendas: ["dono", "gerente_restaurante", "operador_caixa", "caixa", "garcom", "funcionario"],
    produtos: ["dono", "gerente_restaurante", "operador_caixa", "funcionario"],
    funcionarios: ["dono", "gerente_restaurante", "operador_caixa", "rh"],
    cardapio: ["dono", "gerente_restaurante", "operador_caixa"],
    pedidos: ["dono", "gerente_restaurante", "operador_caixa", "garcom"],
    mesas: ["dono", "gerente_restaurante", "operador_caixa", "garcom"],
    financas: ["dono", "gerente_restaurante"], relatorios: ["dono", "gerente_restaurante"],
};

function normalizeRole(r: any) { return String(r || "funcionario").toLowerCase(); }
function canViewTab(tabId: string, role: string): boolean {
    const allowed = TAB_ROLES[tabId];
    if (!allowed) return true;
    if (allowed.includes("*")) return true;
    return allowed.includes(role);
}

export function Sidebar({ activeTab, setActiveTab, onLogout, role, can }: any) {
    const pathname = usePathname();
    const moduleId = (pathname.split("/")[2] as ModuleId) || "dashboard";
    const [caixaAberto, setCaixaAberto] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState("funcionario");
    const tabs = menuConfig[moduleId] || menuConfig.dashboard;

    useEffect(() => {
        const r = role || normalizeRole(JSON.parse(localStorage.getItem("user") || "{}")?.role || "funcionario");
        setUserRole(normalizeRole(r));
    }, [role]);

    useEffect(() => {
        const checkCaixa = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const res = await fetch(`${API_BASE}/caixa/status`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) { const data = await res.json(); setCaixaAberto(data.aberto === true); } else setCaixaAberto(false);
            } catch { setCaixaAberto(false); }
        };
        checkCaixa();
        const interval = setInterval(checkCaixa, 10000);
        return () => clearInterval(interval);
    }, [activeTab]);

    useEffect(() => { if (caixaAberto === false && activeTab === 'vendas') setActiveTab('caixa'); }, [caixaAberto, setActiveTab, activeTab]);

    const filteredTabs = tabs.filter((t: any) => {
        if (t.id === 'vendas' && caixaAberto === false) return false;
        if (!canViewTab(t.id, userRole)) return false;
        if (can && typeof can === 'function' &&!can(t.id)) return false;
        return true;
    });

    return (
        <aside className="w-[76px] h-full bg-white rounded-[28px] flex flex-col border border-white shadow-sm shrink-0 overflow-hidden" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            {/* TOP ICON PRETO IGUAL COPIA */}
            <div className="flex flex-col items-center pt-4 pb-2">
                <div className="w-11 h-11 bg-black rounded-full flex items-center justify-center text-white">
                    <div className="grid grid-cols-3 gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full"/><div className="w-1.5 h-1.5 bg-white rounded-full"/><div className="w-1.5 h-1.5 bg-white rounded-full"/><div className="w-1.5 h-1.5 bg-white rounded-full"/><div className="w-1.5 h-1.5 bg-white rounded-full"/><div className="w-1.5 h-1.5 bg-white rounded-full"/><div className="w-1.5 h-1.5 bg-white rounded-full"/><div className="w-1.5 h-1.5 bg-white rounded-full"/><div className="w-1.5 h-1.5 bg-white rounded-full"/></div>
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 scrollbar-hide">
                <nav className="flex flex-col items-center gap-1.5 py-2 pb-4">
                    {filteredTabs.map(({ id, icon: Icon }: any) => (
                        <button key={id} onClick={() => setActiveTab(id)} className={`w-11 h-11 rounded-full flex items-center justify-center transition shrink-0 ${activeTab === id? "bg-black text-white shadow-md" : "bg-transparent text-[#8A8A8A] hover:bg-[#F5F3EF]"}`} title={id}>
                            <Icon size={18} strokeWidth={activeTab===id?2.5:1.8} />
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex flex-col items-center gap-2 py-4 border-t border-[#F0EDE8]">
                <button onClick={() => setActiveTab("settings")} className={`w-11 h-11 rounded-full flex items-center justify-center ${activeTab==="settings"?"bg-black text-white":"text-[#8A8A8A] hover:bg-[#F5F3EF]"}`}>⚙️</button>
                <button onClick={onLogout} className="w-11 h-11 rounded-full flex items-center justify-center text-[#8A8A8A] hover:bg-[#FCE8E8] hover:text-red-500">↪</button>
                <img src="https://i.pravatar.cc/100?img=33" className="w-8 h-8 rounded-full mt-1" alt="user" />
            </div>
            <style jsx>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
        </aside>
    );
}
