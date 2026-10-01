import { LayoutDashboard, UtensilsCrossed, ChefHat, Armchair, Receipt, Users, UserPlus, FileText, Shield, Lock, Camera, AlertTriangle } from "lucide-react";

export type ModuleId = "restaurante" | "rh" | "seguranca" | "financeiro" | "empresa" | "dashboard";

export const menuConfig: Record<ModuleId, { label: string; id: string; icon: any }[]> = {
  dashboard: [
    { label: "Home", id: "home", icon: LayoutDashboard },
  ],
  restaurante: [
    { label: "Dashboard", id: "home", icon: LayoutDashboard },
    { label: "Pedidos", id: "pedidos", icon: UtensilsCrossed },
    { label: "Cardápio", id: "cardapio", icon: ChefHat },
    { label: "Mesas", id: "mesas", icon: Armchair },
    { label: "Caixa", id: "financeiro", icon: Receipt },
  ],
  rh: [
    { label: "Dashboard", id: "home", icon: LayoutDashboard },
    { label: "Funcionários", id: "funcionarios", icon: Users },
    { label: "Recrutamento", id: "recrutamento", icon: UserPlus },
    { label: "Folha", id: "folha", icon: FileText },
  ],
  seguranca: [
    { label: "Dashboard", id: "home", icon: Shield },
    { label: "Acessos", id: "acessos", icon: Lock },
    { label: "Câmeras", id: "cameras", icon: Camera },
    { label: "Ocorrências", id: "ocorrencias", icon: AlertTriangle },
  ],
  financeiro: [
    { label: "Dashboard", id: "home", icon: LayoutDashboard },
    { label: "Caixa", id: "caixa", icon: Receipt },
    { label: "Relatórios", id: "relatorios", icon: FileText },
  ],
  empresa: [
    { label: "Empresas", id: "home", icon: LayoutDashboard },
  ],
};
