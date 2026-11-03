/**
 * Per-seat hiring plans (Free / Pro / Business) and pure seat + limit math.
 * Candidate Pro lives in lib/pricing.ts and is unchanged.
 */
import type { BillingInterval, PlanAmount } from "@/lib/pricing";

export type HiringPlanSlug = "free" | "pro" | "business";
export type OrgPlanTier = HiringPlanSlug;
export type PaidHiringPlan = Exclude<HiringPlanSlug, "free">;

/** Per-seat prices. Yearly is charged once per year per seat. */
export const HIRING_SEAT_PRICING: Record<PaidHiringPlan, Record<BillingInterval, PlanAmount>> = {
  pro: {
    monthly: { inr: 2999, usd: 39 },
    quarterly: { inr: 8499, usd: 109 },
    yearly: { inr: 29988, usd: 420 },
  },
  business: {
    monthly: { inr: 4999, usd: 59 },
    quarterly: { inr: 14199, usd: 165 },
    yearly: { inr: 50388, usd: 600 },
  },
};

export const BUSINESS_MIN_SEATS = 3;
export const MAX_SEATS = 200;

export type PlanLimits = {
  /** null = unlimited */
  maxOpenJobs: number | null;
  maxWorkspaces: number | null;
  /** Fixed seat cap for free; paid plans use the purchased seat count. */
  includedSeats: number | null;
};

export const PLAN_LIMITS: Record<OrgPlanTier, PlanLimits> = {
  free: { maxOpenJobs: 1, maxWorkspaces: 1, includedSeats: 1 },
  pro: { maxOpenJobs: null, maxWorkspaces: 1, includedSeats: null },
  business: { maxOpenJobs: null, maxWorkspaces: null, includedSeats: null },
};

export function minSeatsFor(plan: PaidHiringPlan): number {
  return plan === "business" ? BUSINESS_MIN_SEATS : 1;
}

export function parsePaidHiringPlan(value: unknown): PaidHiringPlan | null {
  return value === "pro" || value === "business" ? value : null;
}

/** Clamp a requested seat count to the plan minimum and a sane maximum. */
export function normalizeSeats(plan: PaidHiringPlan, requested: unknown): number {
  const n = typeof requested === "number" ? requested : Number(requested);
  const whole = Number.isFinite(n) ? Math.floor(n) : minSeatsFor(plan);
  return Math.min(MAX_SEATS, Math.max(minSeatsFor(plan), whole));
}

/** Tier for an org given its subscription fields. A paid org without a stored plan falls back to Pro. */
export function resolvePlanTier(input: {
  paid: boolean;
  subscriptionPlan?: string | null;
}): OrgPlanTier {
  if (!input.paid) return "free";
  const plan = parsePaidHiringPlan(input.subscriptionPlan);
  return plan ?? "pro";
}

/** Seat cap for a tier: null = unlimited. */
export function seatCap(tier: OrgPlanTier, paidSeats?: number | null): number | null {
  if (tier === "free") return PLAN_LIMITS.free.includedSeats;
  const min = minSeatsFor(tier);
  return Math.max(min, paidSeats ?? min);
}

/** Seats used = active members + pending, unexpired invites. */
export function seatsUsed(activeMembers: number, pendingInvites: number): number {
  return Math.max(0, activeMembers) + Math.max(0, pendingInvites);
}

export function canAddSeatHolder(used: number, cap: number | null, adding = 1): boolean {
  return cap === null || used + adding <= cap;
}

/** Total charged per billing period for `seats`. */
export function periodTotal(plan: PaidHiringPlan, interval: BillingInterval, seats: number, currency: "inr" | "usd"): number {
  return HIRING_SEAT_PRICING[plan][interval][currency] * seats;
}

/** Monthly-equivalent per-seat price, e.g. yearly ₹29,988 → ₹2,499. */
export function monthlyEquivalent(plan: PaidHiringPlan, interval: BillingInterval, currency: "inr" | "usd"): number {
  const months = interval === "monthly" ? 1 : interval === "quarterly" ? 3 : 12;
  return Math.round(HIRING_SEAT_PRICING[plan][interval][currency] / months);
}

/** Savings vs paying monthly for the same period, in percent. */
export function savingsPercent(plan: PaidHiringPlan, interval: BillingInterval, currency: "inr" | "usd"): number | null {
  if (interval === "monthly") return null;
  const months = interval === "quarterly" ? 3 : 12;
  const full = HIRING_SEAT_PRICING[plan].monthly[currency] * months;
  return Math.round((1 - HIRING_SEAT_PRICING[plan][interval][currency] / full) * 100);
}

