"use client";

import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/rich-text";
import {
  JobHighlights,
  JobPerkPills,
} from "@/features/jobs/components/job-highlights";
import {
  JobRequirementCard,
  JobTextSection,
} from "@/features/jobs/components/job-text-section";
import type { Job, JobOrganization } from "@/features/jobs/api/use-jobs";
import {
  formStateToJobInput,
  type JobRoleFormState,
} from "@/features/jobs/lib/role-fields";
import { OrgBanner, OrgLogo } from "@/features/organization/components/org-logo";
import { stripRichTextToPlain } from "@/lib/rich-text";

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
  | "verified"
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
      verified: org.verified,
    },
    requirements: input.requirements ?? [],
  };
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
  const hasTitle = Boolean(stripRichTextToPlain(form.title));

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
              <p className="flex items-center gap-1.5 font-medium text-text-primary">
                <RichText as="span" text={org.name} />
                {org.verified ? (
                  <BadgeCheck className="size-4 shrink-0 text-sky-500" aria-label="Verified company" />
                ) : null}
              </p>
              
              {org.location ? (
                <p className="text-body-sm text-text-secondary">
                  <RichText as="span" text={org.location} />
                </p>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <h2
              className={`text-xl font-semibold tracking-tight ${
                hasTitle ? "text-text-primary" : "text-text-muted"
              }`}
            >
              <RichText as="span" text={job.title} />
            </h2>
            <JobPerkPills job={job} />
          </div>

          <JobHighlights job={job} compact={compact} />

          <JobTextSection
            compact
            title="About the role"
            body={job.description || null}
            emptyHint="Add a description to show candidates what this role is about."
          />
          <JobTextSection
            compact
            title="Responsibilities"
            body={job.responsibilities}
          />
          {(required.length > 0 || preferred.length > 0) && (
            <div className="grid gap-3">
              <JobRequirementCard compact title="Required" items={required} />
              <JobRequirementCard compact title="Preferred" items={preferred} />
            </div>
          )}
          <JobTextSection
            compact
            title="Qualifications"
            body={job.qualifications}
          />
          <JobTextSection compact title="Benefits" body={job.benefits} />
          <Button size="sm" disabled>
            Apply with Livefolio
          </Button>
        </div>
      </div>
    </aside>
  );
}