"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePublicJob } from "@/features/jobs/api/use-jobs";
import { RichText } from "@/components/rich-text";
import {
  JobHighlights,
  JobPerkPills,
} from "@/features/jobs/components/job-highlights";
import {
  JobRequirementCard,
  JobTextSection,
} from "@/features/jobs/components/job-text-section";
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
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-6 py-3.5">
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

      {org.bannerUrl ? (
        <div className="relative h-40 overflow-hidden md:h-52">
          <OrgBanner bannerUrl={org.bannerUrl} brandColor={org.brandColor} />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-base to-transparent" />
        </div>
      ) : null}

      <main
        className={`mx-auto w-full max-w-4xl space-y-10 px-6 pb-16 ${
          org.bannerUrl ? "-mt-10" : "pt-10 md:pt-14"
        }`}
      >
        <section className="space-y-6">
          <div className="flex items-center gap-4">
            {org.logoUrl ? (
              <OrgLogo
                name={org.name}
                logoUrl={org.logoUrl}
                brandColor={org.brandColor}
                size="lg"
              />
            ) : null}
            <div className="min-w-0">
              <p className="font-medium text-text-primary">
                <RichText as="span" text={org.name} />
              </p>
              {org.location ? (
                <p className="text-body-sm text-text-secondary">
                  <RichText as="span" text={org.location} />
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-h1 text-text-primary">
                <RichText as="span" text={job.title} />
              </h1>
              {isPaused ? (
                <Badge variant="neutral">Applications paused</Badge>
              ) : null}
            </div>
            <JobPerkPills job={job} />
          </div>
        </section>

        <JobHighlights job={job} />

        <div className="space-y-6">
          <JobTextSection title="About the role" body={job.description} />
          <JobTextSection title="Responsibilities" body={job.responsibilities} />
          {required.length > 0 || preferred.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <JobRequirementCard
                title="Required"
                items={required.map((r) => r.label)}
              />
              <JobRequirementCard
                title="Preferred"
                items={preferred.map((r) => r.label)}
              />
            </div>
          ) : null}
          <JobTextSection title="Qualifications" body={job.qualifications} />
          <JobTextSection title="Benefits" body={job.benefits} />

          {org.description ? (
            <section className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)] md:p-8">
              <h2 className="text-h3 text-text-primary">
                About <RichText as="span" text={org.name} />
              </h2>
              <RichText
                as="p"
                text={org.description}
                className="mt-4 whitespace-pre-wrap text-body text-text-secondary"
              />
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

          <Button asChild size="lg" disabled={isPaused}>
            <Link href={applyHref}>Apply with Livefolio</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