export const HIRING_PLAN_NAMES: Record<OrgPlanTier, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

export type HiringPlanFeature = { label: string; note?: string };

/** Core hiring workflow, included on every plan (Free through Enterprise). */
export const HIRING_CORE_FEATURES: HiringPlanFeature[] = [
  { label: "Ranking on proof, with plain “why this rank” reasons" },
  { label: "References you can switch on in ranking" },
  { label: "Compare candidates side by side" },
  { label: "Pool gap report" },
  { label: "Pipeline stages and shortlist" },
  { label: "Talent search (candidates who opted in), free" },
];

export type HiringDisplayPlan = HiringPlanSlug | "enterprise";

export const HIRING_DISPLAY_PLANS: HiringDisplayPlan[] = ["free", "pro", "business", "enterprise"];

function limitCount(n: number | null, one: string, many: string): string {
  if (n === null) return `Unlimited ${many}`;
  return `${n} ${n === 1 ? one : many}`;
}

/** Limit lines, derived from PLAN_LIMITS so the copy matches what is enforced. */
export function planLimitLines(plan: HiringDisplayPlan): string[] {
  if (plan === "enterprise") {
    return ["Custom seat volume", "Unlimited open jobs", "Unlimited workspaces"];
  }
  const limits = PLAN_LIMITS[plan];
  const seats =
    plan === "free"
      ? limitCount(limits.includedSeats, "seat", "seats")
      : plan === "business"
        ? `Per seat, from ${BUSINESS_MIN_SEATS} seats`
        : "Per seat, from 1 seat";
  const jobs =
    limits.maxOpenJobs === null
      ? "Unlimited open jobs"
      : `${limitCount(limits.maxOpenJobs, "open job", "open jobs")} (unlimited drafts)`;
  return [seats, jobs, limitCount(limits.maxWorkspaces, "workspace", "workspaces")];
}

export type HiringPlanDisplay = {
  name: string;
  note: string;
  cta: string;
  /** Heading above `features`, e.g. "Everything in Free, plus". */
  featuresHeading: string;
  features: HiringPlanFeature[];
};

/**
 * Single source of truth for plan cards on /recruiters, the billing page and the FAQ.
 * Each paid tier lists only what it adds on top of the previous one.
 */
export const HIRING_PLAN_DISPLAY: Record<HiringDisplayPlan, HiringPlanDisplay> = {
  free: {
    name: "Free",
    note: "One recruiter, one open role",
    cta: "Start free",
    featuresHeading: "Included on every plan",
    features: HIRING_CORE_FEATURES,
  },
  pro: {
    name: "Pro",
    note: "For founders and small hiring teams",
    cta: "Start hiring",
    featuresHeading: "Everything in Free, plus",
    features: [
      { label: "Invite teammates to share the pipeline" },
      { label: "Priority support" },
    ],
  },
  business: {
    name: "Business",
    note: "For teams hiring across brands or regions",
    cta: "Start hiring",
    featuresHeading: "Everything in Pro, plus",
    features: [
      { label: "Priority verified-company review" },
      { label: "Onboarding help" },
      { label: "Invoice billing on request" },
    ],
  },
  enterprise: {
    name: "Enterprise",
    note: "For larger hiring teams with procurement needs",
    cta: "Contact sales",
    featuresHeading: "Everything in Business, plus",
    features: [
      { label: "Custom contract and invoicing" },
      { label: "Dedicated support contact" },
      { label: "Guided onboarding for your team" },
      { label: "SSO and security review on request" },
    ],
  },
};

/**
 * Enterprise is display-only: no Razorpay plan, no checkout, no entitlement tier.
 * Everything here is a service promise handled by the team, phrased "on request".
 */
export const ENTERPRISE_PLAN = {
  name: HIRING_PLAN_DISPLAY.enterprise.name,
  priceLabel: "Custom",
  priceNote: "Annual contract · volume pricing",
  cta: HIRING_PLAN_DISPLAY.enterprise.cta,
  note: HIRING_PLAN_DISPLAY.enterprise.note,
  features: HIRING_PLAN_DISPLAY.enterprise.features,
} as const;

/** mailto link for Enterprise enquiries. */
export function enterpriseContactHref(email: string): string {
  const subject = encodeURIComponent("Livefolio Hiring — Enterprise enquiry");
  const body = encodeURIComponent(
    "Company:\nApprox. number of recruiters / hiring managers:\nWhat you need (seats, SSO, invoicing, onboarding):\n",
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
