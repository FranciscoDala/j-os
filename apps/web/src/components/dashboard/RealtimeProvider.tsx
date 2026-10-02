"use client";
import { createContext } from "react";
import { useRealtime } from "@/hooks/useRealtime";

const Ctx = createContext({});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    useRealtime((ev) => {
        if (!ev?.type || ev.type === "__RECONNECT__") return;

        console.log("[RT]", ev.type, ev);

        // PRODUTO - criado / update / deletado -> sempre dispara produto:update por compat
        if (ev.type.startsWith("produto:")) {
            window.dispatchEvent(new CustomEvent(ev.type, { detail: ev.data || ev }));
            window.dispatchEvent(new CustomEvent("produto:update", { detail: ev.data || ev }));
        }

        // VENDA
        if (ev.type === "venda:nova" || ev.type === "venda:fechada" || ev.type === "venda:update" || ev.type === "venda:cancelada" || ev.type === "venda:item_status") {
            window.dispatchEvent(new CustomEvent(ev.type, { detail: ev.data || ev }));
            // compat antigo que só escuta venda:nova
            if (ev.type !== "venda:nova") {
                window.dispatchEvent(new CustomEvent("venda:nova", { detail: ev.data || ev }));
            }
        }

        // CAIXA - backend manda separado: caixa:update e caixa:extrato
        if (ev.type === "caixa:update" || ev.type === "caixa:extrato") {
            window.dispatchEvent(new CustomEvent(ev.type, { detail: ev.data || ev }));
        }
        // quando vem venda:nova com movimento junto (legado), ainda funciona
        if (ev.type === "venda:nova" && ev.movimento) {
            window.dispatchEvent(new CustomEvent("caixa:extrato", { detail: ev.movimento }));
        }

        // RESERVA
        if (ev.type.startsWith("reserva:")) {
            window.dispatchEvent(new CustomEvent(ev.type, { detail: ev.data || ev }));
            window.dispatchEvent(new CustomEvent("reserva:update", { detail: ev }));
        }

        // ATIVIDADE
        if (ev.type === "atividade:nova") {
            window.dispatchEvent(new CustomEvent("atividade:nova", { detail: ev.data || ev }));
        }

        // EMPRESA / ENTIDADE / USUARIO
        if (ev.type.startsWith("empresa:") || ev.type.startsWith("entidade:") || ev.type.startsWith("usuario:") || ev.type.startsWith("perfis:") || ev.type.startsWith("mesa:")) {
            window.dispatchEvent(new CustomEvent(ev.type, { detail: ev.data || ev }));
        }
    });

    return <Ctx.Provider value={{}}>{children}</Ctx.Provider>;
}
