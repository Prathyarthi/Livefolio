"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useApplicantPool } from "@/features/applications/api/use-applications";
import {
  ApplicantCompareView,
  MAX_COMPARE_CANDIDATES,
  MIN_COMPARE_CANDIDATES,
} from "@/features/applications/components/applicant-compare-view";

export default function CompareApplicantsPage() {
  const params = useParams<{ orgSlug: string; jobId: string }>();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug;
  const jobId = params.jobId;

  const ids = useMemo(() => {
    const raw = searchParams.get("ids") ?? "";
    const parsed = raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    return Array.from(new Set(parsed)).slice(0, MAX_COMPARE_CANDIDATES);
  }, [searchParams]);

  const poolQuery = useApplicantPool(jobId);

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
          <Link href={`/company/${orgSlug}/jobs/${jobId}/applicants`}>
            ← Back to applicants
          </Link>
        </Button>
        <h1 className="text-h2 text-text-primary">Select candidates</h1>
        <p className="text-body-sm text-text-secondary">
          Choose at least {MIN_COMPARE_CANDIDATES} applicants from the pool to
          compare evidence.
        </p>
      </div>
    );
  }

  if (poolQuery.isLoading) {
    return (
      <div className="p-8 text-body-sm text-text-muted">
        Loading comparison…
      </div>
    );
  }

  if (poolQuery.error || !poolQuery.data) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-6 md:p-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/company/${orgSlug}/jobs/${jobId}/applicants`}>
            ← Back to applicants
          </Link>
        </Button>
        <p className="text-body-sm text-semantic-danger">
          {poolQuery.error instanceof Error
            ? poolQuery.error.message
            : "Failed to load applicants"}
        </p>
      </div>
    );
  }

  if (selected.length < MIN_COMPARE_CANDIDATES) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-6 md:p-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/company/${orgSlug}/jobs/${jobId}/applicants`}>
            ← Back to applicants
          </Link>
        </Button>
        <h1 className="text-h2 text-text-primary">Candidates unavailable</h1>
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
      jobId={jobId}
      jobTitle={poolQuery.data.job.title}
      applicants={selected}
      requirements={poolQuery.data.job.requirements}
    />
  );
}