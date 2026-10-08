"use client";
import { useEffect, useRef } from "react";
import { WS_URL } from "@/lib/api";

type RealtimeEvent = { type: string; tipo?: string; data?: any; [key: string]: any };

export function useRealtime(onEvent: (ev: RealtimeEvent) => void) {
    const wsRef = useRef<WebSocket | null>(null);
    const retryRef = useRef(1000);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    useEffect(() => {
        let closedByUs = false;
        let timer: ReturnType<typeof setTimeout>;

        const connect = () => {
            const token = typeof window!== "undefined"? localStorage.getItem("access_token") || localStorage.getItem("token") : null;
            if (!token) {
                timer = setTimeout(connect, 2000);
                return;
            }
            try {
                const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log("[realtime] conectado", WS_URL);
                    retryRef.current = 1000;
                    onEventRef.current({ type: "__RECONNECT__" });
                };

                ws.onmessage = (msg) => {
                    try {
                        if (typeof msg.data!== "string") return;
                        if (msg.data === "pong" || msg.data.includes("ping")) {
                            // responde ping se vier texto
                            try { if (msg.data.includes("ping")) ws.send(JSON.stringify({ type: "pong" })); } catch {}
                            if (msg.data === "pong") return;
                        }
                        const data = JSON.parse(msg.data);
                        if (data.type === "ping") {
                            try { ws.send(JSON.stringify({ type: "pong" })); } catch {}
                            return;
                        }
                        const eventType = data.type || data.tipo;
                        if (!eventType) return;
                        data.type = eventType;
                        onEventRef.current(data);
                    } catch (e) {
                        console.warn("[realtime] parse fail", e);
                    }
                };

                ws.onclose = () => {
                    if (closedByUs) return;
                    console.log(`[realtime] fechado, retry em ${retryRef.current}ms`);
                    timer = setTimeout(() => {
                        retryRef.current = Math.min(retryRef.current * 1.5, 15000);
                        connect();
                    }, retryRef.current);
                };

                ws.onerror = () => {
                    try { ws.close(); } catch {}
                };
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
