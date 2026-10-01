"use client";

import { useEffect, useState } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const root = document.documentElement;

        // Pega do localStorage ou usa dark como padrão
        const theme = localStorage.getItem("theme") || "dark";
        const cardStyle = localStorage.getItem("cardStyle") || "padrao";
        const cardSize = localStorage.getItem("cardSize") || "medio";

        root.setAttribute("data-theme", theme);
        root.setAttribute("data-card-style", cardStyle);
        root.setAttribute("data-card-size", cardSize);
    }, []);

    // Função pra mudar e salvar
    useEffect(() => {
        if (!mounted) return;

        // Escuta mudanças no window pra tu poder chamar de qualquer lugar
        // @ts-ignore
        window.setTheme = (key: string, value: string) => {
            const root = document.documentElement;
            root.setAttribute(key, value);
            localStorage.setItem(key.replace("data-", ""), value);
        };
    }, [mounted]);

    if (!mounted) return null; // evita piscar

    return <>{children}</>;
}
