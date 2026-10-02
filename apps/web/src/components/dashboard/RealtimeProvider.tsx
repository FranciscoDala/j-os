"use client";
import { createContext } from "react";
import { useRealtime } from "@/hooks/useRealtime";

const Ctx = createContext({});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    useRealtime((ev) => {
        if (ev.type === "__RECONNECT__") return;

        console.log("[RT]", ev.type, ev);

        if (ev.type === "produto:update" || ev.type === "produto:created" || ev.type === "produto:deleted") {
            window.dispatchEvent(new CustomEvent(ev.type, { detail: ev.data || ev }));
        }
        if (ev.type === "produto:update") {
            // compat com código antigo que escuta produto:update para created também
            window.dispatchEvent(new CustomEvent("produto:update", { detail: ev.data || ev }));
        }
        if (ev.type === "venda:nova") {
            window.dispatchEvent(new CustomEvent("venda:nova", { detail: ev.data || ev }));
            if (ev.movimento) {
                window.dispatchEvent(new CustomEvent("caixa:extrato", { detail: ev.movimento }));
            } else if (ev.data) {
                window.dispatchEvent(new CustomEvent("caixa:extrato", { detail: ev.data }));
            }
        }
        if (ev.type === "caixa:update" || ev.type === "caixa:extrato") {
            window.dispatchEvent(new CustomEvent(ev.type, { detail: ev.data || ev }));
        }
        if (ev.type === "atividade:nova") {
            window.dispatchEvent(new CustomEvent("atividade:nova", { detail: ev.data || ev }));
        }
    });

    return <Ctx.Provider value={{}}>{children}</Ctx.Provider>;
}
