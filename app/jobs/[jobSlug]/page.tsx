"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublicJob } from "@/features/jobs/api/use-jobs";
import {
  EMPLOYMENT_TYPE_LABELS,
  WORKPLACE_TYPE_LABELS,
  formatJobMeta,
} from "@/features/jobs/constants/labels";
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

  const org = job.organization;
  const brand = org.brandColor || undefined;
  const required = job.requirements.filter((r) => r.type === "required");
  const preferred = job.requirements.filter((r) => r.type === "preferred");
  const applyHref =
    status === "authenticated"
      ? `/jobs/${job.slug}/apply`
      : `/sign-in?callbackUrl=${encodeURIComponent(`/jobs/${job.slug}/apply`)}`;
  const isPaused = job.status === "paused";

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="border-b border-border-default bg-surface-raised">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <LogoMark className="h-7 w-7" />
            <span className="font-display text-sm font-bold text-brand-primary">
              {siteConfig.name}
            </span>
          </Link>
          <Button asChild size="sm" disabled={isPaused}>
            <Link href={applyHref}>Apply with Livefolio</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-10 px-6 py-10 md:py-14">
        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt=""
                className="h-12 w-12 rounded-[var(--radius-md)] object-cover"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold text-white"
                style={{ background: brand || "var(--brand-primary)" }}
              >
                {org.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-text-primary">{org.name}</p>
              {org.location ? (
                <p className="text-body-sm text-text-secondary">{org.location}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-h1 text-text-primary">{job.title}</h1>
              {isPaused ? <Badge variant="neutral">Applications paused</Badge> : null}
            </div>
            <p className="text-body text-text-secondary">
              {formatJobMeta([
                job.location,
                job.employmentType
                  ? EMPLOYMENT_TYPE_LABELS[job.employmentType]
                  : null,
                job.workplaceType
                  ? WORKPLACE_TYPE_LABELS[job.workplaceType]
                  : null,
                job.department,
              ])}
            </p>
          </div>

          <Button asChild size="lg" disabled={isPaused}>
            <Link href={applyHref}>Apply with Livefolio</Link>
          </Button>
          {isPaused ? (
            <p className="text-body-sm text-text-muted">
              This company has temporarily paused applications.
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <h2 className="text-h3 text-text-primary">About the role</h2>
          <p className="whitespace-pre-wrap text-body text-text-secondary">
            {job.description}
          </p>
        </section>

        {job.responsibilities ? (
          <section className="space-y-3">
            <h2 className="text-h3 text-text-primary">Responsibilities</h2>
            <p className="whitespace-pre-wrap text-body text-text-secondary">
              {job.responsibilities}
            </p>
          </section>
        ) : null}

        {(required.length > 0 || preferred.length > 0) && (
          <section className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-h3 text-text-primary">Required</h2>
              <ul className="list-disc space-y-2 pl-5 text-body text-text-secondary">
                {required.map((r) => (
                  <li key={r.id ?? r.label}>{r.label}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <h2 className="text-h3 text-text-primary">Preferred</h2>
              <ul className="list-disc space-y-2 pl-5 text-body text-text-secondary">
                {preferred.map((r) => (
                  <li key={r.id ?? r.label}>{r.label}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {job.qualifications ? (
          <section className="space-y-3">
            <h2 className="text-h3 text-text-primary">Qualifications</h2>
            <p className="whitespace-pre-wrap text-body text-text-secondary">
              {job.qualifications}
            </p>
          </section>
        ) : null}

        {job.benefits ? (
          <section className="space-y-3">
            <h2 className="text-h3 text-text-primary">Benefits</h2>
            <p className="whitespace-pre-wrap text-body text-text-secondary">
              {job.benefits}
            </p>
          </section>
        ) : null}

        {org.description ? (
          <section className="space-y-3 border-t border-border-default pt-8">
            <h2 className="text-h3 text-text-primary">About {org.name}</h2>
            <p className="whitespace-pre-wrap text-body text-text-secondary">
              {org.description}
            </p>
            {org.websiteUrl ? (
              <a
                href={org.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="text-body-sm text-brand-primary underline"
              >
                Company website
              </a>
            ) : null}
          </section>
        ) : null}

        <section className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 text-center">
          <h2 className="text-h3 text-text-primary">Apply with your Livefolio</h2>
          <p className="mx-auto mt-2 max-w-md text-body-sm text-text-secondary">
            Share a living professional profile — experience, work, and evidence
            — instead of a static resume.
          </p>
          <Button asChild size="lg" className="mt-4" disabled={isPaused}>
            <Link href={applyHref}>Apply with Livefolio</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}