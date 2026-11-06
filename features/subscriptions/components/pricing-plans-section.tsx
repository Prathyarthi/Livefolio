"use client";

import { SubscriptionFlow } from "./subscription-flow";
import { cn } from "@/lib/utils";

export function PricingPlansSection({
  className,
}: {
  className?: string;
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
        <h2 className="text-h1 text-text-primary md:text-display">
          Two simple plans
        </h2>
        <p className="prose-measure mx-auto text-body text-text-secondary">
          Start with a one-month free trial of all core workflows. After that,
          stay on free essentials or upgrade to Pro — billed monthly, quarterly,
          or yearly.
        </p>
      </header>

      <SubscriptionFlow />
    </div>
  );
}
