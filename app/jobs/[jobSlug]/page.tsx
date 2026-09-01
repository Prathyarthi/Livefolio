"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublicJob } from "@/features/jobs/api/use-jobs";
import {
  JobHighlights,
  JobPerkPills,
} from "@/features/jobs/components/job-highlights";
import { splitRichLines } from "@/features/jobs/constants/labels";
import { OrgBanner, OrgLogo } from "@/features/organization/components/org-logo";
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
  const required = job.requirements.filter((r) => r.type === "required");
  const preferred = job.requirements.filter((r) => r.type === "preferred");
  const applyHref =
    status === "authenticated"
      ? `/jobs/${job.slug}/apply`
      : `/sign-in?callbackUrl=${encodeURIComponent(`/jobs/${job.slug}/apply`)}`;
  const isPaused = job.status === "paused";

  return (
    <div className="min-h-screen bg-surface-base">
      <header className="sticky top-0 z-20 border-b border-border-default bg-surface-raised/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
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

      <div className="relative h-44 overflow-hidden md:h-64">
        <OrgBanner bannerUrl={org.bannerUrl} brandColor={org.brandColor} />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-base via-surface-base/20 to-transparent" />
      </div>

      <main className="mx-auto w-full max-w-5xl px-6 pb-16">
        <div className="-mt-10 flex flex-col gap-10 md:-mt-12 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-8">
            <section className="space-y-5">
              <div className="flex flex-wrap items-end gap-4">
                <OrgLogo
                  name={org.name}
                  logoUrl={org.logoUrl}
                  brandColor={org.brandColor}
                  size="lg"
                />
                <div className="min-w-0 pb-1">
                  <p className="font-medium text-text-primary">{org.name}</p>
                  {org.location ? (
                    <p className="text-body-sm text-text-secondary">{org.location}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-h1 text-text-primary">{job.title}</h1>
                  {isPaused ? (
                    <Badge variant="neutral">Applications paused</Badge>
                  ) : null}
                </div>
                <JobPerkPills job={job} />
              </div>
            </section>

            <JobHighlights job={job} />

            <JobTextSection title="About the role" body={job.description} />
            <JobTextSection title="Responsibilities" body={job.responsibilities} />
            {(required.length > 0 || preferred.length > 0) && (
              <section className="grid gap-4 sm:grid-cols-2">
                <RequirementCard title="Required" items={required.map((r) => r.label)} />
                <RequirementCard title="Preferred" items={preferred.map((r) => r.label)} />
              </section>
            )}
            <JobTextSection title="Qualifications" body={job.qualifications} />
            <JobTextSection title="Benefits" body={job.benefits} />

            {org.description ? (
              <section className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] md:p-8">
                <h2 className="text-h3 text-text-primary">About {org.name}</h2>
                <p className="mt-4 whitespace-pre-wrap text-body text-text-secondary">
                  {org.description}
                </p>
                {org.websiteUrl ? (
                  <a
                    href={org.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-body-sm text-brand-primary"
                  >
                    Company website
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </section>
            ) : null}
          </div>

          <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-80">
            <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-h3 text-text-primary">Apply with your Livefolio</h2>
              <p className="mt-2 text-body-sm text-text-secondary">
                Share a living professional profile — experience, work, and
                evidence — instead of a static resume.
              </p>
              <Button asChild size="lg" className="mt-5 w-full" disabled={isPaused}>
                <Link href={applyHref}>Apply with Livefolio</Link>
              </Button>
              {isPaused ? (
                <p className="mt-3 text-body-sm text-text-muted">
                  This company has temporarily paused applications.
                </p>
              ) : null}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function JobTextSection({
  title,
  body,
}: {
  title: string;
  body: string | null;
}) {
  if (!body?.trim()) return null;
  const lines = splitRichLines(body);
  return (
    <section className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] md:p-8">
      <h2 className="text-h3 text-text-primary">{title}</h2>
      {lines.length > 1 ? (
        <ul className="mt-4 space-y-2.5 text-body text-text-secondary">
          {lines.map((line) => (
            <li key={line} className="flex gap-3">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 whitespace-pre-wrap text-body text-text-secondary">
          {body}
        </p>
      )}
    </section>
  );
}

function RequirementCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-h3 text-text-primary">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-body-sm text-text-muted">None listed</p>
      ) : (
        <ul className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-full border border-border-default bg-surface-base px-3 py-1.5 text-body-sm text-text-primary"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
