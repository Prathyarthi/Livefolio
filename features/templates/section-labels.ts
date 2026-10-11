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
  | "profiles"
  | "github"
  | "openSource"
  | "contact";

export const STANDARD_SECTION_LABELS: Record<SectionKey, string> = {
  about: "About",
  projects: "Projects",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  achievements: "Achievements",
  articles: "Articles",
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

export function getSectionLabel(
  key: SectionKey,
  customization?: PortfolioCustomization | Record<string, unknown> | null
): string {
  const stored = getStoredSectionLabels(customization);
  const override = stored[key]?.trim();
  if (override) return override;
  return STANDARD_SECTION_LABELS[key];
}

export function getSectionLabels(
  customization?: PortfolioCustomization | Record<string, unknown> | null
): Record<SectionKey, string> {
  const stored = getStoredSectionLabels(customization);
  return Object.fromEntries(
    (Object.keys(STANDARD_SECTION_LABELS) as SectionKey[]).map((key) => [
      key,
      stored[key]?.trim() || STANDARD_SECTION_LABELS[key],
    ])
  ) as Record<SectionKey, string>;
}
