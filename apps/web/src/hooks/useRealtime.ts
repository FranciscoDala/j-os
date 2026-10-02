"use client";
import { useEffect, useRef } from "react";
import { WS_URL } from "@/lib/api";

type RealtimeEvent = { type: string; [key: string]: any };

export function useRealtime(onEvent: (ev: RealtimeEvent) => void) {
    const wsRef = useRef<WebSocket | null>(null);
    const retryRef = useRef(1000);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    useEffect(() => {
        let closedByUs = false;
        let timer: ReturnType<typeof setTimeout>;

        const connect = () => {
            const token = localStorage.getItem("access_token");
            if (!token) {
                timer = setTimeout(connect, 2000); // espera login
                return;
            }
            try {
                const ws = new WebSocket(`${WS_URL}?token=${token}`);
                wsRef.current = ws;
                ws.onopen = () => {
                    console.log("[realtime] conectado");
                    retryRef.current = 1000;
                };
                ws.onmessage = (msg) => {
                    try {
                        const data = JSON.parse(msg.data);
                        onEventRef.current(data);
                    } catch {}
                };
                ws.onclose = () => {
                    if (closedByUs) return;
                    timer = setTimeout(() => {
                        retryRef.current = Math.min(retryRef.current * 1.5, 15000);
                        connect();
                    }, retryRef.current);
                };
                ws.onerror = () => ws.close();
            } catch {
                timer = setTimeout(connect, retryRef.current);
            }
        };

        connect();
        return () => {
            closedByUs = true;
            clearTimeout(timer);
            try { wsRef.current?.close(); } catch {}
        };
    }, []);

    return wsRef;
}
