"use client";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { HomeTab } from "./components/tabs/dashboard";

export default function RestaurantePage() {
    const { activeTab, user } = useDashboard();

    return (
        <div className="w-full min-w-0">
            {activeTab === "home" && <HomeTab user={user} />}
            {activeTab === "pedidos" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Pedidos</div>}
            {activeTab === "cardapio" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Cardápio</div>}
            {activeTab === "mesas" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Mesas</div>}
            {/* vendas não renderiza aqui, já está no overlay do layout */}
        </div>
    );
}
