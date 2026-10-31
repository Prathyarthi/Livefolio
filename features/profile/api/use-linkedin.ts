"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  LinkedInSyncQuota,
  LinkedInPost,
  LinkedInProfileData,
  LinkedInSelection,
} from "@/lib/linkedin";

export interface LinkedInImportState {
  profileUrl: string;
  profile: LinkedInProfileData | null;
  posts: LinkedInPost[];
  selection: LinkedInSelection;
  showOnPortfolio: boolean;
  lastSyncedAt: string | null;
}

export class LinkedInApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public quota?: LinkedInSyncQuota,
  ) {
    super(message);
  }
}

async function readError(res: Response, fallback: string) {
  const json = await res.json().catch(() => ({}));
  return new LinkedInApiError(
    typeof json.error === "string" && json.error ? json.error : fallback,
    res.status,
    typeof json.code === "string" ? json.code : undefined,
    json.quota && typeof json.quota === "object" ? (json.quota as LinkedInSyncQuota) : undefined,
  );
}

const KEY = ["linkedin-import"] as const;

export interface LinkedInImportResponse {
  configured: boolean;
  data: LinkedInImportState | null;
  quota?: LinkedInSyncQuota;
}

export function useLinkedInImport(enabled = true) {
  return useQuery({
    queryKey: KEY,
    enabled,
    // Status only changes via our own mutations (which update the cache), so
    // don't refetch on focus; retry transient failures once, never 4xx.
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) =>
      failureCount < 1 &&
      !(error instanceof LinkedInApiError && error.status >= 400 && error.status < 500),
    queryFn: async (): Promise<LinkedInImportResponse> => {
      const res = await fetch("/api/profile/linkedin", { credentials: "include" });
      if (!res.ok) throw await readError(res, "Failed to load LinkedIn import");
      return res.json();
    },
  });
}

function useLinkedInMutation<T>(
  request: (input: T) => Promise<Response>,
  fallback: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: T,
    ): Promise<{ data: LinkedInImportState | null; quota?: LinkedInSyncQuota }> => {
      const res = await request(input);
      if (!res.ok) throw await readError(res, fallback);
      const json = await res.json();
      return { data: json.data ?? null, quota: json.quota };
    },
    onSuccess: ({ data, quota }) => {
      qc.setQueryData(KEY, (prev: LinkedInImportResponse | undefined) => ({
        configured: prev?.configured ?? true,
        quota: quota ?? prev?.quota,
        data,
      }));
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (error) => {
      if (!(error instanceof LinkedInApiError) || !error.quota) return;
      const quota = error.quota;
      qc.setQueryData(KEY, (prev: LinkedInImportResponse | undefined) =>
        prev ? { ...prev, quota } : prev,
      );
    },
  });
}

export function useSyncLinkedIn() {
  return useLinkedInMutation(
    (url: string) =>
      fetch("/api/profile/linkedin/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        credentials: "include",
      }),
    "Failed to sync LinkedIn profile",
  );
}

export function useSaveLinkedInSelection() {
  return useLinkedInMutation(
    (input: { selection: LinkedInSelection; showOnPortfolio?: boolean }) =>
      fetch("/api/profile/linkedin/selection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        credentials: "include",
      }),
    "Failed to save LinkedIn selection",
  );
}

export function useRemoveLinkedIn() {
  return useLinkedInMutation(
    () =>
      fetch("/api/profile/linkedin", { method: "DELETE", credentials: "include" }),
    "Failed to remove LinkedIn import",
  );
}
