"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/features/landing/components/footer";
import { shouldShowMarketingFooter } from "@/lib/domain";

type GlobalFooterClientProps = {
  host: string;
};

function isStudioCandidatePath(pathname: string) {
  return pathname === "/";
}

function isStudioRecruiterPath(pathname: string) {
  return pathname === "/recruiters" || pathname.startsWith("/recruiters/");
}

/**
 * Single marketing footer slot (root layout). Studio landings get white /
 * 1144-aligned chrome; recruiter gets hiring copy. Contact/legal/pricing
 * keep the default cream footer. Never renders twice.
 */
export function GlobalFooterClient({ host }: GlobalFooterClientProps) {
  const pathname = usePathname();

  if (!shouldShowMarketingFooter(pathname, host)) {
    return null;
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/company") ||
    pathname.startsWith("/vouch")
  ) {
    return null;
  }

  if (isStudioRecruiterPath(pathname)) {
    return <Footer surface="studio" audience="recruiter" />;
  }

  if (isStudioCandidatePath(pathname)) {
    return <Footer surface="studio" audience="candidate" />;
  }

  return <Footer surface="default" audience="candidate" />;
}
