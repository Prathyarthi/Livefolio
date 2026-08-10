"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrgJobs } from "@/features/jobs/api/use-jobs";
import {
  EMPLOYMENT_TYPE_LABELS,
  JOB_STATUS_LABELS,
  WORKPLACE_TYPE_LABELS,
  formatJobMeta,
} from "@/features/jobs/constants/labels";
import { getAppOrigin } from "@/lib/domain";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Drafts" },
  { id: "paused", label: "Paused" },
  { id: "closed", label: "Closed" },
] as const;

export default function CompanyJobsPage() {
  const params = useParams<{ orgSlug: string }>();
  const orgSlug = params.orgSlug;
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const { data: jobs, isLoading } = useOrgJobs(
    orgSlug,
    filter === "all" ? undefined : filter,
  );

  const origin = useMemo(() => getAppOrigin(), []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={`/company/${orgSlug}`}>← Back to overview</Link>
      </Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="eyebrow uppercase">Jobs</p>
          <h1 className="text-h2 text-text-primary">Open roles</h1>
          <p className="text-body-sm text-text-secondary">
            Create, publish, and share jobs. Applicants apply with their
            Livefolio.
          </p>
        </div>
        <Button asChild>
          <Link href={`/company/${orgSlug}/jobs/new`}>
            <Plus className="h-4 w-4" />
            Create job
          </Link>
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.id}
            size="sm"
            variant={filter === item.id ? "default" : "outline"}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-body-sm text-text-muted">Loading jobs…</p>
      ) : !jobs || jobs.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-default px-6 py-12 text-center">
          <h2 className="text-h3 text-text-primary">No jobs in this view</h2>
          <p className="mt-1 text-body-sm text-text-secondary">
            Create a job draft, then publish when you&apos;re ready.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border-default rounded-[var(--radius-lg)] border border-border-default bg-surface-raised">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/company/${orgSlug}/jobs/${job.id}`}
                    className="truncate font-medium text-text-primary hover:underline"
                  >
                    {job.title}
                  </Link>
                  <Badge
                    variant={
                      job.status === "published" ? "success" : "neutral"
                    }
                  >
                    {JOB_STATUS_LABELS[job.status] ?? job.status}
                  </Badge>
                </div>
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
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href={`/company/${orgSlug}/jobs/${job.id}/applicants`}>
                    Applicants ({job._count?.applications ?? 0})
                  </Link>
                </Button>
                {(job.status === "published" || job.status === "paused") && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/jobs/${job.slug}`} target="_blank">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Public page
                    </Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/company/${orgSlug}/jobs/${job.id}`}>
                    Manage
                  </Link>
                </Button>
              </div>
              {(job.status === "published" || job.status === "paused") && (
                <p className="w-full truncate text-mono text-xs text-text-muted">
                  {origin}/jobs/{job.slug}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
