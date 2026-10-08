"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { X, Plus, CheckCircle, AlertTriangle, Info, ChevronDown } from "lucide-react";
import { ProdutoCard } from "./cards/produto";
import { ProdutoDeleteModal } from "./modals/apagar";
import { ProdutoModal } from "./modals/criar";
import { ProdutoDetalheModal } from "./modals/detalhe";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const API_BASE = `${API_URL}/api/v1/produtos`;
type Toast = { id: string; msg: string; type: "success" | "error" | "info" };

function getAuthHeaders() {
    const token = typeof window!== "undefined"? (localStorage.getItem("access_token") || localStorage.getItem("token")) : null;
    const empresa_id = typeof window!== "undefined"? localStorage.getItem("empresa_id") : null;
    const h: Record<string, string> = {};
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (empresa_id) h["X-Empresa-ID"] = empresa_id;
    return h;
}

function FilterSelect({ value, onChange, options, placeholder }: { value: string, onChange: (v: string) => void, options: string[], placeholder?: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
    return (
        <div ref={ref} className={`relative w-full ${open? "z-[60]" : "z-0"}`}>
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 h-10 text-[11px] font-black flex items-center justify-between shadow-sm hover:border-[#A67C52] focus:ring-2 focus:ring-[#A67C52]/20 transition-all outline-none">
                <span className="truncate">{value || placeholder || "Todas"}</span>
                <ChevronDown size={14} className={`shrink-0 ml-2 transition-transform ${open? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 min-w-[160px] bg-white rounded-[18px] border border-[#E8DCCF] shadow-[0_12px_32px_rgba(0,0,0,0.18)] z-[100] overflow-hidden p-1.5">
                    <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-0.5">
                        {options.map(opt => (<button key={opt || "todas"} type="button" onClick={() => { onChange(opt); setOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-full text-[11px] font-bold transition-all ${value === opt? "bg-[#A67C52] text-white" : "bg-white text-black hover:bg-[#F5E6D3]"}`}>{opt === ""? "Todas" : opt}</button>))}
                    </div>
                </div>
            )}
        </div>
    )
}

