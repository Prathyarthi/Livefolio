import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import {
  detectRoleFamily,
  emptySearchProfile,
  gatesForRole,
  type JobSearchProfile,
} from "@/features/jobs/lib/search-profile";
import { tokenize } from "@/features/search/lib/match";
import {
  termAsTyped,
  type InterpretedSearchQuery,
} from "@/features/search/lib/query";
import {
  fieldBlobs,
  matchedTerms,
  type FieldBlobs,
} from "@/features/search/lib/rank-fields";
import {
  clamp01,
  fitScore,
  freshnessScore,
  hasPlatformSignal,
  platformScore,
  provenScore,
} from "@/features/search/lib/rank-signals";

export type CandidateRank = {
  score: number;
  overlap: number;
  proven: number;
  platform: number;
  fit: number;
  freshness: number;
  reasons: string[];
};

export type RankExtras = {
  name?: string;
  email?: string;
  coverNote?: string | null;
  freshnessAt?: Date | string | null;
};

/** Bump whenever weights or scoring change so logged results can be compared across versions. */
export const RANKING_VERSION = "field-weighted-v5";

const COMPONENT_WEIGHTS = {
  overlap: 0.45,
  proven: 0.22,
  platform: 0.15,
  fit: 0.1,
  freshness: 0.08,
} as const;

export function searchProfileFromQuery(
  query: InterpretedSearchQuery,
): JobSearchProfile {
  const terms = query.keywords.map((term) => termAsTyped(query.raw, term));
  const { roleFamily, confidence } = detectRoleFamily(
    [query.raw, ...terms].join(" "),
  );
  return emptySearchProfile(`query:${query.raw.slice(0, 48)}`, {
    roleFamily,
    confidence,
    minYears: query.minExperience ?? null,
    location: query.location ?? null,
    mustHaves: query.matchAny ? [] : terms.slice(0, 16),
    niceToHaves: query.matchAny ? terms.slice(0, 16) : [],
    digest: "",
    gates: gatesForRole(roleFamily, confidence),
  });
}

function overlapScore(
  blobs: FieldBlobs,
  profile: JobSearchProfile,
  reasons: string[],
  matchAny: boolean,
): number {
  const must = matchedTerms(blobs, profile.mustHaves);
  const nice = matchedTerms(blobs, profile.niceToHaves);
  const domains = matchedTerms(blobs, profile.domains);
  const responsibilities = matchedTerms(blobs, profile.responsibilities);
  const digestHits = matchedTerms(blobs, tokenize(profile.digest).slice(0, 12));
  const education = profile.education
    ? matchedTerms(blobs, [profile.education])
    : null;

  if (must.hits[0]) {
    reasons.push(`Must-have: ${must.hits.slice(0, 3).join(", ")}`);
  } else if (nice.hits[0]) {
    reasons.push(`Matches: ${nice.hits.slice(0, 3).join(", ")}`);
  }
  if (domains.hits[0]) {
    reasons.push(`Domain: ${domains.hits.slice(0, 2).join(", ")}`);
  }
  if (responsibilities.hits[0]) reasons.push(responsibilities.hits[0]!);

  // An OR query is satisfied by its strongest term; an AND query or JD needs them all.
  const mustScore =
    profile.mustHaves.length > 0
      ? must.score
      : matchAny && nice.hits.length > 0
        ? nice.best
        : digestHits.hits.length > 0
          ? 0.4
          : 0.2;
  const core =
    profile.niceToHaves.length === 0
      ? mustScore * 0.9
      : mustScore * 0.7 + (matchAny ? nice.best : nice.score) * 0.2;
  const extra =
    (domains.hits.length > 0 ? 0.1 : 0) +
    (responsibilities.hits.length > 0 ? 0.1 : 0) +
    (education && education.hits.length > 0 ? 0.05 : 0) +
    clamp01(digestHits.hits.length / 8) * 0.1;

  return clamp01(core + extra);
}

