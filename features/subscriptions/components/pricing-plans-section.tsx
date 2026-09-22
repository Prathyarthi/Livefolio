"use client";

import { SubscriptionFlow } from "./subscription-flow";

export function PricingPlansSection() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-[var(--space-6)]">
      <header className="mx-auto max-w-2xl space-y-4 text-center">
        <p className="eyebrow uppercase">Pricing</p>
        <h1 className="text-h1 text-text-primary md:text-display">
          Two simple plans
        </h1>
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
