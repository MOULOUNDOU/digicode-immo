import DashboardShell from "@/components/dashboard/DashboardShell";

export default function BrokerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell title="Digicode Immo">{children}</DashboardShell>;
}
