/**
 * Per-seat hiring plans (Free / Pro / Business) and pure seat + limit math.
 * Candidate Pro lives in lib/pricing.ts and is unchanged.
 */
import type { BillingInterval, PlanAmount } from "@/lib/pricing";

export type HiringPlanSlug = "free" | "pro" | "business";
/** `legacy_pro` = Org Pro subscribers from before per-seat pricing; keeps their terms. */
export type OrgPlanTier = HiringPlanSlug | "legacy_pro";
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
  // Legacy Org Pro: unlimited jobs and workspaces, no seat cap (their original terms).
  legacy_pro: { maxOpenJobs: null, maxWorkspaces: null, includedSeats: null },
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

/** Tier for an org given its subscription fields. Active org without a stored plan = legacy Org Pro. */
export function resolvePlanTier(input: {
  paid: boolean;
  subscriptionPlan?: string | null;
}): OrgPlanTier {
  if (!input.paid) return "free";
  const plan = parsePaidHiringPlan(input.subscriptionPlan);
  return plan ?? "legacy_pro";
}

/** Seat cap for a tier: null = unlimited. */
export function seatCap(tier: OrgPlanTier, paidSeats?: number | null): number | null {
  if (tier === "free") return PLAN_LIMITS.free.includedSeats;
  if (tier === "legacy_pro") return null;
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
  legacy_pro: "Org Pro (legacy)",
};

export type HiringPlanFeature = { label: string; note?: string };

export const HIRING_PLAN_FEATURES: Record<HiringPlanSlug, HiringPlanFeature[]> = {
  free: [
    { label: "1 seat, 1 open job, unlimited drafts" },
    { label: "Proof-based ranking with “why this rank” reasons" },
    { label: "References you can switch on in ranking" },
    { label: "Compare candidates side by side" },
    { label: "Pool gap report" },
    { label: "Pipeline stages and shortlist" },
    { label: "Talent search (candidates who opted in)" },
  ],
  pro: [
    { label: "Everything in Free" },
    { label: "Priced per seat — add teammates as you grow" },
    { label: "Unlimited open jobs" },
    { label: "Team notes and invites" },
    { label: "Priority support" },
  ],
  business: [
    { label: `Everything in Pro, minimum ${BUSINESS_MIN_SEATS} seats` },
    { label: "Multiple workspaces for teams or brands" },
    { label: "Priority verified-company review" },
    { label: "Onboarding help" },
    { label: "Invoice billing on request" },
  ],
};
