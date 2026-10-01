import { DashboardLayoutProvider } from "@/components/dashboard/Tamplate";

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutProvider>{children}</DashboardLayoutProvider>;
}
