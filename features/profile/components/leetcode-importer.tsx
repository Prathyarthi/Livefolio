"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useFetchLeetCode,
  useImportLeetCode,
} from "@/features/profile/api/use-leetcode";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Search, Trophy, Save } from "lucide-react";
import type { LeetCodeStats } from "@/lib/leetcode";

export function LeetCodeImporter() {
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState<LeetCodeStats | null>(null);

  const fetchLeetCode = useFetchLeetCode();
  const importLeetCode = useImportLeetCode();

  const handleFetch = () => {
    if (!username.trim()) {
      toast.error("Please enter a LeetCode username");
      return;
    }

    fetchLeetCode.mutate(username.trim(), {
      onSuccess: (data) => {
        setStats(data);
        toast.success("LeetCode stats fetched successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const handleImport = () => {
    if (!stats) return;

    importLeetCode.mutate(stats, {
      onSuccess: () => {
        toast.success("LeetCode stats saved to your portfolio");
        setStats(null);
        setUsername("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  // Max problems on LeetCode for progress bar calculations (approximate)
  const TOTAL_EASY = 800;
  const TOTAL_MEDIUM = 1700;
  const TOTAL_HARD = 750;

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Import from LeetCode
          </CardTitle>
          <CardDescription>
            Enter your LeetCode username to fetch your problem-solving stats and
            display them on your portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="leetcode-username" className="sr-only">
                LeetCode Username
              </Label>
              <Input
                id="leetcode-username"
                placeholder="e.g. leetcoder123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                disabled={fetchLeetCode.isPending}
              />
            </div>
            <Button
              onClick={handleFetch}
              disabled={fetchLeetCode.isPending || !username.trim()}
            >
              {fetchLeetCode.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Fetch
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats display */}
      {stats && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{stats.username}</CardTitle>
                  <CardDescription>
                    Ranking: #{stats.ranking.toLocaleString()}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  {stats.totalSolved} Solved
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Easy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                    Easy
                  </span>
                  <span className="text-text-muted">
                    {stats.easySolved} / ~{TOTAL_EASY}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    (stats.easySolved / TOTAL_EASY) * 100,
                    100
                  )}
                  className="h-2"
                />
              </div>

              {/* Medium */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-500" />
                    Medium
                  </span>
                  <span className="text-text-muted">
                    {stats.mediumSolved} / ~{TOTAL_MEDIUM}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    (stats.mediumSolved / TOTAL_MEDIUM) * 100,
                    100
                  )}
                  className="h-2"
                />
              </div>

              {/* Hard */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    Hard
                  </span>
                  <span className="text-text-muted">
                    {stats.hardSolved} / ~{TOTAL_HARD}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    (stats.hardSolved / TOTAL_HARD) * 100,
                    100
                  )}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleImport}
              disabled={importLeetCode.isPending}
            >
              {importLeetCode.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save to Portfolio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
