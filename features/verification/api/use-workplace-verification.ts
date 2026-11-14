"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function throwApiError(response: Response, fallback: string): Promise<never> {
  const body = (await response.json().catch(() => null)) as
    | { error?: unknown }
    | null;
  const message =
    typeof body?.error === "string" && body.error.trim()
      ? body.error.trim()
      : fallback;
  throw new Error(message);
}

export type CompanyVerificationStatus = {
  verified: boolean;
  status: "pending" | "verified" | null;
  emailMasked: string | null;
};

export function useCompanyVerification(orgSlug: string | undefined) {
  return useQuery({
    queryKey: ["organizations", orgSlug, "verification"],
    enabled: Boolean(orgSlug),
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgSlug}/verification`, {
        cache: "no-store",
      });
      if (!res.ok) await throwApiError(res, "Could not load verification");
      return res.json() as Promise<CompanyVerificationStatus>;
    },
  });
}

export function useRequestCompanyVerification(orgSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(`/api/organizations/${orgSlug}/verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) await throwApiError(res, "Could not send the code");
      return res.json() as Promise<{ sent: boolean; emailMasked: string }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["organizations", orgSlug, "verification"],
      });
    },
  });
}

export function useConfirmCompanyVerification(orgSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch(
        `/api/organizations/${orgSlug}/verification/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        },
      );
      if (!res.ok) await throwApiError(res, "Could not verify that code");
      return res.json() as Promise<{ verified: boolean }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations", orgSlug] });
      qc.invalidateQueries({
        queryKey: ["organizations", orgSlug, "verification"],
      });
    },
  });
}

export function useRemoveCompanyVerification(orgSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/organizations/${orgSlug}/verification`, {
        method: "DELETE",
      });
      if (!res.ok) await throwApiError(res, "Could not remove verification");
      return res.json() as Promise<{ verified: boolean }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["organizations"] });
      qc.invalidateQueries({ queryKey: ["organizations", orgSlug] });
      qc.invalidateQueries({
        queryKey: ["organizations", orgSlug, "verification"],
      });
    },
  });
}
