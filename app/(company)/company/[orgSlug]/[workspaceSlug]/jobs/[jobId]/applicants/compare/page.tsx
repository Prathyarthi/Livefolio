"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryError } from "@/features/organization/components/workspace-ui";
import { useApplicantPool } from "@/features/applications/api/use-applications";
import {
  ApplicantCompareView,
  MAX_COMPARE_CANDIDATES,
  MIN_COMPARE_CANDIDATES,
} from "@/features/applications/components/applicant-compare-view";

export default function CompareApplicantsPage() {
  const params = useParams<{ orgSlug: string; workspaceSlug: string; jobId: string }>();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug;
  const workspaceSlug = params.workspaceSlug;
  const jobId = params.jobId;

  const ids = useMemo(() => {
    const raw = searchParams.get("ids") ?? "";
    const parsed = raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    return Array.from(new Set(parsed)).slice(0, MAX_COMPARE_CANDIDATES);
  }, [searchParams]);

  // Load exactly the selected applications, whatever page they were picked from.
  const poolQuery = useApplicantPool(jobId, {
    ids,
    pageSize: MAX_COMPARE_CANDIDATES,
    enabled: ids.length >= MIN_COMPARE_CANDIDATES,
  });

  const selected = useMemo(() => {
    if (!poolQuery.data) return [];
    const byId = new Map(
      poolQuery.data.applicants.map((applicant) => [applicant.id, applicant]),
    );
    return ids
      .map((id) => byId.get(id))
      .filter((applicant): applicant is NonNullable<typeof applicant> =>
        Boolean(applicant),
      );
  }, [poolQuery.data, ids]);

  if (ids.length < MIN_COMPARE_CANDIDATES) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-6 md:p-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/company/${orgSlug}/${workspaceSlug}/jobs/${jobId}/applicants`}>
            ← Back to applicants
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Select candidates</h1>
        <p className="text-body-sm text-text-secondary">
          Choose at least {MIN_COMPARE_CANDIDATES} applicants from the pool to
          compare evidence.
        </p>
      </div>
    );
  }

  if (poolQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] space-y-6 p-6 md:p-8" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-72" />
        </div>
        <div className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-border-default" style={{ gridTemplateColumns: `14rem repeat(${ids.length}, minmax(0, 1fr))` }}>
          {Array.from({ length: (ids.length + 1) * 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-none" />
          ))}
        </div>
      </div>
    );
  }

  if (poolQuery.error || !poolQuery.data) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-6 md:p-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/company/${orgSlug}/${workspaceSlug}/jobs/${jobId}/applicants`}>
            ← Back to applicants
          </Link>
        </Button>
        <QueryError
          error={poolQuery.error}
          fallback="Failed to load applicants"
          onRetry={() => void poolQuery.refetch()}
        />
      </div>
    );
  }

  if (selected.length < MIN_COMPARE_CANDIDATES) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-6 md:p-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/company/${orgSlug}/${workspaceSlug}/jobs/${jobId}/applicants`}>
            ← Back to applicants
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Candidates unavailable</h1>
        <p className="text-body-sm text-text-secondary">
          Some selected applicants could not be found in this job. Go back and
          select again.
        </p>
      </div>
    );
  }

  return (
    <ApplicantCompareView
      orgSlug={orgSlug}
      workspaceSlug={workspaceSlug}
      jobId={jobId}
      jobTitle={poolQuery.data.job.title}
      applicants={selected}
      requirements={poolQuery.data.job.requirements}
    />
  );
}