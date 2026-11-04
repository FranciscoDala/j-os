"use client";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginApi } from "@/lib/api";

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

            // REGRA SUPERADMIN: sem loja, direto para /admin
            const role = (data.user as any)?.role?.toLowerCase?.() || (data.user as any)?.role_slug || "";
            const isSuperAdmin = role === "superadmin" || data.user?.email?.toLowerCase() === "superadmin@j-os.ao";

            if (isSuperAdmin) {
                setToast({ msg: `Bem-vindo Super Admin!`, type: "success" });
                setTimeout(() => { window.location.href = "/admin"; }, 600);
                return;
            }

            if (data.access_token) {
                const nomeEmp = data.empresa?.nome_fantasia || data.user?.nome || "Dr.";
                setToast({ msg: `Bem-vindo, ${nomeEmp}!`, type: "success" });
                setTimeout(() => { window.location.href = "/dashboard/restaurante"; }, 600);
                return;
            }
            if (data.temp_token) {
                setToast({ msg: "Selecione a empresa", type: "success" });
                setTimeout(() => { window.location.href = "/dashboard/empresa"; }, 600);
                return;
            }
        } catch (err: any) {
            setToast({ msg: err.message || "Email ou senha inválidos", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] overflow-y-auto flex justify-center bg-[#1a1a1a] px-4 py-6 sm:bg-[#111] sm:items-center">
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <div className="w-full max-w-[400px] bg-[#151203] rounded-[36px] flex flex-col px-6 pt-6 pb-6 shadow-2xl border border-white/10 my-auto">

                {/* LOGO */}
                <div className="flex flex-col items-center shrink-0">
                    <div className="w-[140px] h-[140px] rounded-full overflow-hidden bg-[#f5a623] flex items-center justify-center p-3">
                        <img
                            src="/Kitanda.png"
                            alt="Kitanda"
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                <form onSubmit={handleLogin} className="mt-5 space-y-2.5">
                    {/* EMAIL - sem label */}
                    <div className="flex items-center gap-2 bg-black/40 border border-white/15 rounded-full px-4 h-[48px] focus-within:border-[#f5d76e]/60">
                        <span className="text-white/70 text-[16px] shrink-0">✉️</span>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/50"
                            required
                        />
                    </div>

                    {/* SENHA - sem label, colada no email */}
                    <div className="flex items-center gap-2 bg-black/40 border border-white/15 rounded-full px-4 h-[48px] focus-within:border-[#f5d76e]/60">
                        <span className="text-white/70 text-[16px] shrink-0">🔒</span>
                        <input
                            type={mostrarSenha ? "text" : "password"}
                            placeholder="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-white text-sm placeholder:text-white/50"
                            required
                        />
                        <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="text-white/70 hover:text-white transition shrink-0">
                            {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    {/* BOTÃO - colado nos inputs */}
                    <button
                        disabled={loading}
                        className="w-full h-[50px] !mt-4 rounded-full bg-gradient-to-b from-[#ffe680] to-[#f5b800] text-black font-bold text-[16px] shadow-lg active:scale-[0.98] transition disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? <><Loader2 size={18} className="animate-spin" /> Entrando...</> : "Log In"}
                    </button>
                </form>

                <div className="pt-5 flex justify-center">
                    <div className="w-[120px] h-[4px] bg-white rounded-full" />
                </div>
            </div>
            <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>
        </div>
    );
}
