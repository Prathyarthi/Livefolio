"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMyApplications } from "@/features/applications/api/use-applications";
import { APPLICATION_STATUS_LABELS } from "@/features/jobs/constants/labels";
import { ListPagination } from "@/components/list-pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export default function MyApplicationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useMyApplications({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const applications = data?.applications ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard">← Back to dashboard</Link>
      </Button>
      <header className="space-y-1">
        <p className="eyebrow uppercase">Applications</p>
        <h1 className="text-h2 text-text-primary">My applications</h1>
        <p className="text-body-sm text-text-secondary">
          Track jobs you&apos;ve applied to with your Livefolio.
        </p>
      </header>

      {isLoading ? (
        <p className="text-body-sm text-text-muted">Loading applications…</p>
      ) : error ? (
        <p className="text-body-sm text-semantic-danger">
          {error instanceof Error ? error.message : "Failed to load"}
        </p>
      ) : applications.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-default px-6 py-12 text-center">
          <h2 className="text-h3 text-text-primary">No applications yet</h2>
          <p className="mt-1 text-body-sm text-text-secondary">
            When you apply to a job with Livefolio, it will show up here.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-border-default rounded-[var(--radius-lg)] border border-border-default bg-surface-raised">
            {applications.map((application) => (
              <li key={application.id}>
                <Link
                  href={`/dashboard/applications/${application.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-base"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium text-text-primary">
                      {application.job.title}
                    </p>
                    <p className="text-body-sm text-text-secondary">
                      {application.job.organization.name} · Applied{" "}
                      {new Date(application.submittedAt).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </p>
                  </div>
                  <Badge variant="neutral">
                    {APPLICATION_STATUS_LABELS[application.status] ??
                      application.status}
                  </Badge>
                </Link>
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