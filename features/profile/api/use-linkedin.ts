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
const SYNC_CLIENT_TIMEOUT_MS = 4 * 60 * 1000;

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
    ): Promise<{
      data: LinkedInImportState | null;
      quota?: LinkedInSyncQuota;
      warning?: string | null;
    }> => {
      let res: Response;
      try {
        res = await request(input);
      } catch (error) {
        if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
          throw new LinkedInApiError("This is taking too long. Check back in a few minutes; your sync may still finish.", 408);
        }
        throw new LinkedInApiError("Network error. Check your connection and try again.", 0);
      }
      if (!res.ok) throw await readError(res, fallback);
      const json = await res.json();
      return { data: json.data ?? null, quota: json.quota, warning: json.warning ?? null };
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
        // Scrapes can take ~1–3 min server-side; give up client-side after 4 min.
        signal: AbortSignal.timeout(SYNC_CLIENT_TIMEOUT_MS),
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

/** Optimistic "Show on portfolio" toggle: flips the cached flag immediately, rolls back on error. */
export function useToggleLinkedInVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { selection: LinkedInSelection; showOnPortfolio: boolean }) => {
      const res = await fetch("/api/profile/linkedin/selection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        credentials: "include",
      });
      if (!res.ok) throw await readError(res, "Failed to update visibility");
      const json = await res.json();
      return { data: (json.data ?? null) as LinkedInImportState | null, warning: (json.warning ?? null) as string | null };
    },
    onMutate: async ({ showOnPortfolio }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const previous = qc.getQueryData<LinkedInImportResponse>(KEY);
      if (previous?.data) {
        qc.setQueryData<LinkedInImportResponse>(KEY, {
          ...previous,
          data: { ...previous.data, showOnPortfolio },
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) qc.setQueryData(KEY, context.previous);
    },
    onSuccess: ({ data }) => {
      // Only sync the flag; keep any unsaved local selection edits intact.
      qc.setQueryData<LinkedInImportResponse>(KEY, (prev) =>
        prev?.data && data ? { ...prev, data: { ...prev.data, showOnPortfolio: data.showOnPortfolio } } : prev,
      );
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useRemoveLinkedIn() {
  return useLinkedInMutation(
    () =>
      fetch("/api/profile/linkedin", { method: "DELETE", credentials: "include" }),
    "Failed to remove LinkedIn import",
  );
}
