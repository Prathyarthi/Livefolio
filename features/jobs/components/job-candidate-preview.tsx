"use client";

import { Button } from "@/components/ui/button";
import {
  JobHighlights,
  JobPerkPills,
} from "@/features/jobs/components/job-highlights";
import type { Job, JobOrganization } from "@/features/jobs/api/use-jobs";
import {
  formStateToJobInput,
  type JobRoleFormState,
} from "@/features/jobs/lib/role-fields";
import { splitRichLines } from "@/features/jobs/constants/labels";
import { OrgBanner, OrgLogo } from "@/features/organization/components/org-logo";

type PreviewOrg = Pick<
  JobOrganization,
  | "id"
  | "name"
  | "slug"
  | "logoUrl"
  | "bannerUrl"
  | "brandColor"
  | "description"
  | "websiteUrl"
  | "location"
>;

function formToPreviewJob(form: JobRoleFormState, org: PreviewOrg): Job {
  const input = formStateToJobInput(form);
  const now = new Date().toISOString();
  return {
    id: "preview",
    organizationId: org.id,
    workspaceId: "preview",
    title: input.title || "Role title",
    slug: "preview",
    description: input.description || "",
    department: input.department ?? null,
    employmentType: input.employmentType ?? null,
    location: input.location ?? null,
    workplaceType: input.workplaceType ?? null,
    experienceMin: input.experienceMin ?? null,
    experienceMax: input.experienceMax ?? null,
    salaryMin: input.salaryMin ?? null,
    salaryMax: input.salaryMax ?? null,
    salaryCurrency: input.salaryCurrency ?? "USD",
    customFields: input.customFields ?? [],
    screeningQuestions: input.screeningQuestions ?? [],
    responsibilities: input.responsibilities ?? null,
    qualifications: input.qualifications ?? null,
    benefits: input.benefits ?? null,
    applicationDeadline: input.applicationDeadline ?? null,
    status: "draft",
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
      bannerUrl: org.bannerUrl,
      brandColor: org.brandColor,
      description: org.description,
      websiteUrl: org.websiteUrl,
      location: org.location,
    },
    requirements: input.requirements ?? [],
  };
}

function PreviewTextSection({
  title,
  body,
  emptyHint,
}: {
  title: string;
  body: string | null;
  emptyHint?: string;
}) {
  const trimmed = body?.trim() ?? "";
  if (!trimmed) {
    if (!emptyHint) return null;
    return (
      <section className="rounded-[var(--radius-lg)] border border-dashed border-border-default bg-surface-raised/80 p-4">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        <p className="mt-2 text-body-sm text-text-muted">{emptyHint}</p>
      </section>
    );
  }

  const lines = splitRichLines(trimmed);
  return (
    <section className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      {lines.length > 1 ? (
        <ul className="mt-3 space-y-2 text-body-sm text-text-secondary">
          {lines.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-body-sm text-text-secondary">
          {trimmed}
        </p>
      )}
    </section>
  );
}

function PreviewRequirementCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-body-sm text-text-muted">None listed yet</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-full border border-border-default bg-surface-base px-2.5 py-1 text-xs text-text-primary"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function JobCandidatePreview({
  form,
  organization,
  compact = true,
}: {
  form: JobRoleFormState;
  organization: PreviewOrg;
  compact?: boolean;
}) {
  const job = formToPreviewJob(form, organization);
  const org = job.organization;
  const required = job.requirements
    .filter((r) => r.type === "required")
    .map((r) => r.label);
  const preferred = job.requirements
    .filter((r) => r.type === "preferred")
    .map((r) => r.label);
  const hasTitle = Boolean(form.title.trim());

  return (
    <aside className="rounded-[var(--radius-lg)] border border-border-default bg-surface-base shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3 rounded-t-[var(--radius-lg)] border-b border-border-default bg-surface-raised px-4 py-3">
        <div>
          <p className="text-label uppercase text-text-secondary">
            Candidate view
          </p>
          <p className="text-xs text-text-muted">
            Live preview of the public job page
          </p>
        </div>
      </div>

      <div>
        {org.bannerUrl ? (
          <div className="relative aspect-[4/1] w-full overflow-hidden">
            <OrgBanner bannerUrl={org.bannerUrl} brandColor={org.brandColor} />
          </div>
        ) : null}

        <div className="space-y-5 px-4 pb-5 pt-4">
          <div className="flex flex-wrap items-start gap-4">
            {org.logoUrl ? (
              <div
                className={`relative z-10 shrink-0 ${
                  org.bannerUrl ? "-mt-8" : ""
                }`}
              >
                <OrgLogo
                  name={org.name}
                  logoUrl={org.logoUrl}
                  brandColor={org.brandColor}
                  size="lg"
                />
              </div>
            ) : null}
            <div className="min-w-0 pt-1">
              <p className="font-medium text-text-primary">{org.name}</p>
              {org.location ? (
                <p className="text-body-sm text-text-secondary">{org.location}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <h2
              className={`text-xl font-semibold tracking-tight ${
                hasTitle ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {job.title}
            </h2>
            <JobPerkPills job={job} />
          </div>

          <JobHighlights job={job} compact={compact} />

          <PreviewTextSection
            title="About the role"
            body={job.description || null}
            emptyHint="Add a description to show candidates what this role is about."
          />
          <PreviewTextSection
            title="Responsibilities"
            body={job.responsibilities}
          />
          {(required.length > 0 || preferred.length > 0) && (
            <div className="grid gap-3">
              <PreviewRequirementCard title="Required" items={required} />
              <PreviewRequirementCard title="Preferred" items={preferred} />
            </div>
          )}
          <PreviewTextSection
            title="Qualifications"
            body={job.qualifications}
          />
          <PreviewTextSection title="Benefits" body={job.benefits} />

          <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-4 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-medium text-text-primary">
              Apply with your Livefolio
            </h3>
            <p className="mt-1.5 text-xs text-text-secondary">
              Candidates share a living profile instead of a static resume.
            </p>
            {(job.screeningQuestions?.length ?? 0) > 0 ? (
              <p className="mt-1.5 text-xs text-text-muted">
                Applicants will be asked {job.screeningQuestions?.length} extra
                question
                {(job.screeningQuestions?.length ?? 0) === 1 ? "" : "s"}.
              </p>
            ) : null}
            <Button size="sm" className="mt-3 w-full" disabled>
              Apply with Livefolio
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}