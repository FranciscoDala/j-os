"use client";
import { createContext, useContext, useEffect } from "react";
import { useRealtime } from "@/hooks/useRealtime";

const Ctx = createContext({});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    useRealtime((ev) => {
        if (ev.type === "__RECONNECT__") {
            // reconecta - não dispara nada, o hook já reconecta sozinho
            window.location.reload();
            return;
        }

        console.log("[RT]", ev.type, ev);

        // DISPARA SÓ EVENTOS CIRÚRGICOS
        if (ev.type === "produto:update" || ev.type === "produto:created") {
            window.dispatchEvent(new CustomEvent("produto:update", { detail: ev.data || ev }));
        }
        if (ev.type === "venda:nova") {
            window.dispatchEvent(new CustomEvent("venda:nova", { detail: ev.data || ev }));
            window.dispatchEvent(new CustomEvent("caixa:extrato", { detail: ev.movimento || ev.data }));
        }
        if (ev.type === "caixa:update") {
            window.dispatchEvent(new CustomEvent("caixa:update", { detail: ev.data || ev }));
        }
        if (ev.type === "atividade:nova") {
            window.dispatchEvent(new CustomEvent("atividade:nova", { detail: ev.data || ev }));
        }
    });

    return <Ctx.Provider value={{}}>{children}</Ctx.Provider>;
}
