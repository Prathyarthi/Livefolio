export type CandidateSource = "applicant" | "sourced";

export type PoolCandidate = {
  userId: string;
  name: string;
  headline: string;
  avatarUrl: string | null;
  livefolioUrl: string | null;
  score: number;
  reasons: string[];
  proof: string[];
  /** Applicants: application id. Sourced: portfolio slug. */
  ref: string;
  /** Applicants: job they applied to. */
  appliedTo?: string | null;
};

export type ShortlistCandidate = PoolCandidate & {
  source: CandidateSource;
  label: "Applicant" | "Sourced";
};

export const SHORTLIST_SIZE = 10;

/**
 * Merge both pools, one row per person. Someone who already applied stays an
 * Applicant (keeps their best applicant score); they are not also listed as Sourced.
 */
export function mergeShortlist(
  applicants: PoolCandidate[],
  sourced: PoolCandidate[],
  limit = SHORTLIST_SIZE,
): ShortlistCandidate[] {
  const byUser = new Map<string, ShortlistCandidate>();
  for (const c of applicants) {
    const prev = byUser.get(c.userId);
    if (!prev || c.score > prev.score) {
      byUser.set(c.userId, { ...c, source: "applicant", label: "Applicant" });
    }
  }
  for (const c of sourced) {
    if (byUser.has(c.userId)) continue;
    byUser.set(c.userId, { ...c, source: "sourced", label: "Sourced" });
  }
  return [...byUser.values()]
    .sort((a, b) => b.score - a.score || (a.source === "applicant" ? -1 : 1))
    .slice(0, limit);
}

export function draftInvite(input: {
  candidateName: string;
  source: CandidateSource;
  jobTitle: string;
  orgName: string;
  jobUrl: string;
  reasons: string[];
  senderName: string;
}): { subject: string; body: string } {
  const first = input.candidateName.trim().split(/\s+/)[0] || "there";
  const why = input.reasons
    .slice(0, 2)
    .map((r) => r.replace(/^[^:]+:\s*/, ""))
    .filter(Boolean)
    .join("; ");
  const hook = why ? ` Your Livefolio stood out (${why}).` : "";
  const opener =
    input.source === "applicant"
      ? `Thanks for applying to ${input.orgName}. We're also hiring a ${input.jobTitle} and think you'd be a strong fit.`
      : `I came across your Livefolio and think you'd be a strong fit for our ${input.jobTitle} role at ${input.orgName}.`;
  return {
    subject: `${input.jobTitle} at ${input.orgName}`,
    body: `Hi ${first},\n\n${opener}${hook}\n\nYou can see the role and apply here: ${input.jobUrl}\n\nWould you be open to a quick chat?\n\nBest,\n${input.senderName}`,
  };
}
