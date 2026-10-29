"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, Search, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTalentSearch } from "@/features/talent/api/use-talent";
import { useOrgJobs } from "@/features/jobs/api/use-jobs";
import {
  FacetPanel,
  ProofBadges,
  SortToggle,
  experienceBandRange,
  type FacetKind,
} from "@/features/search/components/search-refiners";
import type { FacetBucket } from "@/features/search/lib/facets";
import type { ProofKind } from "@/features/search/lib/proof";
import type { SearchSort } from "@/features/search/lib/query";
import { ListPagination } from "@/components/list-pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { stripRichTextToPlain } from "@/lib/rich-text";

export default function CompanyTalentPage() {
  const params = useParams<{ orgSlug: string; workspaceSlug: string }>();
  const orgSlug = params.orgSlug;
  const workspaceSlug = params.workspaceSlug;

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");
  const [proof, setProof] = useState<ProofKind | undefined>();
  const [experience, setExperience] = useState<string | undefined>();
  const [jobId, setJobId] = useState("");
  const [sort, setSort] = useState<SearchSort>("relevance");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => setQ(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [q, location, skill, proof, experience, jobId, sort]);

  const jobsQuery = useOrgJobs(orgSlug, { workspaceSlug });
  const talentQuery = useTalentSearch(orgSlug, workspaceSlug, {
    q: q || undefined,
    location: location.trim() || undefined,
    skill: skill.trim() || undefined,
    proof,
    ...experienceBandRange(experience),
    jobId: jobId || undefined,
    sort,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const data = talentQuery.data;
  const people = data?.people ?? [];
  const total = data?.total ?? 0;
  const hasFilters = Boolean(
    q || location.trim() || skill.trim() || proof || experience,
  );
  const ranked = Boolean(q || jobId);

  function clearFilters() {
    setSearchInput("");
    setQ("");
    setLocation("");
    setSkill("");
    setProof(undefined);
    setExperience(undefined);
  }

  function selectFacet(kind: FacetKind, bucket: FacetBucket | null) {
    if (kind === "skill") setSkill(bucket?.label ?? "");
    if (kind === "location") setLocation(bucket?.label ?? "");
    if (kind === "experience") setExperience(bucket?.id);
    if (kind === "proof") setProof((bucket?.id as ProofKind | undefined) ?? undefined);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}/${workspaceSlug}`}>← Back to overview</Link>
      </Button>

      <header className="space-y-1">
        <p className="eyebrow uppercase">Talent</p>
        <h1 className="text-h2 text-text-primary">Find talent</h1>
        <p className="max-w-2xl text-body-sm text-text-secondary">
          Search people who opted in so you can reach them. This is separate
          from applicants on your jobs. Pick a job to rank everyone against it.
        </p>
      </header>

      <div className="space-y-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4 shadow-[var(--shadow-card)] md:p-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder='Try “brand designer in Bangalore”, “seo OR content strategy”, or “sales -insurance”'
            className="pl-9"
            aria-label="Search talent"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="talent-job">Rank for job</Label>
            <select
              id="talent-job"
              className="h-9 w-full rounded-[var(--radius-md)] border border-border-default bg-surface-base px-2 text-sm text-text-primary"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              <option value="">No job — rank by search</option>
              {(jobsQuery.data ?? []).map((job) => (
                <option key={job.id} value={job.id}>
                  {stripRichTextToPlain(job.title)}
                </option>
              ))}
            </select>
          </div>
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
              placeholder="e.g. Figma, SEO, Salesforce"
            />
          </div>
        </div>
        <FacetPanel
          facets={data?.facets}
          active={{ skill, location, experience, proof }}
          onSelect={selectFacet}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-body-sm text-text-muted">
            {data
              ? `${total}${data.truncated ? "+" : ""} ${total === 1 ? "person" : "people"}${
                  data.job ? ` · ranked for ${stripRichTextToPlain(data.job.title)}` : ""
                }`
              : null}
          </p>
          <div className="flex items-center gap-2">
            {hasFilters ? (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            ) : null}
            <SortToggle value={sort} onChange={setSort} />
          </div>
        </div>
        {data?.truncated ? (
          <p className="text-xs text-text-muted">
            Showing the best of the 300 most recently updated matches. Narrow
            the search to see more.
          </p>
        ) : null}
      </div>

      {talentQuery.isLoading ? (
        <p className="text-body-sm text-text-muted">Loading talent…</p>
      ) : talentQuery.isError ? (
        <p className="text-body-sm text-text-secondary">
          {talentQuery.error instanceof Error
            ? talentQuery.error.message
            : "Couldn’t load talent. Try again in a moment."}
        </p>
      ) : people.length === 0 ? (
        <div className="flex flex-col items-center rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 px-6 py-10 text-center shadow-[var(--shadow-card)] md:p-8">
          <Users className="mx-auto h-8 w-8 text-text-muted" />
          <h3 className="mt-3 text-h3 text-text-primary">
            {hasFilters || jobId ? "No matches" : "No talent yet"}
          </h3>
          <p className="mt-1 text-body-sm text-text-secondary">
            {hasFilters || jobId
              ? "Try a different search or job."
              : "Nobody has opted in for recruiter discovery yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-border-default rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
            {people.map((person) => (
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-text-primary">
                        {person.title || "Untitled"}
                      </p>
                      {ranked && person.score > 0 ? (
                        <Badge variant="neutral">Match {person.score}</Badge>
                      ) : null}
                    </div>
                    {person.headline ? (
                      <p className="text-body-sm text-text-secondary">
                        {person.headline}
                      </p>
                    ) : null}
                    <p className="text-body-sm text-text-muted">
                      {[
                        person.location,
                        person.yearsExperience != null
                          ? `${person.yearsExperience}+ yrs`
                          : null,
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
                    <ProofBadges proof={person.proof} />
                    {ranked && person.reasons.length > 0 ? (
                      <ul className="space-y-0.5 text-body-sm text-text-secondary">
                        {person.reasons.slice(0, 3).map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
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
              </li>
            ))}
          </ul>
          <ListPagination
            page={data?.page ?? page}
            pageSize={data?.pageSize ?? DEFAULT_PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
