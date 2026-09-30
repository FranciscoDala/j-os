"use client";
import { useEffect, useState } from "react";
import { selectEmpresaApi } from "@/lib/api";

type Empresa = { id: string; nome: string; role: string };

export default function SelectEmpresaPage() {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("empresas");
        const temp = localStorage.getItem("temp_token");
        if (!stored || !temp) {
            window.location.href = "/login";
            return;
        }
        setEmpresas(JSON.parse(stored));
    }, []);

    const selecionar = async (empresa_id: string) => {
        setLoadingId(empresa_id);
        try {
            const temp_token = localStorage.getItem("temp_token");
            if (!temp_token) {
                window.location.href = "/login";
                return;
            }
            const res = await selectEmpresaApi(temp_token, empresa_id);
            localStorage.setItem("access_token", res.access_token);
            localStorage.setItem("user", JSON.stringify(res.user));
            localStorage.removeItem("temp_token");
            window.location.href = "/dashboard";
        } catch (err: any) {
            alert(err.message || "Erro ao selecionar empresa");
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
            <div className="w-full max-w-md bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                <h1 className="text-white text-xl font-bold mb-2">Selecione a loja</h1>
                <p className="text-zinc-400 text-sm mb-6">{empresas.length} loja(s) encontrada(s)</p>
                <div className="space-y-3">
                    {empresas.map((emp) => (
                        <button key={emp.id} onClick={() => selecionar(emp.id)} disabled={!!loadingId} className="w-full text-left p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{emp.nome || `Loja ${emp.id.slice(0, 8)}`}</p>
                                <p className="text-xs text-zinc-400">{emp.role}</p>
                            </div>
                            <span className="text-xs bg-violet-600 px-2 py-1 rounded">{loadingId === emp.id ? "..." : "Entrar"}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
