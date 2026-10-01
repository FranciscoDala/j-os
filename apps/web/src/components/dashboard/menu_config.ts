import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  BarChart3,
  Users,
  ClipboardList,
  Armchair,
  ChefHat,
  DollarSign,
  Settings,
  Power
} from "lucide-react";

export type ModuleId = "restaurante" | "rh" | "seguranca" | "financeiro" | "empresa" | "dashboard";

export const menuConfig: Record<ModuleId, { label: string; id: string; icon: any }[]> = {
  dashboard: [
    { label: "Dashboard", id: "home", icon: LayoutDashboard },
  ],
  restaurante: [
    { label: "Dashboard", id: "home", icon: LayoutDashboard },
    { label: "Tela Vendas", id: "vendas", icon: ShoppingCart },
    { label: "Caixa", id: "caixa", icon: Receipt }, // SUBIU PRA CÁ
    { label: "Pedidos", id: "pedidos", icon: ClipboardList },
    { label: "Mesas", id: "mesas", icon: Armchair },
    { label: "Produtos", id: "produtos", icon: Package },
    { label: "Cardápio", id: "cardapio", icon: ChefHat },
    { label: "Funcionários", id: "funcionarios", icon: Users },
    { label: "Finanças", id: "financas", icon: DollarSign },
    { label: "Relatórios", id: "relatorios", icon: BarChart3 },
  ],
  rh: [
    { label: "Dashboard", id: "home", icon: LayoutDashboard },
    { label: "Funcionários", id: "funcionarios", icon: Users },
  ],
  seguranca: [
    { label: "Dashboard", id: "home", icon: LayoutDashboard },
  ],
  financeiro: [
    { label: "Finanças", id: "financas", icon: DollarSign },
    { label: "Relatórios", id: "relatorios", icon: BarChart3 },
  ],
  empresa: [
    { label: "Dashboard", id: "home", icon: LayoutDashboard },
  ],
};

export const bottomMenu = [
  { label: "Config", id: "settings", icon: Settings },
  { label: "Sair", id: "logout", icon: Power },
];
