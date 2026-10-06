"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type SearchCtx = {
    search: string;
    setSearch: (v: string) => void;
    activeTab: string;
    setActiveTab: (v: string) => void;
};

const Ctx = createContext<SearchCtx>({
    search: "",
    setSearch: () => { },
    activeTab: "vendas",
    setActiveTab: () => { },
});

export function SearchProvider({ children }: { children: ReactNode }) {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("vendas");
    return <Ctx.Provider value={{ search, setSearch, activeTab, setActiveTab }}>{children}</Ctx.Provider>;
}

export const useGlobalSearch = () => useContext(Ctx);
