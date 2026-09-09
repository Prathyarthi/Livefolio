export const PIPELINE_STAGES = [
  "new",
  "reviewing",
  "shortlisted",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  new: "New",
  reviewing: "Reviewing",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export function isPipelineStage(value: string): value is PipelineStage {
  return (PIPELINE_STAGES as readonly string[]).includes(value);
}

/** Keep candidate-visible status in sync with internal pipeline stage. */
export function statusForStage(stage: PipelineStage): string {
  switch (stage) {
    case "new":
      return "applied";
    case "reviewing":
      return "under_review";
    case "shortlisted":
      return "shortlisted";
    case "interview":
      return "interview";
    case "offer":
      return "offer";
    case "hired":
      return "hired";
    case "rejected":
      return "rejected";
  }
}
