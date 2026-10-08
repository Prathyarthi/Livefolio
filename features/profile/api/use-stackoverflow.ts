"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImportedArticle } from "@/lib/imported-article";
import type { StackOverflowProfile } from "@/lib/stackoverflow";

async function readError(res: Response, fallback: string) {
  const json = await res.json().catch(() => ({}));
  return new Error(
    typeof json.error === "string" && json.error ? json.error : fallback
  );
}

export function useFetchStackOverflow() {
  return useMutation({
    mutationFn: async (username: string): Promise<StackOverflowProfile> => {
      const res = await fetch("/api/profile/stackoverflow/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
        credentials: "include",
      });
      if (!res.ok) throw await readError(res, "Failed to fetch Stack Overflow profile");
      const json = await res.json();
      return json.data;
    },
  });
}

export function useImportStackOverflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: Omit<StackOverflowProfile, "answers"> & { answers: ImportedArticle[] }
    ): Promise<{ imported: number }> => {
      const res = await fetch("/api/profile/stackoverflow/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw await readError(res, "Failed to import Stack Overflow profile");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}