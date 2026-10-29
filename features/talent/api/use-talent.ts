"use client";

import { useQuery } from "@tanstack/react-query";
import type { SearchFacets } from "@/features/search/lib/facets";
import type { ProofKind } from "@/features/search/lib/proof";
import type { InterpretedSearchQuery, SearchSort } from "@/features/search/lib/query";

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
  yearsExperience: number | null;
  proof: ProofKind[];
  score: number;
  reasons: string[];
  livefolioUrl: string;
};

export type TalentSearchResult = {
  total: number;
  truncated: boolean;
  page: number;
  pageSize: number;
  pageCount: number;
  sort: SearchSort;
  job: { id: string; title: string } | null;
  interpreted: InterpretedSearchQuery;
  facets: SearchFacets;
  people: TalentPerson[];
};

export type TalentSearchOptions = {
  q?: string;
  location?: string;
  skill?: string;
  proof?: ProofKind;
  minExperience?: number;
  maxExperience?: number;
  jobId?: string;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
};

export function useTalentSearch(
  orgSlug: string | undefined,
  workspaceSlug: string | undefined,
  options?: TalentSearchOptions,
) {
  const {
    q,
    location,
    skill,
    proof,
    minExperience,
    maxExperience,
    jobId,
    sort = "relevance",
    page = 1,
    pageSize = 20,
  } = options ?? {};

  return useQuery({
    queryKey: [
      "talent",
      orgSlug,
      workspaceSlug,
      q ?? "",
      location ?? "",
      skill ?? "",
      proof ?? "",
      minExperience ?? "",
      maxExperience ?? "",
      jobId ?? "",
      sort,
      page,
      pageSize,
    ],
    enabled: Boolean(orgSlug && workspaceSlug),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (location) params.set("location", location);
      if (skill) params.set("skill", skill);
      if (proof) params.set("proof", proof);
      if (minExperience != null) params.set("minExperience", String(minExperience));
      if (maxExperience != null) params.set("maxExperience", String(maxExperience));
      if (jobId) params.set("jobId", jobId);
      params.set("sort", sort);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const qs = params.toString();
      const res = await fetch(
        `/api/talent/org/${orgSlug}/workspace/${workspaceSlug}${qs ? `?${qs}` : ""}`,
        { cache: "no-store" },
      );
      if (!res.ok) await throwApiError(res, "Failed to load talent");
      return res.json() as Promise<TalentSearchResult>;
    },
  });
}
