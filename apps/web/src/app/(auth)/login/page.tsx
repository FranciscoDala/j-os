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

            {/* MATA O AZUL DO AUTOFILL + SPINNER QUE GIRA DE VERDADE */}
            <style>{`
                .login-input input { font-size: 17px !important; line-height: 1 !important; background: transparent !important; }
                .login-input input::placeholder { font-size: 17px !important; line-height: 1 !important; }
                .login-input input:-webkit-autofill,
                .login-input input:-webkit-autofill:hover,
                .login-input input:-webkit-autofill:focus,
                .login-input input:-webkit-autofill:active {
                    -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
                    -webkit-text-fill-color: #000 !important;
                    caret-color: #000 !important;
                    transition: background-color 9999s ease-in-out 0s !important;
                    background: transparent !important;
                }
                @keyframes slideIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }
                @keyframes kitanda-spin { to { transform: rotate(360deg); } }
                .kitanda-spinner {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    border: 3px solid rgba(0,0,0,0.15);
                    border-top-color: #000;
                    animation: kitanda-spin 0.7s linear infinite;
                    display: inline-block;
                    flex-shrink: 0;
                }
            `}</style>

            {/* BACKGROUND */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/bg/1.jpeg"
                    alt=""
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
            </div>

            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* CARD BRANCO */}
            <div
                className="relative z-10 w-full max-w-[400px] rounded-[32px] flex flex-col px-5 pt-5 pb-4 my-auto"
                style={{
                    background: "#ffffff",
                    border: "1px solid rgba(0, 0, 0, 0.08)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                }}
            >

                {/* LOGO */}
                <div className="flex flex-col items-center shrink-0">
                    <img
                        src="/kitanda.png"
                        alt="Kitanda"
                        className="w-[250px] h-auto object-contain drop-shadow-sm"
                    />
                </div>

                <form onSubmit={handleLogin} className="mt-4 space-y-2 login-input" autoComplete="off">
                    {/* EMAIL - TRANSPARENTE */}
                    <div
                        className="flex items-center gap-2.5 rounded-full pl-4 pr-4 h-[45px] transition focus-within:border-[#f5a623]"
                        style={{ background: "transparent", border: "1px solid rgba(0,0,0,0.15)" }}
                    >
                        <i className="fa-solid fa-user text-black/50 text-[16px] w-5 text-center shrink-0 leading-none"></i>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-black py-0"
                            style={{ fontSize: "17px", height: "100%", background: "transparent" }}
                            autoComplete="off"
                            required
                        />
                    </div>

                    {/* SENHA - TRANSPARENTE + OLHO ALINHADO */}
                    <div
                        className="flex items-center gap-2.5 rounded-full pl-4 pr-2 h-[45px] transition focus-within:border-[#f5a623]"
                        style={{ background: "transparent", border: "1px solid rgba(0,0,0,0.15)" }}
                    >
                        <i className="fa-solid fa-lock text-black/50 text-[16px] w-5 text-center shrink-0 leading-none"></i>
                        <input
                            type={mostrarSenha ? "text" : "password"}
                            placeholder="Senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-black py-0 min-w-0"
                            style={{ fontSize: "17px", height: "100%", background: "transparent" }}
                            autoComplete="new-password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-black/50 hover:text-black hover:bg-black/5 transition"
                        >
                            <i className={`fa-solid ${mostrarSenha ? "fa-eye-slash" : "fa-eye"} text-[16px] leading-none`}></i>
                        </button>
                    </div>

                    {/* BOTÃO - SPINNER CSS PURO QUE GIRA */}
                    <button
                        disabled={loading}
                        className="w-full h-[48px] !mt-3 rounded-full bg-gradient-to-b from-[#ffe680] to-[#f5b800] text-black font-bold text-[17px] shadow-lg active:scale-[0.98] transition disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="kitanda-spinner"></span>
                        ) : (
                            "Entrar"
                        )}
                    </button>
                </form>

                <div className="pt-3 flex justify-center">
                    <div className="w-[120px] h-[4px] bg-black/20 rounded-full" />
                </div>
            </div>
        </div>
    );
}
