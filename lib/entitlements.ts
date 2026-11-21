import { templateCatalog } from "@/features/templates/template-catalog";
import {
  FREE_VOUCH_REQUESTS,
  PRO_VOUCH_REQUESTS,
} from "@/features/vouches/lib/constants";
import { isAnyBillingReady } from "@/lib/billing";

const FREE_TRIAL_DAYS = 30;

const FREE_TEMPLATE_IDS = [
  "minimal",
  "modern",
  "corporate",
  "developer",
  "vibrant",
  "paper",
  "airy",
] as const;
const FREE_TEMPLATE_ID_SET = new Set<string>(FREE_TEMPLATE_IDS);

function allTemplateIds(): string[] {
  return Object.keys(templateCatalog);
}

export type AccessTier = "free" | "trial" | "pro";

export interface UserBillingProfile {
  id: string;
  email: string;
  createdAt: Date;
  /** From DB: none | pending | active — Pro is `active`. */
  subscriptionStatus?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionCurrentPeriodEnd?: Date | null;
  complimentaryProUntil?: Date | null;
}

export const FREE_PROJECT_THUMBNAILS = 3;
export const PRO_PROJECT_THUMBNAILS = 12;

export interface AccessSnapshot {
  tier: AccessTier;
  trialEndsAt: string;
  trialDaysRemaining: number;
  complimentaryProUntil: string | null;
  canUsePremiumTemplates: boolean;
  canUseImports: boolean;
  canUseAnalytics: boolean;
  /** Paid Pro or complimentary Pro (not the free trial): LinkedIn import spends scrape credits. */
  canUseLinkedInImport: boolean;
  allowedTemplateIds: string[];
  maxProjectThumbnails: number;
  maxVouchRequests: number;
}

export function isProSubscription(
  subscriptionStatus: string | null | undefined
): boolean {
  return (subscriptionStatus ?? "").toLowerCase() === "active";
}

export function isComplimentaryProActive(
  complimentaryProUntil: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!complimentaryProUntil) return false;
  const until =
    complimentaryProUntil instanceof Date
      ? complimentaryProUntil
      : new Date(complimentaryProUntil);
  return !Number.isNaN(until.getTime()) && until.getTime() > now.getTime();
}

export function hasPaidProAccess(
  user: Pick<
    UserBillingProfile,
    | "subscriptionStatus"
    | "subscriptionCancelAtPeriodEnd"
    | "subscriptionCurrentPeriodEnd"
  >,
  now: Date = new Date()
): boolean {
  const paidThroughCancellation =
    !user.subscriptionCancelAtPeriodEnd ||
    !user.subscriptionCurrentPeriodEnd ||
    now.getTime() < user.subscriptionCurrentPeriodEnd.getTime();
  return isProSubscription(user.subscriptionStatus) && paidThroughCancellation;
}

export function hasProAccess(
  user: Pick<
    UserBillingProfile,
    | "subscriptionStatus"
    | "subscriptionCancelAtPeriodEnd"
    | "subscriptionCurrentPeriodEnd"
    | "complimentaryProUntil"
  >,
  now: Date = new Date()
): boolean {
  return (
    hasPaidProAccess(user, now) ||
    isComplimentaryProActive(user.complimentaryProUntil, now)
  );
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
  const paidPro = hasPaidProAccess(user, now);
  const complimentaryPro = isComplimentaryProActive(
    user.complimentaryProUntil,
    now
  );
  const unlockedPro = paidPro || complimentaryPro;
  const allowUnconfiguredBillingAccess =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_UNCONFIGURED_BILLING_ACCESS === "true";

  const tier: AccessTier = unlockedPro ? "pro" : inTrial ? "trial" : "free";
  const trialDaysRemaining = inTrial
    ? Math.max(
        0,
        Math.ceil(
          (trialEndsAtDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        )
      )
    : 0;

  const canUsePremiumTemplates =
    unlockedPro ||
    inTrial ||
    (!billingConfigured && allowUnconfiguredBillingAccess);
  const canUseImports =
    unlockedPro ||
    inTrial ||
    (!billingConfigured && allowUnconfiguredBillingAccess);
  const canUseAnalytics =
    unlockedPro ||
    inTrial ||
    (!billingConfigured && allowUnconfiguredBillingAccess);
  const canUseLinkedInImport =
    unlockedPro || (!billingConfigured && allowUnconfiguredBillingAccess);
  const allowedTemplateIds = canUsePremiumTemplates
    ? allTemplateIds()
    : [...FREE_TEMPLATE_IDS];
  const unlocked =
    unlockedPro ||
    inTrial ||
    (!billingConfigured && allowUnconfiguredBillingAccess);
  const maxProjectThumbnails = unlocked
    ? PRO_PROJECT_THUMBNAILS
    : FREE_PROJECT_THUMBNAILS;
  const maxVouchRequests = unlocked ? PRO_VOUCH_REQUESTS : FREE_VOUCH_REQUESTS;

  return {
    tier,
    trialEndsAt: trialEndsAtDate.toISOString(),
    trialDaysRemaining,
    complimentaryProUntil:
      complimentaryPro && user.complimentaryProUntil
        ? new Date(user.complimentaryProUntil).toISOString()
        : null,
    canUsePremiumTemplates,
    canUseImports,
    canUseAnalytics,
    canUseLinkedInImport,
    allowedTemplateIds,
    maxProjectThumbnails,
    maxVouchRequests,
  };
}

export function canUseTemplate(
  snapshot: AccessSnapshot,
  templateId: string
): boolean {
  if (snapshot.canUsePremiumTemplates) {
    return templateId in templateCatalog || FREE_TEMPLATE_ID_SET.has(templateId);
  }
  return FREE_TEMPLATE_ID_SET.has(templateId);
}

export function getPlanLimitMessage(snapshot: AccessSnapshot): string {
  if (snapshot.tier === "free") {
    return "Your free month has ended. Upgrade to Pro to unlock imports and premium templates.";
  }
  return "This feature is not available on your current plan.";
}
