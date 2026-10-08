"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StackOverflowIcon } from "@/components/icons";
import {
  useFetchStackOverflow,
  useImportStackOverflow,
} from "@/features/profile/api/use-stackoverflow";
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
import { Download, Loader2, Search } from "lucide-react";
import type { StackOverflowProfile } from "@/lib/stackoverflow";

const IMPORT_LIST_BATCH_SIZE = 5;

export function StackOverflowImporter() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<StackOverflowProfile | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(IMPORT_LIST_BATCH_SIZE);
  const fetchProfile = useFetchStackOverflow();
  const importProfile = useImportStackOverflow();

  const handleFetch = async () => {
    if (!query.trim()) {
      toast.error("Enter a Stack Overflow name, user id, or profile URL");
      return;
    }
    try {
      const result = await fetchProfile.mutateAsync(query.trim());
      setData(result);
      setSelected(new Set(result.answers.map((_, index) => index)));
      setVisibleCount(IMPORT_LIST_BATCH_SIZE);
      toast.success(`Found ${result.username}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch Stack Overflow");
    }
  };

  const toggle = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleImport = async () => {
    if (!data) return;
    try {
      const result = await importProfile.mutateAsync({
        ...data,
        answers: Array.from(selected).map((index) => data.answers[index]!),
      });
      toast.success(
        result.imported > 0
          ? `Saved Stack Overflow stats and ${result.imported} answers`
          : "Saved Stack Overflow stats"
      );
      setData(null);
      setQuery("");
      setSelected(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import Stack Overflow");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StackOverflowIcon className="h-5 w-5" />
            Import from Stack Overflow
          </CardTitle>
          <CardDescription>
            Enter a display name, numeric user id, or profile URL. Reputation is saved
            with your profile, and you can add top answers to your articles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="stackoverflow-user" className="sr-only">
                Stack Overflow user
              </Label>
              <Input
                id="stackoverflow-user"
                placeholder="name, 22656, or profile URL"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleFetch();
                }}
                disabled={fetchProfile.isPending}
              />
            </div>
            <Button
              onClick={() => void handleFetch()}
              disabled={fetchProfile.isPending || !query.trim()}
            >
              {fetchProfile.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Fetch
            </Button>
          </div>
        </CardContent>
      </Card>

      {data ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">{data.username}</CardTitle>
                  <CardDescription>
                    {data.reputation.toLocaleString()} reputation · {data.answerCount.toLocaleString()} answers
                  </CardDescription>
                </div>
                <div className="flex gap-2 text-sm">
                  <Badge className="bg-[#ffcc01] text-black hover:bg-[#ffcc01]">
                    {data.goldBadges} gold
                  </Badge>
                  <Badge className="bg-[#b4b8bc] text-black hover:bg-[#b4b8bc]">
                    {data.silverBadges} silver
                  </Badge>
                  <Badge className="bg-[#d1a684] text-black hover:bg-[#d1a684]">
                    {data.bronzeBadges} bronze
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Top answers ({data.answers.length})</h3>
            <Button onClick={() => void handleImport()} disabled={importProfile.isPending}>
              {importProfile.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Save profile{selected.size > 0 ? ` and ${selected.size} answers` : ""}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {data.answers.slice(0, visibleCount).map((answer, index) => (
              <Card
                key={answer.url}
                className={`cursor-pointer transition-colors ${
                  selected.has(index) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
                onClick={() => toggle(index)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(index)}
                      onChange={() => toggle(index)}
                      onClick={(event) => event.stopPropagation()}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-input accent-primary"
                    />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium">{answer.title}</p>
                      {answer.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {answer.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {visibleCount < data.answers.length ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setVisibleCount((count) =>
                    Math.min(count + IMPORT_LIST_BATCH_SIZE, data.answers.length)
                  )
                }
              >
                Show more ({data.answers.length - visibleCount} remaining)
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
