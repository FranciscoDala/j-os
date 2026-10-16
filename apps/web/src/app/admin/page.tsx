"use client";
import { useState, useEffect, useCallback } from "react";
import { Building2, Users, Crown, Search, Loader2, Plus, LogOut, X, Store, TrendingUp, ShieldCheck } from "lucide-react";
import { AdminEmpresaCard } from "./cards/empresa";
import { AdminLojaModal } from "./modals/criar";
import { AdminDeleteModal } from "./modals/delete";

type Toast = { id: string; msg: string; type: "success" | "error" | "info" };
const rawUrl = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/+$/, "");
const baseUrl = rawUrl.endsWith("/api/v1")? rawUrl : rawUrl.endsWith("/api")? rawUrl + "/v1" : rawUrl + "/api/v1";

function getToken(){ return typeof window!=='undefined'? localStorage.getItem("access_token")||"" : ""; }
function clearAndRedirect(){ localStorage.clear(); window.location.href="/login"; }
function getReadableError(raw:string){
    const m=raw.toLowerCase();
    if(m.includes("nif já")) return "NIF já cadastrado.";
    if(m.includes("email já")) return "Email já em uso.";
    if(m.includes("superadmin")) return "Sem permissão SUPERADMIN.";
    try{ const j=JSON.parse(raw); if(j.detail) return typeof j.detail==='string'? j.detail : j.detail[0]?.msg||raw; }catch{}
    return raw.slice(0,200);
}

