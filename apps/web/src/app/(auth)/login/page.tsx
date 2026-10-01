"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginApi } from "@/lib/api";

// Toast simples global
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-[14px] backdrop-blur-xl border shadow-2xl text-sm font-medium flex items-center gap-2 animate-[slideIn_0.3s_ease] ${type === "success" ? "bg-white/90 border-white/60 text-slate-800" : "bg-red-500/90 border-red-400/30 text-white"}`}>
            <div className={`w-2 h-2 rounded-full ${type === "success" ? "bg-green-500" : "bg-white"} animate-pulse`} />
            {message}
        </div>
    );
}

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await loginApi(email, senha);
            if (data.access_token) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("user", JSON.stringify(data.user));
                setToast({ msg: `Bem-vindo, ${data.user?.nome || "Dr."}!`, type: "success" });
                setTimeout(() => { window.location.href = "/dashboard"; }, 800);
                return;
            }
            if (data.temp_token) {
                localStorage.setItem("temp_token", data.temp_token);
                localStorage.setItem("empresas", JSON.stringify(data.empresas || []));
                localStorage.setItem("user", JSON.stringify(data.user));
                setToast({ msg: "Selecione a empresa", type: "success" });
                setTimeout(() => { window.location.href = "/dashboard/empresa"; }, 800);
                return;
            }
        } catch (err: any) {
            setToast({ msg: err.message || "Email ou senha inválidos", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#5A8AD4] p-4">
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <div className="w-full max-w-sm bg-white/30 backdrop-blur-2xl p-8 rounded-[24px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center font-black text-[#5A8AD4] mb-4 shadow-md">J</div>
                <h1 className="text-white text-2xl font-bold mb-1 text-center drop-shadow">J-OS</h1>
                <p className="text-white/70 text-xs text-center mb-6">Bem-vindo de volta</p>

                <form onSubmit={handleLogin} className="space-y-3">
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/70 backdrop-blur text-slate-800 p-3 rounded-full outline-none border border-white/60 text-sm placeholder:text-gray-400" required />

                    <div className="relative">
                        <input type={mostrarSenha ? "text" : "password"} placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full bg-white/70 backdrop-blur text-slate-800 p-3 rounded-full outline-none border border-white/60 pr-12 text-sm" required />
                        <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-1 top-1 w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 transition shadow-sm">
                            {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <button disabled={loading} className="w-full bg-[#2F4A8A] hover:bg-[#1E2F6B] text-white p-3 rounded-full font-semibold shadow-lg transition text-sm flex items-center justify-center gap-2">
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Entrando</> : "Entrar"}
                    </button>
                </form>
            </div>

            <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>
        </div>
    );
}
