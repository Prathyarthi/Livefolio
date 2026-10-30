import type { VouchRelationship } from "@/features/vouches/lib/constants";
import { VOUCH_RELATIONSHIP_LABELS } from "@/features/vouches/lib/constants";
import { blobHasTerm, matchesInterpretedQuery } from "@/features/search/lib/match";
import type { InterpretedSearchQuery } from "@/features/search/lib/query";
import { joinText } from "@/features/search/lib/rank-fields";
import { clamp01 } from "@/features/search/lib/rank-signals";

export type ReferenceForSearch = {
  relationship: VouchRelationship;
  story: string;
};

/** How many match points a full reference signal can add. Scores never go down. */
export const REFERENCE_SCORE_POINTS = 12;

const RELATIONSHIP_WEIGHT: Record<VouchRelationship, number> = {
  founder: 1,
  manager: 1,
  collaborator: 0.8,
  peer: 0.75,
  report: 0.6,
  other: 0.3,
};

export function referenceSearchText(references: ReferenceForSearch[]): string {
  return joinText(
    references.flatMap((ref) => [
      VOUCH_RELATIONSHIP_LABELS[ref.relationship],
      ref.story,
    ]),
  );
}

export function appendReferenceText(
  blob: string,
  references: ReferenceForSearch[] | undefined,
): string {
  if (!references?.length) return blob;
  const extra = referenceSearchText(references);
  if (!extra) return blob;
  return `${blob} ${extra}`.trim();
}

function relationshipPhrase(relationship: VouchRelationship): string {
  if (relationship === "other") return "someone who worked with them";
  return `a ${VOUCH_RELATIONSHIP_LABELS[relationship].toLowerCase()}`;
}

/**
 * 0 when there are no references. A story that mentions the search counts in full;
 * a reference that does not still counts, but less. Two references fill the signal.
 */
export function referenceScore(
  references: ReferenceForSearch[],
  terms: string[],
): { score: number; reason: string | null } {
  if (references.length === 0) return { score: 0, reason: null };

  const hasTerms = terms.length > 0;
  const weighted = references.map((ref) => {
    const text = joinText([
      VOUCH_RELATIONSHIP_LABELS[ref.relationship],
      ref.story,
    ]);
    const topical =
      !hasTerms || terms.some((term) => blobHasTerm(text, term));
    return {
      ref,
      topical,
      weight: RELATIONSHIP_WEIGHT[ref.relationship] * (topical ? 1 : 0.4),
    };
  });
  const best = Math.max(...weighted.map((row) => row.weight));
  // "Other" adds little presence: people often send that option to a friend.
  const presence = clamp01(
    references.reduce(
      (sum, ref) => sum + (ref.relationship === "other" ? 0.35 : 1),
      0,
    ) / 2,
  );
  const score = clamp01(presence * 0.45 + best * 0.55);
  const topicalCount = weighted.filter((row) => row.topical).length;
  const lead = weighted.reduce((top, row) => (row.weight > top.weight ? row : top));

  let reason: string;
  if (hasTerms && topicalCount > 0) {
    reason =
      topicalCount === 1
        ? `Reference from ${relationshipPhrase(lead.ref.relationship)} mentions what you're looking for`
        : `${topicalCount} references mention what you're looking for`;
  } else if (references.length === 1) {
    reason = `1 reference from ${relationshipPhrase(lead.ref.relationship)}`;
  } else {
    reason = `${references.length} references, including ${relationshipPhrase(lead.ref.relationship)}`;
  }

  return { score, reason };
}

export function referenceMatchTerms(input: {
  keywords?: string[];
  mustHaves?: string[];
  niceToHaves?: string[];
}): string[] {
  const keywords = (input.keywords ?? []).map((term) => term.trim()).filter(Boolean);
  if (keywords.length > 0) return keywords.slice(0, 16);
  return [...(input.mustHaves ?? []), ...(input.niceToHaves ?? [])]
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 16);
}

/** Add the reference signal on top of a 0–100 score. An empty list leaves it unchanged. */
export function applyReferenceRank(
  baseScore: number,
  reasons: string[],
  references: ReferenceForSearch[] | undefined,
  terms: string[],
): { score: number; reasons: string[] } {
  if (!references?.length) return { score: baseScore, reasons };
  const result = referenceScore(references, terms);
  if (result.score <= 0) return { score: baseScore, reasons };
  const score = Math.min(
    100,
    Math.max(0, Math.round(baseScore + result.score * REFERENCE_SCORE_POINTS)),
  );
  const nextReasons = result.reason
    ? [result.reason, ...reasons.filter((reason) => reason !== result.reason)].slice(0, 4)
    : reasons;
  return { score, reasons: nextReasons };
}

/** User ids whose reference text satisfies the query, for recall beyond the Livefolio. */
export function userIdsFromReferenceSignals(
  grouped: Map<string, ReferenceForSearch[]>,
  interpreted: InterpretedSearchQuery,
  skill?: string,
): string[] {
  const skillTerm = skill?.trim() ?? "";
  if (interpreted.keywords.length === 0 && !skillTerm) return [];

  const ids: string[] = [];
  for (const [userId, references] of grouped) {
    const blob = referenceSearchText(references);
    if (!blob) continue;
    if (!matchesInterpretedQuery(blob, interpreted)) continue;
    if (skillTerm && !blobHasTerm(blob, skillTerm)) continue;
    ids.push(userId);
    if (ids.length >= 500) break;
  }
  return ids;
}