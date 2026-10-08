"use client";

import { useState, type ComponentType } from "react";
import { toast } from "sonner";
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
import { Calendar, Clock, Download, Loader2, Search } from "lucide-react";
import type { ImportedArticle } from "@/lib/imported-article";

const IMPORT_LIST_BATCH_SIZE = 5;

export type ArticleSourceProfile = {
  username: string;
  name: string;
  articles: ImportedArticle[];
  profileUrl?: string;
};

type ArticleSourceImporterProps = {
  platformLabel: string;
  icon: ComponentType<{ className?: string }>;
  placeholder: string;
  description: string;
  usernameFieldId: string;
  isFetching: boolean;
  isImporting: boolean;
  fetchProfile: (username: string) => Promise<ArticleSourceProfile>;
  importSelected: (input: {
    username: string;
    profileUrl?: string;
    articles: ImportedArticle[];
  }) => Promise<{ imported: number }>;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ArticleSourceImporter({
  platformLabel,
  icon: Icon,
  placeholder,
  description,
  usernameFieldId,
  isFetching,
  isImporting,
  fetchProfile,
  importSelected,
}: ArticleSourceImporterProps) {
  const [username, setUsername] = useState("");
  const [data, setData] = useState<ArticleSourceProfile | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(IMPORT_LIST_BATCH_SIZE);

  const handleFetch = async () => {
    if (!username.trim()) {
      toast.error(`Please enter a ${platformLabel} username`);
      return;
    }

    try {
      const result = await fetchProfile(username.trim());
      setData(result);
      setSelectedArticles(new Set(result.articles.map((_, index) => index)));
      setVisibleCount(IMPORT_LIST_BATCH_SIZE);
      toast.success(
        result.articles.length === 0
          ? `Found ${result.name}, with no articles to import`
          : `Found ${result.articles.length} articles`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch articles");
    }
  };

  const toggleArticle = (index: number) => {
    setSelectedArticles((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleImport = async () => {
    if (!data || selectedArticles.size === 0) return;
    const articles = Array.from(selectedArticles).map((index) => data.articles[index]!);
    try {
      const result = await importSelected({
        username: data.username,
        profileUrl: data.profileUrl,
        articles,
      });
      toast.success(`Imported ${result.imported} articles from ${platformLabel}`);
      setData(null);
      setUsername("");
      setSelectedArticles(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import articles");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            Import from {platformLabel}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor={usernameFieldId} className="sr-only">
                {platformLabel} username
              </Label>
              <Input
                id={usernameFieldId}
                placeholder={placeholder}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void handleFetch();
                }}
                disabled={isFetching}
              />
            </div>
            <Button onClick={() => void handleFetch()} disabled={isFetching || !username.trim()}>
              {isFetching ? (
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
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-2xl font-bold text-brand-primary">
                  {data.name[0]?.toUpperCase() || platformLabel[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{data.name}</h3>
                  <p className="text-sm text-muted-foreground">@{data.username}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data.articles.length} articles
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Articles ({data.articles.length})</h3>
              <div className="flex flex-wrap items-center gap-2">
                {data.articles.length > 0 ? (
                  <Button
                    onClick={() => void handleImport()}
                    disabled={selectedArticles.size === 0 || isImporting}
                  >
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Import {selectedArticles.size} article
                    {selectedArticles.size === 1 ? "" : "s"}
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedArticles(new Set(data.articles.map((_, index) => index)))
                  }
                >
                  Select all
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedArticles(new Set())}>
                  Deselect all
                </Button>
              </div>
            </div>

            {data.articles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No articles found for this account.</p>
            ) : (
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
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedArticles.has(index)}
                          onChange={() => toggleArticle(index)}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-input accent-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium leading-tight">
                            {article.title}
                          </p>
                          {article.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {article.description}
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            {article.publishedAt ? (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(article.publishedAt)}
                              </span>
                            ) : null}
                            {article.readTime ? (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {article.readTime} min read
                              </span>
                            ) : null}
                          </div>
                          {article.tags.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {article.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {visibleCount < data.articles.length ? (
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
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}