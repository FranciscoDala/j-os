"use client";
import { useRealtime } from "@/hooks/useRealtime";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);

    useRealtime((ev) => {
        if (ev.type === "__RECONNECT__") {
            window.location.reload();
            return;
        }

        switch (ev.type) {
            case "CAIXA_ABERTO":
                toast.success(`Caixa aberto por ${ev.caixa?.aberto_por_nome || 'alguém'}`);
                window.dispatchEvent(new CustomEvent("caixa:update"));
                break;
            case "CAIXA_FECHADO":
                toast.info("Caixa fechado");
                window.dispatchEvent(new CustomEvent("caixa:update"));
                break;
            case "CAIXA_MOVIMENTO":
                window.dispatchEvent(new CustomEvent("caixa:extrato", { detail: ev.movimento }));
                break;
            case "PRODUTO_ATUALIZADO":
            case "PRODUTO_CRIADO":
                window.dispatchEvent(new CustomEvent("produto:update", { detail: ev.produto }));
                break;
            case "RESERVA_UPDATE":
                window.dispatchEvent(new CustomEvent("reserva:update", { detail: ev }));
                break;
            case "VENDA_CONCLUIDA":
                toast.success(`Venda ${ev.venda?.numero || ''} concluída!`);
                window.dispatchEvent(new CustomEvent("venda:nova", { detail: ev.venda }));
                window.dispatchEvent(new CustomEvent("caixa:update"));
                break;
            case "ATIVIDADE_NOVA":
                window.dispatchEvent(new CustomEvent("atividade:nova", { detail: ev.log }));
                break;
        }
    });

    if (!isMounted) return null as any;
    return <>{children}</>;
}
