import DashboardShell from "@/components/dashboard/DashboardShell";

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell title="Digicode Immo">{children}</DashboardShell>;
}
