"use client";
import { useState } from "react";
import { loginApi } from "@/lib/api";

export default function LoginPage() {
  const [email,setEmail]=useState(""); const [senha,setSenha]=useState(""); const [mostrarSenha,setMostrarSenha]=useState(false); const [loading,setLoading]=useState(false); const [erro,setErro]=useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErro("");
    try {
      const data = await loginApi(email,senha);
      if(data.access_token){ localStorage.setItem("access_token",data.access_token); localStorage.setItem("user",JSON.stringify(data.user)); window.location.href="/dashboard"; return; }
      if(data.temp_token){ localStorage.setItem("temp_token",data.temp_token); localStorage.setItem("empresas",JSON.stringify(data.empresas||[])); window.location.href="/dashboard/empresa"; return; }
    } catch(err:any){ setErro(err.message||"Email ou senha inválidos"); } finally{ setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#5A8AD4] p-4">
      <div className="w-full max-w-sm bg-white/30 backdrop-blur-2xl p-8 rounded-[24px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center font-black text-[#5A8AD4] mb-4 shadow-md">J</div>
        <h1 className="text-white text-2xl font-bold mb-1 text-center drop-shadow">J-OS</h1>
        <p className="text-white/70 text-xs text-center mb-6">Bem-vindo de volta</p>
        {erro && <div className="bg-red-500/20 backdrop-blur border border-red-400/30 text-white text-sm p-3 rounded-xl mb-4">{erro}</div>}
        <form onSubmit={handleLogin} className="space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full bg-white/70 backdrop-blur text-slate-800 p-3 rounded-full outline-none border border-white/60 text-sm placeholder:text-gray-400" required />
          <div className="relative">
            <input type={mostrarSenha?"text":"password"} placeholder="Senha" value={senha} onChange={(e)=>setSenha(e.target.value)} className="w-full bg-white/70 backdrop-blur text-slate-800 p-3 rounded-full outline-none border border-white/60 pr-16 text-sm" required />
            <button type="button" onClick={()=>setMostrarSenha(!mostrarSenha)} className="absolute right-2 top-1.5 bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600">{mostrarSenha?"ocultar":"ver"}</button>
          </div>
          <button disabled={loading} className="w-full bg-[#2F4A8A] hover:bg-[#1E2F6B] text-white p-3 rounded-full font-semibold shadow-lg transition text-sm">{loading?"Entrando...":"Entrar"}</button>
        </form>
      </div>
    </div>
  );
}
