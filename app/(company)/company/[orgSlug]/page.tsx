"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrganization } from "@/features/organization/api/use-organization";
import { useOrgJobs } from "@/features/jobs/api/use-jobs";
import {
  EMPLOYMENT_TYPE_LABELS,
  JOB_STATUS_LABELS,
  WORKPLACE_TYPE_LABELS,
  formatJobMeta,
} from "@/features/jobs/constants/labels";

export default function CompanyOverviewPage() {
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const { data: org, isLoading, error } = useOrganization(orgSlug);
  const { data: jobs, isLoading: jobsLoading } = useOrgJobs(orgSlug);

  if (isLoading) {
    return (
      <div className="p-8 text-body-sm text-text-muted">Loading workspace…</div>
    );
  }

  if (error || !org) {
    return (
      <div className="p-8">
        <h1 className="text-h3 text-text-primary">Workspace not found</h1>
        <p className="mt-2 text-body-sm text-text-secondary">
          You may not have access to this company workspace.
        </p>
        <Button asChild className="mt-4">
          <Link href="/company">Back to companies</Link>
        </Button>
      </div>
    );
  }

  const recentJobs = (jobs ?? []).slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/company">← Back to companies</Link>
      </Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="eyebrow uppercase">Overview</p>
          <h1 className="text-h2 text-text-primary">{org.name}</h1>
          <p className="max-w-xl text-body-sm text-text-secondary">
            {org.description ||
              "Create jobs and receive Livefolio applications from candidates."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/company/${orgSlug}/jobs/new`}>
              <Plus className="h-4 w-4" />
              Create job
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/company/${orgSlug}/settings`}>
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Published", value: org.jobCounts.published },
          { label: "Drafts", value: org.jobCounts.draft },
          { label: "Total jobs", value: org.jobCounts.total },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5"
          >
            <p className="text-label uppercase text-text-secondary">
              {stat.label}
            </p>
            <p className="mt-2 text-h2 text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-h3 text-text-primary">Recent jobs</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/company/${orgSlug}/jobs`}>View all</Link>
          </Button>
        </div>

        {jobsLoading ? (
          <p className="text-body-sm text-text-muted">Loading jobs…</p>
        ) : recentJobs.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border-default bg-surface-raised px-6 py-10 text-center">
            <Briefcase className="mx-auto h-8 w-8 text-text-muted" />
            <h3 className="mt-3 text-h3 text-text-primary">No jobs yet</h3>
            <p className="mt-1 text-body-sm text-text-secondary">
              Publish your first role and share the Apply with Livefolio link.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/company/${orgSlug}/jobs/new`}>Create a job</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border-default rounded-[var(--radius-lg)] border border-border-default bg-surface-raised">
            {recentJobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/company/${orgSlug}/jobs/${job.id}/applicants`}
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
    </div>
  );
}
