"use client";
import { useEffect, useState, useRef } from "react";
import { X, Plus, Search, Package, CheckCircle, AlertTriangle, Info, ChevronDown } from "lucide-react";
import { ProdutoCard } from "./cards/produto";
import { ProdutoDeleteModal } from "./modals/apagar";
import { ProdutoModal } from "./modals/criar";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const API_BASE = `${API_URL}/api/v1/produtos`;
type Toast = { id: string; msg: string; type: "success" | "error" | "info" };

function FilterSelect({ value, onChange, options, placeholder }: { value: string, onChange: (v: string) => void, options: string[], placeholder?: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);
    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => setOpen(!open)} className="h-9 bg-white border border-black/10 rounded-full px-4 text-[11px] font-bold flex items-center gap-2 hover:border-black/20 transition-colors outline-none shrink-0">
                <span className="truncate max-w-[90px]">{value || placeholder || "Todas"}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${open? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-[44px] right-0 min-w-[160px] bg-white rounded-[18px] border border-black/10 shadow-[0_16px_40px_rgba(0,0,0,0.12)] z-[100] overflow-hidden p-1.5">
                    <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-0.5">
                        {options.map(opt => (
                            <button key={opt || "todas"} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-full text-[11px] font-bold transition-all ${value === opt? "bg-black text-white" : "bg-white text-black hover:bg-[#F5F7FB]"}`}>
                                {opt === ""? "Todas" : opt}
                            </button>
                        ))}
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
    const [preview, setPreview] = useState<string>("");
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ id: string, nome: string, img: string } | null>(null);

    const pushToast = (msg: string, type: Toast["type"] = "info") => {
        const id = Date.now().toString() + Math.random().toString().slice(2);
        setToasts(t => [...t, { id, msg, type }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id!== id)), 4000);
    };

    const [form, setForm] = useState<any>({
        nome: "", codigo: "", preco_venda: "", preco_custo: "0", tipo: "RESTAURANT_DISH", unidade: "UNIT",
        categoria: "", descricao: "", codigo_barras: "", codigo_qr: "", iva: "0", tem_iva: false, peso: "",
        ativo: true, controlar_stock: true, allow_negative: false, stock_atual: "0", stock_minimo: "0",
        prep_time: "", kitchen_station: "", is_modifiable: false, service_duration: "", imagem_url: ""
    });

    const fetchProds = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const qs = new URLSearchParams({ skip: "0", limit: "20", search, categoria: cat });
            const r = await fetch(`${API_BASE}/?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await r.json();
            if (r.ok) { setItems(data.items || []); setTotal(data.total || 0); }
            else pushToast(data.detail || "Erro ao listar", "error");
        } catch { pushToast("Falha de conexão ao listar produtos", "error") }
    };
    const fetchCats = async () => {
        const token = localStorage.getItem("access_token");
        const r = await fetch(`${API_BASE}/categorias/lista`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) setCats(await r.json());
    };
    useEffect(() => { fetchProds(); fetchCats(); }, [search, cat]);

    const genCode = () => `P-${Date.now().toString().slice(-6)}`;
    const resetForm = () => {
        setForm({ nome: "", codigo: genCode(), preco_venda: "", preco_custo: "0", tipo: "RESTAURANT_DISH", unidade: "UNIT", categoria: "", descricao: "", codigo_barras: "", codigo_qr: "", iva: "0", tem_iva: false, peso: "", ativo: true, controlar_stock: true, allow_negative: false, stock_atual: "0", stock_minimo: "0", prep_time: "", kitchen_station: "", is_modifiable: false, service_duration: "", imagem_url: "" });
        setImgFile(null); setPreview(""); setEditId(null); setTab("Geral");
    };

    const openEdit = (p: any) => {
        setEditId(p.id);
        setForm({
            nome: p.nome, codigo: p.codigo, preco_venda: p.preco_venda, preco_custo: p.preco_custo || 0, tipo: p.tipo, unidade: "UNIT",
            categoria: p.categoria || "", descricao: p.descricao || "", codigo_barras: p.codigo_barras || "", codigo_qr: p.codigo_qr || "", iva: p.iva || 0, tem_iva: p.tem_iva || false, peso: p.peso || "",
            ativo: p.ativo, controlar_stock: p.controlar_stock, allow_negative: p.allow_negative || false, stock_atual: p.stock_atual, stock_minimo: p.stock_minimo || 0,
            prep_time: p.prep_time || "", kitchen_station: p.kitchen_station || "", is_modifiable: p.is_modifiable || false, service_duration: p.service_duration || "", imagem_url: p.imagem_url || ""
        });
        setPreview(p.imagem_url || ""); setOpen(true);
    };

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);
        const token = localStorage.getItem("access_token");
        const allowed = ["nome", "codigo", "preco_venda", "preco_custo", "tipo", "unidade", "categoria", "descricao", "codigo_barras", "codigo_qr", "iva", "tem_iva", "peso", "ativo", "controlar_stock", "allow_negative", "stock_atual", "stock_minimo", "prep_time", "kitchen_station", "is_modifiable", "service_duration"];
        const fd = new FormData();
        allowed.forEach(k => { const v = form[k]; if (v!== "" && v!== null && v!== undefined) fd.append(k, String(v)); });
        if (imgFile) fd.append("imagem", imgFile);
        const url = editId? `${API_BASE}/${editId}` : `${API_BASE}/`;
        const method = editId? "PUT" : "POST";
        try {
            const r = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
            const data = await r.json().catch(async () => ({ detail: await r.text() }));
            if (r.ok) {
                pushToast(editId? "Produto atualizado!" : `Produto ${form.nome} criado!`, "success");
                setOpen(false); resetForm(); fetchProds();
            } else {
                pushToast(data.detail || "Erro ao salvar", "error");
            }
        } catch { pushToast("Erro de rede ao salvar", "error"); }
        finally { setSaving(false); }
    };

    const confirmDelete = async () => {
        if (!deleteModal) return;
        const token = localStorage.getItem("access_token");
        const r = await fetch(`${API_BASE}/${deleteModal.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) { pushToast("Produto apagado", "success"); fetchProds(); setDeleteModal(null); }
        else pushToast("Erro ao apagar", "error");
    };

    return (
        <div className="w-full space-y-3 relative">
            {/* TOASTS */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[340px] pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto flex gap-2 items-start p-3 rounded-[14px] border backdrop-blur-xl shadow-2xl text-[12px] font-medium ${t.type === "success"? "bg-[#E8F5E9] border-green-200 text-green-800" : t.type === "error"? "bg-[#FDECEA] border-red-200 text-red-800" : "bg-white border-gray-200 text-gray-800"}`}>
                        {t.type === "success" && <CheckCircle size={16} className="shrink-0 mt-0.5" />}
                        {t.type === "error" && <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                        {t.type === "info" && <Info size={16} className="shrink-0 mt-0.5" />}
                        <span className="flex-1 leading-[1.2]">{t.msg}</span>
                        <button onClick={() => setToasts(x => x.filter(f => f.id!== t.id))} className="opacity-60"><X size={12} /></button>
                    </div>
                ))}
            </div>

            {/* HEADER ÚNICO - LIMPO */}
            <div className="w-full bg-white rounded-[22px] px-3 py-2.5 md:px-4 md:py-3 flex items-center justify-between gap-3 shadow-[0_6px_24px_rgba(0,0,0,0.05)] border border-white">

                {/* Left */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white">
                        <Package size={16} />
                    </div>
                    <div className="hidden md:block leading-[1.1]">
                        <p className="font-black text-[13px]">Produtos</p>
                        <p className="text-[11px] text-gray-400 font-medium">{total} cadastrados</p>
                    </div>
                    <div className="md:hidden">
                        <p className="font-black text-[13px] leading-none">Produtos • {total}</p>
                    </div>
                </div>

                {/* Center - Busca única */}
                <div className="flex-1 flex items-center justify-end md:justify-center gap-2 max-w-[520px]">
                    <div className="flex-1 relative group">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Nome, código, barras..."
                            className="w-full h-9 bg-[#F5F7FB] rounded-full pl-9 pr-4 text-[12px] outline-none focus:bg-white border border-transparent focus:border-black/10 focus:shadow-sm transition-all"
                        />
                    </div>

                    <div className="hidden md:block">
                        <FilterSelect value={cat} onChange={setCat} options={["",...cats]} placeholder="Todas" />
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="md:hidden">
                        <FilterSelect value={cat} onChange={setCat} options={["",...cats]} placeholder="Todas" />
                    </div>
                    <button onClick={() => { resetForm(); setOpen(true); }} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all">
                        <Plus size={18} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-3.5">
                {items.map(p => (
                    <ProdutoCard
                        key={p.id}
                        p={p}
                        onEdit={openEdit}
                        onDelete={(prod) => setDeleteModal({ id: prod.id, nome: prod.nome, img: prod.imagem_url })}
                    />
                ))}
            </div>

            <ProdutoDeleteModal data={deleteModal} onClose={() => setDeleteModal(null)} onConfirm={confirmDelete} />

            <ProdutoModal
                open={open}
                editId={editId}
                tab={tab}
                setTab={setTab}
                form={form}
                setForm={setForm}
                preview={preview}
                setPreview={setPreview}
                setImgFile={setImgFile}
                cats={cats}
                saving={saving}
                onClose={() => setOpen(false)}
                onSave={handleSave}
            />
        </div>
    )
}
