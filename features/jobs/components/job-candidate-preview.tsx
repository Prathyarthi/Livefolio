"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Job, JobOrganization } from "@/features/jobs/api/use-jobs";
import { PublicJobView } from "@/features/jobs/components/public-job-view";
import {
  formStateToPreviewJob,
  type JobRoleFormState,
} from "@/features/jobs/lib/role-fields";

export function CandidateViewToggle({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Button
      type="button"
      variant={open ? "secondary" : "outline"}
      onClick={() => onOpenChange(!open)}
    >
      {open ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      {open ? "Hide candidate view" : "Candidate view"}
    </Button>
  );
}

export function JobCandidatePreview({
  form,
  organization,
  job,
}: {
  form: JobRoleFormState;
  organization: JobOrganization;
  job?: Job | null;
}) {
  const previewJob = formStateToPreviewJob(form, organization, {
    id: job?.id,
    slug: job?.slug,
    status: job?.status === "paused" ? "paused" : "published",
    workspaceId: job?.workspaceId,
    createdAt: job?.createdAt,
    updatedAt: job?.updatedAt,
    publishedAt: job?.publishedAt,
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-base">
      <div className="shrink-0 border-b border-border-default bg-surface-raised px-4 py-3">
        <p className="eyebrow uppercase">Candidate view</p>
        <p className="mt-1 text-body-sm text-text-secondary">
          Live preview of the public job page. Changes appear as you type.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PublicJobView job={previewJob} chrome="listing" />
      </div>
    </div>
  );
}
