import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { normalizeSearchText } from "@/features/search/lib/skill-families";
import {
  blobHasTerm,
  flattenSearchableJson,
  snapshotSearchBlob,
} from "@/features/search/lib/match";

export type FieldBlobs = {
  skills: string;
  work: string;
  experience: string;
  identity: string;
  all: string;
};

/** Where a term is found says how strongly it is claimed: a listed skill beats a passing mention. */
const FIELD_WEIGHTS = {
  skills: 1,
  work: 0.85,
  experience: 0.7,
  identity: 0.55,
  all: 0.25,
} as const;

export function joinText(parts: Array<string | null | undefined>): string {
  return normalizeSearchText(parts.filter(Boolean).join(" | "));
}

export function fieldBlobs(
  snapshot: ApplicationSnapshotData | null | undefined,
  extras?: { name?: string; email?: string; coverNote?: string | null },
): FieldBlobs {
  return {
    skills: joinText([
      ...(snapshot?.skills ?? []).flatMap((s) => [s.name, s.category]),
      ...(snapshot?.certifications ?? []).map((c) => c.name),
    ]),
    work: joinText([
      ...(snapshot?.projects ?? []).flatMap((p) => [
        p.title,
        p.description,
        ...p.techStack,
      ]),
      ...(snapshot?.articles ?? []).flatMap((a) => [
        a.title,
        a.description,
        ...a.tags,
      ]),
      ...(snapshot?.customSections ?? []).flatMap((c) =>
        flattenSearchableJson(c.items),
      ),
    ]),
    experience: joinText(
      (snapshot?.experiences ?? []).flatMap((e) => [
        e.role,
        e.company,
        e.description,
      ]),
    ),
    identity: joinText([
      extras?.name,
      snapshot?.profile.title,
      snapshot?.profile.headline,
    ]),
    all: snapshotSearchBlob(snapshot, extras),
  };
}

function termFieldWeight(blobs: FieldBlobs, term: string): number {
  if (blobHasTerm(blobs.skills, term)) return FIELD_WEIGHTS.skills;
  if (blobHasTerm(blobs.work, term)) return FIELD_WEIGHTS.work;
  if (blobHasTerm(blobs.experience, term)) return FIELD_WEIGHTS.experience;
  if (blobHasTerm(blobs.identity, term)) return FIELD_WEIGHTS.identity;
  if (blobHasTerm(blobs.all, term)) return FIELD_WEIGHTS.all;
  return 0;
}

export function matchedTerms(
  blobs: FieldBlobs,
  terms: string[],
): { hits: string[]; score: number; best: number } {
  if (terms.length === 0) return { hits: [], score: 0, best: 0 };
  const weights = terms.map((term) => ({
    term,
    weight: termFieldWeight(blobs, term),
  }));
  const hits = weights.filter((row) => row.weight > 0).map((row) => row.term);
  const score = weights.reduce((sum, row) => sum + row.weight, 0) / terms.length;
  const best = Math.max(0, ...weights.map((row) => row.weight));
  return { hits, score, best };
}
