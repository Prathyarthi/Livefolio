import { LandingNav } from "@/features/landing/components/landing-nav";

interface MarketingPageShellProps {
  children: React.ReactNode;
  variant?: "candidate" | "recruiter";
}

export function MarketingPageShell({
  children,
  variant = "candidate",
}: MarketingPageShellProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden bg-surface-base">
      <div className="glass-ambient" aria-hidden />
      <div className="relative z-[1]">
        <LandingNav variant={variant} />
        <main className="px-4 py-14 sm:px-6 md:py-20">{children}</main>
      </div>
    </div>
  );
}
