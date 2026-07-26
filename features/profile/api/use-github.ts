"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { GitHubData, GitHubRepo } from "@/lib/github";

export function useFetchGitHub() {
  return useMutation({
    mutationFn: async (username: string): Promise<GitHubData> => {
      const res = await fetch("/api/profile/github/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to fetch GitHub data");
      return json.data;
    },
  });
}

export function useImportGitHub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      username: string;
      repos: GitHubRepo[];
      showHeatmap?: boolean;
    }): Promise<{ imported: number }> => {
      const res = await fetch("/api/profile/github/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to import repos");
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}
