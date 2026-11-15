import type { AccessSnapshot } from "@/lib/entitlements";
import { FREE_VOUCH_REQUESTS, PRO_VOUCH_REQUESTS } from "./constants";
import { countsTowardVouchLimit } from "./validation";

export function remainingVouchRequests(used: number, max: number): number {
  return Math.max(0, max - used);
}

export function isAtVouchLimit(used: number, max: number): boolean {
  return used >= max;
}

export function usedFromStatuses(statuses: string[]): number {
  return statuses.filter(countsTowardVouchLimit).length;
}

export function vouchLimitUpgradeMessage(access: AccessSnapshot): string {
  if (access.tier === "free") {
    return `Free accounts can ask ${FREE_VOUCH_REQUESTS} people. Upgrade to Pro to ask ${PRO_VOUCH_REQUESTS}.`;
  }
  return `You've reached the ${access.maxVouchRequests} reference limit on your plan.`;
}

export { FREE_VOUCH_REQUESTS, PRO_VOUCH_REQUESTS };