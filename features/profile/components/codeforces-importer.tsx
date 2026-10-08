"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CodeforcesIcon } from "@/components/icons";
import {
  useFetchCodeforces,
  useImportCodeforces,
} from "@/features/profile/api/use-codeforces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, Search } from "lucide-react";
import type { CodeforcesStats } from "@/lib/codeforces";

function formatRank(rank: string | null) {
  if (!rank) return "Unrated";
  return rank.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function CodeforcesImporter() {
  const [handle, setHandle] = useState("");
  const [stats, setStats] = useState<CodeforcesStats | null>(null);
  const fetchCodeforces = useFetchCodeforces();
  const importCodeforces = useImportCodeforces();

  const handleFetch = async () => {
    if (!handle.trim()) {
      toast.error("Please enter a Codeforces handle");
      return;
    }
    try {
      const result = await fetchCodeforces.mutateAsync(handle.trim());
      setStats(result);
      toast.success("Codeforces stats fetched");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch Codeforces stats");
    }
  };

  const handleImport = async () => {
    if (!stats) return;
    try {
      await importCodeforces.mutateAsync(stats);
      toast.success("Codeforces stats saved to your portfolio");
      setStats(null);
      setHandle("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save Codeforces stats");
    }
  };

  const solvedLabel = stats
    ? `${stats.solvedCount.toLocaleString()}${stats.solvedCountPartial ? "+" : ""} solved`
    : "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CodeforcesIcon className="h-5 w-5" />
            Import from Codeforces
          </CardTitle>
          <CardDescription>
            Enter your handle to save contest rating, rank, and solved problems on your
            portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="codeforces-handle" className="sr-only">
                Codeforces handle
              </Label>
              <Input
                id="codeforces-handle"
                placeholder="e.g. tourist"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleFetch();
                }}
                disabled={fetchCodeforces.isPending}
              />
            </div>
            <Button
              onClick={() => void handleFetch()}
              disabled={fetchCodeforces.isPending || !handle.trim()}
            >
              {fetchCodeforces.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Fetch
            </Button>
          </div>
        </CardContent>
      </Card>

      {stats ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{stats.name}</CardTitle>
              <CardDescription>@{stats.handle}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Rank</dt>
                  <dd className="text-sm font-medium">{formatRank(stats.rank)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Rating</dt>
                  <dd className="text-sm font-medium">
                    {stats.rating?.toLocaleString() ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Max rating</dt>
                  <dd className="text-sm font-medium">
                    {stats.maxRating?.toLocaleString() ?? "—"}
                    {stats.maxRank ? ` · ${formatRank(stats.maxRank)}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Solved</dt>
                  <dd className="text-sm font-medium">{solvedLabel}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => void handleImport()} disabled={importCodeforces.isPending}>
              {importCodeforces.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save to portfolio
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