export default function AdminPage() {
    const [empresas,setEmpresas]=useState<any[]>([]);
    const [donos,setDonos]=useState<any[]>([]);
    const [loading,setLoading]=useState(true);
    const [search,setSearch]=useState("");
    const [modalOpen,setModalOpen]=useState(false);
    const [editingLoja,setEditingLoja]=useState<any|null>(null);
    const [deleteOpen,setDeleteOpen]=useState(false);
    const [lojaToDelete,setLojaToDelete]=useState<any|null>(null);
    const [saving,setSaving]=useState(false);
    const [deleting,setDeleting]=useState(false);
    const [toasts,setToasts]=useState<Toast[]>([]);
    const [formData,setFormData]=useState<any>({ nome_fantasia:"", nif:"", tipo:"RESTAURANTE", email:"", phone:"", city:"", address:"", modoDono:"existente", dono_existente_id:"", dono_novo:{ nome:"", email:"", senha:"", telefone:""} });

    const pushToast = useCallback((msg:string,type:Toast["type"]="info")=>{
        const id=Date.now().toString(); setToasts(t=>[...t,{id,msg:getReadableError(msg),type}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000);
    },[]);

    const authFetch = useCallback(async(url:string,opts:RequestInit={})=>{
        const token=getToken(); if(!token){ clearAndRedirect(); throw new Error("Sem token"); }
        const headers={"Content-Type":"application/json",Authorization:`Bearer ${token}`,...(opts.headers||{})} as any;
        const res=await fetch(url,{...opts,headers}); if(res.status===401||res.status===403){ clearAndRedirect(); throw new Error("Unauthorized"); } return res;
    },[]);

    const fetchData=useCallback(async()=>{
        setLoading(true);
        try{
            const [r1,r2]=await Promise.all([authFetch(`${baseUrl}/admin/empresas`),authFetch(`${baseUrl}/admin/donos`)]);
            if(r1.ok){ const d=await r1.json(); setEmpresas(Array.isArray(d)?d:d.items||[]); }
            if(r2.ok) setDonos(await r2.json());
        }catch{} finally{ setLoading(false); }
    },[authFetch]);

    useEffect(()=>{ if(!getToken()){clearAndRedirect();return;} fetchData(); },[fetchData]);

    const openCreate=()=>{ setEditingLoja(null); setFormData({ nome_fantasia:"", nif:"", tipo:"RESTAURANTE", email:"", phone:"", city:"", address:"", modoDono:"existente", dono_existente_id:"", dono_novo:{ nome:"", email:"", senha:"", telefone:""} }); setModalOpen(true); };
    const openEdit=(emp:any)=>{ setEditingLoja(emp); setFormData({ nome_fantasia:emp.nome_fantasia, nif:emp.nif||"", tipo:emp.tipo||"RESTAURANTE", email:emp.email||"", phone:emp.phone||"", city:emp.city||"", address:emp.address||"", modoDono:"existente", dono_existente_id:"", dono_novo:{ nome:"", email:"", senha:"", telefone:""} }); setModalOpen(true); };
    const openDelete=(emp:any)=>{ setLojaToDelete(emp); setDeleteOpen(true); };
    const onSave=async(e:any)=>{ e.preventDefault(); if(saving) return; setSaving(true); try{ let url=`${baseUrl}/admin/empresas`; let method="POST"; if(editingLoja){ url=`${baseUrl}/admin/empresas/${editingLoja.id}`; method="PUT"; } const res=await authFetch(url,{method,body:JSON.stringify(formData)}); const t=await res.text(); if(!res.ok) throw new Error(t); pushToast(editingLoja?"Loja atualizada com sucesso!":"Loja criada com sucesso!","success"); setModalOpen(false); fetchData(); }catch(err:any){ if(err.message!=="Unauthorized") pushToast(err.message,"error"); } finally{ setSaving(false); } };
    const onConfirmDelete=async()=>{ if(!lojaToDelete||deleting) return; setDeleting(true); try{ const res=await authFetch(`${baseUrl}/admin/empresas/${lojaToDelete.id}`,{method:"DELETE"}); const t=await res.text(); if(!res.ok) throw new Error(t); pushToast("Loja apagada","success"); setDeleteOpen(false); setLojaToDelete(null); fetchData(); }catch(err:any){ pushToast(err.message,"error"); } finally{ setDeleting(false); } };

    const filtered=empresas.filter(e=> e.nome_fantasia.toLowerCase().includes(search.toLowerCase()) || e.dono?.nome?.toLowerCase().includes(search.toLowerCase()));
    const totalRestaurante = empresas.filter(e=> e.tipo==="RESTAURANTE").length;

    return (
        <div className="flex flex-col gap-3 md:gap-[14px] w-full min-w-0 pb-[100px] md:pb-6 px-3 md:px-0" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            {/* TOASTS */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[92%] max-w-[340px] pointer-events-none">
                {toasts.map(t=>(
                    <div key={t.id} className={`pointer-events-auto flex gap-2 items-start p-3 rounded-[14px] border backdrop-blur-xl shadow-2xl text-[12px] font-medium ${t.type==="success"?"bg-[#E8F5E9] border-green-200 text-green-800":t.type==="error"?"bg-[#FDECEA] border-red-200 text-red-800":"bg-white border-gray-200"}`}>
                        <span className="flex-1 leading-[1.2]">{t.msg}</span>
                        <button onClick={()=>setToasts(x=>x.filter(f=>f.id!==t.id))}><X size={12}/></button>
                    </div>
                ))}
            </div>

            {/* STATS - IGUAL HOMETAB */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-[14px]">
                <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex justify-between items-center h-[76px] md:h-[86px] border border-black/[0.03]">
                    <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-[#F9F8F5] flex items-center justify-center"><Building2 size={18} className="text-[#111]" /></div>
                        <div><p className="text-[11px] text-[#9A9A9A] font-medium">Total Lojas</p><p className="text-[18px] md:text-[20px] font-bold tracking-tight text-[#111]">{loading? "..." : empresas.length}</p></div>
                    </div>
                    <span className="text-[10px] bg-[#F9F8F5] text-[#111] px-2.5 py-1 rounded-full font-bold border border-black/5">{filtered.length} visíveis</span>
                </div>
                <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex justify-between items-center h-[76px] md:h-[86px] border border-black/[0.03]">
                    <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-[#FFFBEB] flex items-center justify-center"><Users size={18} className="text-[#B77900]" /></div>
                        <div><p className="text-[11px] text-[#9A9A9A] font-medium">Donos</p><p className="text-[18px] md:text-[20px] font-bold tracking-tight text-[#111]">{loading? "..." : donos.length}</p></div>
                    </div>
                    <span className="text-[10px] bg-[#FFFBEB] text-[#8A5A00] px-2.5 py-1 rounded-full font-bold">{totalRestaurante} restaurantes</span>
                </div>
                <div className="bg-[#111] rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] flex justify-between items-center h-[76px] md:h-[86px] text-white">
                    <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><ShieldCheck size={18} /></div>
                        <div><p className="text-[11px] text-white/60 font-medium">Status</p><p className="text-[16px] md:text-[18px] font-bold tracking-tight">Super Admin</p></div>
                    </div>
                    <TrendingUp size={18} className="text-white/60" />
                </div>
            </div>

            {/* BARRA DE AÇÃO - bonita com padding */}
            <div className="bg-white rounded-[16px] md:rounded-[20px] p-3 md:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.03] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-[#111] text-white flex items-center justify-center shrink-0"><Store size={16} /></div>
                    <div className="min-w-0">
                        <p className="font-bold text-[13px] md:text-[14px] text-[#111] leading-none">Minhas Lojas</p>
                        <p className="text-[11px] text-[#9A9A9A] mt-1">Gerencie todas as empresas cadastradas</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-[260px]">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar loja ou dono..." className="w-full pl-10 pr-4 h-10 bg-[#F9F8F5] border border-transparent rounded-full text-[12px] font-medium outline-none focus:bg-white focus:border-black transition-all placeholder:text-[#9A9A9A]" />
                    </div>
                    <button onClick={openCreate} className="h-10 px-4 bg-[#111] text-white rounded-full flex items-center justify-center gap-2 hover:bg-black active:scale-[0.98] transition-all shadow-sm shrink-0 font-bold text-[12px]">
                        <Plus size={16} strokeWidth={2.5} /> <span className="hidden sm:inline">Nova Loja</span><span className="sm:hidden">Nova</span>
                    </button>
                    <button onClick={clearAndRedirect} className="w-10 h-10 bg-white border border-black/10 rounded-full flex items-center justify-center hover:bg-[#F9F8F5] shrink-0"><LogOut size={16} /></button>
                </div>
            </div>

            {/* GRID */}
            {loading? (
                <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] py-20 flex flex-col items-center gap-3 border border-black/[0.03]">
                    <Loader2 className="animate-spin" size={20} />
                    <p className="text-[12px] text-[#9A9A9A] font-medium">Carregando lojas...</p>
                </div>
            ) : filtered.length>0? (
                <div className="grid gap-3 md:gap-[14px] grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full min-w-0">
                    {filtered.map(emp=> <AdminEmpresaCard key={emp.id} emp={emp} onEdit={openEdit} onDelete={openDelete} />)}
                </div>
            ) : (
                <div className="bg-white rounded-[20px] p-8 md:p-12 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-black/[0.03] text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-[#F9F8F5] flex items-center justify-center mb-4"><Building2 size={24} className="text-[#9A9A9A]" /></div>
                    <p className="font-bold text-[14px] text-[#111]">Nenhuma loja encontrada</p>
                    <p className="text-[12px] text-[#9A9A9A] mt-1 max-w-[280px]">Tente buscar por outro nome ou crie a primeira loja da plataforma</p>
                    <button onClick={openCreate} className="mt-5 h-10 px-5 bg-[#FFC91A] text-black rounded-full font-bold text-[12px] hover:bg-[#FFB800]">Criar primeira loja</button>
                </div>
            )}

            <AdminLojaModal open={modalOpen} onOpenChange={setModalOpen} editingLoja={editingLoja} donos={donos} formData={formData} setFormData={setFormData} onSave={onSave} saving={saving} pushToast={pushToast} />
            <AdminDeleteModal open={deleteOpen} onOpenChange={setDeleteOpen} loja={lojaToDelete} onConfirm={onConfirmDelete} deleting={deleting} />
        </div>
    );
}
