"use client";
import { useDashboard } from "@/components/dashboard/Tamplate";
import { HomeTab } from "./components/tabs/dashboard";
import { ProdutosTab } from "./components/tabs/produto/produto";
import { CaixaTab } from "./components/tabs/caixa/caixa";
import { EntidadesTab } from "./components/tabs/entidade/entidade";
import { MesasTab } from "./components/tabs/mesa/mesa";
import { PedidosTab } from "./components/tabs/pedido/pedido";

export default function RestaurantePage() {
    const { activeTab, user } = useDashboard();

    switch (activeTab) {
        case "home": return <HomeTab user={user} />;
        case "caixa": return <CaixaTab />;
        case "produtos": return <ProdutosTab />;
        case "funcionarios": return <EntidadesTab />;
        case "mesas": return <MesasTab />;
        case "pedidos": return <PedidosTab />;
        default: return <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-8 text-[11px]">Em breve: {activeTab}</div>;
    }
}
