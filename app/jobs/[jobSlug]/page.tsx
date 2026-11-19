"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { usePublicJob } from "@/features/jobs/api/use-jobs";
import { CandidateJobBody } from "@/features/jobs/components/public-job-view";
import { LogoMark } from "@/components/logo";
import { siteConfig } from "@/lib/site";

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
  const isPaused = job.status === "paused";

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="sticky top-0 z-20 border-b border-border-default bg-surface-raised/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="font-display text-sm font-bold text-brand-primary">
              {siteConfig.name}
            </span>
          </Link>
          <Button asChild size="sm" disabled={isPaused}>
            <Link href={applyHref}>Apply</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <CandidateJobBody
          job={job}
          paused={isPaused}
          showCompany
          footer={
            <Button asChild size="lg" disabled={isPaused}>
              <Link href={applyHref}>Apply with Livefolio</Link>
            </Button>
          }
        />
      </main>
    </div>
  );
}
