"use client";
import { useState, useEffect, useCallback } from "react";
import { Building2, Crown, LogOut, Search, Loader2, Plus, X } from "lucide-react";
import { AdminEmpresaCard } from "./cards/empresa";
import { AdminLojaModal } from "./modals/criar";
import { AdminDeleteModal } from "./modals/delete";

const rawUrl = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/+$/, "");
const baseUrl = rawUrl.endsWith("/api/v1")? rawUrl : rawUrl + "/api/v1";
function getToken(){ return typeof window!=='undefined'? localStorage.getItem("access_token")||"" : ""; }
function clearAndRedirect(){ localStorage.clear(); window.location.href="/login"; }

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
  const [toasts,setToasts]=useState<any[]>([]);
  const [formData,setFormData]=useState<any>({ nome_fantasia:"", nif:"", tipo:"RESTAURANTE", email:"", phone:"", city:"", address:"", modoDono:"existente", dono_existente_id:"", dono_novo:{ nome:"", email:"", senha:"", telefone:""} });

  const pushToast = (msg:string)=>{ const id=Date.now().toString(); setToasts((t:any)=>[...t,{id,msg}]); setTimeout(()=>setToasts((t:any)=>t.filter((x:any)=>x.id!==id)),4000); }
  const authFetch = useCallback(async(url:string,opts:any={})=>{
    const token=getToken(); const headers={"Content-Type":"application/json",Authorization:`Bearer ${token}`,...opts.headers}; const res=await fetch(url,{...opts,headers}); if(res.status===401||res.status===403){ clearAndRedirect(); throw new Error("Unauthorized"); } return res;
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

  const openCreate=()=>{ setEditingLoja(null); setModalOpen(true); };
  const openEdit=(emp:any)=>{ setEditingLoja(emp); setFormData({ nome_fantasia:emp.nome_fantasia, nif:emp.nif||"", tipo:emp.tipo||"RESTAURANTE", email:emp.email||"", phone:emp.phone||"", city:emp.city||"", address:emp.address||"", modoDono:"existente", dono_existente_id:"", dono_novo:{ nome:"", email:"", senha:"", telefone:""} }); setModalOpen(true); };
  const openDelete=(emp:any)=>{ setLojaToDelete(emp); setDeleteOpen(true); };
  const onSave=async(e:any)=>{ e.preventDefault(); setSaving(true); try{ let url=`${baseUrl}/admin/empresas`; let method="POST"; if(editingLoja){ url=`${baseUrl}/admin/empresas/${editingLoja.id}`; method="PUT"; } const res=await authFetch(url,{method,body:JSON.stringify(formData)}); if(!res.ok) throw new Error(await res.text()); setModalOpen(false); fetchData(); }catch(err:any){ pushToast(err.message);} finally{ setSaving(false);} };
  const onConfirmDelete=async()=>{ if(!lojaToDelete) return; setDeleting(true); try{ const res=await authFetch(`${baseUrl}/admin/empresas/${lojaToDelete.id}`,{method:"DELETE"}); if(!res.ok) throw new Error(await res.text()); setDeleteOpen(false); fetchData(); }catch{} finally{ setDeleting(false);} };

  const filtered=empresas.filter(e=> e.nome_fantasia.toLowerCase().includes(search.toLowerCase()) );

  return (
    <div className="w-full h-[100dvh] overflow-y-auto overscroll-y-contain bg-[#F5F7FB] flex flex-col gap-4 pb-[180px]" style={{ WebkitOverflowScrolling:'touch' }}>
      <header className="bg-white border-b w-full shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-[56px] flex items-center justify-between">
          <div className="flex items-center gap-2"><div className="w-8 h-8 bg-[#2F4A8A] rounded-full flex items-center justify-center text-white font-black">J</div><h1 className="font-black text-[14px]">J-OS Admin</h1><Crown size={14} className="text-amber-500" /></div>
          <div className="flex items-center gap-2"><button onClick={openCreate} className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center"><Plus size={18}/></button><button onClick={clearAndRedirect} className="w-9 h-9 bg-[#F5F0E9] border rounded-full flex items-center justify-center"><LogOut size={16}/></button></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <h2 className="font-black text-[13px] flex items-center gap-2"><Building2 size={18}/> Lojas • {filtered.length}</h2>
          <div className="relative w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar loja ou dono..." className="w-full pl-9 pr-4 py-3 bg-white border border-[#E8DCCF] rounded-full text-[14px] outline-none" />
          </div>
        </div>

        {loading? <div className="py-20 flex justify-center"><Loader2 className="animate-spin"/></div> : (
          <div className="grid grid-cols-1 gap-4 w-full">
            {filtered.map(emp=> <AdminEmpresaCard key={emp.id} emp={emp} onEdit={openEdit} onDelete={openDelete} />)}
          </div>
        )}
      </div>

      <AdminLojaModal open={modalOpen} onOpenChange={setModalOpen} editingLoja={editingLoja} donos={donos} formData={formData} setFormData={setFormData} onSave={onSave} saving={saving} pushToast={pushToast} />
      <AdminDeleteModal open={deleteOpen} onOpenChange={setDeleteOpen} loja={lojaToDelete} onConfirm={onConfirmDelete} deleting={deleting} />
    </div>
  );
}
