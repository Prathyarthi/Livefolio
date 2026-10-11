import type { Metadata } from "next";
import { PricingPageShell } from "@/features/subscriptions/components/pricing-page-shell";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Pricing & Pro Plans",
  description:
    "Compare Livefolio free and Pro plans. Unlock all portfolio templates, resume import, GitHub, Medium, and LeetCode integrations with a flexible subscription.",
  path: "/pricing",
});

export default function PricingPage() {
  return <PricingPageShell />;
}
