"use client";

import { Button } from "@/components/ui/button";
import { CandidateJobBody } from "@/features/jobs/components/public-job-view";
import type { Job, JobOrganization } from "@/features/jobs/api/use-jobs";
import {
  formStateToJobInput,
  type JobRoleFormState,
} from "@/features/jobs/lib/role-fields";
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
  const hasTitle = Boolean(stripRichTextToPlain(form.title));

  return (
    <aside className="overflow-hidden rounded-[20px] border border-border-default bg-surface-raised">
      <div className="px-5 pb-4 pt-5">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-brand-secondary">
          Candidate view
        </p>
        <p className="mt-1.5 text-sm text-text-secondary">
          Live preview of the public job page. Changes appear as you type.
        </p>
      </div>
      <CandidateJobBody
        job={job}
        compact={compact}
        framed={false}
        titlePlaceholder={!hasTitle}
        showEmptyAbout
        footer={
          <Button size={compact ? "sm" : "lg"} disabled>
            Apply with Livefolio
          </Button>
        }
      />
    </aside>
  );
}
