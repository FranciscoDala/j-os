"use client";
import { usePathname } from "next/navigation";
import { menuConfig, ModuleId } from "./menu_config";
import { useEffect, useState } from "react";
import { useDashboard } from "./Tamplate";
import { Settings, Power } from "lucide-react";
import { useEmpresa } from "@/components/dashboard/empresaContext";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
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

function getLogoSrc(logo_url?: string) {
    if (!logo_url) return null;
    if (logo_url.startsWith("http")) return logo_url;
    return `${API_URL}${logo_url.startsWith("/") ? "" : "/"}${logo_url}`;
}

export function Sidebar({ activeTab, setActiveTab, onLogout, role, can, isMobile = false, onOpenConfig }: any) {
    const pathname = usePathname();
    const moduleId = (pathname.split("/")[2] as ModuleId) || "dashboard";
    const [caixaAberto, setCaixaAberto] = useState<boolean | null>(null);
    const [userRole, setUserRole] = useState("funcionario");
    const { pedidosCount } = useDashboard();
    const { empresa } = useEmpresa();
    const tabs = menuConfig[moduleId] || menuConfig.dashboard;

    const empresaLogo = getLogoSrc(empresa?.logo_url);

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
        if (can && typeof can === 'function' && !can(t.id)) return false;
        return true;
    });

    const showConfig = CAN_CONFIG.includes(userRole);

    // LOGO NO TOPO
    const LogoTopo = ({ size = "w-12 h-12" }: { size?: string }) => (
        <button
            onClick={() => setActiveTab('home')}
            title={empresa?.nome_fantasia || "Início"}
            className={`${size} rounded-full flex items-center justify-center overflow-hidden shrink-0 bg-white border border-black/5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] transition active:scale-95 ${activeTab === 'home' ? 'ring-2 ring-black' : 'hover:ring-2 hover:ring-black/20'}`}
        >
            {empresaLogo ? (
                <img src={empresaLogo} className="w-full h-full object-cover" alt="logo empresa" />
            ) : (
                <span className="text-[15px] font-black text-black">{empresa?.nome_fantasia?.[0] || "J"}</span>
            )}
        </button>
    );

    if (isMobile) {
        return (
            <div className="w-full flex flex-col h-full" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
                <div className="flex items-center gap-3 px-2 mb-4">
                    <LogoTopo size="w-12 h-12" />
                    <div className="leading-none">
                        <p className="text-[12px] font-black truncate text-black">{empresa?.nome_fantasia || "Empresa"}</p>
                        <p className="text-[10px] text-black/60">{empresa?.nif || ""}</p>
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                    {filteredTabs.map(({ id, label, icon: Icon }: any) => {
                        const active = activeTab === id;
                        return (
                            <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-4 h-[56px] rounded-full text-[13px] font-bold transition-all ${active ? 'bg-white text-black shadow-[0_4px_12px_rgba(0,0,0,0.12)]' : 'bg-transparent text-black border border-black/10'}`}>
                                <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-black/5' : 'bg-white/60'}`}><Icon size={24} strokeWidth={2} className="text-black" /></span>
                                <span className="flex-1 text-left">{label}</span>
                                {id === 'pedidos' && pedidosCount > 0 && <span className={`min-w-[22px] h-[22px] px-1.5 text-[11px] font-black rounded-full flex items-center justify-center ${active ? 'bg-black text-white' : 'bg-red-500 text-white'}`}>{pedidosCount > 9 ? "9+" : pedidosCount}</span>}
                            </button>
                        )
                    })}
                </div>
                <div className="mt-4 pt-4 border-t border-black/10 flex flex-col gap-2">
                    {showConfig && <button onClick={onOpenConfig} className="w-full flex items-center gap-3 px-4 h-[52px] rounded-full bg-white/70 text-black text-[13px] font-bold border border-black/10"><Settings size={22} strokeWidth={2} className="text-black" /> Configurações</button>}
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 h-[52px] rounded-full bg-white/70 text-black text-[13px] font-bold border border-black/10 hover:bg-white"><Power size={22} strokeWidth={2.5} className="text-black" /> Sair</button>
                </div>
            </div>
        )
    }

    return (
        <aside className="w-[68px] h-[calc(100dvh-28px)] bg-transparent rounded-[28px] flex flex-col items-center py-4 shrink-0" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            {/* LOGO NO TOPO */}
            <LogoTopo size="w-10 h-10" />

            <div className="flex-1 flex flex-col items-center gap-2 mt-5">
                {filteredTabs.filter((t: any) => t.id !== 'home').map(({ id, icon: Icon }: any) => (
                    <button key={id} onClick={() => setActiveTab(id)} className={`relative w-12 h-12 rounded-full flex items-center justify-center transition ${activeTab === id ? 'bg-white text-black shadow-[0_4px_12px_rgba(0,0,0,0.15)]' : 'text-black hover:bg-white/60'}`}>
                        <Icon size={24} strokeWidth={2} className="text-black" />
                        {id === 'pedidos' && pedidosCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[4px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-[2px] border-white">{pedidosCount > 9 ? "9+" : pedidosCount}</span>}
                    </button>
                ))}
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-[1px] bg-black/20 my-1" />
                {showConfig && <button onClick={onOpenConfig} className="w-12 h-12 rounded-full flex items-center justify-center bg-white/70 text-black hover:bg-white transition"><Settings size={22} strokeWidth={2} className="text-black" /></button>}
                {/* SAIR - ícone OFF preto */}
                <button onClick={onLogout} title="Sair" className="w-12 h-12 rounded-full flex items-center justify-center text-black hover:bg-white/70 transition active:scale-95"><Power size={24} strokeWidth={2.5} className="text-black" /></button>
            </div>
        </aside>
    );
}
