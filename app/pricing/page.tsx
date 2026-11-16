import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { PricingPageShell } from "@/features/subscriptions/components/pricing-page-shell";
import { createPageMetadata } from "@/lib/seo";
import { getBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = createPageMetadata({
  title: "Pricing: Free and Pro Portfolio Plans",
  description:
    "Start with a free one-month trial, then stay on Free or upgrade to Pro, billed monthly, quarterly or yearly. Hiring teams: see per-seat plans for recruiters.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <>
      <JsonLd data={getBreadcrumbSchema([{ name: "Pricing", path: "/pricing" }])} />
      <PricingPageShell />
    </>
  );
}