export function ProdutosTab() {
    const { role } = useDashboard();
    const { search: globalSearch } = useGlobalSearch();
    const canManage = ["dono","gerente","gerente_restaurante","admin","owner"].includes((role||"").toLowerCase());

    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
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
    const [viewProduto, setViewProduto] = useState<any>(null);

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

    const fetchProds = useCallback(async () => {
        try {
            const qs = new URLSearchParams({ skip: "0", limit: "20", search: globalSearch, categoria: cat });
            const r = await fetch(`${API_BASE}/?${qs}`, { headers: getAuthHeaders() as any, cache: "no-store" as any });
            const data = await r.json();
            if (r.ok) { setItems(data.items || []); setTotal(data.total || 0); }
            else { if (r.status === 403) pushToast(data.detail || "Empresa inválida", "error"); else pushToast(data.detail || "Erro ao listar", "error"); }
        } catch { pushToast("Falha de conexão ao listar produtos", "error") }
    }, [globalSearch, cat]);

    const fetchCats = useCallback(async () => { try { const r = await fetch(`${API_BASE}/categorias/lista`, { headers: getAuthHeaders() as any, cache: "no-store" as any }); if (r.ok) setCats(await r.json()); } catch {} }, []);

    useEffect(() => { fetchProds(); fetchCats(); }, [fetchProds, fetchCats]);

    useEffect(() => {
        const getData = (e:any) => e.detail?.data || e.detail;

        const onUpdate = (e: any) => {
            const p = getData(e);
            if (!p?.id) return;
            setItems(prev => prev.map(x => x.id === p.id? {...x,...p } : x));
        };
        const onCreated = (e: any) => {
            const p = getData(e);
            if (!p?.id) { fetchProds(); return; }
            if (!globalSearch && (!cat || (p.categoria || "").toLowerCase() === cat.toLowerCase())) {
                setItems(prev => { if (prev.some(x => x.id === p.id)) return prev; return [p,...prev].slice(0, 20); });
                setTotal(t => t + 1);
                if (p.categoria &&!cats.includes(p.categoria)) setCats(c=> [...c, p.categoria]);
            } else {
                fetchProds();
            }
        };
        const onVenda = (e: any) => {
            const venda = getData(e);
            const itens = venda?.itens || venda?.data?.itens || venda?.produtos || [];
            if (!itens.length) { fetchProds(); return; }
            itens.forEach((it: any) => {
                const pid = it.produto_id || it.produto?.id || it.id;
                const qtd = Number(it.quantidade || 1);
                setItems(prev => prev.map(p => p.id === pid && p.controlar_stock? {...p, stock_atual: Number(p.stock_atual || 0) - qtd } : p));
            });
        };
        const onDelete = (e: any) => {
            const d = getData(e);
            const id = d?.id || d?.produto_id;
            if (!id) { fetchProds(); return; }
            setItems(prev => prev.filter(x => x.id!== id));
            setTotal(t => Math.max(0, t - 1));
        };

        window.addEventListener("produto:update" as any, onUpdate);
        window.addEventListener("produto:atualizado" as any, onUpdate);
        window.addEventListener("produto.updated" as any, onUpdate);
        window.addEventListener("produto:created" as any, onCreated);
        window.addEventListener("stock.updated" as any, onUpdate);
        window.addEventListener("produto:deleted" as any, onDelete);
        window.addEventListener("venda:nova" as any, onVenda);
        window.addEventListener("venda:fechada" as any, onVenda);
        window.addEventListener("venda:update" as any, onVenda);

        return () => {
            window.removeEventListener("produto:update" as any, onUpdate);
            window.removeEventListener("produto:atualizado" as any, onUpdate);
            window.removeEventListener("produto.updated" as any, onUpdate);
            window.removeEventListener("produto:created" as any, onCreated);
            window.removeEventListener("stock.updated" as any, onUpdate);
            window.removeEventListener("produto:deleted" as any, onDelete);
            window.removeEventListener("venda:nova" as any, onVenda);
            window.removeEventListener("venda:fechada" as any, onVenda);
            window.removeEventListener("venda:update" as any, onVenda);
        };
    }, [globalSearch, cat, cats, fetchProds]);

    const genCode = () => `P-${Date.now().toString().slice(-6)}`;
    const resetForm = () => { setForm({ nome: "", codigo: genCode(), preco_venda: "", preco_custo: "0", tipo: "RESTAURANT_DISH", unidade: "UNIT", categoria: "", descricao: "", codigo_barras: "", codigo_qr: "", iva: "0", tem_iva: false, peso: "", ativo: true, controlar_stock: true, allow_negative: false, stock_atual: "0", stock_minimo: "0", prep_time: "", kitchen_station: "", is_modifiable: false, service_duration: "", imagem_url: "" }); setImgFile(null); setPreview(""); setEditId(null); setTab("Geral"); };
    const openEdit = (p: any) => {
        if(!canManage) return pushToast("Sem permissão para editar", "error");
        setEditId(p.id); setForm({ nome: p.nome, codigo: p.codigo, preco_venda: p.preco_venda, preco_custo: p.preco_custo || 0, tipo: p.tipo, unidade: "UNIT", categoria: p.categoria || "", descricao: p.descricao || "", codigo_barras: p.codigo_barras || "", codigo_qr: p.codigo_qr || "", iva: p.iva || 0, tem_iva: p.tem_iva || false, peso: p.peso || "", ativo: p.ativo, controlar_stock: p.controlar_stock, allow_negative: p.allow_negative || false, stock_atual: p.stock_atual, stock_minimo: p.stock_minimo || 0, prep_time: p.prep_time || "", kitchen_station: p.kitchen_station || "", is_modifiable: p.is_modifiable || false, service_duration: p.service_duration || "", imagem_url: p.imagem_url || "" }); setPreview(p.imagem_url || ""); setOpen(true);
    };
    const handleSave = async () => {
        if(!canManage) return pushToast("Sem permissão", "error");
        if (saving) return; setSaving(true);
        const allowed = ["nome","codigo","preco_venda","preco_custo","tipo","unidade","categoria","descricao","codigo_barras","codigo_qr","iva","tem_iva","peso","ativo","controlar_stock","allow_negative","stock_atual","stock_minimo","prep_time","kitchen_station","is_modifiable","service_duration"];
        const fd = new FormData(); allowed.forEach(k => { const v = form[k]; if (v!== "" && v!== null && v!== undefined) fd.append(k, String(v)); }); if (imgFile) fd.append("imagem", imgFile);
        const url = editId? `${API_BASE}/${editId}` : `${API_BASE}/`; const method = editId? "PUT" : "POST";
        try { const r = await fetch(url, { method, headers: getAuthHeaders() as any, body: fd }); const data = await r.json().catch(async () => ({ detail: await r.text() })); if (r.ok) { pushToast(editId? "Produto atualizado!" : `Produto ${form.nome} criado!`, "success"); setOpen(false); resetForm(); fetchProds(); fetchCats(); } else { pushToast(data.detail || "Erro ao salvar", "error"); } } catch { pushToast("Erro de rede ao salvar", "error"); } finally { setSaving(false); }
    };
    const confirmDelete = async () => {
        if(!canManage) return pushToast("Sem permissão", "error");
        if (!deleteModal) return;
        const r = await fetch(`${API_BASE}/${deleteModal.id}`, { method: "DELETE", headers: getAuthHeaders() as any });
        if (r.ok) {
            pushToast("Produto apagado", "success");
            setItems(prev=> prev.filter(x=> x.id!== deleteModal.id));
            setTotal(t=> Math.max(0, t-1));
            setDeleteModal(null);
        } else pushToast("Erro ao apagar", "error");
    };

    return (
        <div className="w-full space-y-3 md:space-y-4 relative">
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[92%] max-w-[340px] pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto flex gap-2 items-start p-3 rounded-[14px] border backdrop-blur-xl shadow-2xl text-[12px] font-medium ${t.type === "success"? "bg-[#E8F5E9] border-green-200 text-green-800" : t.type === "error"? "bg-[#FDECEA] border-red-200 text-red-800" : "bg-white border-gray-200 text-gray-800"}`}>
                        {t.type === "success" && <CheckCircle size={16} className="shrink-0 mt-0.5" />}{t.type === "error" && <AlertTriangle size={16} className="shrink-0 mt-0.5" />}{t.type === "info" && <Info size={16} className="shrink-0 mt-0.5" />}
                        <span className="flex-1 leading-[1.2]">{t.msg}</span><button onClick={() => setToasts(x => x.filter(f => f.id!== t.id))} className="opacity-60"><X size={12} /></button>
                    </div>
                ))}
            </div>

            <div className="w-full flex items-center justify-between gap-2.5 md:gap-3">
                <div className="flex-1 sm:flex-none sm:w-[180px] md:w-[200px]">
                    <FilterSelect value={cat} onChange={setCat} options={["",...cats]} placeholder="Todas categorias" />
                </div>
                <div className="flex-1 hidden sm:block" />
                {canManage && (
                    <button onClick={() => { resetForm(); setOpen(true); }} className="h-10 px-4 md:w-10 md:px-0 bg-black text-white rounded-full flex items-center justify-center gap-1.5 hover:bg-zinc-800 active:scale-95 transition-all shadow-md shrink-0">
                        <Plus size={18} strokeWidth={3} /><span className="md:hidden text-[12px] font-black">Novo</span>
                    </button>
                )}
            </div>

            <div className="grid gap-2.5 md:gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {items.map(p => (
                    <ProdutoCard key={p.id} p={p} canManage={canManage} onView={setViewProduto} onEdit={openEdit} onDelete={(prod) => { if(!canManage) return pushToast("Sem permissão", "error"); setDeleteModal({ id: prod.id, nome: prod.nome, img: prod.imagem_url }); }} />
                ))}
            </div>

            {items.length === 0 && (
                <div className="py-12 text-center border border-dashed border-[#E8DCCF] rounded-[18px] md:rounded-[22px] bg-white/50">
                    <p className="font-black text-[13px]">Nenhum produto</p>
                    <p className="text-[11px] opacity-60 mt-1">Crie seu primeiro produto</p>
                </div>
            )}

            <ProdutoDeleteModal data={deleteModal} onClose={() => setDeleteModal(null)} onConfirm={confirmDelete} />
            <ProdutoModal open={open} editId={editId} tab={tab} setTab={setTab} form={form} setForm={setForm} preview={preview} setPreview={setPreview} setImgFile={setImgFile} cats={cats} saving={saving} onClose={() => setOpen(false)} onSave={handleSave} />
            <ProdutoDetalheModal produto={viewProduto} open={!!viewProduto} onClose={() => setViewProduto(null)} canManage={canManage} onEdit={openEdit} />
        </div>
    )
}
