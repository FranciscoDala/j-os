"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getEmpresaData, getEmpresa, setEmpresaData as saveEmpresaData } from "@/lib/api";
import type { Empresa } from "@/lib/types";

type EmpresaContextType = {
    empresa: Empresa | null;
    loading: boolean;
    setEmpresa: (e: Empresa) => void;
    reload: () => Promise<void>;
};

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        setLoading(true);
        try {
            const cached = getEmpresaData();
            if (cached) {
                setEmpresa(cached);
            } else {
                const id = typeof window!== 'undefined'? localStorage.getItem("empresa_id") : null;
                if (id) {
                    const fresh = await getEmpresa(id);
                    setEmpresa(fresh);
                    saveEmpresaData(fresh);
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        reload();
        const handler = (e: Event) => {
            const custom = e as CustomEvent<Empresa>;
            setEmpresa(custom.detail);
        };
        window.addEventListener("empresa:updated" as any, handler);
        return () => window.removeEventListener("empresa:updated" as any, handler);
    }, [reload]);

    const handleSet = useCallback((e: Empresa) => {
        setEmpresa(e);
        saveEmpresaData(e);
    }, []);

    return (
        <EmpresaContext.Provider value={{ empresa, loading, setEmpresa: handleSet, reload }}>
            {children}
        </EmpresaContext.Provider>
    );
}

export function useEmpresa() {
    const ctx = useContext(EmpresaContext);
    if (!ctx) throw new Error("useEmpresa must be used within EmpresaProvider");
    return ctx;
}
