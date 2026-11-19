import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Briefcase,
  Building2,
  Calendar,
  CircleCheck,
  Gift,
  GraduationCap,
  Info,
  MapPin,
} from "lucide-react";
import { RichText } from "@/components/rich-text";
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
import { OrgBanner, OrgLogo } from "@/features/organization/components/org-logo";
import { cn } from "@/lib/utils";

type Stat = {
  key: string;
  label: string;
  icon: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
};

function formatExperienceDisplay(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return `${min} – ${max} Years`;
  if (min != null) return `${min}+ Years`;
  return `Up to ${max} Years`;
}

function Section({
  title,
  aside,
  children,
}: {
  title: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border-default pb-2.5">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-primary">
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function bodyCopyClass(compact: boolean) {
  return cn(
    "leading-relaxed text-text-secondary",
    compact ? "text-sm" : "text-[15px]",
  );
}

export function CandidateJobBody({
  job,
  compact = false,
  framed = true,
  titlePlaceholder = false,
  showEmptyAbout = false,
  showCompany = false,
  showBanner = true,
  paused = false,
  footer,
}: {
  job: Job;
  compact?: boolean;
  framed?: boolean;
  titlePlaceholder?: boolean;
  showEmptyAbout?: boolean;
  showCompany?: boolean;
  /** Set false when the parent already paints a full-bleed org banner. */
  showBanner?: boolean;
  paused?: boolean;
  footer?: ReactNode;
}) {
  const org = job.organization;
  const workplaceLabel = job.workplaceType
    ? (WORKPLACE_TYPE_LABELS[job.workplaceType] ?? job.workplaceType)
    : null;
  const employmentLabel = job.employmentType
    ? (EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType)
    : null;
  const salary = formatSalaryRange({
    min: job.salaryMin,
    max: job.salaryMax,
    currency: job.salaryCurrency,
  });
  const experience = formatExperienceDisplay(job.experienceMin, job.experienceMax);
  const deadline = formatDeadline(job.applicationDeadline);
  const pills = [
    job.department?.trim()
      ? { key: "department", text: job.department.trim() }
      : null,
    workplaceLabel ? { key: "workplace", text: workplaceLabel } : null,
    employmentLabel ? { key: "employment", text: employmentLabel } : null,
  ].filter((pill): pill is { key: string; text: string } => Boolean(pill));

  const stats: Stat[] = [];
  if (salary) {
    stats.push({
      key: "compensation",
      label: "Compensation",
      icon: <Banknote className="size-3.5" />,
      value: <RichText as="span" text={salary} />,
      detail: "/ year",
    });
  }
  if (experience) {
    stats.push({
      key: "experience",
      label: "Experience",
      icon: <GraduationCap className="size-3.5" />,
      value: experience,
    });
  }
  if (employmentLabel) {
    stats.push({
      key: "employment",
      label: "Employment type",
      icon: <Briefcase className="size-3.5" />,
      value: employmentLabel,
    });
  }
  if (workplaceLabel || job.location) {
    stats.push({
      key: "workplace",
      label: "Workplace model",
      icon: <Building2 className="size-3.5" />,
      value: (
        <>
          {workplaceLabel}
          {workplaceLabel && job.location ? " (" : null}
          {job.location ? <RichText as="span" text={job.location} /> : null}
          {workplaceLabel && job.location ? ")" : null}
        </>
      ),
    });
  }
  if (Array.isArray(job.customFields)) {
    for (const field of job.customFields as CustomFieldDraft[]) {
      if (!field.label?.trim() || !field.value?.trim()) continue;
      stats.push({
        key: `custom-${field.id ?? field.label}`,
        label: field.label,
        icon: <Info className="size-3.5" />,
        value: <RichText as="span" text={field.value} />,
      });
    }
  }

  const required = job.requirements.filter(
    (item) => item.type === "required" && item.label.trim(),
  );
  const preferred = job.requirements.filter(
    (item) => item.type === "preferred" && item.label.trim(),
  );
  const showMatch = required.length > 0 || preferred.length > 0;

  const responsibilityLines = splitRichLines(job.responsibilities);
  const qualificationLines = splitRichLines(job.qualifications);
  const benefits = job.benefits?.trim() ?? "";
  const description = job.description?.trim() ?? "";
  const copy = bodyCopyClass(compact);
  const hasBannerAsset = Boolean(org.bannerUrl);
  const paintBanner = showBanner && hasBannerAsset;
  const hasLogo = Boolean(org.logoUrl);
  const showBrandHeader = hasLogo || hasBannerAsset;

  return (
    <article
      className={cn(
        framed &&
          "overflow-hidden rounded-[20px] border border-border-default bg-surface-raised",
      )}
    >
      {paintBanner ? (
        <div
          className={cn(
            "relative w-full overflow-hidden",
            compact ? "aspect-[4/1]" : "h-40 md:h-52",
          )}
        >
          <OrgBanner bannerUrl={org.bannerUrl} brandColor={org.brandColor} />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-raised to-transparent" />
        </div>
      ) : showBanner || !hasBannerAsset ? (
        <div className="h-1 bg-brand-secondary" />
      ) : null}
      <div
        className={cn(
          "space-y-8",
          compact ? "px-4 py-5" : "px-5 py-6 md:px-7 md:py-8",
        )}
      >
        {showBrandHeader ? (
          <div className="flex flex-wrap items-start gap-4">
            {hasLogo ? (
              <div
                className={cn(
                  "relative z-10 shrink-0",
                  paintBanner && (compact ? "-mt-10" : "-mt-12"),
                )}
              >
                <OrgLogo
                  name={org.name}
                  logoUrl={org.logoUrl}
                  brandColor={org.brandColor}
                  size="lg"
                />
              </div>
            ) : null}
            <div className={cn("min-w-0", hasLogo && paintBanner && "pt-1")}>
              <p className="flex items-center gap-1.5 font-medium text-text-primary">
                <RichText as="span" text={org.name} />
                {org.verified ? (
                  <BadgeCheck
                    className="size-4 shrink-0 text-sky-500"
                    aria-label="Verified company"
                  />
                ) : null}
              </p>
              {org.location ? (
                <p className="text-sm text-text-secondary">
                  <RichText as="span" text={org.location} />
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {pills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {pills.map((pill, index) => (
              <span
                key={pill.key}
                className={cn(
                  "rounded-full bg-surface-sunken px-3.5 py-1.5 text-[13px] font-medium dark:bg-black/40",
                  index === 0 ? "text-brand-secondary" : "text-text-primary",
                )}
              >
                <RichText as="span" text={pill.text} />
              </span>
            ))}
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className={cn(
                "min-w-0 font-semibold tracking-[-0.03em] text-text-primary",
                compact
                  ? "text-[1.65rem] leading-[1.15]"
                  : "text-3xl leading-[1.12] sm:text-4xl",
                titlePlaceholder && "text-text-muted",
              )}
            >
              <RichText as="span" text={job.title} />
            </h1>
            {paused ? <Badge variant="neutral">Applications paused</Badge> : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
            {!showBrandHeader ? (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5 shrink-0 text-text-muted" />
                <RichText as="span" text={org.name} />
                {org.verified ? (
                  <BadgeCheck
                    className="size-3.5 shrink-0 text-sky-500"
                    aria-label="Verified company"
                  />
                ) : null}
              </span>
            ) : null}
            {job.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 text-text-muted" />
                <RichText as="span" text={job.location} />
              </span>
            ) : null}
            {deadline ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 shrink-0 text-text-muted" />
                Deadline: {deadline}
              </span>
            ) : null}
          </div>
        </div>

        {stats.length > 0 ? (
          <dl className="grid gap-5 rounded-2xl border border-border-default px-4 py-4 sm:grid-cols-3 sm:px-5 sm:py-5">
            {stats.map((stat) => (
              <div key={stat.key} className="min-w-0">
                <dt className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
                  <RichText as="span" text={stat.label} />
                </dt>
                <dd className="mt-2 flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-brand-secondary">{stat.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold leading-snug text-text-primary">
                      {stat.value}
                    </span>
                    {stat.detail ? (
                      <span className="mt-0.5 block text-sm text-text-secondary">
                        {stat.detail}
                      </span>
                    ) : null}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {description || showEmptyAbout ? (
          <Section title="About the role">
            {description ? (
              <RichText
                as="p"
                text={description}
                className={cn("whitespace-pre-wrap", copy)}
              />
            ) : (
              <p className="text-sm text-text-muted">
                Add a description to show candidates what this role is about.
              </p>
            )}
          </Section>
        ) : null}

        {showMatch ? (
          <Section
            title="Candidate match criteria"
            aside={
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">
                Automated screening criteria
              </p>
            }
          >
            <div className="flex flex-col items-start gap-3">
              {required.map((item) => (
                <div
                  key={item.id ?? item.label}
                  className="w-fit max-w-full rounded-xl border border-brand-secondary/40 bg-brand-secondary/[0.08] px-4 py-3.5"
                >
                  <p className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-brand-secondary">
                    Must have
                  </p>
                  <p className="mt-2 text-[15px] font-semibold leading-snug text-text-primary">
                    <RichText as="span" text={item.label} />
                  </p>
                </div>
              ))}
              {preferred.map((item) => (
                <div
                  key={item.id ?? item.label}
                  className="w-fit max-w-full rounded-xl border border-border-default bg-surface-sunken/60 px-4 py-3.5"
                >
                  <p className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-text-muted">
                    Nice to have
                  </p>
                  <p className="mt-2 text-[15px] font-semibold leading-snug text-text-primary">
                    <RichText as="span" text={item.label} />
                  </p>
                </div>
              ))}
            </div>
          </Section>
        ) : null}

        {responsibilityLines.length > 0 ? (
          <Section title="Key responsibilities">
            <ul className={cn("space-y-3", copy)}>
              {responsibilityLines.map((line, index) => (
                <li key={`${index}-${line}`} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-secondary" />
                  <RichText as="span" text={line} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {qualificationLines.length > 0 ? (
          <Section title="Qualifications">
            <ul className={cn("space-y-3", copy)}>
              {qualificationLines.map((line, index) => (
                <li key={`${index}-${line}`} className="flex items-start gap-3">
                  <span className="flex h-[1lh] shrink-0 items-center text-brand-secondary">
                    <CircleCheck className="size-4" />
                  </span>
                  <RichText as="span" text={line} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {benefits ? (
          <Section title="Benefits">
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border border-border-default px-4 py-4",
                copy,
              )}
            >
              <span className="flex h-[1lh] shrink-0 items-center text-brand-secondary">
                <Gift className="size-4" />
              </span>
              <RichText
                as="p"
                text={benefits}
                className="min-w-0 whitespace-pre-wrap"
              />
            </div>
          </Section>
        ) : null}

        {showCompany && (org.description?.trim() || org.websiteUrl) ? (
          <Section
            title={
              <>
                About <RichText as="span" text={org.name} />
              </>
            }
          >
            {org.description?.trim() ? (
              <RichText
                as="p"
                text={org.description}
                className={cn("whitespace-pre-wrap", copy)}
              />
            ) : null}
            {org.websiteUrl ? (
              <a
                href={org.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "inline-flex items-center gap-1 text-brand-secondary",
                  org.description?.trim() && "mt-3",
                  copy,
                )}
              >
                Company website
                <ArrowUpRight className="size-3.5" />
              </a>
            ) : null}
          </Section>
        ) : null}

        {footer}
      </div>
    </article>
  );
}
