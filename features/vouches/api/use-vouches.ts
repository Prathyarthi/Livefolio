"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AccessTier } from "@/lib/entitlements";
import type { VouchStatus } from "@/features/vouches/lib/constants";

async function throwApiError(
  response: Response,
  fallback: string,
): Promise<never> {
  const body = (await response
    .clone()
    .json()
    .catch(() => null)) as { error?: unknown } | null;
  const text = body ? "" : await response.text().catch(() => "");
  const message =
    typeof body?.error === "string" && body.error.trim()
      ? body.error
      : text.trim() || fallback;
  throw new Error(message);
}

export type AskedVouch = {
  id: string;
  status: VouchStatus;
  inviteEmail: string;
  inviteName: string | null;
  personalNote: string | null;
  sharePath: string;
  emailCount: number;
  canResend: boolean;
  lastEmailedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  relationship: string | null;
  relationshipLabel: string | null;
  story: string | null;
  referee: {
    name: string;
    avatarUrl: string | null;
    portfolioUrl: string | null;
  } | null;
};

export type IncomingVouch = {
  id: string;
  status: VouchStatus;
  personalNote: string | null;
  sharePath: string;
  createdAt: string;
  requester: {
    name: string;
    headline: string | null;
    title: string | null;
    avatarUrl: string | null;
    portfolioUrl: string | null;
  };
};

export type VouchLimits = {
  used: number;
  max: number;
  remaining: number;
  tier: AccessTier;
};

export type VouchesPayload = {
  asked: AskedVouch[];
  incoming: IncomingVouch[];
  given: IncomingVouch[];
  limits: VouchLimits;
};

export type TokenVouch = {
  token: string;
  status: VouchStatus;
  inviteEmail: string;
  personalNote: string | null;
  isRequester: boolean;
  isInvitee: boolean;
  requester: IncomingVouch["requester"];
  completed: {
    relationship: string;
    relationshipLabel: string;
    story: string;
    completedAt: string | null;
    refereeName: string | null;
  } | null;
};

export function useVouches() {
  return useQuery({
    queryKey: ["vouches"],
    retry: false,
    queryFn: async () => {
      const res = await fetch("/api/vouches", { cache: "no-store" });
      if (!res.ok) await throwApiError(res, "Failed to load references");
      return res.json() as Promise<VouchesPayload>;
    },
  });
}

export function useAskForVouch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; name?: string; note?: string }) => {
      const res = await fetch("/api/vouches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) await throwApiError(res, "Failed to send request");
      return res.json() as Promise<{
        vouch: AskedVouch;
        emailSent: boolean;
        emailError: string | null;
      }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vouches"] }),
  });
}

export function useCancelVouch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vouches/${id}/cancel`, { method: "POST" });
      if (!res.ok) await throwApiError(res, "Failed to cancel request");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vouches"] }),
  });
}

export function useResendVouch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vouches/${id}/resend`, { method: "POST" });
      if (!res.ok) await throwApiError(res, "Failed to resend email");
      return res.json() as Promise<{
        vouch: AskedVouch;
        emailSent: boolean;
        emailError: string | null;
      }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vouches"] }),
  });
}

export function useVouchToken(token: string) {
  return useQuery({
    queryKey: ["vouch-token", token],
    retry: false,
    queryFn: async () => {
      const res = await fetch(`/api/vouches/token/${token}`, {
        cache: "no-store",
      });
      if (!res.ok) await throwApiError(res, "Reference request not found");
      return res.json() as Promise<TokenVouch>;
    },
  });
}

export function useSubmitVouch(token: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      relationship: string;
      story: string;
    }) => {
      const res = await fetch(`/api/vouches/token/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) await throwApiError(res, "Failed to submit vouch");
      return res.json() as Promise<TokenVouch>;
    },
    onSuccess: (data) => {
      qc.setQueryData(["vouch-token", token], data);
      void qc.invalidateQueries({ queryKey: ["vouches"] });
    },
  });
}