function emptyRank(freshness = 0): CandidateRank {
  return {
    score: Math.round(freshness * 8),
    overlap: 0,
    proven: 0,
    platform: 0,
    fit: 0,
    freshness,
    reasons: [],
  };
}

function combineRank(
  snapshot: ApplicationSnapshotData | null | undefined,
  profile: JobSearchProfile,
  extras: RankExtras | undefined,
  matchAny: boolean,
): CandidateRank {
  const blobs = fieldBlobs(snapshot, extras);
  const reasons: string[] = [];
  const overlap = overlapScore(blobs, profile, reasons, matchAny);
  const proven = provenScore(
    snapshot,
    [...profile.mustHaves, ...profile.niceToHaves],
    profile.gates.liveUrl,
    reasons,
  );
  const platform = platformScore(snapshot, profile, reasons);
  const fit = fitScore(snapshot, profile, reasons);
  const freshness = freshnessScore(extras?.freshnessAt);

  // Roles without a platform signal (sales, ops, product, design…) must still be able to score 100.
  const platformWeight = hasPlatformSignal(profile) ? COMPONENT_WEIGHTS.platform : 0;
  const total =
    COMPONENT_WEIGHTS.overlap +
    COMPONENT_WEIGHTS.proven +
    platformWeight +
    COMPONENT_WEIGHTS.fit +
    COMPONENT_WEIGHTS.freshness;
  const weighted =
    overlap * COMPONENT_WEIGHTS.overlap +
    proven * COMPONENT_WEIGHTS.proven +
    platform * platformWeight +
    fit * COMPONENT_WEIGHTS.fit +
    freshness * COMPONENT_WEIGHTS.freshness;

  return {
    score: Math.min(100, Math.max(0, Math.round((weighted / total) * 100))),
    overlap,
    proven,
    platform,
    fit,
    freshness,
    reasons: [...new Set(reasons)].slice(0, 4),
  };
}

export function rankAgainstJob(
  snapshot: ApplicationSnapshotData | null | undefined,
  profile: JobSearchProfile | null,
  extras?: RankExtras,
): CandidateRank {
  if (!profile) return emptyRank();
  return combineRank(snapshot, profile, extras, false);
}

export function rankAgainstQuery(
  snapshot: ApplicationSnapshotData | null | undefined,
  query: InterpretedSearchQuery,
  extras?: RankExtras,
): CandidateRank {
  if (query.keywords.length === 0 && !query.minExperience) {
    return emptyRank(freshnessScore(extras?.freshnessAt));
  }
  return combineRank(
    snapshot,
    searchProfileFromQuery(query),
    extras,
    query.matchAny,
  );
}

/**
 * Rank against a job, a recruiter query, or both. With both, the job sets the bar
 * and the query nudges toward what the recruiter is looking for right now.
 */
export function rankCandidate(
  snapshot: ApplicationSnapshotData | null | undefined,
  options: {
    jobProfile?: JobSearchProfile | null;
    query?: InterpretedSearchQuery | null;
    extras?: RankExtras;
  },
): CandidateRank {
  const { jobProfile, query, extras } = options;
  const hasQuery = Boolean(query && (query.keywords.length > 0 || query.minExperience));
  if (jobProfile && query && hasQuery) {
    const job = rankAgainstJob(snapshot, jobProfile, extras);
    const byQuery = rankAgainstQuery(snapshot, query, extras);
    return {
      score: Math.round(job.score * 0.7 + byQuery.score * 0.3),
      overlap: job.overlap * 0.7 + byQuery.overlap * 0.3,
      proven: Math.max(job.proven, byQuery.proven),
      platform: job.platform,
      fit: job.fit,
      freshness: job.freshness,
      reasons: [...new Set([...byQuery.reasons, ...job.reasons])].slice(0, 4),
    };
  }
  if (jobProfile) return rankAgainstJob(snapshot, jobProfile, extras);
  if (query) return rankAgainstQuery(snapshot, query, extras);
  return emptyRank(freshnessScore(extras?.freshnessAt));
}
