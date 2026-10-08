"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useFetchMedium, useImportMedium } from "@/features/profile/api/use-medium";
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
import { MediumIcon as Medium } from "@/components/icons";
import {
  Loader2,
  Search,
  Download,
  Clock,
  Calendar,
} from "lucide-react";
import type { MediumArticle, MediumProfile } from "@/lib/medium";

const IMPORT_LIST_BATCH_SIZE = 5;

export function MediumImporter() {
  const [username, setUsername] = useState("");
  const [data, setData] = useState<MediumProfile | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(IMPORT_LIST_BATCH_SIZE);

  const fetchMedium = useFetchMedium();
  const importMedium = useImportMedium();

  const handleFetch = () => {
    if (!username.trim()) {
      toast.error("Please enter a Medium username");
      return;
    }

    fetchMedium.mutate(username.trim(), {
      onSuccess: (result) => {
        setData(result);
        // Auto-select all articles
        const allIndices = new Set(
          result.articles.map((_, i) => i)
        );
        setSelectedArticles(allIndices);
        setVisibleCount(IMPORT_LIST_BATCH_SIZE);
        toast.success(`Found ${result.articles.length} articles`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const toggleArticle = (index: number) => {
    setSelectedArticles((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!data) return;
    setSelectedArticles(new Set(data.articles.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedArticles(new Set());
  };

  const handleImport = () => {
    if (!data || selectedArticles.size === 0) return;

    const articles: MediumArticle[] = Array.from(selectedArticles).map(
      (i) => data.articles[i]!
    );

    importMedium.mutate(
      { username, articles },
      {
        onSuccess: (result) => {
          toast.success(`Imported ${result.imported} articles from Medium`);
          setData(null);
          setUsername("");
          setSelectedArticles(new Set());
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medium className="h-5 w-5" />
            Import from Medium
          </CardTitle>
          <CardDescription>
            Enter your Medium username (without @) to fetch articles and import them as
            projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="medium-username" className="sr-only">
                Medium Username
              </Label>
              <Input
                id="medium-username"
                placeholder="e.g. yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                disabled={fetchMedium.isPending}
              />
            </div>
            <Button
              onClick={handleFetch}
              disabled={fetchMedium.isPending || !username.trim()}
            >
              {fetchMedium.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Fetch
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile & Articles */}
      {data && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white text-2xl font-bold">
                  {data.name[0]?.toUpperCase() || "M"}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{data.name}</h3>
                  <p className="text-sm text-text-muted">
                    @{data.username}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-text-muted">
                    <span>{data.articles.length} articles</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">
                Articles ({data.articles.length})
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {data.articles.length > 0 && (
                  <Button
                    onClick={handleImport}
                    disabled={selectedArticles.size === 0 || importMedium.isPending}
                  >
                    {importMedium.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Import {selectedArticles.size} Article
                    {selectedArticles.size !== 1 ? "s" : ""}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {data.articles.slice(0, visibleCount).map((article, index) => (
                <Card
                  key={article.url}
                  className={`cursor-pointer transition-colors ${
                    selectedArticles.has(index)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggleArticle(index)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={selectedArticles.has(index)}
                            onChange={() => toggleArticle(index)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 h-4 w-4 cursor-pointer rounded border-input accent-primary flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-tight line-clamp-2">
                              {article.title}
                            </p>
                            {article.description && (
                              <p className="text-xs text-text-muted mt-1 line-clamp-2">
                                {article.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              {article.publishedAt && (
                                <span className="flex items-center gap-1 text-xs text-text-muted">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(article.publishedAt)}
                                </span>
                              )}
                              {article.readTime && (
                                <span className="flex items-center gap-1 text-xs text-text-muted">
                                  <Clock className="h-3 w-3" />
                                  {article.readTime} min read
                                </span>
                              )}
                            </div>
                            {article.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {article.tags.slice(0, 3).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {article.tags.length > 3 && (
                                  <span className="text-xs text-text-muted">
                                    +{article.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {visibleCount < data.articles.length && (
              <div className="flex justify-center pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setVisibleCount((count) =>
                      Math.min(count + IMPORT_LIST_BATCH_SIZE, data.articles.length)
                    )
                  }
                >
                  Show more ({data.articles.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
