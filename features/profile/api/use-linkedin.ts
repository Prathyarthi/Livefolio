"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
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
  nextSyncAt: string | null;
}

export class LinkedInApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

async function readError(res: Response, fallback: string) {
  const json = await res.json().catch(() => ({}));
  return new LinkedInApiError(
    typeof json.error === "string" && json.error ? json.error : fallback,
    res.status,
    typeof json.code === "string" ? json.code : undefined,
  );
}

const KEY = ["linkedin-import"] as const;

export function useLinkedInImport(enabled = true) {
  return useQuery({
    queryKey: KEY,
    enabled,
    retry: false,
    queryFn: async (): Promise<{ configured: boolean; data: LinkedInImportState | null }> => {
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
    mutationFn: async (input: T): Promise<LinkedInImportState | null> => {
      const res = await request(input);
      if (!res.ok) throw await readError(res, fallback);
      const json = await res.json();
      return json.data ?? null;
    },
    onSuccess: (data) => {
      qc.setQueryData(KEY, (prev: { configured: boolean } | undefined) => ({
        configured: prev?.configured ?? true,
        data,
      }));
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
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
