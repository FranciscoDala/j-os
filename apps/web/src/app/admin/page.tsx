"use client";
import { useState, useEffect, useCallback } from "react";
import { Building2, Crown, LogOut, Search, Loader2, Plus, CheckCircle, AlertTriangle, Info, X, ShieldAlert } from "lucide-react";
import { AdminEmpresaCard } from "./cards/empresa";
import { AdminLojaModal } from "./modals/criar";
import { AdminDeleteModal } from "./modals/delete";
import { Button } from "@/components/ui/button";

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
    const onSave=async(e:any)=>{ e.preventDefault(); if(saving) return; setSaving(true); try{ let url=`${baseUrl}/admin/empresas`; let method="POST"; if(editingLoja){ url=`${baseUrl}/admin/empresas/${editingLoja.id}`; method="PUT"; } const res=await authFetch(url,{method,body:JSON.stringify(formData)}); const t=await res.text(); if(!res.ok) throw new Error(t); pushToast(editingLoja?"Atualizada!":"Criada!","success"); setModalOpen(false); fetchData(); }catch(err:any){ if(err.message!=="Unauthorized") pushToast(err.message,"error"); } finally{ setSaving(false); } };
    const onConfirmDelete=async()=>{ if(!lojaToDelete||deleting) return; setDeleting(true); try{ const res=await authFetch(`${baseUrl}/admin/empresas/${lojaToDelete.id}`,{method:"DELETE"}); const t=await res.text(); if(!res.ok) throw new Error(t); pushToast("Apagada","success"); setDeleteOpen(false); setLojaToDelete(null); fetchData(); }catch(err:any){ pushToast(err.message,"error"); } finally{ setDeleting(false); } };

    const filtered=empresas.filter(e=> e.nome_fantasia.toLowerCase().includes(search.toLowerCase()) || e.dono?.nome?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="w-full space-y-3 md:space-y-4 relative">
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[92%] max-w-[340px] pointer-events-none">
                {toasts.map(t=>(
                    <div key={t.id} className={`pointer-events-auto flex gap-2 items-start p-3 rounded-[14px] border backdrop-blur-xl shadow-2xl text-[12px] font-medium ${t.type==="success"?"bg-[#E8F5E9] border-green-200 text-green-800":t.type==="error"?"bg-[#FDECEA] border-red-200 text-red-800":"bg-white border-gray-200"}`}>
                        <span className="flex-1 leading-[1.2]">{t.msg}</span><button onClick={()=>setToasts(x=>x.filter(f=>f.id!==t.id))}><X size={12}/></button>
                    </div>
                ))}
            </div>

            <div className="w-full flex items-center justify-between gap-2.5 md:gap-3">
                <h2 className="font-black text-[13px] flex items-center gap-2 shrink-0"><Building2 size={18}/> Lojas • {filtered.length}</h2>
                <div className="flex-1 hidden sm:block" />
                <div className="relative w-[180px] md:w-[240px] shrink-0">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar loja ou dono..." className="w-full pl-9 pr-4 h-10 bg-white border border-[#E8DCCF] rounded-full text-[11px] font-black outline-none focus:border-black shadow-sm" />
                </div>
                <button onClick={openCreate} className="h-10 px-4 md:w-10 md:px-0 bg-black text-white rounded-full flex items-center justify-center gap-1.5 hover:bg-zinc-800 active:scale-95 shadow-md shrink-0">
                    <Plus size={18} strokeWidth={3}/><span className="md:hidden text-[12px] font-black">Nova</span>
                </button>
                <button onClick={clearAndRedirect} className="w-10 h-10 bg-white border border-[#E8DCCF] rounded-full flex items-center justify-center hover:bg-[#F5F0E9] shrink-0"><LogOut size={16}/></button>
            </div>

            {loading? <div className="py-20 flex justify-center"><Loader2 className="animate-spin"/></div> : (
                <div className="grid gap-2.5 md:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full pb-24">
                    {filtered.map(emp=> <AdminEmpresaCard key={emp.id} emp={emp} onEdit={openEdit} onDelete={openDelete} />)}
                </div>
            )}

            {filtered.length===0 &&!loading && (
                <div className="py-12 text-center border border-dashed border-[#E8DCCF] rounded-[22px] bg-white/50">
                    <p className="font-black text-[13px]">Nenhuma loja</p><p className="text-[11px] opacity-60 mt-1">Crie a primeira loja</p>
                </div>
            )}

            <AdminLojaModal open={modalOpen} onOpenChange={setModalOpen} editingLoja={editingLoja} donos={donos} formData={formData} setFormData={setFormData} onSave={onSave} saving={saving} pushToast={pushToast} />
            <AdminDeleteModal open={deleteOpen} onOpenChange={setDeleteOpen} loja={lojaToDelete} onConfirm={onConfirmDelete} deleting={deleting} />
        </div>
    );
}
