"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { BadgeCategory, BadgeIcon } from "@/lib/badges-catalog";

export interface ShelfBadge {
  key: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  category: BadgeCategory;
  awardedAt: string;
}

export interface BadgeShelfResponse {
  badges: ShelfBadge[];
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
