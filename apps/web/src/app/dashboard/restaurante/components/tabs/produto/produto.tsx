"use client";
import { useEffect, useState, useRef } from "react";
import { X, Plus, Search, Package, CheckCircle, AlertTriangle, ChevronDown } from "lucide-react";
import { ProdutoCard } from "./cards/produto";
import { ProdutoDeleteModal } from "./modals/apagar";
import { ProdutoModal } from "./modals/criar";
import { toast } from "sonner";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const BASE = `${API_URL}/api/v1`;

async function apiFetch(path: string) {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    const r = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw data;
    return data;
}

function FilterSelect({ value, onChange, options }: { value: string, onChange: (v: string) => void, options: string[] }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    return (
        <div ref={ref} className="relative">
            <button onClick={() => setOpen(!open)} className="h-9 bg-white border rounded-full px-4 text-[11px] font-black flex items-center gap-2">{value || "Todas"} <ChevronDown size={14} className={open ? "rotate-180" : ""} /></button>
            {open && (
                <div className="absolute top-[44px] right-0 min-w-[160px] bg-white rounded-[18px] border shadow-xl z-[100] p-1.5">
                    <div className="max-h-[220px] overflow-y-auto no-scrollbar" style={{ scrollbarWidth: 'none' }}>
                        {options.map(opt => <button key={opt || "todas"} onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-full text-[11px] font-bold ${value === opt ? "bg-black text-white" : "hover:bg-[#F5F7FB]"}`}>{opt === "" ? "Todas" : opt}</button>)}
                    </div>
                </div>
            )}
        </div>
    )
}

export function ProdutosTab() {
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState("");
    const [cat, setCat] = useState("");
    const [cats, setCats] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [tab, setTab] = useState("Geral");
    const [imgFile, setImgFile] = useState<File | null>(null);
    const [preview, setPreview] = useState("");
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<any>(null);

    const [form, setForm] = useState<any>({ nome: "", codigo: "", preco_venda: "", preco_custo: "0", tipo: "RESTAURANT_DISH", unidade: "UNIT", categoria: "", descricao: "", codigo_barras: "", codigo_qr: "", iva: "0", tem_iva: false, peso: "", ativo: true, controlar_stock: true, allow_negative: false, stock_atual: "0", stock_minimo: "0", prep_time: "", kitchen_station: "", is_modifiable: false, service_duration: "", imagem_url: "" });

    const fetchProds = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set("skip", "0");
            params.set("limit", "20");
            if (search.trim()) params.set("search", search.trim());
            if (cat.trim()) params.set("categoria", cat.trim()); // FIX: só envia se tiver valor
            const data = await apiFetch(`/produtos/?${params.toString()}`);
            setItems(data.items || []);
            setTotal(data.total || 0);
        } catch (e: any) {
            console.log("produtos erro", e);
            // não mostra toast de 422 pra não poluir
            if (e?.detail && !JSON.stringify(e.detail).includes("categoria")) toast.error(e.detail);
        } finally { setLoading(false); }
    };

    const fetchCats = async () => {
        try { const data = await apiFetch(`/produtos/categorias/lista`); setCats(data || []); } catch { }
    };

    useEffect(() => { fetchProds(); }, [search, cat]);
    useEffect(() => { fetchCats(); }, []);

    const resetForm = () => {
        setForm({ nome: "", codigo: `P-${Date.now().toString().slice(-6)}`, preco_venda: "", preco_custo: "0", tipo: "RESTAURANT_DISH", unidade: "UNIT", categoria: "", descricao: "", codigo_barras: "", codigo_qr: "", iva: "0", tem_iva: false, peso: "", ativo: true, controlar_stock: true, allow_negative: false, stock_atual: "0", stock_minimo: "0", prep_time: "", kitchen_station: "", is_modifiable: false, service_duration: "", imagem_url: "" });
        setImgFile(null); setPreview(""); setEditId(null); setTab("Geral");
    };

    const openEdit = (p: any) => {
        setEditId(p.id);
        setForm({ nome: p.nome, codigo: p.codigo, preco_venda: p.preco_venda, preco_custo: p.preco_custo || 0, tipo: p.tipo, unidade: "UNIT", categoria: p.categoria || "", descricao: p.descricao || "", codigo_barras: p.codigo_barras || "", codigo_qr: p.codigo_qr || "", iva: p.iva || 0, tem_iva: p.tem_iva || false, peso: p.peso || "", ativo: p.ativo, controlar_stock: p.controlar_stock, allow_negative: p.allow_negative || false, stock_atual: p.stock_atual, stock_minimo: p.stock_minimo || 0, prep_time: p.prep_time || "", kitchen_station: p.kitchen_station || "", is_modifiable: p.is_modifiable || false, service_duration: p.service_duration || "", imagem_url: p.imagem_url || "" });
        setPreview(p.imagem_url || ""); setOpen(true);
    };

    const handleSave = async () => {
        if (saving) return;
        if (!form.nome?.trim()) return toast.error("Nome obrigatório");
        setSaving(true);
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v !== "" && v !== null && v !== undefined && k !== "imagem_url") fd.append(k, String(v)); });
        if (imgFile) fd.append("imagem", imgFile);
        const url = editId ? `${BASE}/produtos/${editId}` : `${BASE}/produtos/`;
        try {
            const r = await fetch(url, { method: editId ? "PUT" : "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
            const data = await r.json().catch(() => ({}));
            if (r.ok) { toast.success(editId ? "Atualizado!" : "Criado!", { id: "prod" }); setOpen(false); resetForm(); fetchProds(); }
            else toast.error(data.detail || "Erro ao salvar", { id: "prod-err" });
        } finally { setSaving(false); }
    };

    const confirmDelete = async () => {
        if (!deleteModal) return;
        await apiFetch(`/produtos/${deleteModal.id}`); // vai falhar, precisa DELETE
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        const r = await fetch(`${BASE}/produtos/${deleteModal.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) { toast.success("Apagado"); fetchProds(); setDeleteModal(null); }
    };

    return (
        <div className="w-full space-y-3">
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{scrollbar-width:none;-ms-overflow-style:none}`}</style>
            <div className="w-full bg-white rounded-[22px] px-3 py-2.5 flex items-center justify-between gap-3 shadow-sm border">
                <div className="flex items-center gap-2.5"><div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white"><Package size={16} /></div><p className="font-black text-[13px]">Produtos • {total}</p></div>
                <div className="flex-1 flex items-center gap-2 max-w-[520px] justify-end">
                    <div className="flex-1 relative"><Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full h-9 bg-[#F5F7FB] rounded-full pl-9 pr-4 text-[12px] outline-none focus:bg-white border" /></div>
                    <FilterSelect value={cat} onChange={setCat} options={["", ...cats]} />
                    <button onClick={() => { resetForm(); setOpen(true); }} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center"><Plus size={18} /></button>
                </div>
            </div>

            {loading ? <div className="py-20 text-center text-[12px] opacity-40 font-bold">Carregando...</div> : items.length === 0 ? <div className="py-20 text-center text-[12px] opacity-40 font-bold">Nenhum produto encontrado</div> : (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                    {items.map(p => <ProdutoCard key={p.id} p={p} onEdit={openEdit} onDelete={(prod: any) => setDeleteModal({ id: prod.id, nome: prod.nome, img: prod.imagem_url })} />)}
                </div>
            )}

            <ProdutoDeleteModal data={deleteModal} onClose={() => setDeleteModal(null)} onConfirm={confirmDelete} />
            <ProdutoModal open={open} editId={editId} tab={tab} setTab={setTab} form={form} setForm={setForm} preview={preview} setPreview={setPreview} setImgFile={setImgFile} cats={cats} saving={saving} onClose={() => setOpen(false)} onSave={handleSave} />
        </div>
    )
}
