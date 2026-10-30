import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { summarizeSnapshot } from "@/features/applications/lib/applicant-summary";
import { normalizeSearchText } from "@/features/search/lib/skill-families";
import { blobHasTerm, customSectionSearchParts } from "@/features/search/lib/match";
import { proofKindsOf, type ProofKind } from "@/features/search/lib/proof";

export type SearchFilters = {
  location?: string;
  skill?: string;
  role?: string;
  education?: string;
  minExperience?: number;
  maxExperience?: number;
  appliedAfter?: string;
  appliedBefore?: string;
  proof?: ProofKind;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().trim();
}

export function matchesStructuredFilters(
  snapshot: ApplicationSnapshotData | null | undefined,
  filters: SearchFilters,
  submittedAt: Date | string,
  extras?: { skillText?: string },
): boolean {
  const summary = summarizeSnapshot(snapshot);

  if (filters.location?.trim()) {
    const needle = normalize(filters.location);
    const hay = normalize(
      [summary.location, ...(snapshot?.experiences.map((e) => e.location) ?? [])]
        .filter(Boolean)
        .join(" "),
    );
    if (!hay.includes(needle)) return false;
  }

  const customText = customSectionSearchParts(snapshot?.customSections).map(
    normalize,
  );

  if (filters.skill?.trim()) {
    const skillBlob = normalizeSearchText(
      [
        ...(snapshot?.skills ?? []).flatMap((s) => [s.name, s.category]),
        ...(snapshot?.projects ?? []).flatMap((p) => p.techStack),
        ...(snapshot?.articles ?? []).flatMap((a) => a.tags),
        ...(snapshot?.certifications ?? []).map((c) => c.name),
        ...customText,
        extras?.skillText,
      ].join(" | "),
    );
    if (!blobHasTerm(skillBlob, filters.skill)) return false;
  }

  if (filters.proof && !proofKindsOf(snapshot).includes(filters.proof)) {
    return false;
  }

  if (filters.role?.trim()) {
    const needle = normalize(filters.role);
    const roles = (snapshot?.experiences ?? []).flatMap((e) => [
      normalize(e.role),
      normalize(e.company),
      normalize(e.description),
    ]);
    if (![...roles, ...customText].some((r) => r.includes(needle))) {
      return false;
    }
  }

  if (filters.education?.trim()) {
    const needle = normalize(filters.education);
    const edu = (snapshot?.educations ?? []).flatMap((e) => [
      normalize(e.institution),
      normalize(e.degree),
      normalize(e.field),
      normalize(e.description),
    ]);
    if (![...edu, ...customText].some((e) => e.includes(needle))) return false;
  }

  if (filters.minExperience != null && Number.isFinite(filters.minExperience)) {
    const years = summary.yearsExperience;
    if (years == null || years < filters.minExperience) return false;
  }

  if (filters.maxExperience != null && Number.isFinite(filters.maxExperience)) {
    const years = summary.yearsExperience;
    if (years == null || years > filters.maxExperience) return false;
  }

  const submitted = new Date(submittedAt).getTime();
  if (filters.appliedAfter) {
    const after = Date.parse(filters.appliedAfter);
    if (!Number.isNaN(after) && submitted < after) return false;
  }
  if (filters.appliedBefore) {
    const before = Date.parse(filters.appliedBefore);
    if (!Number.isNaN(before) && submitted > before) return false;
  }

  return true;
}
