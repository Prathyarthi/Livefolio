"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Search, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListPagination } from "@/components/list-pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { AddToWorkspaceDialog } from "@/features/talent/components/add-to-workspace-dialog";
import {
  useAddTalentToWorkspace,
  useTalentSearch,
  type TalentPerson,
} from "@/features/talent/api/use-talent";

export function TalentSearchPage({
  orgSlug,
  workspaceSlug,
}: {
  orgSlug: string;
  workspaceSlug?: string;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [adding, setAdding] = useState<TalentPerson | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const addTalent = useAddTalentToWorkspace(orgSlug);

  useEffect(() => {
    const timer = window.setTimeout(() => setQ(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [q, location, skill]);

  const talentQuery = useTalentSearch(orgSlug, {
    q: q || undefined,
    location: location.trim() || undefined,
    skill: skill.trim() || undefined,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const people = talentQuery.data?.people ?? [];
  const total = talentQuery.data?.total ?? 0;
  const hasFilters = Boolean(q || location.trim() || skill.trim());

  async function addToCurrentWorkspace(person: TalentPerson) {
    if (!workspaceSlug || pendingSlug) return;
    setPendingSlug(person.slug);
    try {
      await addTalent.mutateAsync({
        workspaceSlug,
        slug: person.slug,
      });
      toast.success("Added to this workspace");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add talent");
    } finally {
      setPendingSlug(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link
          href={
            workspaceSlug
              ? `/company/${orgSlug}/${workspaceSlug}`
              : `/company/${orgSlug}`
          }
        >
          {workspaceSlug ? "← Back to overview" : "← Back to organization"}
        </Link>
      </Button>

      <header className="space-y-1">
        <p className="eyebrow uppercase">Talent</p>
        <h1 className="text-h2 text-text-primary">Find talent</h1>
        <p className="max-w-2xl text-body-sm text-text-secondary">
          Search people who opted in so you can reach them. This is separate
          from applicants on your jobs.
        </p>
      </header>

      <div className="space-y-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, headline, skills, or work…"
            className="pl-9"
            aria-label="Search talent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters((v) => !v)}
          >
            Filters
          </Button>
          {hasFilters ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchInput("");
                setLocation("");
                setSkill("");
              }}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
        {showFilters ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="talent-location">Location</Label>
              <Input
                id="talent-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or region"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="talent-skill">Skill</Label>
              <Input
                id="talent-skill"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="e.g. React"
              />
            </div>
          </div>
        ) : null}
      </div>

      {talentQuery.isLoading ? (
        <p className="text-body-sm text-text-muted">Loading talent…</p>
      ) : talentQuery.isError ? (
        <p className="text-body-sm text-danger">
          Couldn’t load talent. Try again in a moment.
        </p>
      ) : people.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-fill/12">
            <Users className="h-6 w-6 text-brand-secondary" aria-hidden />
          </span>
          <h2 className="mt-4 text-h3 text-text-primary">
            {hasFilters ? "No matches" : "No talent yet"}
          </h2>
          <p className="mt-1 text-body-sm text-text-secondary">
            {hasFilters
              ? "Try a different search."
              : "Nobody has opted in for recruiter discovery yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-border-default rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
            {people.map((person) => {
              const alreadyHere = workspaceSlug
                ? (person.savedWorkspaces ?? []).some(
                    (ws) => ws.slug === workspaceSlug,
                  )
                : false;
              const addingNow = pendingSlug === person.slug;
              return (
                <li
                  key={person.slug}
                  className="flex flex-wrap items-start justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={person.avatarUrl ?? undefined} alt="" />
                      <AvatarFallback>
                        {(person.title || "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1.5">
                      <p className="truncate font-medium text-text-primary">
                        {person.title || "Untitled"}
                      </p>
                      {person.headline ? (
                        <p className="text-body-sm text-text-secondary">
                          {person.headline}
                        </p>
                      ) : null}
                      <p className="text-body-sm text-text-muted">
                        {[
                          person.location,
                          person.recentRole
                            ? `${person.recentRole.role} · ${person.recentRole.company}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {person.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {person.skills.map((s) => (
                            <span
                              key={s}
                              className="rounded-[var(--radius-sm)] bg-surface-base px-2 py-0.5 text-xs text-text-secondary"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {(person.savedWorkspaces ?? []).length > 0 ? (
                        <p className="text-xs text-text-muted">
                          Added to{" "}
                          {(person.savedWorkspaces ?? [])
                            .map((ws) => ws.name)
                            .join(", ")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {workspaceSlug ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={alreadyHere || addingNow}
                        onClick={() => void addToCurrentWorkspace(person)}
                      >
                        {alreadyHere
                          ? "Added"
                          : addingNow
                            ? "Adding…"
                            : "Add to workspace"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAdding(person)}
                      >
                        Add to workspace
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={person.livefolioUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Livefolio
                      </a>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <ListPagination
            page={talentQuery.data?.page ?? page}
            pageSize={talentQuery.data?.pageSize ?? DEFAULT_PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </div>
      )}

      {workspaceSlug ? null : (
        <AddToWorkspaceDialog
          orgSlug={orgSlug}
          person={adding}
          open={adding != null}
          onOpenChange={(open) => {
            if (!open) setAdding(null);
          }}
        />
      )}
    </div>
  );
}
