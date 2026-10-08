"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Footer } from "@/features/landing/components/footer";
import { shouldShowMarketingFooter } from "@/lib/domain";
import { HIRING_FROM } from "@/lib/auth-callback";

type GlobalFooterClientProps = {
  host: string;
};

export function GlobalFooterClient({ host }: GlobalFooterClientProps) {
  return (
    <Suspense fallback={null}>
      <GlobalFooterInner host={host} />
    </Suspense>
  );
}

function GlobalFooterInner({ host }: GlobalFooterClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!shouldShowMarketingFooter(pathname, host)) {
    return null;
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/company") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  const hiring =
    pathname.startsWith("/recruiters") ||
    searchParams.get("from") === HIRING_FROM;

  return <Footer variant={hiring ? "recruiter" : "candidate"} />;
}
