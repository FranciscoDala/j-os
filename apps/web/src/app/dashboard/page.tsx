"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem("token");
        const u = localStorage.getItem("user");
        const emp = localStorage.getItem("empresa_id");

        if (!token || !u) {
            window.location.href = "/login";
            return;
        }

        setUser(JSON.parse(u));
        setEmpresaId(emp);

        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.empresa_id) {
                setEmpresaId(payload.empresa_id);
                localStorage.setItem("empresa_id", payload.empresa_id);
            }
        } catch { }
    }, []);

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("empresa_id");
        window.location.href = "/login";
    }

    function trocarLoja() {
        localStorage.removeItem("empresa_id");
        // volta pro login pra escolher outra loja, sem precisar digitar senha de novo
        // se tiver temp_token salvo, usa, senão pede login
        window.location.href = "/login";
    }

    if (!mounted || !user) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Carregando J-OS...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <header className="border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 bg-black">
                <div>
                    <h1 className="text-xl font-bold">J-OS Dashboard</h1>
                    <p className="text-xs text-zinc-400">
                        {user.nome} • {user.role} • Loja: {empresaId?.slice(0, 8) || "N/A"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <a href="/dashboard/empresas" className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-sm">
                        Lojas
                    </a>
                    <button onClick={trocarLoja} className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-sm">
                        Trocar Loja
                    </button>
                    <button onClick={logout} className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-zinc-200">
                        Sair
                    </button>
                </div>
            </header>

            <main className="p-6 space-y-6">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                    <h2 className="font-bold">Bem-vindo, {user.nome}!</h2>
                    <p className="text-zinc-400 text-sm mt-2">
                        Empresa ativa: <b className="text-white">{empresaId}</b>
                    </p>
                    <p className="text-zinc-500 text-xs mt-2">
                        Token válido. Se você tem 1 loja, entrou direto. Se tem N, escolheu na tela de login.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <a href="/dashboard/empresas" className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:bg-zinc-800">
                        <h3 className="font-bold">Minhas Lojas</h3>
                        <p className="text-xs text-zinc-500">Criar e gerenciar lojas</p>
                    </a>
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl opacity-50">
                        <h3 className="font-bold">Vendas</h3>
                        <p className="text-xs text-zinc-500">Em breve</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl opacity-50">
                        <h3 className="font-bold">Estoque</h3>
                        <p className="text-xs text-zinc-500">Em breve</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
