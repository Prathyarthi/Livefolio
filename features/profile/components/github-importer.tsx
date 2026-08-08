"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useFetchGitHub, useImportGitHub } from "@/features/profile/api/use-github";
import {
  usePortfolio,
  useUpdatePortfolio,
} from "@/features/portfolio/api/use-portfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Star,
  GitFork,
  Download,
  MapPin,
  Users,
} from "lucide-react";
import { GithubIcon as Github } from "@/components/icons";
import type { GitHubData, GitHubRepo } from "@/lib/github";
import {
  getStoredSectionLayout,
  normalizeHidden,
  normalizeOrder,
  toSectionLayoutPayload,
  type ReorderableSectionKey,
} from "@/features/templates/section-order";
import type { PortfolioCustomization } from "@/features/templates/types";

const IMPORT_LIST_BATCH_SIZE = 5;

export function GitHubImporter() {
  const [username, setUsername] = useState("");
  const [data, setData] = useState<GitHubData | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(IMPORT_LIST_BATCH_SIZE);

  const { data: portfolio } = usePortfolio();
  const updatePortfolio = useUpdatePortfolio();
  const fetchGitHub = useFetchGitHub();
  const importGitHub = useImportGitHub();

  const customization = (portfolio?.customization ??
    {}) as PortfolioCustomization;
  const layout = getStoredSectionLayout(customization);
  // Heatmap is opt-in: off until the user has an explicit sectionLayout.hidden
  // preference (or turns the switch on).
  const hasExplicitHeatmapPreference = Array.isArray(
    customization.sectionLayout?.hidden,
  );
  const showHeatmap = hasExplicitHeatmapPreference
    ? !normalizeHidden(layout.hidden).includes("github")
    : false;

  const setShowHeatmap = (show: boolean) => {
    if (!portfolio) return;

    const hidden: ReorderableSectionKey[] = normalizeHidden(layout.hidden).filter(
      (key) => key !== "github",
    );
    if (!show) hidden.push("github");

    updatePortfolio.mutate(
      {
        customization: {
          sectionLayout: toSectionLayoutPayload(
            normalizeOrder(layout.order),
            hidden,
          ),
        },
      },
      { onError: (error) => toast.error(error.message) },
    );
  };

  const handleFetch = () => {
    if (!username.trim()) {
      toast.error("Please enter a GitHub username");
      return;
    }

    fetchGitHub.mutate(username.trim(), {
      onSuccess: (result) => {
        setData(result);
        const topIndices = new Set(
          result.repos
            .slice(0, Math.min(6, result.repos.length))
            .map((_, i) => i)
        );
        setSelectedRepos(topIndices);
        setVisibleCount(IMPORT_LIST_BATCH_SIZE);
        toast.success(`Found ${result.repos.length} repositories`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const toggleRepo = (index: number) => {
    setSelectedRepos((prev) => {
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
    setSelectedRepos(new Set(data.repos.map((_, i) => i)));
  };

  const deselectAll = () => {
    setSelectedRepos(new Set());
  };

  const canImport =
    Boolean(data) && (selectedRepos.size > 0 || showHeatmap);

  const handleImport = () => {
    if (!data || !canImport) return;

    const repos: GitHubRepo[] = Array.from(selectedRepos).map(
      (i) => data.repos[i]!
    );

    importGitHub.mutate(
      { username, repos, showHeatmap },
      {
        onSuccess: (result) => {
          if (result.imported > 0) {
            toast.success(`Imported ${result.imported} projects from GitHub`);
          } else {
            toast.success("Saved GitHub contribution heatmap");
          }
          setData(null);
          setUsername("");
          setSelectedRepos(new Set());
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Import from GitHub
          </CardTitle>
          <CardDescription>
            Enter a GitHub username to fetch repositories and import them as
            projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="github-username" className="sr-only">
                GitHub Username
              </Label>
              <Input
                id="github-username"
                placeholder="e.g. octocat"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                disabled={fetchGitHub.isPending}
              />
            </div>
            <Button
              onClick={handleFetch}
              disabled={fetchGitHub.isPending || !username.trim()}
            >
              {fetchGitHub.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Fetch
            </Button>
          </div>

          {portfolio ? (
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="show-github-heatmap">
                Show contribution heatmap on portfolio
              </Label>
              <Switch
                id="show-github-heatmap"
                checked={showHeatmap}
                disabled={updatePortfolio.isPending}
                onCheckedChange={setShowHeatmap}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {data && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <img
                  src={data.profile.avatarUrl}
                  alt={data.profile.name ?? username}
                  className="h-16 w-16 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-lg">
                    {data.profile.name ?? username}
                  </h3>
                  {data.profile.bio && (
                    <p className="text-sm text-muted-foreground">
                      {data.profile.bio}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {data.profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {data.profile.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {data.profile.followers} followers
                    </span>
                    <span>{data.profile.repos} repos</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">
                Repositories ({data.repos.length})
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleImport}
                  disabled={!canImport || importGitHub.isPending}
                >
                  {importGitHub.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {selectedRepos.size > 0
                    ? `Import ${selectedRepos.size} Project${
                        selectedRepos.size !== 1 ? "s" : ""
                      }`
                    : "Import heatmap"}
                </Button>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {data.repos.slice(0, visibleCount).map((repo, index) => (
                <Card
                  key={repo.name}
                  className={`cursor-pointer transition-colors ${
                    selectedRepos.has(index)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggleRepo(index)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRepos.has(index)}
                            onChange={() => toggleRepo(index)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 cursor-pointer rounded border-input accent-primary"
                          />
                          <p className="font-medium text-sm truncate">
                            {repo.name}
                          </p>
                        </div>
                        {repo.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 ml-6">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 ml-6">
                          {repo.language && (
                            <Badge variant="secondary" className="text-xs">
                              {repo.language}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3 w-3" />
                            {repo.stars}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <GitFork className="h-3 w-3" />
                            {repo.forks}
                          </span>
                        </div>
                        {repo.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 ml-6">
                            {repo.topics.slice(0, 4).map((topic) => (
                              <Badge
                                key={topic}
                                variant="outline"
                                className="text-xs"
                              >
                                {topic}
                              </Badge>
                            ))}
                            {repo.topics.length > 4 && (
                              <span className="text-xs text-muted-foreground">
                                +{repo.topics.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {visibleCount < data.repos.length && (
              <div className="flex justify-center pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount(data.repos.length)}
                >
                  Show all ({data.repos.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
