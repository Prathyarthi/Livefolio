"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useApplicantPool } from "@/features/applications/api/use-applications";
import {
  ApplicantCompareView,
  MAX_COMPARE_CANDIDATES,
  MIN_COMPARE_CANDIDATES,
} from "@/features/applications/components/applicant-compare-view";
import {
  HiringLoadingState,
  HiringNotFoundState,
} from "@/features/organization/components/hiring-page-chrome";

export default function CompareApplicantsPage() {
  const params = useParams<{ orgSlug: string; workspaceSlug: string; jobId: string }>();
  const searchParams = useSearchParams();
  const orgSlug = params.orgSlug;
  const workspaceSlug = params.workspaceSlug;
  const jobId = params.jobId;
  const backHref = `/company/${orgSlug}/${workspaceSlug}/jobs/${jobId}/applicants`;

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
      <HiringNotFoundState
        className="max-w-[1200px]"
        backHref={backHref}
        backLabel="← Back to applicants"
        title="Select candidates"
        description={`Choose at least ${MIN_COMPARE_CANDIDATES} applicants from the pool to compare evidence.`}
      />
    );
  }

  if (poolQuery.isLoading) {
    return (
      <HiringLoadingState
        className="max-w-[1200px]"
        backHref={backHref}
        backLabel="← Back to applicants"
        message="Loading comparison…"
      />
    );
  }

  if (poolQuery.error || !poolQuery.data) {
    return (
      <HiringNotFoundState
        className="max-w-[1200px]"
        backHref={backHref}
        backLabel="← Back to applicants"
        title="Couldn't load comparison"
        description={
          poolQuery.error instanceof Error
            ? poolQuery.error.message
            : "Failed to load applicants"
        }
      />
    );
  }

  if (selected.length < MIN_COMPARE_CANDIDATES) {
    return (
      <HiringNotFoundState
        className="max-w-[1200px]"
        backHref={backHref}
        backLabel="← Back to applicants"
        title="Candidates unavailable"
        description="Some selected applicants could not be found in this job. Go back and select again."
      />
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
