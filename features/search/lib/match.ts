import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import {
  expandSkillTerms,
  normalizeSearchText,
} from "./skill-families";
import type { InterpretedSearchQuery } from "./query";

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9+\-#.]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Word-aware match so `js` does not hit `java` and `ts` does not hit `hits`. */
export function blobHasToken(blob: string, token: string): boolean {
  const needle = token.trim().toLowerCase();
  if (!needle) return false;
  if (needle.includes(" ")) return blob.includes(needle);
  const pattern = new RegExp(
    `(^|[^a-z0-9+#])${escapeRegExp(needle)}([^a-z0-9+#]|$)`,
    "i",
  );
  return pattern.test(blob);
}

export function blobHasTerm(blob: string, term: string): boolean {
  const variants = expandSkillTerms([term]);
  return variants.some((variant) => {
    const tokens = tokenize(variant);
    if (tokens.length === 0) return blobHasToken(blob, variant);
    if (variant.includes(" ")) return blobHasToken(blob, variant);
    return tokens.every((token) => blobHasToken(blob, token));
  });
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

const URL_ONLY = /^https?:\/\/\S+$/i;
const TITLE_KEYS = ["title", "name", "heading", "role", "label", "company"];

/**
 * Readable title for one custom-section entry. Snapshots are stored as jsonb, which
 * reorders object keys, so the first value is often a link rather than the title.
 */
export function customItemTitle(entry: unknown, fallback: string): string {
  if (entry && typeof entry === "object" && !Array.isArray(entry)) {
    const record = entry as Record<string, unknown>;
    for (const key of TITLE_KEYS) {
      const value = record[key];
      if (typeof value === "string" && value.trim() && !URL_ONLY.test(value.trim())) {
        return value.trim().slice(0, 80);
      }
    }
  }
  const text = flattenSearchableJson(entry).find((s) => !URL_ONLY.test(s));
  return text?.slice(0, 80) || fallback;
}

export function customSectionEntries(
  section: ApplicationSnapshotData["customSections"][number],
): unknown[] {
  return Array.isArray(section.items) ? section.items : [section.items];
}

export function customSectionSearchParts(
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

  return normalizeSearchText(
    parts
      .filter((value): value is string => Boolean(value && value.trim()))
      .join(" "),
  );
}

export function matchesInterpretedQuery(
  blob: string,
  interpreted: InterpretedSearchQuery,
): boolean {
  if (interpreted.exclude.some((term) => blobHasTerm(blob, term))) {
    return false;
  }
  if (interpreted.keywords.length === 0) return true;
  if (interpreted.matchAny) {
    return interpreted.keywords.some((term) => blobHasTerm(blob, term));
  }
  return interpreted.keywords.every((term) => blobHasTerm(blob, term));
}