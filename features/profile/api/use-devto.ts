"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DevtoProfile } from "@/lib/devto";
import type { ImportedArticle } from "@/lib/imported-article";

async function readError(res: Response, fallback: string) {
  const json = await res.json().catch(() => ({}));
  return new Error(
    typeof json.error === "string" && json.error ? json.error : fallback
  );
}

export function useFetchDevto() {
  return useMutation({
    mutationFn: async (username: string): Promise<DevtoProfile> => {
      const res = await fetch("/api/profile/devto/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        credentials: "include",
      });
      if (!res.ok) throw await readError(res, "Failed to fetch Dev.to articles");
      const json = await res.json();
      return json.data;
    },
  });
}

export function useImportDevto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      username: string;
      articles: ImportedArticle[];
    }): Promise<{ imported: number }> => {
      const res = await fetch("/api/profile/devto/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw await readError(res, "Failed to import articles");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}