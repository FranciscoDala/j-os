"use client";
import { useEffect } from "react";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { HomeTab } from "./components/tabs/dashboard";
import { ProdutosTab } from "./components/tabs/produto/produto";
import { CaixaTab } from "./components/tabs/caixa/caixa";

export default function RestaurantePage() {
    const { activeTab, user } = useDashboard();

    // Isso faz as tabs recarregarem sozinhas quando chegar evento do backend
    useEffect(() => {
        const reload = () => window.dispatchEvent(new CustomEvent("app:refresh"));

        const events = ["caixa:update", "venda:nova", "produto:update", "atividade:nova"];
        events.forEach(e => window.addEventListener(e, reload));
        return () => events.forEach(e => window.removeEventListener(e, reload));
    }, []);

    return (
        <div className="w-full min-w-0">
            {activeTab === "home" && <HomeTab user={user} key="home" />}
            {activeTab === "caixa" && <CaixaTab key="caixa" />}
            {activeTab === "produtos" && <ProdutosTab key="produtos" />}
            {activeTab === "cardapio" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Cardápio - montagem de pratos</div>}
            {activeTab === "pedidos" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Pedidos</div>}
            {activeTab === "mesas" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Mesas</div>}
        </div>
    );
}
