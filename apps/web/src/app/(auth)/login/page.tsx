"use client";
import { useState, useEffect } from "react";
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
        <div className="relative min-h-[100dvh] overflow-y-auto flex justify-center items-center px-4 py-6">
            {/* FONT AWESOME */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />

            {/* BACKGROUND - CORRIGIDO: /bg/1.jpg + z-0, NÃO -z-10 */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/bg/1.jpeg"
                    alt=""
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* CARD BRANCO - z-10 para ficar POR CIMA da imagem */}
            <div className="relative z-10 w-full max-w-[400px] bg-white rounded-[36px] flex flex-col px-6 pt-6 pb-6 shadow-2xl my-auto">

                {/* LOGO - CORRIGIDO: /kitanda.png minúsculo */}
                {/* LOGO - SEM CÍRCULO, SÓ A LOGO GRANDE */}
                <div className="flex flex-col items-center shrink-0">
                    <img
                        src="/kitanda.png"
                        alt="Kitanda"
                        className="w-[240px] h-auto object-contain"
                    />
                </div>

                <form onSubmit={handleLogin} className="mt-5 space-y-2.5">
                    {/* EMAIL */}
                    <div className="flex items-center gap-3 bg-[#F2F2F2] border border-black/10 rounded-full px-4 h-[48px] focus-within:border-[#f5a623]">
                        <i className="fa-solid fa-envelope text-black/50 text-[15px] w-4 text-center shrink-0"></i>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-black text-sm placeholder:text-black/50"
                            required
                        />
                    </div>

                    {/* SENHA */}
                    <div className="flex items-center gap-3 bg-[#F2F2F2] border border-black/10 rounded-full px-4 h-[48px] focus-within:border-[#f5a623]">
                        <i className="fa-solid fa-lock text-[#f5a623] text-[15px] w-4 text-center shrink-0"></i>
                        <input
                            type={mostrarSenha ? "text" : "password"}
                            placeholder="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-black text-sm placeholder:text-black/50"
                            required
                        />
                        <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="text-black/50 hover:text-black transition shrink-0 w-5 text-center">
                            <i className={`fa-solid ${mostrarSenha ? "fa-eye-slash" : "fa-eye"} text-[15px]`}></i>
                        </button>
                    </div>

                    {/* BOTÃO */}
                    <button
                        disabled={loading}
                        className="w-full h-[50px] !mt-4 rounded-full bg-gradient-to-b from-[#ffe680] to-[#f5b800] text-black font-bold text-[16px] shadow-lg active:scale-[0.98] transition disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Entrando...</> : "Log In"}
                    </button>
                </form>

                <div className="pt-5 flex justify-center">
                    <div className="w-[120px] h-[4px] bg-black/20 rounded-full" />
                </div>
            </div>
            <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`}</style>
        </div>
    );
}
