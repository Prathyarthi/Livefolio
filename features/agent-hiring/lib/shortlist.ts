import { compareRankKeys, type RankOrderKey } from "@/features/search/lib/rank-order";

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
  /** Applicants: id of that job, so the profile opens on the right role. */
  appliedJobId?: string | null;
  /**
   * Sort keys for a stable order: fine score, proof, skill match, then applied time
   * (sourced people: profile created time) and id. Without it only `score` is compared.
   */
  order?: RankOrderKey;
};

export type ShortlistCandidate = PoolCandidate & {
  source: CandidateSource;
  label: "Applicant" | "Sourced";
};

export const SHORTLIST_SIZE = 10;

/** Best first. Same chain as every other ranked list; see rank-order.ts. */
export function compareCandidates(a: PoolCandidate, b: PoolCandidate): number {
  const keyOf = (c: PoolCandidate): RankOrderKey =>
    c.order ?? { scoreFine: c.score, proof: 0, skill: 0, at: null, id: "" };
  return compareRankKeys(keyOf(a), keyOf(b));
}

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
    if (!prev || compareCandidates(c, prev) < 0) {
      byUser.set(c.userId, { ...c, source: "applicant", label: "Applicant" });
    }
  }
  for (const c of sourced) {
    if (byUser.has(c.userId)) continue;
    byUser.set(c.userId, { ...c, source: "sourced", label: "Sourced" });
  }
  return [...byUser.values()]
    .sort(
      (a, b) =>
        compareCandidates(a, b) ||
        (a.source === b.source ? 0 : a.source === "applicant" ? -1 : 1) ||
        (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0),
    )
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
