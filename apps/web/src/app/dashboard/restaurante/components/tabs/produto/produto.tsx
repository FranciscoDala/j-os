"use client";
import { useEffect, useState } from "react";
import { X, Plus, Search, Pencil, Trash2, Package, Upload, Save, CheckCircle, AlertTriangle, Info } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/,"");
const API_BASE = `${API_URL}/api/v1/produtos`;
const TIPOS = ["GENERAL","RESTAURANT_DISH","RESTAURANT_INGREDIENT","RESTAURANT_DRINK","SERVICE","KIT"];
const UNIDADES = ["UNIT","UN","KG","LITER","PORTION","HOUR","DAY","TASK"];
const MODAL_TABS = ["Geral","Preços","Stock","Cozinha","Códigos"];
const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200";
type Toast = { id:string; msg:string; type:"success"|"error"|"info" };

const getImgUrl = (url?: string)=>{
  if(!url) return FALLBACK_IMG;
  if(url.startsWith("blob:")) return url;
  if(url.startsWith("http")) return url;
  if(url.startsWith("/media")) return `${API_URL}${url}`;
  return url;
};

export function ProdutosTab(){
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [tab, setTab] = useState("Geral");
  const [imgFile, setImgFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<string>("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (msg:string, type:Toast["type"]="info")=>{
    const id = Date.now().toString() + Math.random().toString().slice(2);
    setToasts(t=>[...t, {id, msg, type}]);
    setTimeout(()=> setToasts(t=> t.filter(x=> x.id!==id)), 4000);
  };

  const [form, setForm] = useState<any>({
    nome:"", codigo:"", preco_venda:"", preco_custo:"0", tipo:"RESTAURANT_DISH", unidade:"UNIT",
    categoria:"", descricao:"", codigo_barras:"", codigo_qr:"", iva:"0", tem_iva:false, peso:"",
    ativo:true, controlar_stock:true, allow_negative:false, stock_atual:"0", stock_minimo:"0",
    prep_time:"", kitchen_station:"", is_modifiable:false, service_duration:"", imagem_url:""
  });

  const fetchProds = async()=>{
    try{
      const token = localStorage.getItem("access_token");
      const qs = new URLSearchParams({ skip:"0", limit:"20", search, categoria:cat });
      const r = await fetch(`${API_BASE}/?${qs}`, { headers:{ Authorization:`Bearer ${token}` }});
      const data = await r.json();
      if(r.ok){ setItems(data.items||[]); setTotal(data.total||0); }
      else pushToast(data.detail || "Erro ao listar", "error");
    }catch{ pushToast("Falha de conexão ao listar produtos","error") }
  };
  const fetchCats = async()=>{
    const token = localStorage.getItem("access_token");
    const r = await fetch(`${API_BASE}/categorias/lista`, { headers:{ Authorization:`Bearer ${token}` }});
    if(r.ok) setCats(await r.json());
  };
  useEffect(()=>{ fetchProds(); fetchCats(); },[search, cat]);

  const genCode = ()=> `P-${Date.now().toString().slice(-6)}`;
  const resetForm = ()=>{
    setForm({ nome:"", codigo:genCode(), preco_venda:"", preco_custo:"0", tipo:"RESTAURANT_DISH", unidade:"UNIT", categoria:"", descricao:"", codigo_barras:"", codigo_qr:"", iva:"0", tem_iva:false, peso:"", ativo:true, controlar_stock:true, allow_negative:false, stock_atual:"0", stock_minimo:"0", prep_time:"", kitchen_station:"", is_modifiable:false, service_duration:"", imagem_url:"" });
    setImgFile(null); setPreview(""); setEditId(null); setTab("Geral");
  };

  const openEdit = (p:any)=>{
    setEditId(p.id);
    setForm({
      nome:p.nome, codigo:p.codigo, preco_venda:p.preco_venda, preco_custo:p.preco_custo||0, tipo:p.tipo, unidade:"UNIT",
      categoria:p.categoria||"", descricao:p.descricao||"", codigo_barras:p.codigo_barras||"", codigo_qr:p.codigo_qr||"", iva:p.iva||0, tem_iva:p.tem_iva||false, peso:p.peso||"",
      ativo:p.ativo, controlar_stock:p.controlar_stock, allow_negative:p.allow_negative||false, stock_atual:p.stock_atual, stock_minimo:p.stock_minimo||0,
      prep_time:p.prep_time||"", kitchen_station:p.kitchen_station||"", is_modifiable:p.is_modifiable||false, service_duration:p.service_duration||"", imagem_url:p.imagem_url||""
    });
    setPreview(p.imagem_url||""); setOpen(true);
  };

  const handleSave = async()=>{
    const token = localStorage.getItem("access_token");
    const allowed = ["nome","codigo","preco_venda","preco_custo","tipo","unidade","categoria","descricao","codigo_barras","codigo_qr","iva","tem_iva","peso","ativo","controlar_stock","allow_negative","stock_atual","stock_minimo","prep_time","kitchen_station","is_modifiable","service_duration"];
    const fd = new FormData();
    allowed.forEach(k=>{ const v = form[k]; if(v!=="" && v!==null && v!==undefined) fd.append(k, String(v)); });
    if(imgFile) fd.append("imagem", imgFile);
    const url = editId? `${API_BASE}/${editId}` : `${API_BASE}/`;
    const method = editId? "PUT" : "POST";
    try{
      const r = await fetch(url, { method, headers:{ Authorization:`Bearer ${token}` }, body: fd });
      const data = await r.json().catch(async()=>({detail: await r.text()}));
      if(r.ok){
        pushToast(editId? "Produto atualizado!" : `Produto ${form.nome} criado!`, "success");
        setOpen(false); resetForm(); fetchProds();
      } else {
        pushToast(data.detail || "Erro ao salvar", "error");
      }
    }catch{ pushToast("Erro de rede ao salvar", "error"); }
  };

  const handleDelete = async(id:string)=>{
    if(!confirm("Apagar produto?")) return;
    const token = localStorage.getItem("access_token");
    const r = await fetch(`${API_BASE}/${id}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` }});
    if(r.ok){ pushToast("Produto apagado", "success"); fetchProds(); }
    else pushToast("Erro ao apagar", "error");
  };

  return (
    <div className="w-full space-y-4 relative">
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 w-[340px] pointer-events-none">
        {toasts.map(t=>(
          <div key={t.id} className={`pointer-events-auto flex gap-2 items-start p-3 rounded-[14px] border backdrop-blur-xl shadow-2xl text-[12px] font-medium ${t.type==="success"?"bg-[#E8F5E9] border-green-200 text-green-800": t.type==="error"?"bg-[#FDECEA] border-red-200 text-red-800":"bg-white border-gray-200 text-gray-800"}`}>
            {t.type==="success" && <CheckCircle size={16} className="shrink-0 mt-0.5"/>}
            {t.type==="error" && <AlertTriangle size={16} className="shrink-0 mt-0.5"/>}
            {t.type==="info" && <Info size={16} className="shrink-0 mt-0.5"/>}
            <span className="flex-1 leading-[1.2]">{t.msg}</span>
            <button onClick={()=> setToasts(x=> x.filter(f=> f.id!==t.id))} className="opacity-60"><X size={12}/></button>
          </div>
        ))}
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-3 md:p-4 border border-white/50 flex flex-col md:flex-row gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white"><Package size={18}/></div>
          <div><p className="font-black text-[14px] leading-none">Produtos</p><p className="text-[11px] text-gray-500">{total} cadastrados</p></div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-[#EEF2F8] rounded-full px-4 py-2.5 w-full md:w-[260px]"><Search size={14} className="text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome, código, barras..." className="bg-transparent outline-none text-[12px] w-full"/></div>
          <select value={cat} onChange={e=>setCat(e.target.value)} className="bg-white border border-white/60 rounded-full px-3 py-2.5 text-[12px] outline-none"><option value="">Todas</option>{cats.map(c=><option key={c} value={c}>{c}</option>)}</select>
          <button onClick={()=>{ resetForm(); setOpen(true); }} className="bg-black text-white rounded-full px-4 py-2.5 text-[12px] font-bold flex items-center gap-1"><Plus size={14}/> Novo</button>
        </div>
      </div>

      {/* CARDS ESTILO RAMEN - IGUAL PRINT */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {items.map(p=>(
          <div key={p.id} className="group relative bg-white rounded-[28px] p-4 pt-5 pb-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-white flex flex-col items-center text-center hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300">
            {/* botoes edit/delete no hover */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={()=>openEdit(p)} className="w-7 h-7 bg-black/80 backdrop-blur text-white rounded-full flex items-center justify-center"><Pencil size={12}/></button>
              <button onClick={()=>handleDelete(p.id)} className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center"><Trash2 size={12}/></button>
            </div>

            <div className="w-[110px] h-[110px] md:w-[125px] md:h-[125px] rounded-full p-[4px] bg-[#F5E6D3] shadow-inner">
              <img
                src={getImgUrl(p.imagem_url)}
                onError={(e)=> (e.currentTarget.src = FALLBACK_IMG)}
                className="w-full h-full rounded-full object-cover"
                alt={p.nome}
              />
            </div>

            <h3 className="mt-4 font-black text-[14px] md:text-[15px] leading-[1.1] text-black tracking-tight line-clamp-1">{p.nome}</h3>
            <p className="mt-1 text-[10px] md:text-[11px] leading-[1.25] text-[#6B6B6B] h-[28px] line-clamp-2 px-1">
              {p.descricao || p.categoria || p.codigo || "produto especial da casa"}
            </p>

            <div className="mt-3 bg-[#A67C52] text-white rounded-full px-5 py-[5px] flex items-baseline gap-1 shadow-sm">
              <span className="text-[10px] font-bold opacity-90">$</span>
              <span className="text-[15px] font-black tracking-wide">{Number(p.preco_venda).toLocaleString('en-US')}</span>
            </div>

            {!p.ativo && <span className="mt-2 text-[9px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 font-bold">INATIVO</span>}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-md flex items-center justify-center p-2 md:p-4">
          <div className="w-full max-w-[560px] bg-white/95 backdrop-blur-2xl rounded-[22px] border border-white/60 shadow-2xl overflow-hidden max-h-[94dvh] flex flex-col">
            <div className="p-4 flex justify-between items-center border-b"><p className="font-black text-[14px]">{editId?"Editar":"Novo"} • {form.tipo}</p><button onClick={()=>setOpen(false)} className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center"><X size={14}/></button></div>
            <div className="flex gap-1.5 px-4 py-2 border-b bg-[#F5F7FB]/70 overflow-x-auto no-scrollbar">
              {MODAL_TABS.map(t=><button key={t} onClick={()=>setTab(t)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold border ${tab===t?"bg-black text-white border-black":"bg-white border-black/10"}`}>{t}</button>)}
            </div>
            <div className="p-4 overflow-y-auto no-scrollbar space-y-3 flex-1">
              {tab==="Geral" && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-[80px] h-[80px] bg-[#F5F7FB] rounded-[12px] border overflow-hidden flex items-center justify-center shrink-0">
                      <img src={getImgUrl(preview)} onError={(e)=> e.currentTarget.style.display='none'} className="w-full h-full object-cover" alt=""/>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input value={form.nome} onChange={e=>setForm({...form, nome:e.target.value})} placeholder="Nome *" className="w-full bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[13px] outline-none"/>
                      <input value={form.codigo} onChange={e=>setForm({...form, codigo:e.target.value})} placeholder="Código interno *" className="w-full bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[13px] outline-none"/>
                    </div>
                  </div>
                  <input value={form.descricao} onChange={e=>setForm({...form, descricao:e.target.value})} placeholder="Descrição" className="w-full bg-[#F5F7FB] border rounded-[12px] px-4 py-2.5 text-[12px] outline-none"/>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={form.tipo} onChange={e=>setForm({...form, tipo:e.target.value})} className="bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[12px]">{TIPOS.map(t=><option key={t} value={t}>{t}</option>)}</select>
                    <select value={form.unidade} onChange={e=>setForm({...form, unidade:e.target.value})} className="bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[12px]">{UNIDADES.map(u=><option key={u} value={u}>{u}</option>)}</select>
                  </div>
                  <input value={form.categoria} onChange={e=>setForm({...form, categoria:e.target.value})} placeholder="Categoria" list="cats" className="bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[12px]"/><datalist id="cats">{cats.map(c=><option key={c} value={c}/>)}</datalist>
                  <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(f){ setImgFile(f); setPreview(URL.createObjectURL(f)); } }} className="bg-[#F5F7FB] border rounded-full px-4 py-2 text-[11px]"/>
                  <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.ativo} onChange={e=>setForm({...form, ativo:e.target.checked})}/> Ativo</label>
                </div>
              )}
              {tab==="Preços" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[10px] font-bold ml-1">PREÇO VENDA *</label><input type="number" value={form.preco_venda} onChange={e=>setForm({...form, preco_venda:e.target.value})} className="w-full bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[13px] font-bold"/></div>
                    <div><label className="text-[10px] font-bold ml-1">PREÇO CUSTO</label><input type="number" value={form.preco_custo} onChange={e=>setForm({...form, preco_custo:e.target.value})} className="w-full bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[13px]"/></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex items-center gap-1 text-[11px]"><input type="checkbox" checked={form.tem_iva} onChange={e=>setForm({...form, tem_iva:e.target.checked})}/> Tem IVA</label>
                    <input type="number" disabled={!form.tem_iva} value={form.iva} onChange={e=>setForm({...form, iva:e.target.value})} placeholder="IVA %" className="bg-[#F5F7FB] border rounded-full px-3 py-2 text-[12px] disabled:opacity-50"/>
                    <input type="number" value={form.peso} onChange={e=>setForm({...form, peso:e.target.value})} placeholder="Peso" className="bg-[#F5F7FB] border rounded-full px-3 py-2 text-[12px]"/>
                  </div>
                </div>
              )}
              {tab==="Stock" && (
                <div className="space-y-3">
                  <div className="flex gap-3 text-[11px]"><label className="flex items-center gap-1"><input type="checkbox" checked={form.controlar_stock} onChange={e=>setForm({...form, controlar_stock:e.target.checked})}/> Controlar stock</label><label className="flex items-center gap-1"><input type="checkbox" checked={form.allow_negative} onChange={e=>setForm({...form, allow_negative:e.target.checked})}/> Negativo</label></div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={form.stock_atual} onChange={e=>setForm({...form, stock_atual:e.target.value})} placeholder="Stock atual" className="bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[13px]"/>
                    <input type="number" value={form.stock_minimo} onChange={e=>setForm({...form, stock_minimo:e.target.value})} placeholder="Stock mínimo" className="bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[13px]"/>
                  </div>
                </div>
              )}
              {tab==="Cozinha" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={form.prep_time} onChange={e=>setForm({...form, prep_time:e.target.value})} placeholder="Tempo min" className="bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[12px]"/>
                    <input value={form.kitchen_station} onChange={e=>setForm({...form, kitchen_station:e.target.value})} placeholder="Estação" className="bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[12px]"/>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={form.is_modifiable} onChange={e=>setForm({...form, is_modifiable:e.target.checked})}/> Modificável</label>
                    <input type="number" value={form.service_duration} onChange={e=>setForm({...form, service_duration:e.target.value})} placeholder="Duração" className="bg-[#F5F7FB] border rounded-full px-3 py-2 text-[11px]"/>
                  </div>
                </div>
              )}
              {tab==="Códigos" && (
                <div className="space-y-3">
                  <input value={form.codigo_barras} onChange={e=>setForm({...form, codigo_barras:e.target.value})} placeholder="Código barras" className="w-full bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[12px]"/>
                  <input value={form.codigo_qr} onChange={e=>setForm({...form, codigo_qr:e.target.value})} placeholder="Código QR" className="w-full bg-[#F5F7FB] border rounded-full px-4 py-2.5 text-[12px]"/>
                </div>
              )}
            </div>
            <div className="p-3 border-t flex gap-2">
              <button onClick={()=>setOpen(false)} className="flex-1 bg-white border rounded-full py-2.5 text-[12px]">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-black text-white rounded-full py-2.5 text-[12px] font-bold flex items-center justify-center gap-2"><Save size={14}/> {editId?"Atualizar":"Criar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
