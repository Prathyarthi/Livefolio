"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecruiterPricingCta } from "@/features/landing/components/recruiter-pricing-cta";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import {
  ENTERPRISE_PLAN,
  enterpriseContactHref,
  HIRING_PLAN_FEATURES,
  savingsPercent,
  type HiringPlanSlug,
} from "@/lib/hiring-plans";
import {
  BILLING_CURRENCY,
  BILLING_INTERVAL_LABELS,
  BILLING_INTERVALS,
  formatSeatBillingNote,
  formatSeatMonthlyHeadline,
  type BillingInterval,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

const PLAN_COPY: Record<HiringPlanSlug, { name: string; note: string; cta: string }> = {
  free: { name: "Free", note: "One recruiter, one open role", cta: "Start free" },
  pro: { name: "Pro", note: "For founders and small hiring teams", cta: "Start hiring" },
  business: { name: "Business", note: "For teams hiring across workspaces", cta: "Start hiring" },
};

const PLANS: HiringPlanSlug[] = ["free", "pro", "business"];

export function RecruiterPricingCards() {
  const [interval, setInterval] = useState<BillingInterval>("yearly");
  const yearlySave = savingsPercent("pro", "yearly", BILLING_CURRENCY);

  return (
    <div className="space-y-6">
      <Tabs value={interval} onValueChange={(v) => setInterval(v as BillingInterval)}>
        <TabsList aria-label="Billing period">
          {BILLING_INTERVALS.map((value) => (
            <TabsTrigger key={value} value={value} className="gap-1.5 px-3">
              {BILLING_INTERVAL_LABELS[value]}
              {value === "yearly" && yearlySave ? (
                <span className="font-mono text-[11px] text-brand-primary">−{yearlySave}%</span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-px overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-border-default sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((slug) => {
          const copy = PLAN_COPY[slug];
          const paid = slug !== "free";
          return (
            <div
              key={slug}
              className={cn(
                "flex flex-col bg-surface-base p-6 md:p-8",
                slug === "pro" && "bg-surface-raised",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs uppercase tracking-wider text-text-secondary">
                  {copy.name}
                </p>
                {slug === "pro" ? <Badge variant="brand">Most teams</Badge> : null}
              </div>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-tight text-text-primary tabular-nums">
                  {paid ? formatSeatMonthlyHeadline(slug, interval) : BILLING_CURRENCY === "usd" ? "$0" : "₹0"}
                </span>
                {paid ? (
                  <span className="text-body-sm text-text-secondary">/ seat / mo</span>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {paid
                  ? `${formatSeatBillingNote(slug, interval)}${slug === "business" ? " · min 3 seats" : ""}`
                  : "Free forever"}
              </p>
              <p className="mt-3 text-body-sm text-text-secondary">{copy.note}</p>
              <ul className="mt-6 flex-1 space-y-2">
                {HIRING_PLAN_FEATURES[slug].map((feature) => (
                  <li
                    key={feature.label}
                    className="flex items-start gap-2 text-body-sm text-text-secondary"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" aria-hidden />
                    {feature.label}
                  </li>
                ))}
              </ul>
              <RecruiterPricingCta highlight={paid} label={copy.cta} />
            </div>
          );
        })}
        <div className="flex flex-col bg-surface-base p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-wider text-text-secondary">
            {ENTERPRISE_PLAN.name}
          </p>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-text-primary">
            {ENTERPRISE_PLAN.priceLabel}
          </p>
          <p className="mt-1 text-xs text-text-muted">Annual contract · volume pricing</p>
          <p className="mt-3 text-body-sm text-text-secondary">{ENTERPRISE_PLAN.note}</p>
          <ul className="mt-6 flex-1 space-y-2">
            {ENTERPRISE_PLAN.features.map((feature) => (
              <li
                key={feature.label}
                className="flex items-start gap-2 text-body-sm text-text-secondary"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" aria-hidden />
                {feature.label}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="mt-6 w-full">
            <a href={enterpriseContactHref(siteConfig.supportEmail)}>{ENTERPRISE_PLAN.cta}</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
