"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { recruiterKeys } from "@/features/recruiter/api/query-keys";
import type {
  RecruiterOrg,
  RecruiterOrgResponse,
} from "@/features/recruiter/types";

export function useRecruiterOrg() {
  return useQuery({
    queryKey: recruiterKeys.org(),
    queryFn: async (): Promise<RecruiterOrgResponse> => {
      const res = await fetch("/api/recruiter/orgs/me", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load organization");
      return json;
    },
  });
}

export function useCreateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      name: string
    ): Promise<{ org: RecruiterOrg; role: string }> => {
      const res = await fetch("/api/recruiter/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create organization");
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: recruiterKeys.org() }),
  });
}
