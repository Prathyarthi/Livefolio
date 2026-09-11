"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Banknote,
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Building2,
  Calendar,
  CircleCheck,
  GraduationCap,
  MapPin,
  Share2,
  Shield,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/features/jobs/api/use-jobs";
import type { CustomFieldDraft } from "@/features/jobs/lib/role-fields";
import {
  EMPLOYMENT_TYPE_LABELS,
  WORKPLACE_TYPE_LABELS,
  formatDeadline,
  formatSalaryRange,
  splitRichLines,
} from "@/features/jobs/constants/labels";
import { OrgBanner } from "@/features/organization/components/org-logo";
import { LogoMark } from "@/components/logo";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const SAVED_JOB_KEY = (slug: string) => `livefolio:saved-job:${slug}`;

export function PublicJobView({
  job,
  preview = false,
  applyHref,
  chrome = "full",
}: {
  job: Job;
  preview?: boolean;
  applyHref?: string;
  chrome?: "full" | "listing";
}) {
  const org = job.organization;
  const jobTitle = job.title;
  const jobPublicSlug = job.slug;
  const required = job.requirements.filter((r) => r.type === "required");
  const preferred = job.requirements.filter((r) => r.type === "preferred");
  const resolvedApplyHref = applyHref ?? `/jobs/${jobPublicSlug}/apply`;
  const isPaused = job.status === "paused";
  const pills = jobPills(job);
  const highlights = jobHighlightItems(job);
  const customFields = filledCustomFields(job);
  const deadline = formatDeadline(job.applicationDeadline);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (preview || !job.slug || job.slug === "preview") return;
    try {
      setSaved(window.localStorage.getItem(SAVED_JOB_KEY(job.slug)) === "1");
    } catch {
      setSaved(false);
    }
  }, [job.slug, preview]);

  async function handleShare() {
    if (preview) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: jobTitle,
          text: `${jobTitle} at ${org.name}`,
          url,
        });
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  function toggleSaved() {
    if (preview) return;
    const next = !saved;
    setSaved(next);
    try {
      window.localStorage.setItem(SAVED_JOB_KEY(jobPublicSlug), next ? "1" : "0");
    } catch {
      /* ignore quota / private mode */
    }
    toast.success(next ? "Job saved" : "Removed from saved jobs");
  }

  const applyButton =
    preview || isPaused ? (
      <Button size="sm" disabled>
        Apply with Livefolio
      </Button>
    ) : (
      <Button asChild size="sm">
        <Link href={resolvedApplyHref}>Apply with Livefolio</Link>
      </Button>
    );

  const listing = (
        <article className="overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-surface-raised shadow-[var(--shadow-card)]">
          <div className="h-1.5 bg-gradient-to-r from-brand-primary via-brand-primary to-brand-secondary" />

          {org.bannerUrl && chrome === "full" ? (
            <div className="relative h-36 overflow-hidden md:h-48">
              <OrgBanner bannerUrl={org.bannerUrl} brandColor={org.brandColor} />
            </div>
          ) : null}

          <div className="px-5 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {pills.map((pill, index) => (
                  <span
                    key={pill}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-body-sm font-medium",
                      index === 0
                        ? "bg-brand-light text-brand-primary"
                        : "bg-surface-sunken text-text-primary",
                    )}
                  >
                    {pill}
                  </span>
                ))}
                {isPaused ? (
                  <Badge variant="neutral">Applications paused</Badge>
                ) : null}
              </div>
              {chrome === "full" ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    aria-label="Share job"
                    disabled={preview}
                    onClick={() => void handleShare()}
                  >
                    <Share2 />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full border-border-strong text-text-secondary hover:text-text-primary"
                    aria-label={saved ? "Remove saved job" : "Save job"}
                    aria-pressed={saved}
                    disabled={preview}
                    onClick={toggleSaved}
                  >
                    {saved ? <BookmarkCheck /> : <Bookmark />}
                  </Button>
                </div>
              ) : null}
            </div>

            <h1 className="mt-5 text-h1 text-text-primary">{job.title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm">
              <MetaItem icon={Building2}>{org.name}</MetaItem>
              {job.location ? (
                <MetaItem icon={MapPin}>{job.location}</MetaItem>
              ) : org.location ? (
                <MetaItem icon={MapPin}>{org.location}</MetaItem>
              ) : null}
              {deadline ? (
                <MetaItem icon={Calendar}>
                  <span className="font-normal text-text-secondary">Deadline: </span>
                  {deadline}
                </MetaItem>
              ) : null}
            </div>

            {highlights.length > 0 ? (
              <ul className="mt-6 grid gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-sunken/70 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((item) => (
                  <li key={`${item.label}-${item.value}`}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                      {item.label}
                    </p>
                    <p className="mt-1.5 flex items-start gap-2 font-semibold text-text-primary">
                      <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
                      <span>{item.value}</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-10 space-y-10">
              <JobTextSection title="About the role" body={job.description} />

              {required.length > 0 || preferred.length > 0 ? (
                <section>
                  <SectionHeading
                    trailing={
                      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                        Automated screening criteria
                      </p>
                    }
                  >
                    Candidate match criteria
                  </SectionHeading>
                  <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                    {required.map((item) => (
                      <li key={item.id ?? item.label}>
                        <CriteriaCard
                          variant="required"
                          label={item.label}
                          description={item.description}
                        />
                      </li>
                    ))}
                    {preferred.map((item) => (
                      <li key={item.id ?? item.label}>
                        <CriteriaCard
                          variant="preferred"
                          label={item.label}
                          description={item.description}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <JobTextSection
                title="Key responsibilities"
                body={job.responsibilities}
                preferList
              />
              <JobTextSection
                title="Qualifications"
                body={job.qualifications}
                preferList
                marker="check"
              />
              <JobTextSection
                title="Benefits"
                body={job.benefits}
                preferList
                marker="sparkle"
                layout="cards"
              />

              {customFields.length > 0 ? (
                <section>
                  <SectionHeading>Additional details</SectionHeading>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    {customFields.map((field) => (
                      <div
                        key={field.id ?? `${field.label}-${field.value}`}
                        className="rounded-[var(--radius-lg)] border border-border-default bg-surface-sunken/70 px-4 py-4"
                      >
                        <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
                          {field.label}
                        </dt>
                        <dd className="mt-1.5 text-body font-semibold text-text-primary">
                          {field.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ) : null}

              {chrome === "full" && org.description ? (
                <section>
                  <SectionHeading>About {org.name}</SectionHeading>
                  <p className="mt-4 whitespace-pre-wrap text-body text-text-secondary">
                    {org.description}
                  </p>
                  {org.websiteUrl ? (
                    <a
                      href={org.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-1 text-body-sm font-medium text-brand-primary"
                    >
                      Company website
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </section>
              ) : null}
            </div>
          </div>
        </article>
  );

  if (chrome === "listing") {
    return listing;
  }

  return (
    <div className={cn(!preview && "min-h-screen", "bg-surface-base")}>
      <header
        className={cn(
          "z-20 border-b border-border-default bg-surface-raised/90 backdrop-blur",
          preview ? "relative" : "sticky top-0",
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
          {preview ? (
            <div className="flex items-center gap-2">
              <LogoMark className="h-7 w-7" />
              <span className="font-display text-sm font-bold text-brand-primary">
                {siteConfig.name}
              </span>
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <LogoMark className="h-7 w-7" />
              <span className="font-display text-sm font-bold text-brand-primary">
                {siteConfig.name}
              </span>
            </Link>
          )}
          {applyButton}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-16 md:px-6 md:py-10">
        {listing}
      </main>
    </div>
  );
}

function SectionHeading({
  children,
  trailing,
}: {
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border-default pb-2.5">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-text-primary">
        {children}
      </h2>
      {trailing}
    </div>
  );
}

function MetaItem({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4 shrink-0 text-text-muted" />
      <span className="font-medium text-text-primary">{children}</span>
    </span>
  );
}

function CriteriaCard({
  variant,
  label,
  description,
}: {
  variant: "required" | "preferred";
  label: string;
  description?: string | null;
}) {
  const isRequired = variant === "required";
  return (
    <div
      className={cn(
        "h-full rounded-[var(--radius-lg)] border bg-brand-primary px-4 py-4 dark:bg-surface-sunken",
        isRequired
          ? "border-brand-secondary/60 dark:bg-brand-secondary/20"
          : "border-success/60 dark:bg-success/20",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]",
          isRequired ? "text-brand-secondary" : "text-success",
        )}
      >
        {isRequired ? (
          <Shield className="h-3.5 w-3.5" />
        ) : (
          <Star className="h-3.5 w-3.5 fill-current" />
        )}
        {isRequired ? "Must have" : "Preferred"}
      </div>
      <p className="mt-2 text-body font-semibold text-white">{label}</p>
      {description?.trim() ? (
        <p className="mt-1.5 text-body-sm text-white/75">{description}</p>
      ) : null}
    </div>
  );
}

function JobTextSection({
  title,
  body,
  preferList = false,
  marker = "dot",
  layout = "list",
}: {
  title: string;
  body: string | null;
  preferList?: boolean;
  marker?: "dot" | "check" | "sparkle";
  layout?: "list" | "cards";
}) {
  if (!body?.trim()) return null;
  const lines = splitRichLines(body);
  const asList = preferList ? lines.length > 0 : lines.length > 1;
  return (
    <section>
      <SectionHeading>{title}</SectionHeading>
      {asList ? (
        <ul
          className={
            layout === "cards"
              ? "mt-5 grid gap-3 sm:grid-cols-2"
              : "mt-4 space-y-2.5 text-body text-text-secondary"
          }
        >
          {lines.map((line) => (
            <li
              key={line}
              className={
                layout === "cards"
                  ? "flex items-start gap-3 rounded-[var(--radius-lg)] border border-border-default bg-surface-sunken/70 px-4 py-3 text-body text-text-primary"
                  : "flex gap-3"
              }
            >
              {marker === "check" ? (
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" />
              ) : marker === "sparkle" ? (
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" />
              ) : (
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
              )}
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

function jobPills(job: Job): string[] {
  const pills: string[] = [];
  if (job.department?.trim()) pills.push(job.department.trim());
  if (job.workplaceType) {
    pills.push(WORKPLACE_TYPE_LABELS[job.workplaceType] ?? job.workplaceType);
  }
  if (job.employmentType) {
    pills.push(EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType);
  }
  return pills;
}

function formatExperienceDisplay(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min} – ${max} Years`;
  if (min != null) return `${min}+ Years`;
  return `Up to ${max} Years`;
}

function workplaceModel(job: Job): string | null {
  const workplace = job.workplaceType
    ? (WORKPLACE_TYPE_LABELS[job.workplaceType] ?? job.workplaceType)
    : null;
  if (workplace && job.location) return `${workplace} (${job.location})`;
  return workplace;
}

type HighlightItem = {
  icon: LucideIcon;
  label: string;
  value: string;
};

function filledCustomFields(job: Job): CustomFieldDraft[] {
  if (!Array.isArray(job.customFields)) return [];
  return (job.customFields as CustomFieldDraft[]).filter(
    (field) => Boolean(field.label?.trim()) && Boolean(field.value?.trim()),
  );
}

function jobHighlightItems(job: Job): HighlightItem[] {
  const items: HighlightItem[] = [];
  const salary = formatSalaryRange({
    min: job.salaryMin,
    max: job.salaryMax,
    currency: job.salaryCurrency,
  });
  if (salary) {
    items.push({
      icon: Banknote,
      label: "Compensation",
      value: `${salary} / year`,
    });
  }
  const experience = formatExperienceDisplay(job.experienceMin, job.experienceMax);
  if (experience) {
    items.push({
      icon: GraduationCap,
      label: "Experience",
      value: experience,
    });
  }
  if (job.employmentType) {
    items.push({
      icon: Briefcase,
      label: "Employment type",
      value: EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType,
    });
  }
  const workplace = workplaceModel(job);
  if (workplace) {
    items.push({
      icon: Building2,
      label: "Workplace model",
      value: workplace,
    });
  }
  return items;
}
