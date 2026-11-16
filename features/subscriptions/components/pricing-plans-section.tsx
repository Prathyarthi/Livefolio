"use client";

import Link from "next/link";
import { SubscriptionFlow } from "./subscription-flow";
import { BILLING_INTERVALS, formatProPriceLabel } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function PricingPlansSection({
  className,
  headingLevel: Heading = "h2",
}: {
  className?: string;
  /** `h1` on /pricing (the page has no other H1); `h2` when embedded in the landing page. */
  headingLevel?: "h1" | "h2";
} = {}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col gap-[var(--space-6)]",
        className,
      )}
    >
      <header className="mx-auto max-w-2xl space-y-4 text-center">
        <p className="eyebrow uppercase">Pricing</p>
        <Heading className="text-h1 text-text-primary md:text-display">
          Two simple plans
        </Heading>
        <p className="prose-measure mx-auto text-body text-text-secondary">
          Start with a one-month free trial of all core workflows. After that,
          stay on free essentials or upgrade to Pro, billed monthly, quarterly,
          or yearly.
        </p>
      </header>

      <SubscriptionFlow />

      <p className="text-center text-body-sm text-text-secondary">
        Pro pricing:{" "}
        {BILLING_INTERVALS.map((interval, index) => (
          <span key={interval}>
            {index > 0 ? (index === BILLING_INTERVALS.length - 1 ? " or " : ", ") : ""}
            <span className="font-medium text-text-primary">
              {formatProPriceLabel(interval)}
            </span>
          </span>
        ))}
        . Hiring a team?{" "}
        <Link
          href="/recruiters#pricing"
          className="font-medium text-brand-primary hover:underline"
        >
          See per-seat plans for recruiters
        </Link>
        .
      </p>
    </div>
  );
}
