"use client";
import { useState } from "react";
import { loginApi } from "@/lib/api";

const IconUser = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconLock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const IconEye = ({ off }: { off?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
    {off ? <><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.94 10.94 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.59 9.59 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></>
    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M5 12l5 5l10-10"/></svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if(!email || !senha) return alert("Preencha email e senha");
    setLoading(true);
    try {
      const d = await loginApi(email, senha);
      if (d.access_token) {
        localStorage.setItem("token", d.access_token);
        localStorage.setItem("user", JSON.stringify(d.user));
        window.location.href = "/dashboard";
      }
    } catch (err: any) { alert(err.message); } finally { setLoading(false); }
  }

  const isValidEmail = email.includes("@");

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      backgroundImage: "url(/bg-login.jpg)",
      backgroundSize: "cover", backgroundPosition: "center",
      backgroundColor: "#f8fafc",
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      {/* Overlay suave pra legibilidade */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.65)", backdropFilter: "blur(1px)" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "400px", marginLeft: "7%", padding: "40px 20px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

        {/* Logo */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", letterSpacing: "-0.8px" }}>
            <span style={{ color: "#2563eb" }}>$</span>budgetab
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#1e293b", margin: "10px 0 8px 0", letterSpacing: "-0.5px" }}>Login</h1>
          <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "18px", margin: 0 }}>
            Don't have an account? <span style={{ color: "#2563eb", fontWeight: 600, cursor: "pointer" }}>Create your account</span>,<br />it takes less than a minute.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Email */}
          <div>
            <div style={{
              background: "white", borderRadius: "12px", height: "44px",
              display: "flex", alignItems: "center", gap: "10px", padding: "0 14px",
              border: `1.5px solid ${email ? (isValidEmail ? "#e2e8f0" : "#fecaca") : "#e2e8f0"}`,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              transition: "all 0.2s"
            }}>
              <IconUser />
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="yourmail@company.com"
                style={{ flex: 1, border: "none", outline: "none", fontSize: "13px", color: "#0f172a", background: "transparent" }}
              />
              {isValidEmail && (
                <div style={{ width: "20px", height: "20px", background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <IconCheck />
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{
              background: "white", borderRadius: "12px", height: "44px",
              display: "flex", alignItems: "center", gap: "10px", padding: "0 14px",
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
            }}>
              <IconLock />
              <input
                type={show ? "text" : "password"}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Password"
                style={{ flex: 1, border: "none", outline: "none", fontSize: "13px", color: "#0f172a", background: "transparent" }}
              />
              <button type="button" onClick={() => setShow(!show)} style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex" }}>
                <IconEye off={!show} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 2px" }}>
            <label onClick={() => setRemember(!remember)} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#475569", cursor: "pointer", userSelect: "none" }}>
              <div style={{
                width: "14px", height: "14px", borderRadius: "4px",
                border: `1.5px solid ${remember ? "#2563eb" : "#cbd5e1"}`,
                background: remember ? "#2563eb" : "white",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {remember && <IconCheck />}
              </div>
              Remember me
            </label>
            <span style={{ fontSize: "11px", color: "#64748b", cursor: "pointer" }}>Forgot password?</span>
          </div>

          <button
            disabled={loading}
            style={{
              height: "44px", background: "#0f172a", color: "white", border: "none",
              borderRadius: "12px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 8px 20px rgba(15,23,42,0.2)",
              marginTop: "6px"
            }}>
            {loading ? "Entrando..." : "Login"}
            {!loading && <span style={{ fontSize: "14px" }}>→</span>}
          </button>
        </form>

        <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "32px", lineHeight: "14px", textAlign: "left" }}>
          © 2024 Budgetab - Todos os direitos reservados.<br />
          Sistema de gestão empresarial.
        </p>
      </div>
    </div>
  );
}
