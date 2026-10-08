"use client";
import { createContext, useEffect, useRef } from "react";
import { useRealtime } from "@/hooks/useRealtime";

const Ctx = createContext({});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        console.log("[RT_PROVIDER] montado, token:", typeof window!== "undefined" &&!!localStorage.getItem("access_token"));
        try {
            audioRef.current = new Audio("/sounds/new-order.wav");
            audioRef.current.volume = 0.8;
            audioRef.current.preload = "auto";
        } catch {}
    }, []);

    useRealtime((ev) => {
        if (!ev?.type || ev.type === "__RECONNECT__") return;

        // console.log("[RT]", ev.type, ev);
        const detail = ev.data?? ev;

        // 1. Evento original
        window.dispatchEvent(new CustomEvent(ev.type, { detail }));

        // 2. COMPAT STOCKBOT -> J-OS
        if (ev.type === "stock.updated" || ev.type === "produto:update" || ev.type === "produto:atualizado") {
            window.dispatchEvent(new CustomEvent("produto:update", { detail }));
            window.dispatchEvent(new CustomEvent("produto:atualizado", { detail }));
            window.dispatchEvent(new CustomEvent("stock.updated", { detail }));
        }
        if (ev.type === "produto:created" || ev.type === "produto:deleted") {
            window.dispatchEvent(new CustomEvent("produto:update", { detail }));
        }

        if (ev.type.startsWith("venda:")) {
            window.dispatchEvent(new CustomEvent("venda:nova", { detail }));
            window.dispatchEvent(new CustomEvent("venda:update", { detail }));
            window.dispatchEvent(new CustomEvent("venda:atualizado", { detail }));
            window.dispatchEvent(new CustomEvent("venda:fechada", { detail }));
        }

        if (ev.type === "stats.updated" || ev.type === "dashboard:refresh") {
            window.dispatchEvent(new CustomEvent("stats.updated", { detail: ev }));
            window.dispatchEvent(new CustomEvent("dashboard:refresh", { detail: ev }));
        }

        if (ev.type === "caixa.updated" || ev.type.startsWith("caixa:")) {
            window.dispatchEvent(new CustomEvent("caixa:update", { detail }));
            window.dispatchEvent(new CustomEvent("caixa:atualizado", { detail }));
            window.dispatchEvent(new CustomEvent("caixa:extrato", { detail }));
            window.dispatchEvent(new CustomEvent("caixa.updated", { detail }));
        }

        if (ev.type === "mesa:update" || ev.type === "mesa:atualizado") {
            window.dispatchEvent(new CustomEvent("mesa:update", { detail }));
            window.dispatchEvent(new CustomEvent("mesa:atualizado", { detail }));
        }

        // entidade / usuario / empresa / atividade - NOVOS
        if (ev.type.startsWith("entidade:")) {
            window.dispatchEvent(new CustomEvent("entidade:update", { detail }));
            window.dispatchEvent(new CustomEvent(ev.type, { detail }));
        }
        if (ev.type.startsWith("usuario:")) {
            window.dispatchEvent(new CustomEvent("usuario:update", { detail }));
            window.dispatchEvent(new CustomEvent("entidade:update", { detail }));
        }
        if (ev.type.startsWith("empresa:")) {
            window.dispatchEvent(new CustomEvent("empresa:updated", { detail }));
            window.dispatchEvent(new CustomEvent("empresa:update", { detail }));
        }
        if (ev.type.startsWith("atividade:")) {
            window.dispatchEvent(new CustomEvent("atividade:nova", { detail }));
        }

        if (ev.type === "notificacao:nova") {
            const notifData = ev.data || ev;
            window.dispatchEvent(new CustomEvent("notificacao:nova", { detail: notifData }));
            if (notifData?.tipo === "PEDIDO_QR" || notifData?.mesa_numero) {
                try {
                    audioRef.current?.play().catch(() => {});
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                } catch {}
            }
        }

        if (ev.type === "pedido_qr:novo") {
            window.dispatchEvent(new CustomEvent("pedido_qr:novo", { detail }));
            window.dispatchEvent(new CustomEvent("notificacao:nova", { detail: {...detail, tipo: "PEDIDO_QR" } }));
            try {
                audioRef.current?.play().catch(() => {});
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            } catch {}
        }

        if (ev.type === "pedido_qr:aceito" || ev.type === "pedido_qr:recusado" || ev.type === "pedido_qr:remover") {
            window.dispatchEvent(new CustomEvent("pedido_qr:aceito", { detail }));
            window.dispatchEvent(new CustomEvent("pedido_qr:remover", { detail }));
            window.dispatchEvent(new CustomEvent("pedido-qr:aprovado", { detail }));
            window.dispatchEvent(new CustomEvent("pedido-qr:recusado", { detail }));
        }

        if (ev.type.startsWith("reserva:")) {
            window.dispatchEvent(new CustomEvent("reserva:update", { detail: ev }));
            window.dispatchEvent(new CustomEvent("reserva:init", { detail: ev }));
        }
    });

    return <Ctx.Provider value={{}}>{children}</Ctx.Provider>;
}
