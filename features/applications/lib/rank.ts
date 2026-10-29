import type { ApplicantEvidenceSummary } from "@/features/applications/lib/evidence";
import type { CandidateRank } from "@/features/search/lib/rank";

export function attachRank(
  evidence: ApplicantEvidenceSummary,
  rank: CandidateRank,
): ApplicantEvidenceSummary {
  const highlights =
    rank.reasons.length > 0
      ? rank.reasons.map((label) => ({ kind: "match" as const, label }))
      : evidence.highlights;
  return {
    ...evidence,
    highlights,
    rankScore: rank.score,
    rankReasons: rank.reasons,
  };
}
