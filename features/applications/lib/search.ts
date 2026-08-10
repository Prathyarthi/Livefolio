import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { summarizeSnapshot } from "@/features/applications/lib/applicant-summary";

export type ApplicantSearchFilters = {
  q?: string;
  location?: string;
  skill?: string;
  role?: string;
  education?: string;
  minExperience?: number;
  maxExperience?: number;
  appliedAfter?: string;
  appliedBefore?: string;
};

export type JobRequirementInput = {
  type: string;
  category: string;
  label: string;
};

function normalize(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().trim();
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

/** Flatten snapshot into searchable text for keyword matching. */
export function snapshotSearchBlob(
  snapshot: ApplicationSnapshotData | null | undefined,
  extras?: { name?: string; email?: string; coverNote?: string | null },
): string {
  if (!snapshot) {
    return [extras?.name, extras?.email, extras?.coverNote]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  const parts: Array<string | null | undefined> = [
    extras?.name,
    extras?.email,
    extras?.coverNote ?? undefined,
    snapshot.profile.title,
    snapshot.profile.headline,
    snapshot.profile.summary,
    snapshot.profile.location ?? undefined,
    ...snapshot.experiences.flatMap((e) => [
      e.company,
      e.role,
      e.description,
      e.location ?? undefined,
    ]),
    ...snapshot.educations.flatMap((e) => [
      e.institution,
      e.degree,
      e.field ?? undefined,
      e.description ?? undefined,
    ]),
    ...snapshot.skills.map((s) => s.name),
    ...snapshot.projects.flatMap((p) => [
      p.title,
      p.description,
      ...p.techStack,
    ]),
    ...snapshot.articles.flatMap((a) => [a.title, a.description, ...a.tags]),
    ...snapshot.certifications.flatMap((c) => [c.name, c.issuer]),
    ...snapshot.achievements.map((a) => a.title),
    ...snapshot.socialProfiles.flatMap((s) => [
      s.platform,
      s.username ?? undefined,
    ]),
    ...snapshot.customSections.map((c) => c.label),
  ];

  return parts
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(" ")
    .toLowerCase();
}

export function matchesSearchQuery(
  blob: string,
  query: string | undefined,
): boolean {
  if (!query?.trim()) return true;
  const tokens = tokenize(query);
  if (tokens.length === 0) return true;
  // All tokens must appear somewhere (AND). Supports phrases like
  // "B2B SaaS" by requiring each significant token.
  return tokens.every((token) => blob.includes(token));
}

export function matchesStructuredFilters(
  snapshot: ApplicationSnapshotData | null | undefined,
  filters: ApplicantSearchFilters,
  submittedAt: Date | string,
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

  if (filters.skill?.trim()) {
    const needle = normalize(filters.skill);
    const skills = (snapshot?.skills ?? []).map((s) => normalize(s.name));
    const projectTech = (snapshot?.projects ?? []).flatMap((p) =>
      p.techStack.map(normalize),
    );
    if (![...skills, ...projectTech].some((s) => s.includes(needle))) {
      return false;
    }
  }

  if (filters.role?.trim()) {
    const needle = normalize(filters.role);
    const roles = (snapshot?.experiences ?? []).flatMap((e) => [
      normalize(e.role),
      normalize(e.company),
    ]);
    if (!roles.some((r) => r.includes(needle))) return false;
  }

  if (filters.education?.trim()) {
    const needle = normalize(filters.education);
    const edu = (snapshot?.educations ?? []).flatMap((e) => [
      normalize(e.institution),
      normalize(e.degree),
      normalize(e.field),
    ]);
    if (!edu.some((e) => e.includes(needle))) return false;
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

export function filterApplicantsBySearch<
  T extends {
    snapshot: ApplicationSnapshotData | null;
    submittedAt: Date | string;
    user?: { name?: string; email?: string };
    coverNote?: string | null;
  },
>(items: T[], filters: ApplicantSearchFilters): T[] {
  return items.filter((item) => {
    const blob = snapshotSearchBlob(item.snapshot, {
      name: item.user?.name,
      email: item.user?.email,
      coverNote: item.coverNote,
    });
    if (!matchesSearchQuery(blob, filters.q)) return false;
    return matchesStructuredFilters(item.snapshot, filters, item.submittedAt);
  });
}
