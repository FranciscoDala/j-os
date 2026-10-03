"use client";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { HomeTab } from "./components/tabs/dashboard";
import { ProdutosTab } from "./components/tabs/produto/produto";
import { CaixaTab } from "./components/tabs/caixa/caixa";
import { EntidadesTab } from "./components/tabs/entidade/entidade"; // <-- AQUI

export default function RestaurantePage() {
    const { activeTab, user } = useDashboard();
    return (
        <div className="w-full min-w-0">
            {activeTab === "home" && <HomeTab user={user} />}
            {activeTab === "caixa" && <CaixaTab />}
            {activeTab === "produtos" && <ProdutosTab />}
            {activeTab === "funcionarios" && <EntidadesTab />}
            {activeTab === "cardapio" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Cardápio</div>}
            {activeTab === "pedidos" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Pedidos</div>}
            {activeTab === "mesas" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Mesas</div>}
            {activeTab === "financas" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Finanças</div>}
            {activeTab === "relatorios" && <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 md:p-8 border border-white/50">Relatórios</div>}
        </div>
    );
}
