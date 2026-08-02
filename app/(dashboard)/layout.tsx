"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { EditDirtyProvider } from "@/features/portfolio/context/edit-dirty-context";
import { Loader2 } from "lucide-react";
import { isRecruiterAccount } from "@/lib/account-type";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }
    if (status === "authenticated" && isRecruiterAccount(session?.user?.accountType)) {
      router.replace("/recruiter");
    }
  }, [status, session?.user?.accountType, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  if (isRecruiterAccount(session?.user?.accountType)) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <EditDirtyProvider>
      <DashboardShell>{children}</DashboardShell>
    </EditDirtyProvider>
  );
}
