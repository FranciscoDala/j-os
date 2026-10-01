"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // PADRONIZA: tudo é access_token
        const token = localStorage.getItem("access_token");
        const u = localStorage.getItem("user");

        if (!token ||!u) {
            window.location.href = "/login";
            return;
        }

        try {
            setUser(JSON.parse(u));
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.empresa_id) {
                setEmpresaId(payload.empresa_id);
            }
        } catch {
            // token inválido
            localStorage.removeItem("access_token");
            window.location.href = "/login";
        }
    }, []);

    function logout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        localStorage.removeItem("empresas");
        localStorage.removeItem("temp_token");
        window.location.href = "/login";
    }

    function trocarLoja() {
        const empresasStr = localStorage.getItem("empresas");
        const empresas = empresasStr? JSON.parse(empresasStr) : [];

        // Se tem +1 loja, volta pra seleção sem precisar relogar
        if (empresas.length > 1) {
            // precisa refazer login pra gerar temp_token de novo
            // ou se você guardou temp_token, manda pra /dashboard/empresa
            window.location.href = "/login";
        } else {
            window.location.href = "/login";
        }
    }

    if (!mounted ||!user) {
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
                </div>
            </main>
        </div>
    );
}
