"use client";

import { useQuery } from "@tanstack/react-query";
import type { BillingInterval } from "@/lib/pricing";

export interface BillingResponse {
  razorpayReady: boolean;
  availableIntervals?: BillingInterval[];
  subscription: {
    status: "ACTIVE" | "PENDING";
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
  } | null;
  access: {
    tier: "free" | "trial" | "pro";
    trialDaysRemaining: number;
    canUsePremiumTemplates: boolean;
    canUseImports: boolean;
    canUseAnalytics: boolean;
    allowedTemplateIds: string[];
  } | null;
}

export function useBilling() {
  return useQuery<BillingResponse>({
    queryKey: ["billing", "me"],
    queryFn: () => fetch("/api/billing/me").then((r) => r.json()),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
