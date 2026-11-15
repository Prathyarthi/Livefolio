"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { DraftJob } from "@/features/agent-hiring/lib/brief";
import type { ShortlistCandidate } from "@/features/agent-hiring/lib/shortlist";

type ApiError = Error & { upgradeRequired?: boolean; notConfigured?: boolean };

async function throwApiError(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => null)) as {
    error?: unknown;
    upgradeRequired?: unknown;
    notConfigured?: unknown;
  } | null;
  const message = typeof body?.error === "string" && body.error.trim() ? body.error : fallback;
  throw Object.assign(new Error(message), {
    upgradeRequired: body?.upgradeRequired === true,
    notConfigured: body?.notConfigured === true,
  }) as ApiError;
}

export function useAgentConfig() {
  return useQuery({
    queryKey: ["agent-hiring", "config"],
    queryFn: async () => {
      const res = await fetch("/api/agent-hiring/config", { cache: "no-store" });
      if (!res.ok) await throwApiError(res, "Failed to load agent status");
      return res.json() as Promise<{ llmConfigured: boolean }>;
    },
  });
}

function base(orgSlug: string, workspaceSlug: string) {
  return `/api/agent-hiring/org/${orgSlug}/workspace/${workspaceSlug}`;
}

async function post<T>(url: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwApiError(res, fallback);
  return res.json() as Promise<T>;
}

export function useDraftJob(orgSlug: string, workspaceSlug: string) {
  return useMutation({
    mutationFn: (brief: string) =>
      post<{ draft: DraftJob }>(
        `${base(orgSlug, workspaceSlug)}/draft`,
        { brief },
        "Failed to draft the job",
      ),
  });
}

export type ShortlistResponse = {
  job: { id: string; title: string };
  rankingVersion: string;
  talentSearch: boolean;
  pools: { applicants: number; sourced: number };
  candidates: ShortlistCandidate[];
};

export function useShortlist(orgSlug: string, workspaceSlug: string) {
  return useMutation({
    mutationFn: (jobId: string) =>
      post<ShortlistResponse>(
        `${base(orgSlug, workspaceSlug)}/shortlist`,
        { jobId },
        "Failed to find candidates",
      ),
  });
}

export function useSendInvite(orgSlug: string, workspaceSlug: string) {
  return useMutation({
    mutationFn: (input: {
      jobId: string;
      source: "applicant" | "sourced";
      ref: string;
      subject: string;
      body: string;
    }) => post<{ ok: true }>(`${base(orgSlug, workspaceSlug)}/send`, input, "Failed to send"),
  });
}
