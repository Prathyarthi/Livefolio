import {
  BILLING_INTERVALS,
  type BillingInterval,
} from "@/lib/pricing";

export function parseBillingInterval(value: unknown): BillingInterval | null {
  if (
    typeof value === "string" &&
    BILLING_INTERVALS.includes(value as BillingInterval)
  ) {
    return value as BillingInterval;
  }
  return null;
}

export function getRazorpayPlanId(
  interval: BillingInterval
): string | undefined {
  const planIds: Record<BillingInterval, string | undefined> = {
    monthly:
      process.env.RAZORPAY_PRO_PLAN_ID_MONTHLY ??
      process.env.RAZORPAY_PRO_PLAN_ID,
    quarterly: process.env.RAZORPAY_PRO_PLAN_ID_QUARTERLY,
    yearly: process.env.RAZORPAY_PRO_PLAN_ID_YEARLY,
  };
  const id = planIds[interval]?.trim();
  return id || undefined;
}

export function getOrgRazorpayPlanId(
  interval: BillingInterval
): string | undefined {
  const planIds: Record<BillingInterval, string | undefined> = {
    monthly: process.env.RAZORPAY_ORG_PRO_PLAN_ID_MONTHLY,
    quarterly: process.env.RAZORPAY_ORG_PRO_PLAN_ID_QUARTERLY,
    yearly: process.env.RAZORPAY_ORG_PRO_PLAN_ID_YEARLY,
  };
  const id = planIds[interval]?.trim();
  return id || undefined;
}

export function isOrgIntervalCheckoutReady(interval: BillingInterval): boolean {
  return (
    areRazorpayKeysConfigured() &&
    isRazorpayWebhookConfigured() &&
    Boolean(getOrgRazorpayPlanId(interval))
  );
}

export function isAnyOrgBillingReady(): boolean {
  return BILLING_INTERVALS.some((interval) =>
    isOrgIntervalCheckoutReady(interval)
  );
}

export function getAvailableOrgBillingIntervals(): BillingInterval[] {
  return BILLING_INTERVALS.filter((interval) =>
    isOrgIntervalCheckoutReady(interval)
  );
}

export function areRazorpayKeysConfigured(): boolean {
  return Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );
}

export function isRazorpayWebhookConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_WEBHOOK_SECRET);
}

export function isIntervalCheckoutReady(interval: BillingInterval): boolean {
  return (
    areRazorpayKeysConfigured() &&
    isRazorpayWebhookConfigured() &&
    Boolean(getRazorpayPlanId(interval))
  );
}

export function isAnyBillingReady(): boolean {
  return BILLING_INTERVALS.some((interval) =>
    isIntervalCheckoutReady(interval)
  );
}

export function getAvailableBillingIntervals(): BillingInterval[] {
  return BILLING_INTERVALS.filter((interval) =>
    isIntervalCheckoutReady(interval)
  );
}

export function getCheckoutDescription(interval: BillingInterval): string {
  switch (interval) {
    case "monthly":
      return "Monthly Pro subscription";
    case "quarterly":
      return "Quarterly Pro subscription";
    case "yearly":
      return "Yearly Pro subscription";
  }
}

export function getIntervalCheckoutUnavailableMessage(
  interval: BillingInterval
): string {
  switch (interval) {
    case "monthly":
      return "Monthly checkout is not configured yet. Try again later or contact support.";
    case "quarterly":
      return "Quarterly checkout is not available yet. Choose monthly or contact support.";
    case "yearly":
      return "Yearly checkout is not available yet. Choose monthly or contact support.";
  }
}
