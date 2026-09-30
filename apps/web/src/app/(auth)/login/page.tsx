"use client";
import { useState } from "react";
import { loginApi, selectEmpresaApi } from "@/lib/api";

const IconUser = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const IconLock = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const IconEye = ({ off }: { off?: boolean }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
        {off ? <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.59 9.59 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
    </svg>
);

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [empresas, setEmpresas] = useState<{ id: string; nome: string; role: string }[] | null>(null);
    const [tempToken, setTempToken] = useState<string | null>(null);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (!email || !senha) return setError("Preencha email e senha");
        setLoading(true);
        try {
            const d = await loginApi(email, senha);
            if (d.access_token) {
                localStorage.setItem("access_token", d.access_token);
                localStorage.setItem("user", JSON.stringify(d.user));
                window.location.href = "/mesas";
            } else if (d.temp_token && d.empresas) {
                setTempToken(d.temp_token);
                setEmpresas(d.empresas);
            }
        } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    }

    async function handleSelectEmpresa(empresa_id: string) {
        if (!tempToken) return;
        setLoading(true);
        try {
            const d = await selectEmpresaApi(tempToken, empresa_id);
            localStorage.setItem("access_token", d.access_token);
            localStorage.setItem("user", JSON.stringify(d.user));
            window.location.href = "/mesas";
        } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif" }}>
            {/* LEFT - FORM */}
            <div style={{ flex: 1, maxWidth: "480px", background: "white", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 40px", position: "relative", zIndex: 2 }}>
                <div style={{ marginBottom: "40px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
                        <div style={{ width: "36px", height: "36px", background: "#0f172a", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "18px" }}>$</div>
                        <span style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Budgetab</span>
                    </div>

                    {!empresas ? (
                        <>
                            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0", letterSpacing: "-1px", lineHeight: "36px" }}>Bem-vindo de volta</h1>
                            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Entre com seu acesso para gerenciar seu restaurante.</p>
                        </>
                    ) : (
                        <>
                            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0" }}>Selecione a empresa</h1>
                            <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>Você tem acesso a {empresas.length} empresas.</p>
                        </>
                    )}
                </div>

                {!empresas ? (
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                        <div>
                            <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px", display: "block" }}>E-mail</label>
                            <div style={{ background: "#f8fafc", borderRadius: "12px", height: "48px", display: "flex", alignItems: "center", gap: "12px", padding: "0 14px", border: `1.5px solid ${error ? "#fecaca" : "#e2e8f0"}`, transition: "all .2s" }}>
                                <IconUser />
                                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" style={{ flex: 1, border: "none", outline: "none", fontSize: "14px", background: "transparent", color: "#0f172a" }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px", display: "block" }}>Senha</label>
                            <div style={{ background: "#f8fafc", borderRadius: "12px", height: "48px", display: "flex", alignItems: "center", gap: "12px", padding: "0 14px", border: `1.5px solid ${error ? "#fecaca" : "#e2e8f0"}` }}>
                                <IconLock />
                                <input type={show ? "text" : "password"} value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" style={{ flex: 1, border: "none", outline: "none", fontSize: "14px", background: "transparent", color: "#0f172a" }} />
                                <button type="button" onClick={() => setShow(!show)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}><IconEye off={!show} /></button>
                            </div>
                        </div>

                        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "12px", padding: "10px 12px", borderRadius: "10px" }}>{error}</div>}

                        <button disabled={loading} style={{ height: "48px", background: "#0f172a", color: "white", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1, marginTop: "8px", boxShadow: "0 8px 24px rgba(15,23,42,0.15)" }}>
                            {loading ? "Entrando..." : "Entrar →"}
                        </button>

                        <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", marginTop: "8px" }}>Ao entrar você concorda com nossos termos de uso.</p>
                    </form>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {empresas.map(emp => (
                            <button key={emp.id} onClick={() => handleSelectEmpresa(emp.id)} disabled={loading}
                                style={{ textAlign: "left", background: "white", border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all .2s" }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = "#0f172a")}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{emp.nome}</div>
                                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{emp.role}</div>
                                </div>
                                <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>→</div>
                            </button>
                        ))}
                        {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "12px", padding: "10px 12px", borderRadius: "10px" }}>{error}</div>}
                    </div>
                )}

                <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "auto", paddingTop: "40px" }}>© 2026 Budgetab • Gestão completa</p>
            </div>

            {/* RIGHT - IMAGE / BRANDING */}
            <div style={{ flex: 1.2, background: "#0f172a", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(600px at 60% 20%, #1e293b 0%, #0f172a 60%)" }} />
                <div style={{ position: "relative", zIndex: 1, maxWidth: "440px", padding: "40px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", marginBottom: "24px" }}>🍽️</div>
                    <h2 style={{ fontSize: "36px", fontWeight: 800, color: "white", lineHeight: "38px", letterSpacing: "-1px", margin: "0 0 16px 0" }}>Gestão de restaurante sem dor de cabeça.</h2>
                    <p style={{ fontSize: "15px", color: "#94a3b8", lineHeight: "22px", margin: 0 }}>Mesas, cozinha, caixa e stock tudo em tempo real. Feito para Luanda, rápido até no 3G.</p>
                    <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
                        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 14px", flex: 1 }}>
                            <div style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>1.2k+</div>
                            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>Vendas hoje</div>
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 14px", flex: 1 }}>
                            <div style={{ color: "white", fontWeight: 700, fontSize: "18px" }}>99.9%</div>
                            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>Uptime</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
