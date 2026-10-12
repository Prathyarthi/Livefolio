"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CodeforcesStats } from "@/lib/codeforces";

async function readError(res: Response, fallback: string) {
  const json = await res.json().catch(() => ({}));
  return new Error(
    typeof json.error === "string" && json.error ? json.error : fallback
  );
}

export function useFetchCodeforces() {
  return useMutation({
    mutationFn: async (handle: string): Promise<CodeforcesStats> => {
      const res = await fetch("/api/profile/codeforces/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: handle }),
        credentials: "include",
      });
      if (!res.ok) throw await readError(res, "Failed to fetch Codeforces stats");
      const json = await res.json();
      return json.data;
    },
  });
}

export function useImportCodeforces() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (stats: CodeforcesStats) => {
      const res = await fetch("/api/profile/codeforces/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stats),
        credentials: "include",
      });
      if (!res.ok) throw await readError(res, "Failed to import Codeforces stats");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolio"] }),
  });
}
