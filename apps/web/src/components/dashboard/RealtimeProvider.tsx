"use client";
import { createContext, useEffect } from "react";
import { useRealtime } from "@/hooks/useRealtime";

const Ctx = createContext({});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    useEffect(()=>{ console.log("[RT_PROVIDER] montado, token:", !!localStorage.getItem("access_token")) },[])
    useRealtime((ev) => {
        console.log("[RT_RAW]", ev);
        if (!ev?.type || ev.type === "__RECONNECT__") return;
        console.log("[RT]", ev.type, ev);
        const detail = ev.data || ev;
        window.dispatchEvent(new CustomEvent(ev.type, { detail }));
        // compat
        if(ev.type.startsWith("produto:")) {
          window.dispatchEvent(new CustomEvent("produto:update", { detail }));
          window.dispatchEvent(new CustomEvent("produto:atualizado", { detail }));
        }
        if(ev.type.startsWith("caixa:")) {
          window.dispatchEvent(new CustomEvent("caixa:update", { detail }));
          window.dispatchEvent(new CustomEvent("caixa:atualizado", { detail }));
          window.dispatchEvent(new CustomEvent("caixa:extrato", { detail }));
        }
        if(ev.type.startsWith("venda:")) {
          window.dispatchEvent(new CustomEvent("venda:nova", { detail }));
        }
    });
    return <Ctx.Provider value={{}}>{children}</Ctx.Provider>;
}
