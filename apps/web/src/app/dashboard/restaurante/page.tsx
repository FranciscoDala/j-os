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
    if (activeTab === "home") return <HomeTab user={user} />;
    if (activeTab === "caixa") return <CaixaTab />;
    if (activeTab === "produtos") return <ProdutosTab />;
    if (activeTab === "funcionarios") return <EntidadesTab />;
    if (activeTab === "mesas") return <MesasTab />;
    if (activeTab === "pedidos") return <PedidosTab />;
    return <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-8">Em breve: {activeTab}</div>;
}
