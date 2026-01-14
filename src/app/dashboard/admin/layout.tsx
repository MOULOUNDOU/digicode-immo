import DashboardShell from "@/components/dashboard/DashboardShell";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell title="Digicode Immo">{children}</DashboardShell>;
}
