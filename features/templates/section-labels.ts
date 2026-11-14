import type { PortfolioCustomization, TemplateSectionId } from "./types";

export type SectionKey =
  | "about"
  | "projects"
  | "experience"
  | "education"
  | "skills"
  | "certifications"
  | "achievements"
  | "articles"
  | "linkedin"
  | "profiles"
  | "github"
  | "openSource"
  | "contact";

/** Optional academic score: GPA, percentage, or similar. */
export const EDUCATION_SCORE_LABEL = "GPA / Percentage";

export const STANDARD_SECTION_LABELS: Record<SectionKey, string> = {
  about: "About",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  achievements: "Achievements",
  articles: "Articles",
  linkedin: "LinkedIn",
  profiles: "Profiles",
  github: "GitHub Activity",
  openSource: "Open Source",
  contact: "Contact",
};

/** Maps navbar section IDs to section label keys. */
export const NAVBAR_SECTION_TO_KEY: Record<TemplateSectionId, SectionKey> = {
  about: "about",
  work: "projects",
  experience: "experience",
  profiles: "profiles",
};

function getStoredSectionLabels(
  customization: PortfolioCustomization | Record<string, unknown> | null | undefined
): Partial<Record<SectionKey, string>> {
  if (!customization || typeof customization !== "object") return {};
  const labels = (customization as PortfolioCustomization).sectionLabels;
  if (!labels || typeof labels !== "object" || Array.isArray(labels)) return {};
  return labels;
}

/** Title-case headings stored in all caps. Mixed-case labels stay as written. */
export function formatSectionLabel(label: string): string {
  const trimmed = label.trim();
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (!letters || letters !== letters.toUpperCase()) return trimmed;
  return trimmed
    .toLowerCase()
    .replace(
      /(^|[^a-z0-9'])([a-z])/g,
      (_match, boundary: string, char: string) => boundary + char.toUpperCase()
    );
}

export function getSectionLabel(
  key: SectionKey,
  customization?: PortfolioCustomization | Record<string, unknown> | null
): string {
  const stored = getStoredSectionLabels(customization);
  const override = stored[key]?.trim();
  if (override) return formatSectionLabel(override);
  return STANDARD_SECTION_LABELS[key];
}

export function getSectionLabels(
  customization?: PortfolioCustomization | Record<string, unknown> | null
): Record<SectionKey, string> {
  const stored = getStoredSectionLabels(customization);
  return Object.fromEntries(
    (Object.keys(STANDARD_SECTION_LABELS) as SectionKey[]).map((key) => [
      key,
      formatSectionLabel(stored[key]?.trim() || STANDARD_SECTION_LABELS[key]),
    ])
  ) as Record<SectionKey, string>;
}

/** Max characters for a user-defined section heading. */
export const MAX_SECTION_TITLE_CHARS = 40;

export const SECTION_KEYS = Object.keys(STANDARD_SECTION_LABELS) as SectionKey[];

export function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === "string" && value in STANDARD_SECTION_LABELS;
}

/**
 * The user's own heading for a section, or null when they haven't renamed it.
 * Internal keys (anchors, ordering) never change; this is display-only.
 */
export function getCustomSectionLabel(
  customization: PortfolioCustomization | Record<string, unknown> | null | undefined,
  key: SectionKey,
): string | null {
  const value = getStoredSectionLabels(customization)[key]?.trim();
  return value ? formatSectionLabel(value) : null;
}

/** Custom heading if set, otherwise the template's own default wording. */
export function getSectionTitle(
  customization: PortfolioCustomization | Record<string, unknown> | null | undefined,
  key: SectionKey,
  templateDefault: string,
): string {
  return getCustomSectionLabel(customization, key) ?? templateDefault;
}

/**
 * Clean a sectionLabels map from user input: known keys only, trimmed,
 * capped at MAX_SECTION_TITLE_CHARS, and empty entries dropped (= default).
 */
export function normalizeSectionTitles(
  input: unknown,
): Partial<Record<SectionKey, string>> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Partial<Record<SectionKey, string>> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!isSectionKey(key) || typeof value !== "string") continue;
    const trimmed = value.replace(/\s+/g, " ").trim().slice(0, MAX_SECTION_TITLE_CHARS).trim();
    if (trimmed) out[key] = trimmed;
  }
  return out;
}
