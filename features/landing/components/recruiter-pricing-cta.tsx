"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useOrganizations } from "@/features/organization/api/use-organization";

export function RecruiterPricingCta({
  highlight,
  label,
}: {
  highlight: boolean;
  label: string;
}) {
  const { status } = useSession();
  const authenticated = status === "authenticated";
  const { data: orgs } = useOrganizations({ enabled: authenticated });

  const firstOrgSlug = orgs?.[0]?.organization.slug;
  const billingHref = firstOrgSlug
    ? `/company/${firstOrgSlug}/billing`
    : "/company";

  const href = !authenticated
    ? "/sign-up?callbackUrl=%2Fcompany"
    : highlight
      ? billingHref
      : "/company";

  const text = !authenticated
    ? label
    : highlight
      ? "Upgrade to Org Pro"
      : "Open workspace";

  return (
    <Button
      asChild
      className="mt-6 w-full"
      variant={highlight ? "accent" : "outline"}
    >
      <Link href={href}>{text}</Link>
    </Button>
  );
}
