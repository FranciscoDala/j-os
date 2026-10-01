"use client";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { HomeTab } from "./components/tabs/dashboard";
import { ProdutosTab } from "./components/tabs/produto/produto";
import { CaixaTab } from "./components/tabs/caixa/caixa"; // vamos criar agora

export default function RestaurantePage() {
    const { activeTab, user } = useDashboard();

    return (
        <div className="w-full min-w-0">
            {activeTab === "home" && <HomeTab user={user} />}
            {activeTab === "caixa" && <CaixaTab />}
            {activeTab === "produtos" && <ProdutosTab />}
            {activeTab === "cardapio" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Cardápio - montagem de pratos</div>}
            {activeTab === "pedidos" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Pedidos</div>}
            {activeTab === "mesas" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Mesas</div>}
        </div>
    );
}
