"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { usePublicJob } from "@/features/jobs/api/use-jobs";
import { PublicJobView } from "@/features/jobs/components/public-job-view";

export default function PublicJobPage() {
  const params = useParams<{ jobSlug: string }>();
  const jobSlug = params.jobSlug;
  const { data: job, isLoading } = usePublicJob(jobSlug);
  const { status } = useSession();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base text-body-sm text-text-muted">
        Loading job…
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-base px-6 text-center">
        <h1 className="text-h2 text-text-primary">Job not found</h1>
        <p className="text-body-sm text-text-secondary">
          This role may be closed or the link is incorrect.
        </p>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  const applyHref =
    status === "authenticated"
      ? `/jobs/${job.slug}/apply`
      : `/sign-in?callbackUrl=${encodeURIComponent(`/jobs/${job.slug}/apply`)}`;

  return <PublicJobView job={job} applyHref={applyHref} />;
}
