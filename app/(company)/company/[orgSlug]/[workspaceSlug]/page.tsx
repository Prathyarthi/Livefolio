"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, ExternalLink, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/features/organization/api/use-organization";
import { useOrgJobs } from "@/features/jobs/api/use-jobs";
import { useWorkspaceTalent } from "@/features/talent/api/use-talent";
import {
  HiringLoadingState,
  HiringNotFoundState,
} from "@/features/organization/components/hiring-page-chrome";
import {
  EMPLOYMENT_TYPE_LABELS,
  JOB_STATUS_LABELS,
  WORKPLACE_TYPE_LABELS,
  formatJobMeta,
  formatSalaryRange,
} from "@/features/jobs/constants/labels";

export default function CompanyOverviewPage() {
  const params = useParams<{ orgSlug: string; workspaceSlug: string }>();
  const orgSlug = params.orgSlug;
  const workspaceSlug = params.workspaceSlug;
  const { data: workspace, isLoading, error } = useWorkspace(orgSlug, workspaceSlug);
  const { data: jobs, isLoading: jobsLoading } = useOrgJobs(orgSlug, {
    workspaceSlug,
  });
  const { data: savedTalent } = useWorkspaceTalent(orgSlug, workspaceSlug);

  if (isLoading) {
    return (
      <HiringLoadingState
        backHref={`/company/${orgSlug}`}
        backLabel="← Back to organization"
        message="Loading workspace…"
      />
    );
  }

  if (error || !workspace) {
    return (
      <HiringNotFoundState
        backHref={`/company/${orgSlug}`}
        backLabel="← Back to organization"
        title="Workspace not found"
        description="You may not have access to this workspace."
      />
    );
  }

  const recentJobs = (jobs ?? []).slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}`}>← Back to organization</Link>
      </Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="eyebrow uppercase">Workspace</p>
          <h1 className="text-h2 text-text-primary">{workspace.name}</h1>
          <p className="max-w-xl text-body-sm text-text-secondary">
            {workspace.description ||
              "Create jobs and receive Livefolio applications from candidates."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/company/${orgSlug}/${workspaceSlug}/jobs/new`}>
              <Plus className="h-4 w-4" />
              Create job
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Published", value: workspace.jobCounts.published },
          { label: "Drafts", value: workspace.jobCounts.draft },
          { label: "Total jobs", value: workspace.jobCounts.total },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]"
          >
            <p className="text-label uppercase text-text-secondary">
              {stat.label}
            </p>
            <p className="mt-2 text-h3 text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-h3 text-text-primary">Recent jobs</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/company/${orgSlug}/${workspaceSlug}/jobs`}>View all</Link>
          </Button>
        </div>

        {jobsLoading ? (
          <p className="text-body-sm text-text-muted">Loading jobs…</p>
        ) : recentJobs.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-fill/12">
              <Briefcase className="h-6 w-6 text-brand-secondary" aria-hidden />
            </span>
            <h2 className="mt-4 text-h3 text-text-primary">No jobs yet</h2>
            <p className="mt-1 text-body-sm text-text-secondary">
              Publish your first role and share the Apply with Livefolio link.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/company/${orgSlug}/${workspaceSlug}/jobs/new`}>Create a job</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border-default rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
            {recentJobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/company/${orgSlug}/${workspaceSlug}/jobs/${job.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-base"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium text-text-primary">
                      {job.title}
                    </p>
                    <p className="text-body-sm text-text-secondary">
                      {formatJobMeta([
                        job.location,
                        job.employmentType
                          ? EMPLOYMENT_TYPE_LABELS[job.employmentType]
                          : null,
                        job.workplaceType
                          ? WORKPLACE_TYPE_LABELS[job.workplaceType]
                          : null,
                        formatSalaryRange({
                          min: job.salaryMin,
                          max: job.salaryMax,
                          currency: job.salaryCurrency,
                        }),
                        `${job._count?.applications ?? 0} applicants`,
                      ])}
                    </p>
                  </div>
                  <Badge
                    variant={
                      job.status === "published" ? "success" : "neutral"
                    }
                  >
                    {JOB_STATUS_LABELS[job.status] ?? job.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(savedTalent?.people.length ?? 0) > 0 ? (
        <section className="space-y-4">
          <h2 className="text-h3 text-text-primary">Saved talent</h2>
          <ul className="divide-y divide-border-default rounded-[var(--radius-lg)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
            {savedTalent?.people.map((person) => (
              <li
                key={person.slug}
                className="flex items-center justify-between gap-3 px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={person.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback>
                      {(person.title || "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">
                      {person.title || "Untitled"}
                    </p>
                    {person.headline ? (
                      <p className="truncate text-body-sm text-text-secondary">
                        {person.headline}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={person.livefolioUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Livefolio
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
