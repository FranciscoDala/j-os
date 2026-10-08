"use client";
import { usePathname } from "next/navigation";
import { menuConfig, ModuleId } from "./menu_config";
import { useEffect, useState } from "react";
import { useDashboard } from "./Tamplate";
import { Settings, LogOut } from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const TAB_ROLES: Record<string, string[]> = {
    home: ["*"], caixa: ["dono", "gerente_restaurante", "operador_caixa", "caixa"],
    vendas: ["dono", "gerente_restaurante", "operador_caixa", "caixa", "garcom", "funcionario"],
    produtos: ["dono", "gerente_restaurante", "operador_caixa", "funcionario"],
    funcionarios: ["dono", "gerente_restaurante", "operador_caixa", "rh"],
    pedidos: ["dono", "gerente_restaurante", "operador_caixa", "garcom"],
    mesas: ["dono", "gerente_restaurante", "operador_caixa", "garcom"],
};
const CAN_CONFIG = ["dono", "gerente_restaurante"];
const HIDDEN_TABS = ["financas", "relatorios", "financeiro", "relatorio", "cardapio"];

function normalizeRole(r: any) { return String(r || "funcionario").toLowerCase() }
function canViewTab(id: string, role: string) {
    if (HIDDEN_TABS.includes(id)) return false;
    const a = TAB_ROLES[id];
    if (!a) return true;
    if (a.includes("*")) return true;
    return a.includes(role);
}

export function Sidebar({ activeTab, setActiveTab, onLogout, role, can, isMobile = false, onOpenConfig }: any) {
    const pathname = usePathname();
    const moduleId = (pathname.split("/")[2] as ModuleId) || "dashboard";
    const [caixaAberto, setCaixaAberto] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState("funcionario");
    const { pedidosCount } = useDashboard();
    const tabs = menuConfig[moduleId] || menuConfig.dashboard;

    useEffect(() => { const r = role || normalizeRole(JSON.parse(localStorage.getItem("user") || "{}")?.role || "funcionario"); setUserRole(normalizeRole(r)); }, [role]);
    useEffect(() => {
        const check = async () => { try { const t = localStorage.getItem("access_token"); const res = await fetch(`${API_BASE}/caixa/status`, { headers: { Authorization: `Bearer ${t}` } }); if (res.ok) { const d = await res.json(); setCaixaAberto(d.aberto === true); } else setCaixaAberto(false); } catch { setCaixaAberto(false) } };
        check(); const i = setInterval(check, 10000); return () => clearInterval(i);
    }, [activeTab]);
    useEffect(() => { if (caixaAberto === false && activeTab === 'vendas') setActiveTab('caixa'); }, [caixaAberto, activeTab, setActiveTab]);

    const filteredTabs = tabs.filter((t: any) => {
        if (HIDDEN_TABS.includes(t.id)) return false;
        if (t.id === 'vendas' && caixaAberto === false) return false;
        if (!canViewTab(t.id, userRole)) return false;
        if (can && typeof can === 'function' &&!can(t.id)) return false;
        return true;
    });

    const showConfig = CAN_CONFIG.includes(userRole);

    if (isMobile) {
        return (
            <div className="w-full flex flex-col h-full" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
                <div className="flex-1 flex flex-col gap-1.5">
                    {filteredTabs.map(({ id, label, icon: Icon }: any) => {
                        const active = activeTab === id;
                        return (
                            <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-4 h-[52px] rounded-full text-[13px] font-bold transition-all ${active? 'bg-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]' : 'bg-white text-[#1E1E1E] border border-black/5 shadow-[0_1px_6px_rgba(0,0,0,0.04)]'}`}>
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center ${active? 'bg-white/15' : 'bg-[#F5F2ED]'}`}><Icon size={20} strokeWidth={2} /></span>
                                <span className="flex-1 text-left">{label}</span>
                                {id === 'pedidos' && pedidosCount > 0 && <span className={`min-w-[22px] h-[22px] px-1.5 text-[11px] font-black rounded-full flex items-center justify-center ${active? 'bg-white text-black' : 'bg-red-500 text-white'}`}>{pedidosCount > 9? "9+" : pedidosCount}</span>}
                            </button>
                        )
                    })}
                </div>
                <div className="mt-4 pt-4 border-t border-black/10 flex flex-col gap-2">
                    {showConfig && <button onClick={onOpenConfig} className="w-full flex items-center gap-3 px-4 h-[48px] rounded-full bg-white text-[#1E1E1E] text-[13px] font-bold border border-black/5"><Settings size={18}/> Configurações</button>}
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 h-[48px] rounded-full bg-white text-[#E53E3E] text-[13px] font-bold border border-black/5"><LogOut size={18}/> Sair</button>
                </div>
            </div>
        )
    }

    return (
        <aside className="w-[68px] h-[calc(100dvh-28px)] bg-white rounded-[28px] flex flex-col items-center py-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] shrink-0" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            <button onClick={() => setActiveTab('home')} className={`w-11 h-11 rounded-full flex items-center justify-center transition ${activeTab === 'home'? 'bg-black text-white' : 'text-[#BBBBBB] hover:bg-[#F5F2ED]'}`}>
                <div className="grid grid-cols-3 gap-[3px]">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="w-[4px] h-[4px] bg-current rounded-full" />)}</div>
            </button>
            <div className="flex-1 flex flex-col items-center gap-2 mt-6">
                {filteredTabs.filter((t: any) => t.id!== 'home').map(({ id, icon: Icon }: any) => (
                    <button key={id} onClick={() => setActiveTab(id)} className={`relative w-11 h-11 rounded-full flex items-center justify-center transition ${activeTab === id? 'bg-black text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)]' : 'text-[#A8A8A8] hover:text-[#1E1E1E] hover:bg-[#F5F2ED]'}`}>
                        <Icon size={20} strokeWidth={2} />
                        {id === 'pedidos' && pedidosCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[4px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-[2px] border-white">{pedidosCount > 9? "9+" : pedidosCount}</span>}
                    </button>
                ))}
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-[1px] bg-[#EDEBE6] my-1" />
                {showConfig && <button onClick={onOpenConfig} className="w-11 h-11 rounded-full flex items-center justify-center bg-[#F5F2ED] text-[#1E1E1E] hover:bg-black hover:text-white transition"><Settings size={18} strokeWidth={2}/></button>}
                <button onClick={onLogout} className="w-11 h-11 rounded-full flex items-center justify-center text-[#A8A8A8] hover:bg-[#FCE8E8] hover:text-red-500 transition"><LogOut size={18} strokeWidth={2}/></button>
                <img src="https://i.pravatar.cc/100?img=12" className="w-9 h-9 rounded-full mt-1 ring-2 ring-[#EDEBE6]" alt="user" />
            </div>
        </aside>
    );
}
