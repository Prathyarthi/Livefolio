import { APPLICATION_STATUS_LABELS } from "@/features/jobs/constants/labels";
import {
  statusForStage,
  type PipelineStage,
} from "@/features/applications/lib/pipeline";
import { notify } from "@/lib/notifications";
import { stripRichTextToPlain } from "@/lib/rich-text";

type JobContext = {
  title: string;
  organizationName: string;
};

function plainJobTitle(title: string) {
  return stripRichTextToPlain(title).trim() || "a role";
}

function plainOrgName(name: string) {
  return stripRichTextToPlain(name).trim() || "the company";
}

function applicationHref(applicationId: string) {
  return `/dashboard/applications/${applicationId}`;
}

/**
 * Candidate-only. Fire-and-forget — never await from request handlers.
 * Hiring-team fan-out is intentionally not done here.
 */
export function notifyApplicationSubmitted(input: {
  userId: string;
  applicationId: string;
  job: JobContext;
}) {
  const title = plainJobTitle(input.job.title);
  const org = plainOrgName(input.job.organizationName);
  void notify({
    userId: input.userId,
    type: "application.submitted",
    title: "Application submitted",
    body: `You applied to ${title} at ${org}.`,
    href: applicationHref(input.applicationId),
    metadata: {
      applicationId: input.applicationId,
    },
  });
}

/**
 * Candidate-only status update. Skips when the pipeline stage did not change.
 * Fire-and-forget — never await from request handlers.
 */
export function notifyApplicationStageChanged(input: {
  userId: string;
  applicationId: string;
  job: JobContext;
  previousStage: string;
  stage: PipelineStage;
}) {
  if (input.previousStage === input.stage) return;

  const jobTitle = plainJobTitle(input.job.title);
  const org = plainOrgName(input.job.organizationName);
  const status = statusForStage(input.stage);
  const statusLabel = APPLICATION_STATUS_LABELS[status] ?? status;

  void notify({
    userId: input.userId,
    type: "application.stage_changed",
    title: `${statusLabel}: ${jobTitle}`,
    body: `${org} updated your application to ${statusLabel.toLowerCase()}.`,
    href: applicationHref(input.applicationId),
    metadata: {
      applicationId: input.applicationId,
      stage: input.stage,
      status,
      previousStage: input.previousStage,
    },
  });
}