"use client";
import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ModuleId } from "./menu_config";
import { VendasTab } from "@/app/dashboard/restaurante/components/tabs/venda/venda";
import { useGlobalSearch } from "@/features/search/context";
import { Menu, X, Search, MessageCircle, Bell, AlertTriangle, Smartphone } from "lucide-react";
import ModalEmpresa from "./modal_empresa";
import { NotificationsModal } from "./modal_notificacoes";
import { Toasts } from "@/app/dashboard/restaurante/components/tabs/venda/modals/venda";
import { useEmpresa } from "@/components/dashboard/empresaContext";
import { getCaixaStatus } from "@/lib/api";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
type Toast = { id: string; msg: string; type: "success" | "error" | "info" | "warning" };
type Ctx = { activeTab: string; setActiveTab: (t: string) => void; user: any; moduleId: ModuleId; role: string; can: (p: string) => boolean; pedidosCount: number; setPedidosCount: (n: number) => void; stockAlerts: number; setStockAlerts: (n: number) => void; };
const DashboardCtx = createContext<Ctx>(null as any);
export const useDashboard = () => useContext(DashboardCtx);

const TAB_META: Record<string, { title: string; desc: string }> = {
    home: { title: "Painel", desc: "Visão geral do seu restaurante" },
    pedidos: { title: "Pedidos QR", desc: "Gerencie seus pedidos feitos em tempo real • LIVE" },
    produtos: { title: "Produtos", desc: "Gerencie seus produtos, catálogo e preços" },
    mesas: { title: "Mesas", desc: "Controle de mesas e atendimento" },
    caixa: { title: "Caixa", desc: "Controle financeiro do dia" },
    funcionarios: { title: "Equipe", desc: "Gestão de funcionários e acessos" },
    vendas: { title: "Vendas", desc: "" },
    relatorios: { title: "Relatórios", desc: "Análises e desempenho" }
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
    dono: ["*"],
    gerente_restaurante: ["*"],
    operador_caixa: ["home", "caixa", "vendas", "produtos", "funcionarios", "pedidos", "mesas"],
    caixa: ["home", "caixa", "vendas"],
    garcom: ["home", "vendas", "pedidos", "mesas"],
    vigilante: ["home"],
    rh: ["home", "funcionarios"],
    funcionario: ["home", "produtos", "vendas"]
};

