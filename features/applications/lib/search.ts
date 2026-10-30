import type { Prisma } from "@/db/generated/prisma/client";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import {
  expandSkillTerm,
  normalizeSearchText,
} from "@/features/search/lib/skill-families";
import {
  matchesInterpretedQuery,
  snapshotSearchBlob,
  tokenize,
} from "@/features/search/lib/match";
import { appendReferenceText, type ReferenceForSearch } from "@/features/search/lib/references";
import { interpretSearchQuery } from "@/features/search/lib/query";
import {
  matchesStructuredFilters,
  type SearchFilters,
} from "@/features/search/lib/filters";

export type ApplicantSearchFilters = SearchFilters & { q?: string };

export type JobRequirementInput = {
  type: string;
  category: string;
  label: string;
};

export function mergeInterpretedFilters(
  filters: ApplicantSearchFilters,
): ApplicantSearchFilters {
  const interpreted = interpretSearchQuery(filters.q);
  return {
    ...filters,
    q: interpreted.keywords.join(" ") || undefined,
    location: filters.location?.trim() || interpreted.location,
    minExperience: filters.minExperience ?? interpreted.minExperience,
  };
}

function containsText(value: string): Prisma.ApplicationWhereInput {
  return { searchText: { contains: value, mode: "insensitive" } };
}

/** Clause that holds whenever `blobHasTerm(searchText, term)` would, counting skill-family variants. */
function termRecallClause(term: string): Prisma.ApplicationWhereInput {
  const variants = expandSkillTerm(term);
  return {
    OR: variants.map((variant) => {
      const tokens = tokenize(variant);
      if (tokens.length <= 1 || variant.includes(" ")) return containsText(variant);
      return { AND: tokens.map(containsText) };
    }),
  };
}

/**
 * SQL for an applicant pool. Exact when only column filters are used; with text
 * filters it is a superset (substring recall) and `filterApplicantsBySearch`
 * finishes the job on the recalled rows, including exclusions.
 */
export function applicantPoolWhere(
  jobId: string,
  stage: string | undefined,
  filters: ApplicantSearchFilters,
): { where: Prisma.ApplicationWhereInput; exact: boolean } {
  const interpreted = interpretSearchQuery(filters.q);
  const resolved = mergeInterpretedFilters(filters);
  const and: Prisma.ApplicationWhereInput[] = [{ jobId }];
  if (stage) and.push({ stage });

  if (resolved.proof) and.push({ proofKinds: { has: resolved.proof } });
  if (resolved.minExperience != null && Number.isFinite(resolved.minExperience)) {
    and.push({ yearsExperience: { gte: resolved.minExperience } });
  }
  if (resolved.maxExperience != null && Number.isFinite(resolved.maxExperience)) {
    and.push({ yearsExperience: { lte: resolved.maxExperience } });
  }
  const after = resolved.appliedAfter ? Date.parse(resolved.appliedAfter) : Number.NaN;
  if (!Number.isNaN(after)) and.push({ submittedAt: { gte: new Date(after) } });
  const before = resolved.appliedBefore ? Date.parse(resolved.appliedBefore) : Number.NaN;
  if (!Number.isNaN(before)) and.push({ submittedAt: { lte: new Date(before) } });

  const keywordClauses = interpreted.keywords.map(termRecallClause);
  if (keywordClauses.length > 0) {
    and.push(interpreted.matchAny ? { OR: keywordClauses } : { AND: keywordClauses });
  }
  if (resolved.skill?.trim()) and.push(termRecallClause(resolved.skill));
  for (const text of [resolved.location, resolved.role, resolved.education]) {
    if (text?.trim()) and.push(containsText(normalizeSearchText(text.trim())));
  }

  const exact =
    keywordClauses.length === 0 &&
    interpreted.exclude.length === 0 &&
    !resolved.skill?.trim() &&
    !resolved.location?.trim() &&
    !resolved.role?.trim() &&
    !resolved.education?.trim();

  return { where: { AND: and }, exact };
}

export function matchesSearchQuery(
  blob: string,
  query: string | undefined,
): boolean {
  if (!query?.trim()) return true;
  return matchesInterpretedQuery(blob, interpretSearchQuery(query));
}

export function filterApplicantsBySearch<
  T extends {
    snapshot: ApplicationSnapshotData | null;
    submittedAt: Date | string;
    user?: { id?: string; name?: string; email?: string };
    coverNote?: string | null;
  },
>(
  items: T[],
  filters: ApplicantSearchFilters,
  referencesByUserId?: ReadonlyMap<string, ReferenceForSearch[]>,
): T[] {
  const interpreted = interpretSearchQuery(filters.q);
  const resolved = mergeInterpretedFilters(filters);
  return items.filter((item) => {
    const references = item.user?.id
      ? referencesByUserId?.get(item.user.id)
      : undefined;
    const blob = appendReferenceText(
      snapshotSearchBlob(item.snapshot, {
        name: item.user?.name,
        email: item.user?.email,
        coverNote: item.coverNote,
      }),
      references,
    );
    if (!matchesInterpretedQuery(blob, interpreted)) return false;
    return matchesStructuredFilters(item.snapshot, resolved, item.submittedAt, {
      skillText: references?.length
        ? references.map((ref) => ref.story).join(" ")
        : undefined,
    });
  });
}
