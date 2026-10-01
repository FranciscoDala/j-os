"use client";
import { useEffect, useState } from "react";
import { X, Plus, Search, Pencil, Trash2, Package, Upload, Save } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/,"");
const API_BASE = `${API_URL}/api/v1/produtos`;

const TIPOS = ["GENERAL","RESTAURANT_DISH","RESTAURANT_INGREDIENT","RESTAURANT_DRINK","SERVICE","KIT"];
const UNIDADES = ["UNIT","UN","KG","LITER","PORTION","HOUR","DAY","TASK"];
const MODAL_TABS = ["Geral","Preços","Stock","Cozinha","Códigos"];

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

  const [form, setForm] = useState<any>({
    nome:"", codigo:"", preco_venda:"", preco_custo:"0", tipo:"RESTAURANT_DISH", unidade:"UNIT",
    categoria:"", descricao:"", codigo_barras:"", codigo_qr:"", iva:"0", tem_iva:false, peso:"",
    ativo:true, controlar_stock:true, allow_negative:false, stock_atual:"0", stock_minimo:"0",
    prep_time:"", kitchen_station:"", is_modifiable:false, service_duration:"", requires_booking:false, requires_staff:false, imagem_url:""
  });

  const fetchProds = async()=>{
    const token = localStorage.getItem("access_token");
    const qs = new URLSearchParams({ skip:"0", limit:"20", search, categoria:cat });
    const r = await fetch(`${API_BASE}/?${qs}`, { headers:{ Authorization:`Bearer ${token}` }});
    const data = await r.json();
    if(r.ok){ setItems(data.items||[]); setTotal(data.total||0); }
    else console.log("ERRO PRODUTOS", data);
  };
  const fetchCats = async()=>{
    const token = localStorage.getItem("access_token");
    const r = await fetch(`${API_BASE}/categorias/lista`, { headers:{ Authorization:`Bearer ${token}` }});
    if(r.ok) setCats(await r.json());
  };
  useEffect(()=>{ fetchProds(); fetchCats(); },[search, cat]);

  const resetForm = ()=>{
    setForm({ nome:"", codigo:"", preco_venda:"", preco_custo:"0", tipo:"RESTAURANT_DISH", unidade:"UNIT", categoria:"", descricao:"", codigo_barras:"", codigo_qr:"", iva:"0", tem_iva:false, peso:"", ativo:true, controlar_stock:true, allow_negative:false, stock_atual:"0", stock_minimo:"0", prep_time:"", kitchen_station:"", is_modifiable:false, service_duration:"", requires_booking:false, requires_staff:false, imagem_url:"" });
    setImgFile(null); setPreview(""); setEditId(null); setTab("Geral");
  };

  const openEdit = (p:any)=>{
    setEditId(p.id);
    setForm({
      nome:p.nome, codigo:p.codigo, preco_venda:p.preco_venda, preco_custo:p.preco_custo||0, tipo:p.tipo, unidade:"UNIT",
      categoria:p.categoria||"", descricao:"", codigo_barras:p.codigo_barras||"", codigo_qr:p.codigo_qr||"", iva:p.iva||0, tem_iva:p.tem_iva||false, peso:"",
      ativo:p.ativo, controlar_stock:p.controlar_stock, allow_negative:false, stock_atual:p.stock_atual, stock_minimo:0,
      prep_time:"", kitchen_station:"", is_modifiable:false, service_duration:"", requires_booking:false, requires_staff:false, imagem_url:p.imagem_url||""
    });
    setPreview(p.imagem_url||""); setOpen(true);
  };

  const handleSave = async()=>{
    const token = localStorage.getItem("access_token");
    const fd = new FormData();
    Object.entries(form).forEach(([k,v])=>{ if(v!=="" && v!==null && v!==undefined) fd.append(k, String(v)); });
    if(imgFile) fd.append("imagem", imgFile);

    const url = editId? `${API_BASE}/${editId}` : `${API_BASE}/`;
    const method = editId? "PUT" : "POST";
    const r = await fetch(url, { method, headers:{ Authorization:`Bearer ${token}` }, body: fd });
    if(r.ok){ setOpen(false); resetForm(); fetchProds(); }
    else { const e = await r.text(); alert(e); }
  };

  const handleDelete = async(id:string)=>{
    if(!confirm("Apagar produto?")) return;
    const token = localStorage.getItem("access_token");
    await fetch(`${API_BASE}/${id}`, { method:"DELETE", headers:{ Authorization:`Bearer ${token}` }});
    fetchProds();
  };

  return (
    <div className="w-full space-y-3">
      <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-3 md:p-4 border border-white/50 flex flex-col md:flex-row gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white"><Package size={18}/></div>
          <div><p className="font-black text-[14px] leading-none">Produtos</p><p className="text-[11px] text-gray-500">{total} cadastrados • rota /api/v1/produtos</p></div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-[#EEF2F8] rounded-full px-4 py-2.5 w-full md:w-[260px]"><Search size={14} className="text-gray-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome, código, barras..." className="bg-transparent outline-none text-[12px] w-full"/></div>
          <select value={cat} onChange={e=>setCat(e.target.value)} className="bg-white border border-white/60 rounded-full px-3 py-2.5 text-[12px] outline-none"><option value="">Todas</option>{cats.map(c=><option key={c} value={c}>{c}</option>)}</select>
          <button onClick={()=>{ resetForm(); setOpen(true); }} className="bg-black text-white rounded-full px-4 py-2.5 text-[12px] font-bold flex items-center gap-1"><Plus size={14}/> Novo</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map(p=>(
          <div key={p.id} className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-[18px] p-3 shadow-sm flex gap-3">
            <img src={p.imagem_url? (p.imagem_url.startsWith("/media")? `${API_URL}${p.imagem_url}` : p.imagem_url) : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200"} className="w-[72px] h-[72px] rounded-[12px] object-cover border-2 border-white shrink-0" alt=""/>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2"><p className="font-bold text-[12px] truncate">{p.nome}</p><span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${p.ativo?"bg-[#E8F5E9] text-green-700":"bg-red-50 text-red-600"}`}>{p.ativo?"ATIVO":"INATIVO"}</span></div>
              <p className="text-[10px] text-gray-500">{p.codigo} • {p.categoria||"Sem cat"} • {p.tipo}</p>
              <p className="text-[11px] font-black mt-1">Kz {Number(p.preco_venda).toLocaleString()} {p.tem_iva?`+ ${p.iva}%`:""}</p>
              <p className="text-[10px] text-gray-500">Stock: {p.stock_atual}</p>
              <div className="flex gap-1.5 mt-2"><button onClick={()=>openEdit(p)} className="flex-1 bg-black/5 rounded-full py-1.5 flex justify-center"><Pencil size={12}/></button><button onClick={()=>handleDelete(p.id)} className="flex-1 bg-red-50 text-red-500 rounded-full py-1.5 flex justify-center"><Trash2 size={12}/></button></div>
            </div>
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
                    <div className="w-[80px] h-[80px] bg-[#F5F7FB] rounded-[12px] border overflow-hidden flex items-center justify-center shrink-0">{preview? <img src={preview.startsWith("/media")? `${API_URL}${preview}` : preview} className="w-full h-full object-cover" alt=""/> : <Upload size={18} className="text-gray-400"/>}</div>
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
                    <label className="flex items-center gap-1"><input type="checkbox" checked={form.requires_booking} onChange={e=>setForm({...form, requires_booking:e.target.checked})}/> Reserva</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={form.requires_staff} onChange={e=>setForm({...form, requires_staff:e.target.checked})}/> Staff</label>
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
