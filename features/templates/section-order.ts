import type { ReactNode } from "react";
import type { SectionKey } from "./section-labels";
import type { PortfolioCustomization, PortfolioData } from "./types";

export const REORDERABLE_SECTIONS = [
  "about",
  "projects",
  "experience",
  "education",
  "skills",
  "certifications",
  "achievements",
  "articles",
  "profiles",
  "github",
] as const satisfies readonly SectionKey[];

export type ReorderableSectionKey = (typeof REORDERABLE_SECTIONS)[number];

export type SectionGroupId = "main" | "aside" | "full";

export interface SectionLayoutCustomization {
  /** Global flat permutation of reorderable section keys. */
  order?: ReorderableSectionKey[];
  /** Sections the user has explicitly hidden. */
  hidden?: ReorderableSectionKey[];
}

export interface TemplateSectionGroup {
  id: SectionGroupId;
  label: string;
  defaultOrder: ReorderableSectionKey[];
}

export interface TemplateSectionLayout {
  groups: TemplateSectionGroup[];
  /** When true, hide-only — no drag reordering (e.g. Bento mosaic). */
  fixed?: boolean;
}

export interface ResolvedSectionLayout {
  order: Record<SectionGroupId, ReorderableSectionKey[]>;
  isHidden: (key: ReorderableSectionKey) => boolean;
  globalOrder: ReorderableSectionKey[];
  hidden: ReorderableSectionKey[];
}

const REORDERABLE_SET = new Set<string>(REORDERABLE_SECTIONS);

export function isReorderableSectionKey(
  value: unknown,
): value is ReorderableSectionKey {
  return typeof value === "string" && REORDERABLE_SET.has(value);
}

/** Coerce stored order into a full permutation of REORDERABLE_SECTIONS. */
export function normalizeOrder(
  stored: unknown,
): ReorderableSectionKey[] {
  const seen = new Set<ReorderableSectionKey>();
  const result: ReorderableSectionKey[] = [];

  if (Array.isArray(stored)) {
    for (const item of stored) {
      if (isReorderableSectionKey(item) && !seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
  }

  for (const key of REORDERABLE_SECTIONS) {
    if (!seen.has(key)) {
      result.push(key);
    }
  }

  return result;
}

export function normalizeHidden(stored: unknown): ReorderableSectionKey[] {
  if (!Array.isArray(stored)) return [];
  const seen = new Set<ReorderableSectionKey>();
  const result: ReorderableSectionKey[] = [];
  for (const item of stored) {
    if (isReorderableSectionKey(item) && !seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

export function getStoredSectionLayout(
  customization: PortfolioCustomization | Record<string, unknown> | null | undefined,
): SectionLayoutCustomization {
  if (!customization || typeof customization !== "object") return {};
  const raw = (customization as PortfolioCustomization).sectionLayout;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as SectionLayoutCustomization;
}

/**
 * Write a group's new sequence back into the global order array,
 * keeping positions of keys outside the group fixed.
 */
export function applyGroupOrder(
  globalOrder: ReorderableSectionKey[],
  groupKeys: ReorderableSectionKey[],
): ReorderableSectionKey[] {
  const groupSet = new Set(groupKeys);
  const queue = [...groupKeys];
  return globalOrder.map((key) => (groupSet.has(key) ? queue.shift()! : key));
}

export function resolveSectionLayout(
  layout: TemplateSectionLayout,
  customization: PortfolioCustomization | Record<string, unknown> | null | undefined,
): ResolvedSectionLayout {
  const stored = getStoredSectionLayout(customization);
  const globalOrder = normalizeOrder(stored.order);
  const hidden = normalizeHidden(stored.hidden);
  const hiddenSet = new Set(hidden);

  const order = {
    main: [] as ReorderableSectionKey[],
    aside: [] as ReorderableSectionKey[],
    full: [] as ReorderableSectionKey[],
  };

  for (const group of layout.groups) {
    const groupSet = new Set(group.defaultOrder);
    const fromGlobal = globalOrder.filter((key) => groupSet.has(key));
    const seen = new Set(fromGlobal);
    const missing = group.defaultOrder.filter((key) => !seen.has(key));
    order[group.id] = [...fromGlobal, ...missing];
  }

  return {
    order,
    isHidden: (key) => hiddenSet.has(key),
    globalOrder,
    hidden,
  };
}

export function renderSections(
  resolved: ResolvedSectionLayout,
  groupId: SectionGroupId,
  blocks: Partial<Record<ReorderableSectionKey, ReactNode>>,
): ReactNode[] {
  return resolved.order[groupId]
    .filter((key) => !resolved.isHidden(key) && blocks[key] != null)
    .map((key) => blocks[key]!);
}

/** Build a SectionLayoutCustomization payload from resolved draft state. */
export function toSectionLayoutPayload(
  order: ReorderableSectionKey[],
  hidden: ReorderableSectionKey[],
): SectionLayoutCustomization {
  return {
    order: normalizeOrder(order),
    hidden: normalizeHidden(hidden),
  };
}

function hasGithubActivity(data: PortfolioData): boolean {
  const githubProfile = data.socialProfiles.find(
    (profile) => profile.platform.toLowerCase() === "github",
  );
  if (!githubProfile?.cachedStats) return false;
  const stats = githubProfile.cachedStats as Record<string, unknown>;
  return Boolean(stats.contributionCalendar);
}

function hasProfilesSection(data: PortfolioData): boolean {
  return (
    data.socialProfiles.length > 0 ||
    Boolean(
      data.portfolio.contactEmail ||
        data.portfolio.phone ||
        data.portfolio.websiteUrl ||
        data.portfolio.location,
    )
  );
}

/** Which reorderable sections currently have content that would render. */
export function getPresentSections(
  data: PortfolioData,
): Set<ReorderableSectionKey> {
  const present = new Set<ReorderableSectionKey>();
  if (data.portfolio.summary?.trim()) present.add("about");
  if (data.projects.length > 0) present.add("projects");
  if (data.experiences.length > 0) present.add("experience");
  if (data.educations.length > 0) present.add("education");
  if (data.skills.length > 0) present.add("skills");
  if (data.certifications.length > 0) present.add("certifications");
  if (data.achievements.length > 0) present.add("achievements");
  if (data.articles.length > 0) present.add("articles");
  if (hasProfilesSection(data)) present.add("profiles");
  if (hasGithubActivity(data)) present.add("github");
  return present;
}
