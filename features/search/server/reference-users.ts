import type { InterpretedSearchQuery } from "@/features/search/lib/query";
import { userIdsFromReferenceSignals } from "@/features/search/lib/references";
import { expandSkillTerm } from "@/features/search/lib/skill-families";
import { listReferenceSignalsByStoryTerms } from "@/features/vouches/lib/public";

/** People whose named references satisfy the query, even if the Livefolio does not. */
export async function findUserIdsMatchingReferences(input: {
  interpreted: InterpretedSearchQuery;
  skill?: string;
}): Promise<string[]> {
  const skill = input.skill?.trim() ?? "";
  const seeds = [...input.interpreted.keywords, ...(skill ? [skill] : [])];
  if (seeds.length === 0) return [];

  const variants = [
    ...new Set(seeds.flatMap((term) => expandSkillTerm(term))),
  ].slice(0, 16);
  const grouped = await listReferenceSignalsByStoryTerms(variants);
  return userIdsFromReferenceSignals(grouped, input.interpreted, skill);
}