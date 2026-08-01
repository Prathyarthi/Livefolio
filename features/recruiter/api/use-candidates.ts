"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recruiterKeys } from "@/features/recruiter/api/query-keys";
import type {
  ClaimProofItem,
  RecruiterCandidateDetail,
  RecruiterCandidateListItem,
} from "@/features/recruiter/types";

export function useRecruiterCandidates(status = "active") {
  return useQuery({
    queryKey: recruiterKeys.candidates(status),
    queryFn: async (): Promise<{ candidates: RecruiterCandidateListItem[] }> => {
      const res = await fetch(
        `/api/recruiter/candidates?status=${encodeURIComponent(status)}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load candidates");
      return json;
    },
  });
}

export function useRecruiterCandidate(id: string | undefined) {
  return useQuery({
    queryKey: recruiterKeys.candidate(id ?? ""),
    enabled: Boolean(id),
    queryFn: async (): Promise<{
      candidate: RecruiterCandidateDetail;
      claimsVsProof: ClaimProofItem[];
    }> => {
      const res = await fetch(`/api/recruiter/candidates/${id}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load candidate");
      return json;
    },
  });
}

export function useUploadResumeDossier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<{ candidateId: string }> => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/recruiter/candidates/from-resume", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to upload resume");
      return json;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: recruiterKeys.candidates() }),
  });
}

export function usePatchCandidate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      overallScore?: number | null;
      recommendation?: string | null;
      status?: string;
    }) => {
      const res = await fetch(`/api/recruiter/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update candidate");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.candidate(id) });
      qc.invalidateQueries({ queryKey: recruiterKeys.candidates() });
    },
  });
}

export function useAddCandidateNote(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`/api/recruiter/candidates/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add note");
      return json;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: recruiterKeys.candidate(id) }),
  });
}

export function useSaveLivefolioHit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      portfolioId?: string;
      slug?: string;
    }): Promise<{ candidateId: string }> => {
      const res = await fetch("/api/recruiter/candidates/from-livefolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save candidate");
      return json;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: recruiterKeys.candidates() }),
  });
}
