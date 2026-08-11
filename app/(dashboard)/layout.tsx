import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { EditDirtyProvider } from "@/features/portfolio/context/edit-dirty-context";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EditDirtyProvider>
      <DashboardShell>{children}</DashboardShell>
    </EditDirtyProvider>
  );
}
