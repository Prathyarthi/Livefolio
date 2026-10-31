"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BadgeCategory, BadgeIcon } from "@/lib/badges-catalog";

export interface ShelfBadge {
  key: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  category: BadgeCategory;
  publicEligible: boolean;
  unlockHint: string;
  earned: boolean;
  awardedAt: string | null;
  showOnPortfolio: boolean;
}

export interface BadgeShelfResponse {
  badges: ShelfBadge[];
  nextBadgeKey: string | null;
  newlyAwarded: string[];
}

export class BadgesApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function readError(res: Response, fallback: string) {
  const json = await res.json().catch(() => ({}));
  return new BadgesApiError(typeof json.error === "string" && json.error ? json.error : fallback, res.status);
}

const KEY = ["badges"] as const;

export function useBadges() {
  const qc = useQueryClient();
  return useQuery({
    queryKey: KEY,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) =>
      failureCount < 1 && !(error instanceof BadgesApiError && error.status >= 400 && error.status < 500),
    queryFn: async (): Promise<BadgeShelfResponse> => {
      const res = await fetch("/api/badges", { credentials: "include" });
      if (!res.ok) throw await readError(res, "Failed to load badges");
      const json = (await res.json()) as BadgeShelfResponse;
      // A first visit can award Welcome (with a notification); refresh the bell.
      if (json.newlyAwarded?.length) void qc.invalidateQueries({ queryKey: ["notifications"] });
      return json;
    },
  });
}

/** Optimistic show-on-portfolio toggle; rolls back on error. */
export function useToggleBadgeVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, showOnPortfolio }: { key: string; showOnPortfolio: boolean }) => {
      const res = await fetch(`/api/badges/${encodeURIComponent(key)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showOnPortfolio }),
        credentials: "include",
      });
      if (!res.ok) throw await readError(res, "Failed to update badge");
      return res.json();
    },
    onMutate: async ({ key, showOnPortfolio }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<BadgeShelfResponse>(KEY);
      if (previous) {
        qc.setQueryData<BadgeShelfResponse>(KEY, {
          ...previous,
          badges: previous.badges.map((b) => (b.key === key ? { ...b, showOnPortfolio } : b)),
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) qc.setQueryData(KEY, context.previous);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}
