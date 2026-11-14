// hiring-plans only imports types from this file, so there is no runtime cycle.
import {
  HIRING_SEAT_PRICING,
  monthlyEquivalent,
  type PaidHiringPlan,
} from "@/lib/hiring-plans";

export const BILLING_INTERVALS = ["monthly", "quarterly", "yearly"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const BILLING_INTERVAL_LABELS: Record<BillingInterval, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export interface PricingFeature {
  label: string;
  included: boolean;
}

export interface PlanAmount {
  usd: number;
  inr: number;
}

export type BillingCurrency = "usd" | "inr";

export const BILLING_CURRENCY: BillingCurrency =
  process.env.NEXT_PUBLIC_BILLING_CURRENCY?.toLowerCase() === "usd"
    ? "usd"
    : "inr";

export interface PricingPlan {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  /** Default display price (monthly equivalent for Pro) */
  monthlyAmount: PlanAmount;
  /** Shown next to the price, e.g. /month */
  pricePeriod?: string;
  ctaLabel: string;
  ctaHref: string;
  /** Used on the full pricing page when the paid plan CTA is not checkout */
  pricingPageCta?: { label: string; href: string };
  highlight?: boolean;
  badge?: string;
  note?: string;
  features: PricingFeature[];
}

export const PRO_PRICING: Record<BillingInterval, PlanAmount> = {
  monthly: { usd: 7, inr: 599 },
  quarterly: { usd: 19, inr: 1599 },
  yearly: { usd: 70, inr: 5999 },
};


export function getBillingPeriodSuffix(interval: BillingInterval): string {
  switch (interval) {
    case "monthly":
      return "/month";
    case "quarterly":
      return "/quarter";
    case "yearly":
      return "/year";
  }
}

/** Savings vs paying monthly for the same duration (USD basis). */
export function getProSavingsPercent(interval: BillingInterval): number | null {
  if (interval === "monthly") return null;
  const months = interval === "quarterly" ? 3 : 12;
  const fullPrice = PRO_PRICING.monthly.usd * months;
  const billed = PRO_PRICING[interval].usd;
  return Math.round((1 - billed / fullPrice) * 100);
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatPlanAmountDual(amount: PlanAmount): string {
  return `${formatUsd(amount.usd)} / ${formatInr(amount.inr)}`;
}

export function formatProPriceLabel(interval: BillingInterval): string {
  const amount = PRO_PRICING[interval];
  const price =
    BILLING_CURRENCY === "usd"
      ? formatUsd(amount.usd)
      : formatInr(amount.inr);
  return `${price}${getBillingPeriodSuffix(interval)}`;
}


const yearlySavings = getProSavingsPercent("yearly") ?? 0;

export const pricingPlans: PricingPlan[] = [
  {
    slug: "starter",
    name: "Starter",
    eyebrow: "Start building",
    description:
      "Try every workflow free for one month, then continue on the essentials.",
    monthlyAmount: { usd: 0, inr: 0 },
    pricePeriod: "for 1 month",
    ctaLabel: "Start free",
    ctaHref: "/sign-up",
    note: "After your free month ends, you can continue on Minimal template with core editing and publishing. Imports require Pro.",
    features: [
      { label: "Public portfolio at your Livefolio link", included: true },
      { label: "Resume and platform imports during free month", included: true },
      { label: "Editor and publish", included: true },
      { label: "Opt in so recruiters can find you. Not shown on your Livefolio", included: true },
      { label: "Ask 3 people for a named reference", included: true },
      { label: "All templates during free month", included: true },
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    eyebrow: "Stand out",
    description:
      "For active job search and a stronger public presence, with room to grow.",
    monthlyAmount: PRO_PRICING.monthly,
    pricePeriod: "/month",
    note: `Monthly, quarterly, or yearly billing at checkout. Save up to ${yearlySavings}% on yearly.`,
    ctaLabel: "See Pro benefits",
    ctaHref: "/pricing",
    pricingPageCta: { label: "Upgrade to Pro", href: "/sign-up" },
    highlight: true,
    badge: "Popular",
    features: [
      { label: "Everything in Starter", included: true },
      { label: "Premium portfolio templates", included: true },
      { label: "Portfolio visit analytics", included: true },
      { label: "Live project screenshots", included: true },
      { label: "Ask 15 people for a named reference", included: true },
      { label: "Priority email support", included: true },
      { label: "Early access to more integrations and features", included: true },
    ],
  },
];

/** Paid plan slug — drives subscribe / billing UI in PricingCards */
export const PAID_PLAN_SLUG = "pro" as const;

// Per-seat hiring plans --------------------------------------------------------

function formatAmount(amount: number, currency: BillingCurrency = BILLING_CURRENCY) {
  return currency === "usd" ? formatUsd(amount) : formatInr(amount);
}

/** e.g. "₹2,999 / seat / month", "₹8,499 / seat / quarter", "₹29,988 / seat / year". */
export function formatSeatPriceLabel(
  plan: PaidHiringPlan,
  interval: BillingInterval,
  currency: BillingCurrency = BILLING_CURRENCY,
): string {
  const unit = interval === "monthly" ? "month" : interval === "quarterly" ? "quarter" : "year";
  return `${formatAmount(HIRING_SEAT_PRICING[plan][interval][currency], currency)} / seat / ${unit}`;
}

/** Headline per-seat monthly price, e.g. yearly → "₹2,499". */
export function formatSeatMonthlyHeadline(
  plan: PaidHiringPlan,
  interval: BillingInterval,
  currency: BillingCurrency = BILLING_CURRENCY,
): string {
  return formatAmount(monthlyEquivalent(plan, interval, currency), currency);
}

/** Small print under the headline, e.g. "billed yearly at ₹29,988 per seat". */
export function formatSeatBillingNote(
  plan: PaidHiringPlan,
  interval: BillingInterval,
  currency: BillingCurrency = BILLING_CURRENCY,
): string {
  if (interval === "monthly") return "billed monthly";
  const total = formatAmount(HIRING_SEAT_PRICING[plan][interval][currency], currency);
  return `billed ${interval} at ${total} per seat`;
}
