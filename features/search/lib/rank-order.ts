/**
 * One ordering for every ranked list (applicant pool, talent search, agent shortlist),
 * so two people with the same score always land in the same order.
 *
 * Chain: fine score (high first), proof of work (high first), skill match (high first),
 * applied time (earliest first), id. The applicant pool repeats this chain in SQL
 * (`applicantRankOrderBy` in applicant-pool.ts); keep the two in step.
 */

export type RankOrderKey = {
  /** Unrounded 0-100 score, reference bonus included. */
  scoreFine: number;
  /** Proof-of-work subscore, 0-1. */
  proof: number;
  /** Skill-match (keyword overlap) subscore, 0-1. */
  skill: number;
  /** When they applied; for people nobody applied to, when their profile was created. */
  at?: Date | string | number | null;
  id: string;
};

/** Scores are stored with three decimals, so equal inputs compare equal everywhere. */
export function roundFine(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 1000) / 1000;
}

/** Clamp to 0-100 and fix the precision. The displayed integer is `displayScore` of this. */
export function toFineScore(value: number): number {
  return roundFine(Math.min(100, Math.max(0, value)));
}

/** The integer shown in the UI. Always derived from the fine score so the two never disagree. */
export function displayScore(scoreFine: number): number {
  return Math.min(100, Math.max(0, Math.round(scoreFine)));
}

function timeOf(value: RankOrderKey["at"]): number {
  if (value == null) return Number.POSITIVE_INFINITY;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

function byDesc(a: number, b: number): number {
  return a === b ? 0 : b > a ? 1 : -1;
}

/** Sort comparator: negative when `a` ranks above `b`. Never returns 0 for different ids. */
export function compareRankKeys(a: RankOrderKey, b: RankOrderKey): number {
  const at = timeOf(a.at);
  const bt = timeOf(b.at);
  return (
    byDesc(roundFine(a.scoreFine), roundFine(b.scoreFine)) ||
    byDesc(roundFine(a.proof), roundFine(b.proof)) ||
    byDesc(roundFine(a.skill), roundFine(b.skill)) ||
    (at === bt ? 0 : at < bt ? -1 : 1) ||
    (a.id === b.id ? 0 : a.id < b.id ? -1 : 1)
  );
}

/** How many entries share each displayed integer score. */
export function tiedCounts(scores: Iterable<number>): Map<number, number> {
  const counts = new Map<number, number>();
  for (const score of scores) counts.set(score, (counts.get(score) ?? 0) + 1);
  return counts;
}
