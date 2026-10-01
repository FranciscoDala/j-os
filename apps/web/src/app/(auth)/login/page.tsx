"use client";
import { useState } from "react";
import { loginApi } from "@/lib/api";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");

    // REMOVEU o useEffect que causava loop.
    // Quem tem que proteger é o dashboard, não o login.

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErro("");
        try {
            const data = await loginApi(email, senha);
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("user", JSON.stringify(data.user));
                if (data.empresas) localStorage.setItem("empresas", JSON.stringify(data.empresas));
                localStorage.removeItem("temp_token");
                window.location.href = "/dashboard";
                return;
            }
            if (data.temp_token) {
                localStorage.setItem("temp_token", data.temp_token);
                localStorage.setItem("empresas", JSON.stringify(data.empresas || []));
                localStorage.setItem("user", JSON.stringify(data.user));
                window.location.href = "/dashboard/empresa";
                return;
            }
            setErro("Resposta inválida");
        } catch (err: any) {
            setErro(err.message || "Email ou senha inválidos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
            <form onSubmit={handleLogin} className="w-full max-w-sm bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                <h1 className="text-white text-2xl font-bold mb-6 text-center">J-OS</h1>
                {erro && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-4">{erro}</div>}
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-800 text-white p-3 rounded-lg mb-3 outline-none border border-zinc-700" required />
                <div className="relative mb-6">
                    <input type={mostrarSenha? "text" : "password"} placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full bg-zinc-800 text-white p-3 rounded-lg outline-none border border-zinc-700 pr-10" required />
                    <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-3 text-zinc-400 text-sm">{mostrarSenha? "ocultar" : "ver"}</button>
                </div>
                <button disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white p-3 rounded-lg font-semibold">
                    {loading? "Entrando..." : "Entrar"}
                </button>
            </form>
        </div>
    );
}
