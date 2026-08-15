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

export type InterpretedApplicantQuery = {
  raw: string;
  keywords: string[];
  skills: string[];
  minExperience?: number;
  location?: string;
};

const QUERY_FILLER = new Set([
  "suggest",
  "recommend",
  "recommendation",
  "show",
  "find",
  "need",
  "want",
  "looking",
  "please",
  "me",
  "us",
  "a",
  "an",
  "the",
  "to",
  "for",
  "of",
  "and",
  "or",
  "with",
  "who",
  "that",
  "this",
  "their",
  "them",
  "they",
  "has",
  "have",
  "having",
  "someone",
  "somebody",
  "person",
  "people",
  "candidate",
  "candidates",
  "applicant",
  "applicants",
  "profile",
  "profiles",
  "good",
  "great",
  "strong",
  "solid",
  "decent",
  "nice",
  "best",
  "top",
  "ideal",
  "amount",
  "lot",
  "lots",
  "plenty",
  "knowledge",
  "knows",
  "know",
  "skilled",
  "skill",
  "skills",
  "background",
  "proficiency",
  "proficient",
  "familiar",
  "experience",
  "experienced",
  "exp",
  "years",
  "year",
  "yrs",
  "yr",
  "plus",
  "least",
  "minimum",
  "min",
  "about",
  "around",
  "over",
  "more",
  "than",
  "some",
  "any",
  "from",
  "based",
  "located",
  "working",
  "work",
  "worked",
  "using",
  "use",
  "used",
  "in",
  "on",
  "at",
]);

/**
 * Turn a recruiter sentence into structured filters + leftover keywords.
 * "suggest a candidate with 4 years of experience in React and Node"
 * → { minExperience: 4, keywords: ["react", "node"] }
 */
export function interpretApplicantQuery(
  query: string | undefined,
): InterpretedApplicantQuery {
  const raw = query?.trim() ?? "";
  if (!raw) {
    return { raw, keywords: [], skills: [] };
  }

  let rest = raw;
  let minExperience: number | undefined;
  let location: string | undefined;

  const yearMatch = rest.match(
    /(?:at\s+least|minimum|min\.?|over|more\s+than|around|about)?\s*(\d+)\s*\+?\s*(?:years?|yrs?)\b/i,
  );
  if (yearMatch) {
    const years = Number(yearMatch[1]);
    if (Number.isFinite(years) && years > 0 && years < 60) {
      minExperience = years;
    }
    rest = rest.replace(yearMatch[0], " ");
  }

  const locationMatch = rest.match(
    /\b(?:in|from|based\s+in|located\s+in)\s+([a-z][a-z.\s-]{1,40}?)(?=\s+(?:with|who|and|or|,)|$)/i,
  );
  if (locationMatch) {
    const place = locationMatch[1].trim().replace(/[.,]+$/, "");
    if (place && !QUERY_FILLER.has(place.toLowerCase())) {
      location = place;
    }
    rest = rest.replace(locationMatch[0], " ");
  } else if (/\bremote\b/i.test(rest)) {
    location = "remote";
    rest = rest.replace(/\bremote\b/i, " ");
  }

  const keywords = tokenize(rest).filter((token) => {
    if (QUERY_FILLER.has(token)) return false;
    if (/^\d+$/.test(token)) return false;
    return true;
  });

  return {
    raw,
    keywords,
    skills: keywords,
    minExperience,
    location,
  };
}

export function mergeInterpretedFilters(
  filters: ApplicantSearchFilters,
): ApplicantSearchFilters {
  const interpreted = interpretApplicantQuery(filters.q);
  return {
    ...filters,
    q: interpreted.keywords.join(" ") || undefined,
    location: filters.location?.trim() || interpreted.location,
    minExperience: filters.minExperience ?? interpreted.minExperience,
  };
}

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

const MAX_JSON_STRINGS = 200;

/** Collect string/number values from custom-section JSON (not keys). */
export function flattenSearchableJson(
  value: unknown,
  out: string[] = [],
  depth = 0,
): string[] {
  if (out.length >= MAX_JSON_STRINGS || depth > 6 || value == null) return out;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) out.push(trimmed);
    return out;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    out.push(String(value));
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      flattenSearchableJson(item, out, depth + 1);
      if (out.length >= MAX_JSON_STRINGS) break;
    }
    return out;
  }
  if (typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      flattenSearchableJson(nested, out, depth + 1);
      if (out.length >= MAX_JSON_STRINGS) break;
    }
  }
  return out;
}

function customSectionSearchParts(
  sections: ApplicationSnapshotData["customSections"] | undefined,
): string[] {
  return (sections ?? []).flatMap((section) => [
    section.label,
    section.sectionType,
    ...flattenSearchableJson(section.items),
  ]);
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
    ...snapshot.skills.flatMap((s) => [s.name, s.category]),
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
    ...customSectionSearchParts(snapshot.customSections),
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

  const customText = customSectionSearchParts(snapshot?.customSections).map(
    normalize,
  );

  if (filters.skill?.trim()) {
    const needle = normalize(filters.skill);
    const skills = (snapshot?.skills ?? []).flatMap((s) => [
      normalize(s.name),
      normalize(s.category),
    ]);
    const projectTech = (snapshot?.projects ?? []).flatMap((p) =>
      p.techStack.map(normalize),
    );
    if (
      ![...skills, ...projectTech, ...customText].some((s) =>
        s.includes(needle),
      )
    ) {
      return false;
    }
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

export function filterApplicantsBySearch<
  T extends {
    snapshot: ApplicationSnapshotData | null;
    submittedAt: Date | string;
    user?: { name?: string; email?: string };
    coverNote?: string | null;
  },
>(items: T[], filters: ApplicantSearchFilters): T[] {
  const resolved = mergeInterpretedFilters(filters);
  return items.filter((item) => {
    const blob = snapshotSearchBlob(item.snapshot, {
      name: item.user?.name,
      email: item.user?.email,
      coverNote: item.coverNote,
    });
    if (!matchesSearchQuery(blob, resolved.q)) return false;
    return matchesStructuredFilters(item.snapshot, resolved, item.submittedAt);
  });
}
