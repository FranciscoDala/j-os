"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type Empresa = { id: string; nome_fantasia: string };

export default function EmpresasPage() {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [nome, setNome] = useState("");
    const [loading, setLoading] = useState(false);

    async function load() {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/v1/empresas`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setEmpresas(await res.json());
    }
    useEffect(() => { load() }, []);

    async function criar(e: React.FormEvent) {
        e.preventDefault(); setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/v1/empresas`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ nome_fantasia: nome })
        });
        const data = await res.json();
        if (!res.ok) alert(data.detail); else { setNome(""); load(); alert("Loja criada! Faça login novamente para aparecer na seleção."); }
        setLoading(false);
    }

    function entrar(empresa_id: string) {
        const token = localStorage.getItem("token");
        // se quiser trocar sem logout, usa o temp_token flow. Simplificado: só troca empresa_id e recarrega
        localStorage.setItem("empresa_id", empresa_id);
        window.location.href = "/dashboard";
    }

    return (
        <div className="p-6 bg-black min-h-screen text-white space-y-6">
            <div className="flex justify-between"><h1 className="text-2xl font-bold">Minhas Lojas</h1><a href="/dashboard" className="text-zinc-400">← Dashboard</a></div>
            <div className="grid md:grid-cols-3 gap-3">
                {empresas.map(emp => (
                    <div key={emp.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                        <div><p className="font-bold">{emp.nome_fantasia}</p><p className="text-xs text-zinc-500">{emp.id.slice(0, 8)}</p></div>
                        <button onClick={() => entrar(emp.id)} className="bg-white text-black px-4 py-2 rounded font-bold text-sm">Entrar</button>
                    </div>
                ))}
            </div>
            <form onSubmit={criar} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-md space-y-3">
                <h2 className="font-bold">Criar nova loja</h2>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome ex: Talatona" className="w-full p-3 rounded bg-zinc-800" required />
                <button disabled={loading} className="w-full bg-white text-black p-3 rounded font-bold">{loading ? "..." : "Criar Loja"}</button>
            </form>
        </div>
    );
}
