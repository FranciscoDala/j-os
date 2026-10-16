"use client";
import { useState, useEffect, useCallback } from "react";
import { Building2, Search, Loader2, Plus, LogOut, X } from "lucide-react";
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
    const onSave=async(e:any)=>{ e.preventDefault(); if(saving) return; setSaving(true); try{ let url=`${baseUrl}/admin/empresas`; let method="POST"; if(editingLoja){ url=`${baseUrl}/admin/empresas/${editingLoja.id}`; method="PUT"; } const res=await authFetch(url,{method,body:JSON.stringify(formData)}); const t=await res.text(); if(!res.ok) throw new Error(t); pushToast(editingLoja?"Atualizada!":"Criada!","success"); setModalOpen(false); fetchData(); }catch(err:any){ if(err.message!=="Unauthorized") pushToast(err.message,"error"); } finally{ setSaving(false); } };
    const onConfirmDelete=async()=>{ if(!lojaToDelete||deleting) return; setDeleting(true); try{ const res=await authFetch(`${baseUrl}/admin/empresas/${lojaToDelete.id}`,{method:"DELETE"}); const t=await res.text(); if(!res.ok) throw new Error(t); pushToast("Apagada","success"); setDeleteOpen(false); setLojaToDelete(null); fetchData(); }catch(err:any){ pushToast(err.message,"error"); } finally{ setDeleting(false); } };

    const filtered=empresas.filter(e=> e.nome_fantasia.toLowerCase().includes(search.toLowerCase()) || e.dono?.nome?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col gap-[14px] w-full min-w-0 pb-6 relative" style={{ fontFamily: '"Zalando Sans Expanded", sans-serif' }}>
            {/* TOASTS - mesmo padrão do ProdutosTab */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[92%] max-w-[340px] pointer-events-none">
                {toasts.map(t=>(
                    <div key={t.id} className={`pointer-events-auto flex gap-2 items-start p-3 rounded-[14px] border backdrop-blur-xl shadow-2xl text-[12px] font-medium ${t.type==="success"?"bg-[#E8F5E9] border-green-200 text-green-800":t.type==="error"?"bg-[#FDECEA] border-red-200 text-red-800":"bg-white border-gray-200"}`}>
                        <span className="flex-1 leading-[1.2]">{t.msg}</span>
                        <button onClick={()=>setToasts(x=>x.filter(f=>f.id!==t.id))}><X size={12}/></button>
                    </div>
                ))}
            </div>

            {/* HEADER - mesmo estilo dos cards da HomeTab: bg-white rounded-[16px] p-4 shadow */}
            <div className="bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-between gap-2.5 md:gap-3 w-full min-w-0">
                <div className="flex items-center gap-2 shrink-0 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#F9F8F5] flex items-center justify-center"><Building2 size={14} /></div>
                    <div className="leading-tight">
                        <p className="font-bold text-[13px] text-[#111] tracking-tight">Lojas • {filtered.length}</p>
                        <p className="text-[10px] text-[#9A9A9A] font-medium hidden sm:block">Gerenciar empresas</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative w-[140px] sm:w-[180px] md:w-[240px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 h-[36px] bg-[#F9F8F5] border border-[#F2F0EB] rounded-full text-[11px] font-bold outline-none focus:border-black focus:bg-white transition-all placeholder:text-[#9A9A9A]" />
                    </div>
                    <button onClick={openCreate} className="h-9 px-3 md:w-9 md:px-0 bg-[#111] text-white rounded-full flex items-center justify-center gap-1.5 hover:bg-black active:scale-95 transition-all shadow-sm shrink-0">
                        <Plus size={16} strokeWidth={2.5} /><span className="md:hidden text-[11px] font-bold">Nova</span>
                    </button>
                    <button onClick={clearAndRedirect} className="w-9 h-9 bg-[#F9F8F5] border border-[#F2F0EB] rounded-full flex items-center justify-center hover:bg-[#F2F0EB] shrink-0"><LogOut size={14} /></button>
                </div>
            </div>

            {/* GRID - igual HomeTab: gap-[14px] e grid-cols-1 sm:2 md:3 etc, celular 100% */}
            {loading? (
                <div className="bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] py-20 flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="grid gap-[14px] grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full min-w-0">
                    {filtered.map(emp=> <AdminEmpresaCard key={emp.id} emp={emp} onEdit={openEdit} onDelete={openDelete} />)}
                </div>
            )}

            {filtered.length===0 &&!loading && (
                <div className="bg-white rounded-[16px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] py-12 text-center">
                    <p className="font-bold text-[13px]">Nenhuma loja</p>
                    <p className="text-[11px] text-[#9A9A9A] mt-1">Crie a primeira loja para começar</p>
                </div>
            )}

            <AdminLojaModal open={modalOpen} onOpenChange={setModalOpen} editingLoja={editingLoja} donos={donos} formData={formData} setFormData={setFormData} onSave={onSave} saving={saving} pushToast={pushToast} />
            <AdminDeleteModal open={deleteOpen} onOpenChange={setDeleteOpen} loja={lojaToDelete} onConfirm={onConfirmDelete} deleting={deleting} />
        </div>
    );
}
