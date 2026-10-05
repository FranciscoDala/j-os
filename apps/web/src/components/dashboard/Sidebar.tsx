"use client";
import { usePathname } from "next/navigation";
import { menuConfig, ModuleId } from "./menu_config";
import { useEffect, useState } from "react";
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";
const TAB_ROLES: Record<string, string[]> = {
    home: ["*"], caixa: ["dono","gerente_restaurante","operador_caixa","caixa"],
    vendas: ["dono","gerente_restaurante","operador_caixa","caixa","garcom","funcionario"],
    produtos: ["dono","gerente_restaurante","operador_caixa","funcionario"],
    funcionarios: ["dono","gerente_restaurante","operador_caixa","rh"],
    cardapio: ["dono","gerente_restaurante","operador_caixa"],
    pedidos: ["dono","gerente_restaurante","operador_caixa","garcom"],
    mesas: ["dono","gerente_restaurante","operador_caixa","garcom"],
    financas: ["dono","gerente_restaurante"], relatorios: ["dono","gerente_restaurante"],
};
function normalizeRole(r:any){return String(r||"funcionario").toLowerCase()}
function canViewTab(id:string, role:string){ const a=TAB_ROLES[id]; if(!a) return true; if(a.includes("*")) return true; return a.includes(role); }

export function Sidebar({ activeTab, setActiveTab, onLogout, role, can }: any) {
    const pathname = usePathname(); const moduleId = (pathname.split("/")[2] as ModuleId) || "dashboard";
    const [caixaAberto, setCaixaAberto] = useState<boolean|null>(null);
    const [userRole, setUserRole] = useState("funcionario");
    const tabs = menuConfig[moduleId] || menuConfig.dashboard;
    useEffect(()=>{ const r=role||normalizeRole(JSON.parse(localStorage.getItem("user")||"{}")?.role||"funcionario"); setUserRole(normalizeRole(r)); },[role]);
    useEffect(()=>{
        const check=async()=>{ try{ const t=localStorage.getItem("access_token"); const res=await fetch(`${API_BASE}/caixa/status`,{headers:{Authorization:`Bearer ${t}`}}); if(res.ok){const d=await res.json(); setCaixaAberto(d.aberto===true);} else setCaixaAberto(false);} catch{setCaixaAberto(false)} };
        check(); const i=setInterval(check,10000); return()=>clearInterval(i);
    },[activeTab]);
    useEffect(()=>{ if(caixaAberto===false && activeTab==='vendas') setActiveTab('caixa'); },[caixaAberto, activeTab, setActiveTab]);
    const filteredTabs = tabs.filter((t:any)=>{
        if(t.id==='vendas' && caixaAberto===false) return false;
        if(!canViewTab(t.id, userRole)) return false;
        if(can && typeof can==='function' &&!can(t.id)) return false;
        return true;
    });

    return (
        <aside className="w-[58px] h-[calc(100dvh-28px)] bg-white rounded-full flex flex-col items-center py-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] shrink-0" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            <button onClick={()=>setActiveTab('home')} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${activeTab==='home'?'bg-black text-white':'text-[#BBBBBB] hover:bg-[#F5F2ED]'}`}>
                <div className="grid grid-cols-3 gap-[2px]"><div className="w-[3px] h-[3px] bg-current rounded-full"/><div className="w-[3px] h-[3px] bg-current rounded-full"/><div className="w-[3px] h-[3px] bg-current rounded-full"/><div className="w-[3px] h-[3px] bg-current rounded-full"/><div className="w-[3px] h-[3px] bg-current rounded-full"/><div className="w-[3px] h-[3px] bg-current rounded-full"/><div className="w-[3px] h-[3px] bg-current rounded-full"/><div className="w-[3px] h-[3px] bg-current rounded-full"/><div className="w-[3px] h-[3px] bg-current rounded-full"/></div>
            </button>
            <div className="flex-1 flex flex-col items-center gap-1 mt-5">
                {filteredTabs.filter((t:any)=>t.id!=='home').map(({id, icon:Icon}:any)=>(
                    <button key={id} onClick={()=>setActiveTab(id)} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${activeTab===id?'bg-black text-white shadow-md':'text-[#C5C5C5] hover:text-[#6A6A6A] hover:bg-[#F5F2ED]'}`}>
                        <Icon size={16} strokeWidth={1.5}/>
                    </button>
                ))}
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-[1px] bg-[#EDEBE6] my-1" />
                <button className="w-9 h-9 rounded-full flex items-center justify-center text-[#C5C5C5] hover:bg-[#F5F2ED]">⚙️</button>
                <button onClick={onLogout} className="w-9 h-9 rounded-full flex items-center justify-center text-[#C5C5C5] hover:bg-[#FCE8E8]">↪</button>
                <img src="https://i.pravatar.cc/100?img=12" className="w-8 h-8 rounded-full mt-1" alt="user" />
            </div>
        </aside>
    );
}
