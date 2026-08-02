"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { RecruiterShell } from "@/features/recruiter/components/recruiter-shell";
import { isRecruiterAccount } from "@/lib/account-type";

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in?as=recruiter&callbackUrl=/recruiter");
      return;
    }
    if (
      status === "authenticated" &&
      !isRecruiterAccount(session?.user?.accountType)
    ) {
      router.replace("/dashboard");
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

  if (!isRecruiterAccount(session?.user?.accountType)) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-base">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return <RecruiterShell>{children}</RecruiterShell>;
}
