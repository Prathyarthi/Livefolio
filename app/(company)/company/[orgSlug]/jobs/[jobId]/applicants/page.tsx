"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useApplicantPool,
  useToggleShortlist,
  useUpdateApplicationStage,
} from "@/features/applications/api/use-applications";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
  type PipelineStage,
} from "@/features/jobs/constants/labels";
import { getPortfolioPublicUrl } from "@/lib/domain";

type PoolTab = "all" | PipelineStage;

export default function JobApplicantsPage() {
  const params = useParams<{ orgSlug: string; jobId: string }>();
  const orgSlug = params.orgSlug;
  const jobId = params.jobId;
  const [tab, setTab] = useState<PoolTab>("all");

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [skill, setSkill] = useState("");
  const [role, setRole] = useState("");
  const [education, setEducation] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setQ(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const poolQuery = useApplicantPool(jobId, {
    stage: tab !== "all" ? tab : undefined,
    q: q || undefined,
    location: location.trim() || undefined,
    skill: skill.trim() || undefined,
    role: role.trim() || undefined,
    education: education.trim() || undefined,
    minExperience: minExperience ? Number(minExperience) : undefined,
  });
  const updateStage = useUpdateApplicationStage(jobId);
  const toggleShortlist = useToggleShortlist(jobId);

  const data = poolQuery.data;
  const counts = data?.stageCounts;
  const hasActiveFilters = Boolean(
    q || location || skill || role || education || minExperience,
  );

  const tabs: Array<{ id: PoolTab; label: string; count: number }> = [
    { id: "all", label: "All", count: counts?.all ?? 0 },
    ...PIPELINE_STAGES.map((stage) => ({
      id: stage as PoolTab,
      label: PIPELINE_STAGE_LABELS[stage],
      count: counts?.[stage] ?? 0,
    })),
  ];

  function clearFilters() {
    setSearchInput("");
    setQ("");
    setLocation("");
    setSkill("");
    setRole("");
    setEducation("");
    setMinExperience("");
  }

  async function handleStage(applicationId: string, stage: string) {
    try {
      await updateStage.mutateAsync({ applicationId, stage });
      toast.success(
        `Moved to ${PIPELINE_STAGE_LABELS[stage as PipelineStage] ?? stage}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function handleShortlist(applicationId: string, shortlisted: boolean) {
    try {
      await toggleShortlist.mutateAsync({ applicationId, shortlisted });
      toast.success(
        shortlisted ? "Added to shortlist" : "Removed from shortlist",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}/jobs/${jobId}`}>← Back to job</Link>
      </Button>
      <header className="space-y-2">
        <p className="eyebrow uppercase">Applicants</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-h2 text-text-primary">
              {data?.job.title ?? "Applicant pool"}
            </h1>
            <p className="text-body-sm text-text-secondary">
              {hasActiveFilters
                ? `${data?.matchedCount ?? 0} matching · ${counts?.all ?? 0} total in this job`
                : `${counts?.all ?? 0} applicants · search within this job only`}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-3 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            placeholder='Search applicants — e.g. "B2B SaaS", "team leadership", "Bangalore"'
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
          {hasActiveFilters ? (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          ) : null}
        </div>
        {showFilters ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FilterField
              label="Location"
              value={location}
              onChange={setLocation}
              placeholder="Bangalore, Remote…"
            />
            <FilterField
              label="Skill"
              value={skill}
              onChange={setSkill}
              placeholder="Content strategy…"
            />
            <FilterField
              label="Role / company"
              value={role}
              onChange={setRole}
              placeholder="Marketing Manager…"
            />
            <FilterField
              label="Education"
              value={education}
              onChange={setEducation}
              placeholder="MBA, Stanford…"
            />
            <div className="space-y-1.5">
              <Label htmlFor="min-exp">Min years experience</Label>
              <Input
                id="min-exp"
                type="number"
                min={0}
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                placeholder="5"
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={tab === item.id ? "default" : "outline"}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            <span className="text-xs opacity-70">{item.count}</span>
          </Button>
        ))}
      </div>

      {poolQuery.isLoading ? (
        <p className="text-body-sm text-text-muted">Loading applicants…</p>
      ) : poolQuery.error ? (
        <p className="text-body-sm text-semantic-danger">
          {poolQuery.error instanceof Error
            ? poolQuery.error.message
            : "Failed to load applicants"}
        </p>
      ) : !data || data.applicants.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-default px-6 py-12 text-center">
          <h2 className="text-h3 text-text-primary">
            {hasActiveFilters ? "No matching applicants" : "No applicants here"}
          </h2>
          <p className="mt-1 text-body-sm text-text-secondary">
            {hasActiveFilters
              ? "Try broadening your search or clearing filters."
              : "Share the public job link to start collecting Livefolio applications."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.applicants.map((applicant) => (
            <li
              key={applicant.id}
              className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4 md:p-5"
            >
              <div className="flex flex-wrap items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={applicant.summary.avatarUrl ?? undefined}
                    alt=""
                  />
                  <AvatarFallback>
                    {applicant.summary.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/company/${orgSlug}/jobs/${jobId}/applicants/${applicant.id}`}
                      className="font-medium text-text-primary hover:underline"
                    >
                      {applicant.summary.name}
                    </Link>
                    <Badge
                      variant={
                        applicant.stage === "shortlisted" ? "success" : "neutral"
                      }
                    >
                      {PIPELINE_STAGE_LABELS[
                        applicant.stage as PipelineStage
                      ] ?? applicant.stage}
                    </Badge>
                    {applicant.evidence.totalRequired > 0 ? (
                      <Badge variant="neutral">
                        {applicant.evidence.matchedRequired}/
                        {applicant.evidence.totalRequired} required
                      </Badge>
                    ) : null}
                  </div>

                  {applicant.summary.headline ? (
                    <p className="text-body-sm text-text-secondary">
                      {applicant.summary.headline}
                    </p>
                  ) : null}

                  <p className="text-body-sm text-text-muted">
                    {[
                      applicant.summary.location,
                      applicant.summary.yearsExperience != null
                        ? `${applicant.summary.yearsExperience}+ yrs experience`
                        : null,
                      `Applied ${new Date(applicant.submittedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
                      applicant.noteCount
                        ? `${applicant.noteCount} notes`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>

                  {applicant.summary.recentRoles[0] ? (
                    <p className="text-body-sm text-text-secondary">
                      {applicant.summary.recentRoles[0]}
                    </p>
                  ) : null}

                  {applicant.summary.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {applicant.summary.skills.slice(0, 6).map((s) => (
                        <span
                          key={s}
                          className="rounded-[var(--radius-sm)] bg-surface-base px-2 py-0.5 text-xs text-text-secondary"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {applicant.evidence.highlights.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-label uppercase text-text-muted">
                        Relevant evidence
                      </p>
                      <ul className="space-y-0.5 text-body-sm text-text-secondary">
                        {applicant.evidence.highlights.slice(0, 3).map((item) => (
                          <li key={`${item.kind}-${item.label}`}>
                            <span className="text-text-muted">{item.kind}:</span>{" "}
                            {item.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                  <Button size="sm" asChild>
                    <Link
                      href={`/company/${orgSlug}/jobs/${jobId}/applicants/${applicant.id}`}
                    >
                      Open
                    </Link>
                  </Button>
                  {applicant.summary.slug ? (
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={getPortfolioPublicUrl(applicant.summary.slug)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Livefolio
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleShortlist(applicant.id, !applicant.shortlisted)
                    }
                    disabled={toggleShortlist.isPending}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${applicant.shortlisted ? "fill-current" : ""}`}
                    />
                    {applicant.shortlisted ? "Unshortlist" : "Shortlist"}
                  </Button>
                  <select
                    className="h-9 rounded-[var(--radius-md)] border border-border-default bg-surface-base px-2 text-sm text-text-primary"
                    value={applicant.stage}
                    onChange={(e) => handleStage(applicant.id, e.target.value)}
                    disabled={updateStage.isPending}
                    aria-label="Move stage"
                  >
                    {PIPELINE_STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {PIPELINE_STAGE_LABELS[stage]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
