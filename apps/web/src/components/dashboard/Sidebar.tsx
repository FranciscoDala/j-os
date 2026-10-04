"use client";
import { usePathname } from "next/navigation";
import { Settings, Power } from "lucide-react";
import { menuConfig, ModuleId } from "./menu_config";
import { useEffect, useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";

// PERMISSÕES POR TAB - Sincronizado com backend
const TAB_ROLES: Record<string, string[]> = {
    home: ["*"],
    caixa: ["dono", "gerente_restaurante", "operador_caixa", "caixa"],
    vendas: ["dono", "gerente_restaurante", "operador_caixa", "caixa", "garcom", "funcionario"],
    produtos: ["dono", "gerente_restaurante", "operador_caixa", "funcionario"],
    funcionarios: ["dono", "gerente_restaurante", "operador_caixa", "rh"],
    cardapio: ["dono", "gerente_restaurante", "operador_caixa"],
    pedidos: ["dono", "gerente_restaurante", "operador_caixa", "garcom"],
    mesas: ["dono", "gerente_restaurante", "operador_caixa", "garcom"],
    financas: ["dono", "gerente_restaurante"],
    relatorios: ["dono", "gerente_restaurante"],
};

function normalizeRole(r: any) {
    return String(r || "funcionario").toLowerCase();
}

function canViewTab(tabId: string, role: string): boolean {
    const allowed = TAB_ROLES[tabId];
    if (!allowed) return true; // se não tem regra, libera
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
                const res = await fetch(`${API_BASE}/caixa/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCaixaAberto(data.aberto === true);
                } else {
                    setCaixaAberto(false);
                }
            } catch {
                setCaixaAberto(false);
            }
        };
        checkCaixa();
        const interval = setInterval(checkCaixa, 10000);
        return () => clearInterval(interval);
    }, [activeTab]);

    useEffect(() => {
        if (caixaAberto === false && activeTab === 'vendas') {
            setActiveTab('caixa');
        }
    }, [caixaAberto, setActiveTab, activeTab]);

    const filteredTabs = tabs.filter((t: any) => {
        if (t.id === 'vendas' && caixaAberto === false) return false;
        // FILTRO POR ROLE - AQUI ESTAVA O FIX
        if (!canViewTab(t.id, userRole)) return false;
        // Se veio can do Tamplate, usa também
        if (can && typeof can === 'function' && !can(t.id)) return false;
        return true;
    });

    return (
        <aside className="w-[76px] md:w-[68px] h-[calc(100dvh-16px)] md:h-full bg-white/95 md:bg-white/20 backdrop-blur-xl rounded-[22px] flex flex-col border border-white/40 shadow-2xl md:shadow-lg shrink-0 overflow-hidden">
            <div className="flex flex-col items-center pt-5 pb-3 shrink-0">
                <div className="w-11 h-11 bg-[#5A8AD4] md:bg-white rounded-full flex items-center justify-center text-white md:text-[#5A8AD4] font-black shadow-md">J</div>
                {/* Mostra role pequeno no sidebar - só debug, pode remover depois */}
                <span className="text-[7px] font-black mt-1 opacity-40 uppercase tracking-widest hidden md:block">{userRole.replace('_', ' ')}</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                <nav className="flex flex-col items-center gap-2.5 py-2 pb-4">
                    {filteredTabs.map(({ id, icon: Icon }: any) => (
                        <button key={id} onClick={() => setActiveTab(id)} className={`w-11 h-11 rounded-full flex items-center justify-center transition shrink-0 ${activeTab === id ? "bg-[#FFE86A] text-black shadow-md" : id === 'caixa' ? "bg-black text-white shadow-md hover:bg-black/80" : "bg-gray-100 md:bg-white/30 text-gray-600 md:text-white/80 hover:bg-white/50"}`} title={`${id} - ${userRole}`}>
                            <Icon size={19} />
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex flex-col items-center gap-3 py-4 shrink-0 border-t border-black/5 md:border-white/10 bg-black/[0.02] md:bg-white/5">
                {/* Settings só pra dono e gerente */}
                {(userRole === 'dono' || userRole === 'gerente_restaurante' || userRole === 'operador_caixa') && (
                    <button onClick={() => setActiveTab("settings")} className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${activeTab === "settings" ? "bg-[#FFE86A] text-black" : "bg-white md:bg-white/30 text-gray-500"}`}><Settings size={18} /></button>
                )}
                <button onClick={onLogout} className="w-11 h-11 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shrink-0"><Power size={18} /></button>
            </div>
            <style jsx>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
        </aside>
    );
}