function normalizeRole(raw: any) { return String(raw || "funcionario").toLowerCase(); }
function getLogoSrc(logo_url?: string) {
    if (!logo_url) return null;
    if (logo_url.startsWith("http")) return logo_url;
    return `${API_URL}${logo_url.startsWith("/")? "" : "/"}${logo_url}`;
}

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const moduleId = (pathname.split("/")[2] as ModuleId) || "dashboard";
    const [activeTab, setActiveTab] = useState("home");
    const [user, setUser] = useState<any>(null);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [role, setRole] = useState("funcionario");
    const [showWelcome, setShowWelcome] = useState(true);
    const [showConfig, setShowConfig] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [initialConfigTab, setInitialConfigTab] = useState<"geral"|"whatsapp">("geral");
    const [empresaData, setEmpresaData] = useState<any>(null);
    const [savingEmpresa, setSavingEmpresa] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const { search, setSearch, setActiveTab: setSearchTab } = useGlobalSearch();
    const [pedidosCount, setPedidosCount] = useState(0);
    const [stockAlerts, setStockAlerts] = useState(0);
    const [stockList, setStockList] = useState<any[]>([]);
    const [waConectado, setWaConectado] = useState<boolean | null>(null);
    const prevCountRef = useRef(0);
    const isFirstLoad = useRef(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const alertRef = useRef<HTMLAudioElement | null>(null);
    const { empresa, refreshEmpresa } = useEmpresa() as any;

    const empresaLogo = getLogoSrc(empresa?.logo_url);

    const pushToast = (msg: string, type: Toast["type"] = "info") => {
        const id = Date.now().toString() + Math.random().toString().slice(2);
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id!== id)), 4000);
    };

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) { router.push("/login"); return; }
        try {
            const u = JSON.parse(localStorage.getItem("user") || "{}");
            setUser(u);
            const r = normalizeRole(u?.role || u?.role_equivalente || u?.perfil_slug || "funcionario");
            setRole(r);
            const saved = localStorage.getItem(`${moduleId}_tab`) || "home";
            const allowed = ROLE_PERMISSIONS[r] || ROLE_PERMISSIONS["funcionario"];
            if (allowed.includes("*") || allowed.includes(saved)) setActiveTab(saved);
            else setActiveTab("home");
        } catch { setUser({}); }
    }, [moduleId, router]);

    useEffect(() => {
        if (!user?.nome) return;
        setShowWelcome(true);
        const t = setTimeout(() => setShowWelcome(false), 3200);
        return () => clearTimeout(t);
    }, [user]);

    useEffect(() => {
        if (empresa) {
            setEmpresaData((prev: any) => ({...prev,...empresa, companyName: empresa.nome_fantasia || empresa.companyName }));
            if(typeof empresa.whatsapp_conectado === "boolean") setWaConectado(empresa.whatsapp_conectado);
        }
    }, [empresa]);

    useEffect(() => {
        if (!showConfig) return;
        const load = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                const empId = u.empresa_id || localStorage.getItem("empresa_id");
                if (!empId) return;
                const res = await fetch(`${API_BASE}/empresas/${empId}`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.ok) {
                    const d = await res.json();
                    setEmpresaData({
                        id: d.id,
                        companyName: d.nome_fantasia || "",
                        nome_fantasia: d.nome_fantasia,
                        nif: d.nif || "",
                        email: d.email || "",
                        phone: d.phone || "",
                        address: d.address || "",
                        city: d.city || "",
                        province: d.province || "",
                        iban: d.iban || "",
                        iban2: d.iban2 || "",
                        banco1: d.banco1 || "",
                        banco2: d.banco2 || "",
                        logo_url: d.logo_url || "",
                        image_url: d.image_url || "",
                        whatsapp_instance: d.whatsapp_instance,
                        whatsapp_conectado: d.whatsapp_conectado
                    });
                    setWaConectado(!!d.whatsapp_conectado);
                }
            } catch { }
        };
        if (!empresa) load();
    }, [showConfig, empresa]);

    useEffect(() => {
        const checkWA = async () => {
            try {
                const token = localStorage.getItem("access_token");
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                const empId = u.empresa_id || localStorage.getItem("empresa_id") || empresa?.id;
                if (!empId) return;
                const r = await fetch(`${API_BASE}/empresas/${empId}/whatsapp/status`, { headers: { Authorization: `Bearer ${token}` } });
                if (r.ok) {
                    const j = await r.json();
                    setWaConectado(!!j.conectado);
                }
            } catch {}
        };
        checkWA();
        const it = setInterval(checkWA, 60000);
        return () => clearInterval(it);
    }, [empresa?.id]);

    useEffect(() => {
        const onEmpresaUpdate = (e: any) => {
            const detail = e.detail || {};
            if (detail?.logo_url || detail?.nome_fantasia || typeof detail?.whatsapp_conectado!== "undefined") {
                if (refreshEmpresa) refreshEmpresa();
                if(typeof detail?.whatsapp_conectado === "boolean") setWaConectado(detail.whatsapp_conectado);
                setEmpresaData((prev: any) => prev? {...prev,...detail, companyName: detail.nome_fantasia || prev.companyName } : prev);
            }
        };
        const onPedidoQr = (e: any) => {
            if (Array.isArray(e.detail)) {
                setPedidosCount(e.detail.length);
                prevCountRef.current = e.detail.length;
            } else {
                setPedidosCount(c => c + 1);
            }
        };
        const onPedidoAprovado = () => {
            setPedidosCount(c => Math.max(0, c - 1));
            prevCountRef.current = Math.max(0, prevCountRef.current - 1);
        };
        const onStockBaixo = (e: any) => {
            const d = e.detail || {};
            setStockAlerts(c => c + 1);
            setStockList(prev => {
                const exists = prev.find(x => x.id === d.id);
                if (exists) return prev.map(x => x.id === d.id? d : x);
                return [d,...prev].slice(0, 20);
            });
            pushToast(`Stock baixo: ${d.nome || "produto"} - restam ${d.estoque?? d.stock_atual}`, "warning");
        };
        const onStockZerado = (e: any) => {
            const d = e.detail || {};
            setStockAlerts(c => c + 1);
            setStockList(prev => {
                const exists = prev.find(x => x.id === d.id);
                if (exists) return prev.map(x => x.id === d.id? d : x);
                return [d,...prev].slice(0, 20);
            });
            pushToast(`SEM STOCK: ${d.nome || "produto"} zerado!`, "error");
            try { alertRef.current?.play().catch(() => { }); } catch { }
        };

        window.addEventListener("empresa:updated" as any, onEmpresaUpdate);
        window.addEventListener("empresa:update" as any, onEmpresaUpdate);
        window.addEventListener("pedido_qr:novo" as any, onPedidoQr);
        window.addEventListener("pedido-qr:aprovado" as any, onPedidoAprovado);
        window.addEventListener("pedido-qr:recusado" as any, onPedidoAprovado);
        window.addEventListener("pedido_qr:remover" as any, onPedidoAprovado);
        window.addEventListener("produto:estoque_baixo" as any, onStockBaixo);
        window.addEventListener("produto:zerado" as any, onStockZerado);
        window.addEventListener("produto:stock_baixo" as any, onStockBaixo);
        window.addEventListener("whatsapp:status" as any, (e: any) => setWaConectado(!!e.detail?.conectado));

        return () => {
            window.removeEventListener("empresa:updated" as any, onEmpresaUpdate);
            window.removeEventListener("empresa:update" as any, onEmpresaUpdate);
            window.removeEventListener("pedido_qr:novo" as any, onPedidoQr);
            window.removeEventListener("pedido-qr:aprovado" as any, onPedidoAprovado);
            window.removeEventListener("pedido-qr:recusado" as any, onPedidoAprovado);
            window.removeEventListener("pedido_qr:remover" as any, onPedidoAprovado);
            window.removeEventListener("produto:estoque_baixo" as any, onStockBaixo);
            window.removeEventListener("produto:zerado" as any, onStockZerado);
            window.removeEventListener("produto:stock_baixo" as any, onStockBaixo);
        };
    }, [refreshEmpresa, pedidosCount]);

    const handleSaveEmpresa = async (data: any) => {
        setSavingEmpresa(true);
        try {
            const token = localStorage.getItem("access_token");
            const fd = new FormData();
            ["nome_fantasia", "nif", "email", "phone", "address", "city", "province", "iban", "iban2", "banco1", "banco2"].forEach(k => {
                const val = k === "nome_fantasia"? (data.companyName || data.nome_fantasia) : data[k];
                if (val && String(val).trim()!== "") fd.append(k, String(val).trim())
            });
            if (data.logoFile) fd.append("logo", data.logoFile);
            if (data.bannerFile) fd.append("banner", data.bannerFile);
            const res = await fetch(`${API_BASE}/empresas/${data.id || empresaData.id}`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: fd });
            if (!res.ok) { const err = await res.text(); throw new Error(err) }
            const updated = await res.json();
            setEmpresaData((prev: any) => ({...prev,...updated, companyName: updated.nome_fantasia }));
            if (refreshEmpresa) await refreshEmpresa();
            else {
                localStorage.setItem("empresa_data", JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent("empresa:updated", { detail: updated }));
            }
            setShowConfig(false);
            pushToast(`Empresa ${updated.nome_fantasia || data.companyName} atualizada com sucesso!`, 'success');
        } catch (e: any) {
            pushToast("Erro ao atualizar: " + (e.message?.slice(0, 120) || "tente novamente"), 'error');
        } finally { setSavingEmpresa(false) }
    }

    useEffect(() => {
        audioRef.current = new Audio("/sounds/new-order.wav");
        audioRef.current.volume = 0.8;
        alertRef.current = new Audio("/sounds/alert.mp3");
        alertRef.current.volume = 0.9;
        const fetchPedidosCount = async () => {
            try {
                const token = localStorage.getItem("access_token") || "";
                const u = JSON.parse(localStorage.getItem("user") || "{}");
                const emp = u.empresa_id || localStorage.getItem("empresa_id") || "";
                if (!emp) return;
                const r = await fetch(`${API_URL}/api/v1/pedidos-qr/pendentes`, { headers: { Authorization: `Bearer ${token}`, "X-Empresa-ID": emp }, cache: "no-store" as any });
                if (!r.ok) return;
                const data = await r.json();
                const newCount = Array.isArray(data)? data.length : 0;
                if (!isFirstLoad.current && newCount > prevCountRef.current) {
                    audioRef.current?.play().catch(() => { });
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                }
                prevCountRef.current = newCount;
                setPedidosCount(newCount);
                isFirstLoad.current = false;
                const r2 = await fetch(`${API_URL}/api/v1/produtos/alerta/stock-baixo`, { headers: { Authorization: `Bearer ${token}`, "X-Empresa-ID": emp }, cache: "no-store" as any });
                if (r2.ok) {
                    const stockData = await r2.json();
                    if (Array.isArray(stockData)) {
                        setStockAlerts(stockData.length);
                        setStockList(stockData.map((p: any) => ({ id: p.id, nome: p.nome, estoque: Number(p.stock_atual), minimo: Number(p.stock_minimo), codigo: p.codigo })));
                    }
                }
            } catch { }
        };
        fetchPedidosCount();
        const interval = setInterval(fetchPedidosCount, 30000);
        return () => { clearInterval(interval); };
    }, []);

    useEffect(() => {
        localStorage.setItem(`${moduleId}_tab`, activeTab);
        setSearchTab(activeTab);
        setSearch("");
        if (activeTab === "vendas") {
            getCaixaStatus().then((d: any) => { if (!d.aberto) setActiveTab("caixa"); }).catch(() => setActiveTab("caixa"));
        }
    }, [activeTab, moduleId, setSearchTab, setSearch]);

    const can = useMemo(() => (tab: string) => {
        const a = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["funcionario"];
        return a.includes("*") || a.includes(tab);
    }, [role]);

    useEffect(() => { if (role &&!can(activeTab)) setActiveTab("home"); }, [role, activeTab, can]);

    const logout = () => { localStorage.clear(); router.push("/login"); };
    const isVendasOpen = activeTab === "vendas";
    const meta = TAB_META[activeTab] || { title: "Painel", desc: "Visão geral" };
    const headerTitle = showWelcome? `Bem-vindo, ${user?.nome || empresa?.nome_fantasia || "Francisco Dala"}!` : meta.title;
    const headerDesc = showWelcome? `Explore as informações e atividades do seu restaurante` : meta.desc;
    const totalNotifs = pedidosCount + stockAlerts;

    return (
        <DashboardCtx.Provider value={{ activeTab, setActiveTab, user, moduleId, role, can, pedidosCount, setPedidosCount, stockAlerts, setStockAlerts }}>
            <div className="h-[100dvh] w-screen overflow-hidden bg-[#EDEBE6] flex p-0 md:p-[14px] md:gap-[14px]" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
                <Toasts toasts={toasts} setToasts={setToasts} />
                <div className="hidden md:flex shrink-0"><Sidebar activeTab={activeTab} setActiveTab={(t: any) => { setActiveTab(t); setIsMobileOpen(false) }} onLogout={logout} role={role} can={can} onOpenConfig={() => { setInitialConfigTab("geral"); setShowConfig(true); }} /></div>
                {!isVendasOpen && (<div className={`fixed inset-0 z-[300] md:hidden transition ${isMobileOpen? "visible" : "invisible"}`}><div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity ${isMobileOpen? "opacity-100" : "opacity-0"}`} onClick={() => setIsMobileOpen(false)} /><div className={`absolute left-0 top-0 h-full w-[84%] max-w-[330px] bg-[#EDEBE6] p-4 shadow-[8px_0_30px_rgba(0,0,0,0.15)] transition-transform duration-300 overflow-y-auto no-scrollbar ${isMobileOpen? "translate-x-0" : "-translate-x-full"}`}><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2">{empresaLogo? <img src={empresaLogo} className="w-8 h-8 rounded-full object-cover border" /> : <div className="w-8 h-8 bg-black text-white rounded-full grid place-items-center text-[10px] font-black">JD</div>}<div className="leading-none"><p className="text-[12px] font-black truncate">{empresa?.nome_fantasia || "Menu"}</p><p className="text-[10px] text-[#8A8A8A] capitalize">{role.replace('_', ' ')}</p></div></div><button onClick={() => setIsMobileOpen(false)} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center active:scale-95"><X size={16} /></button></div><Sidebar isMobile={true} activeTab={activeTab} setActiveTab={(t: any) => { setActiveTab(t); setIsMobileOpen(false) }} onLogout={logout} role={role} can={can} onOpenConfig={() => { setIsMobileOpen(false); setInitialConfigTab("geral"); setShowConfig(true); }} /></div></div>)}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {!isVendasOpen && (
                        <div className="flex items-center justify-between gap-3 px-4 md:px-0 py-3 shrink-0 bg-[#EDEBE6] md:bg-transparent border-b md:border-0 border-black/5">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button onClick={() => setIsMobileOpen(true)} className="md:hidden w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(0,0,0,0.08)] shrink-0 active:scale-95"><Menu size={20} strokeWidth={2} /></button>
                                <div className="flex-1 min-w-0"><h1 className="text-[14px] md:text-[18px] font-[900] text-[#1E1E1E] leading-[0.9] tracking-[-0.02em] truncate">{headerTitle}</h1><p className="text-[11px] md:text-[13px] text-[#8A8A8A] mt-1 font-medium truncate hidden sm:block">{headerDesc}</p></div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="hidden lg:flex bg-white rounded-full items-center pl-4 pr-1.5 py-1 w-[300px] h-11 shadow-[0_1px_6px_rgba(0,0,0,0.05)] border border-black/5">
                                    <input value={search} onChange={e => setSearch(e.target.value)} className="flex-1 outline-none text-[12px] bg-transparent placeholder:text-[#AAAAAA] font-bold" placeholder={`Pesquisar em ${meta.title}...`} />
                                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
                                        <Search size={14} className="text-white" strokeWidth={2.5} />
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setInitialConfigTab("whatsapp"); setShowConfig(true); }}
                                    title={waConectado? "WhatsApp conectado" : "WhatsApp desconectado"}
                                    className={`relative w-11 h-11 rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(0,0,0,0.05)] border transition active:scale-95 ${waConectado? 'bg-green-50 border-green-200 text-green-600' : 'bg-orange-50 border-orange-200 text-orange-500'}`}
                                >
                                    <Smartphone size={20} strokeWidth={2} />
                                    <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#EDEBE6] ${waConectado? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`} />
                                </button>

                                <button className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(0,0,0,0.05)] border border-black/5 text-[#A8A8A8] hover:text-[#1E1E1E] hover:bg-[#F5F2ED] transition active:scale-95"><MessageCircle size={20} strokeWidth={2} /></button>

                                <div className="relative">
                                    <button
                                        id="btn-notif"
                                        onClick={() => setShowNotifications(v =>!v)}
                                        className={`relative w-11 h-11 rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(0,0,0,0.05)] border border-black/5 transition active:scale-95 ${showNotifications
                                               ? 'bg-black text-white'
                                                : stockList.length > 0
                                                   ? 'bg-red-50 text-red-600 border-red-200'
                                                    : 'bg-white text-[#A8A8A8] hover:text-[#1E1E1E] hover:bg-[#F5F2ED]'
                                            }`}
                                    >
                                        {stockList.length > 0? <AlertTriangle size={20} strokeWidth={2} /> : <Bell size={20} strokeWidth={2} />}
                                        {totalNotifs > 0 && (
                                            <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#EDEBE6] animate-pulse ${stockList.length > 0? 'bg-red-500' : 'bg-black'}`}>
                                                {totalNotifs > 9? "9+" : totalNotifs}
                                            </span>
                                        )}
                                    </button>
                                    <NotificationsModal
                                        open={showNotifications}
                                        onClose={() => setShowNotifications(false)}
                                        pedidosCount={pedidosCount}
                                        stockAlerts={stockList}
                                        onGoPedidos={() => setActiveTab("pedidos")}
                                        onGoProdutos={() => setActiveTab("produtos")}
                                    />
                                </div>

                                <div className="bg-white rounded-full pl-1 pr-3 py-1 flex items-center gap-2 shadow-[0_1px_6px_rgba(0,0,0,0.05)] h-11 ml-1 border border-black/5">
                                    {empresaLogo? (
                                        <img src={empresaLogo} className="w-8 h-8 rounded-full object-cover" alt="logo empresa" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-black text-white grid place-items-center text-[10px] font-black">{empresa?.nome_fantasia?.[0] || user?.nome?.[0] || "F"}</div>
                                    )}
                                    <div className="hidden md:block leading-none">
                                        <p className="text-[11px] font-bold truncate max-w-[90px]">{empresa?.nome_fantasia || user?.nome || "Francisco"}</p>
                                        <p className="text-[9px] text-[#9A9A9A] capitalize truncate max-w-[90px]">{empresa?.nif || role.replace('_', ' ')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-0 md:pr-1 pb-4 md:pb-0 mt-0 md:mt-2">{children}</div>
                </div>
                {isVendasOpen && <div className="absolute inset-0 z-[100] bg-[#EDEBE6] flex flex-col overflow-hidden"><div className="flex-1 overflow-hidden p-0 md:p-[14px]"><VendasTab onClose={() => setActiveTab("home")} /></div></div>}
            </div>
            {empresaData && <ModalEmpresa open={showConfig} initialData={empresaData} initialTab={initialConfigTab} saving={savingEmpresa} onClose={() => setShowConfig(false)} onSave={handleSaveEmpresa} onWhatsappConnected={(c:boolean)=>setWaConectado(c)} />}
            <style jsx global>{`html,body{height:100%;overflow:hidden;background:#EDEBE6;scrollbar-width:none}::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
        </DashboardCtx.Provider>
    );
}
