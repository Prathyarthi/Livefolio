"use client";

import { useQuery } from "@tanstack/react-query";

async function throwApiError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  const body = (await response
    .clone()
    .json()
    .catch(() => null)) as { error?: unknown; message?: unknown } | null;
  const text = body ? "" : await response.text().catch(() => "");
  const message = [body?.error, body?.message].find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  throw new Error(message?.trim() || text.trim() || fallbackMessage);
}

export type TalentPerson = {
  slug: string;
  title: string;
  headline: string;
  location: string | null;
  avatarUrl: string | null;
  skills: string[];
  recentRole: { role: string; company: string } | null;
  livefolioUrl: string;
};

export type TalentSearchResult = {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  people: TalentPerson[];
};

export function useTalentSearch(
  orgSlug: string | undefined,
  options?: {
    q?: string;
    location?: string;
    skill?: string;
    page?: number;
    pageSize?: number;
  },
) {
  const q = options?.q;
  const location = options?.location;
  const skill = options?.skill;
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;

  return useQuery({
    queryKey: [
      "talent",
      orgSlug,
      q ?? "",
      location ?? "",
      skill ?? "",
      page,
      pageSize,
    ],
    enabled: Boolean(orgSlug),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (location) params.set("location", location);
      if (skill) params.set("skill", skill);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const qs = params.toString();
      const res = await fetch(
        `/api/talent/org/${orgSlug}${qs ? `?${qs}` : ""}`,
        { cache: "no-store" },
      );
      if (!res.ok) await throwApiError(res, "Failed to load talent");
      return res.json() as Promise<TalentSearchResult>;
    },
  });
}
