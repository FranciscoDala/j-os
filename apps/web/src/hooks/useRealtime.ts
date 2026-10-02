"use client";
import { useEffect, useRef } from "react";
import { WS_URL } from "@/lib/api";

type RealtimeEvent = {
    type: string;
    [key: string]: any;
};

export function useRealtime(onEvent: (ev: RealtimeEvent) => void) {
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const ws = new WebSocket(`${WS_URL}?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => console.log("[realtime] conectado");
        ws.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                onEvent(data);
            } catch { }
        };
        ws.onclose = () => {
            console.log("[realtime] desconectado, reconectando em 3s");
            setTimeout(() => onEvent({ type: "__RECONNECT__" }), 3000);
        };

        return () => ws.close();
    }, []);

    return wsRef;
}
