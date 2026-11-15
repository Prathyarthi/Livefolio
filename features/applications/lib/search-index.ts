import { createHash } from "node:crypto";
import type { Prisma } from "@/db/generated/prisma/client";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { summarizeSnapshot } from "@/features/applications/lib/applicant-summary";
import { buildApplicantEvidence } from "@/features/applications/lib/evidence";
import { attachRank } from "@/features/applications/lib/rank";
import { requirementKey } from "@/features/applications/lib/pool-gaps";
import type { JobRequirementInput } from "@/features/applications/lib/search";
import type { JobSearchProfile } from "@/features/jobs/lib/search-profile";
import { facetFieldsOf } from "@/features/search/lib/facets";
import { snapshotSearchBlob } from "@/features/search/lib/match";
import { RANKING_VERSION, rankAgainstJob } from "@/features/search/lib/rank";

/** Changes whenever stored scores would: a ranking change, a new job profile, or edited requirements. */
export function searchIndexKey(
  profile: JobSearchProfile | null,
  requirements: JobRequirementInput[],
): string {
  const reqHash = createHash("sha1")
    .update(
      requirements
        .map((r) => `${requirementKey(r)}|${r.category}`)
        .join("\n"),
    )
    .digest("hex")
    .slice(0, 12);
  return `${RANKING_VERSION}:${profile?.sourceHash ?? "none"}:${reqHash}`;
}

export type SearchIndexFields = {
  searchKey: string;
  rankScore: number;
  rankReasons: string[];
  searchText: string;
  searchSummary: Prisma.InputJsonValue;
  searchEvidence: Prisma.InputJsonValue;
  matchedRequirements: string[];
  yearsExperience: number | null;
  proofKinds: string[];
  skillNames: string[];
  locationLabel: string | null;
};

/**
 * Everything the pool needs about one applicant, computed once from the snapshot.
 * Snapshots never change after submission, so this only reruns when the job side changes.
 * Freshness is left out of the stored score: it would drift with the clock, and
 * "Most recent" sort covers recency.
 */
export function buildSearchIndexFields(
  snapshot: ApplicationSnapshotData | null,
  input: {
    key: string;
    profile: JobSearchProfile | null;
    requirements: JobRequirementInput[];
    name?: string;
    email?: string;
    coverNote?: string | null;
  },
): SearchIndexFields {
  const extras = {
    name: input.name,
    email: input.email,
    coverNote: input.coverNote,
  };
  const summary = summarizeSnapshot(snapshot);
  const rank = rankAgainstJob(snapshot, input.profile, extras);
  const evidence = attachRank(
    buildApplicantEvidence(snapshot, input.requirements),
    rank,
  );
  const facets = facetFieldsOf(snapshot);

  return {
    searchKey: input.key,
    rankScore: rank.score,
    rankReasons: rank.reasons,
    searchText: snapshotSearchBlob(snapshot, extras),
    searchSummary: summary as unknown as Prisma.InputJsonValue,
    searchEvidence: evidence as unknown as Prisma.InputJsonValue,
    matchedRequirements: evidence.requirementMatches
      .filter((m) => m.matched)
      .map(requirementKey),
    yearsExperience: facets.yearsExperience,
    proofKinds: facets.proofKinds,
    skillNames: [...new Set(facets.skillNames.filter(Boolean))],
    locationLabel: facets.locationLabel,
  };
}
