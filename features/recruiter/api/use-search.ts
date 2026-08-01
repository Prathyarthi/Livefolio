"use client";

import { useMutation } from "@tanstack/react-query";
import type {
  FilterAst,
  RecruiterSearchResponse,
} from "@/features/recruiter/types";

export function useRecruiterSearch() {
  return useMutation({
    mutationFn: async (body: {
      text?: string;
      inputType?: "jd" | "nl" | "filters";
      ast?: FilterAst;
    }): Promise<RecruiterSearchResponse> => {
      const res = await fetch("/api/recruiter/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Search failed");
      return json;
    },
  });
}

export function useCompileRecruiterQuery() {
  return useMutation({
    mutationFn: async (body: {
      text: string;
      inputType?: "jd" | "nl";
    }): Promise<Pick<RecruiterSearchResponse, "ast" | "chips"> & { source: string }> => {
      const res = await fetch("/api/recruiter/search/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to compile query");
      return json;
    },
  });
}
