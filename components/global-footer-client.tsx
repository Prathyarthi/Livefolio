"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/features/landing/components/footer";
import { shouldShowMarketingFooter } from "@/lib/domain";

type GlobalFooterClientProps = {
  host: string;
};

export function GlobalFooterClient({ host }: GlobalFooterClientProps) {
  const pathname = usePathname();

  if (!shouldShowMarketingFooter(pathname, host)) {
    return null;
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/company")
  ) {
    return null;
  }

  return <Footer />;
}
