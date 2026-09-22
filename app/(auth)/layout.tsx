import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { AuthHomeLogo } from "@/features/auth/components/auth-home-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-surface-base px-4 py-10">
      <div className="glass-ambient" aria-hidden />
      <div className="relative w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Suspense fallback={<Logo />}>
            <AuthHomeLogo />
          </Suspense>
        </div>
        {children}
      </div>
    </div>
  );
}
