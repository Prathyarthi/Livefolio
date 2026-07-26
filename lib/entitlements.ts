import { templateRegistry } from "@/features/templates/registry";
import { isAnyBillingReady } from "@/lib/billing";

const FREE_TRIAL_DAYS = 30;

const FREE_TEMPLATE_IDS = ["minimal"] as const;
const PREMIUM_TEMPLATE_IDS = Object.keys(templateRegistry).filter(
  (id) => id !== "minimal"
);

export type AccessTier = "free" | "trial" | "pro";

export interface UserBillingProfile {
  id: string;
  email: string;
  createdAt: Date;
  /** From DB: none | pending | active — Pro is `active`. */
  subscriptionStatus?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionCurrentPeriodEnd?: Date | null;
}

export interface AccessSnapshot {
  tier: AccessTier;
  trialEndsAt: string;
  trialDaysRemaining: number;
  canUsePremiumTemplates: boolean;
  canUseImports: boolean;
  canUseAnalytics: boolean;
  allowedTemplateIds: string[];
}

export function isProSubscription(
  subscriptionStatus: string | null | undefined
): boolean {
  return (subscriptionStatus ?? "").toLowerCase() === "active";
}

export function resolveAccessForUser(
  user: UserBillingProfile,
  now: Date = new Date()
): AccessSnapshot {
  const billingConfigured = isAnyBillingReady();
  const trialEndsAtDate = new Date(
    user.createdAt.getTime() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000
  );
  const inTrial = now.getTime() < trialEndsAtDate.getTime();
  const paidThroughCancellation =
    !user.subscriptionCancelAtPeriodEnd ||
    !user.subscriptionCurrentPeriodEnd ||
    now.getTime() < user.subscriptionCurrentPeriodEnd.getTime();
  const paidPro =
    isProSubscription(user.subscriptionStatus) && paidThroughCancellation;
  const allowUnconfiguredBillingAccess =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_UNCONFIGURED_BILLING_ACCESS === "true";

  const tier: AccessTier = paidPro ? "pro" : inTrial ? "trial" : "free";
  const trialDaysRemaining = inTrial
    ? Math.max(
        0,
        Math.ceil(
          (trialEndsAtDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        )
      )
    : 0;

  const canUsePremiumTemplates =
    paidPro || inTrial || (!billingConfigured && allowUnconfiguredBillingAccess);
  const canUseImports =
    paidPro || inTrial || (!billingConfigured && allowUnconfiguredBillingAccess);
  const canUseAnalytics =
    paidPro || inTrial || (!billingConfigured && allowUnconfiguredBillingAccess);
  const allowedTemplateIds = canUsePremiumTemplates
    ? [...FREE_TEMPLATE_IDS, ...PREMIUM_TEMPLATE_IDS]
    : [...FREE_TEMPLATE_IDS];

  return {
    tier,
    trialEndsAt: trialEndsAtDate.toISOString(),
    trialDaysRemaining,
    canUsePremiumTemplates,
    canUseImports,
    canUseAnalytics,
    allowedTemplateIds,
  };
}

export function canUseTemplate(
  snapshot: AccessSnapshot,
  templateId: string
): boolean {
  return snapshot.allowedTemplateIds.includes(templateId);
}

export function getPlanLimitMessage(snapshot: AccessSnapshot): string {
  if (snapshot.tier === "free") {
    return "Your free month has ended. Upgrade to Pro to unlock imports and premium templates.";
  }
  return "This feature is not available on your current plan.";
}
