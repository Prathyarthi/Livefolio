import type { PipelineStage } from "@/features/applications/lib/pipeline";
import { notify } from "@/lib/notifications";
import { stripRichTextToPlain } from "@/lib/rich-text";

type JobContext = {
  title: string;
  organizationName: string;
};

const DECISION_STAGES = new Set<PipelineStage>(["hired", "rejected"]);

function plainJobTitle(title: string) {
  return stripRichTextToPlain(title).trim() || "a role";
}

function plainOrgName(name: string) {
  return stripRichTextToPlain(name).trim() || "the company";
}

function applicationHref(applicationId: string) {
  return `/dashboard/applications/${applicationId}`;
}

function decisionCopy(stage: PipelineStage, jobTitle: string, org: string) {
  if (stage === "hired") {
    return {
      title: `You're hired: ${jobTitle}`,
      body: `Congratulations! ${org} marked your application for ${jobTitle} as hired.`,
    };
  }
  return {
    title: `Update on ${jobTitle}`,
    body: `${org} has decided not to move forward with your application. Thank you for applying.`,
  };
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
 * Candidate-only, hired or rejected only. Fire-and-forget — never await from request handlers.
 */
export function notifyApplicationStageChanged(input: {
  userId: string;
  applicationId: string;
  job: JobContext;
  previousStage: string;
  stage: PipelineStage;
}) {
  if (input.previousStage === input.stage) return;
  if (!DECISION_STAGES.has(input.stage)) return;

  const jobTitle = plainJobTitle(input.job.title);
  const org = plainOrgName(input.job.organizationName);
  const copy = decisionCopy(input.stage, jobTitle, org);

  void notify({
    userId: input.userId,
    type: "application.stage_changed",
    title: copy.title,
    body: copy.body,
    href: applicationHref(input.applicationId),
    metadata: {
      applicationId: input.applicationId,
      stage: input.stage,
      previousStage: input.previousStage,
    },
  });
}
