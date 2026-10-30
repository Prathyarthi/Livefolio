"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { EditDirtyProvider } from "@/features/portfolio/context/edit-dirty-context";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl = `${window.location.pathname}${window.location.search}`;
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <EditDirtyProvider>
      <DashboardShell>{children}</DashboardShell>
    </EditDirtyProvider>
  );
}
