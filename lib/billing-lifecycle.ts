import {
  BILLING_CURRENCY,
  BILLING_INTERVALS,
  ORG_PRO_PRICING,
  PRO_PRICING,
  type BillingInterval,
} from "@/lib/pricing";
import { getOrgRazorpayPlanId, getRazorpayPlanId } from "@/lib/billing";

export type ProviderSubscriptionStatus =
  | "created"
  | "authenticated"
  | "active"
  | "pending"
  | "halted"
  | "paused"
  | "cancelled"
  | "completed"
  | "expired";

const KNOWN_STATUSES = new Set<ProviderSubscriptionStatus>([
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
  "paused",
  "cancelled",
  "completed",
  "expired",
]);

const ALLOWED_TRANSITIONS: Record<
  ProviderSubscriptionStatus,
  ReadonlySet<ProviderSubscriptionStatus>
> = {
  created: new Set(["created", "authenticated", "active", "cancelled", "expired"]),
  authenticated: new Set([
    "authenticated",
    "active",
    "cancelled",
    "expired",
  ]),
  active: new Set([
    "active",
    "pending",
    "halted",
    "paused",
    "cancelled",
    "completed",
  ]),
  pending: new Set(["pending", "active", "halted", "cancelled"]),
  halted: new Set(["halted", "active", "cancelled"]),
  paused: new Set(["paused", "active", "cancelled"]),
  cancelled: new Set(["cancelled"]),
  completed: new Set(["completed"]),
  expired: new Set(["expired"]),
};

export function parseProviderSubscriptionStatus(
  value: unknown
): ProviderSubscriptionStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.toLowerCase() as ProviderSubscriptionStatus;
  return KNOWN_STATUSES.has(normalized) ? normalized : null;
}

export function canApplySubscriptionTransition(
  current: string,
  next: ProviderSubscriptionStatus
) {
  const currentStatus = parseProviderSubscriptionStatus(current);
  if (!currentStatus) return true;
  return ALLOWED_TRANSITIONS[currentStatus].has(next);
}

export function legacyStatusForProvider(
  status: ProviderSubscriptionStatus
): "none" | "pending" | "active" {
  if (status === "active") return "active";
  if (status === "authenticated" || status === "pending") return "pending";
  return "none";
}

export function isTerminalProviderStatus(status: ProviderSubscriptionStatus) {
  return (
    status === "cancelled" ||
    status === "completed" ||
    status === "expired"
  );
}

export function getIntervalForPlanId(planId: string): BillingInterval | null {
  return (
    BILLING_INTERVALS.find(
      (interval) =>
        getRazorpayPlanId(interval) === planId ||
        getOrgRazorpayPlanId(interval) === planId
    ) ?? null
  );
}

/** Ten years of cycles for every billing interval. */
export function getSubscriptionTotalCount(interval: BillingInterval) {
  switch (interval) {
    case "monthly":
      return 120;
    case "quarterly":
      return 40;
    case "yearly":
      return 10;
  }
}

export function getExpectedPlanDefinition(interval: BillingInterval) {
  const amount = PRO_PRICING[interval][BILLING_CURRENCY];
  return {
    amount: Math.round(amount * 100),
    currency: BILLING_CURRENCY.toUpperCase(),
    period: interval === "yearly" ? "yearly" : "monthly",
    interval: interval === "quarterly" ? 3 : 1,
  };
}

export function getExpectedOrgPlanDefinition(interval: BillingInterval) {
  const amount = ORG_PRO_PRICING[interval][BILLING_CURRENCY];
  return {
    amount: Math.round(amount * 100),
    currency: BILLING_CURRENCY.toUpperCase(),
    period: interval === "yearly" ? "yearly" : "monthly",
    interval: interval === "quarterly" ? 3 : 1,
  };
}
