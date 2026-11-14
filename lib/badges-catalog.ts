/**
 * Code-defined badge catalog plus pure awarding/eligibility logic. No DB or IO
 * imports, so it is shared by the server (lib/badges.ts), the client UI, and
 * tests.
 */

export const BADGE_CATEGORIES = ["onboarding", "milestone", "integration"] as const;
export type BadgeCategory = (typeof BADGE_CATEGORIES)[number];

/** Semantic icon name (fallback/metadata); the medallion art lives in features/badges/components/badge-art.ts. */
export type BadgeIcon =
  | "sparkles"
  | "rocket"
  | "github"
  | "linkedin"
  | "code"
  | "pen-line"
  | "newspaper"
  | "book-open"
  | "layers"
  | "trophy";

export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: BadgeIcon;
  category: BadgeCategory;
}

/** Integration source id (SocialProfile.platform / LinkedInImport) → badge key. */
export const INTEGRATION_BADGE_SOURCES = [
  "github",
  "linkedin",
  "leetcode",
  "medium",
  "devto",
  "hashnode",
  "stackoverflow",
  "codeforces",
] as const;
export type IntegrationSource = (typeof INTEGRATION_BADGE_SOURCES)[number];

export function integrationBadgeKey(source: IntegrationSource) {
  return `integration.${source}` as const;
}

function integration(
  source: IntegrationSource,
  label: string,
  icon: BadgeIcon,
  what: string,
): BadgeDefinition {
  return {
    key: integrationBadgeKey(source),
    name: `${label} Connected`,
    description: `Imported ${what} from ${label}.`,
    icon,
    category: "integration",
  };
}

export const BADGES = [
  {
    key: "welcome",
    name: "Welcome Aboard",
    description: "Joined and opened your dashboard for the first time.",
    icon: "sparkles",
    category: "onboarding",
  },
  {
    key: "portfolio_published",
    name: "Live Portfolio",
    description: "Published your portfolio for the world to see.",
    icon: "rocket",
    category: "milestone",
  },
  integration("github", "GitHub", "github", "repositories"),
  integration("linkedin", "LinkedIn", "linkedin", "your profile"),
  integration("leetcode", "LeetCode", "code", "your problem-solving stats"),
  integration("medium", "Medium", "pen-line", "articles"),
  integration("devto", "DEV", "newspaper", "articles"),
  integration("hashnode", "Hashnode", "book-open", "articles"),
  integration("stackoverflow", "Stack Overflow", "layers", "your Q&A activity"),
  integration("codeforces", "Codeforces", "trophy", "your contest rating"),
] as const satisfies readonly BadgeDefinition[];

export type BadgeKey = (typeof BADGES)[number]["key"];

const BY_KEY = new Map<string, BadgeDefinition>(BADGES.map((b) => [b.key, b]));

export function getBadge(key: string): BadgeDefinition | undefined {
  return BY_KEY.get(key);
}

export function isBadgeKey(key: unknown): key is BadgeKey {
  return typeof key === "string" && BY_KEY.has(key);
}

export function isIntegrationSource(value: unknown): value is IntegrationSource {
  return typeof value === "string" && (INTEGRATION_BADGE_SOURCES as readonly string[]).includes(value);
}

/** Facts about a user's existing data, used for the lazy backfill. */
export interface BadgeFacts {
  isPublished: boolean;
  platforms: string[];
  hasLinkedInImport: boolean;
}

/** Badge keys a user already qualifies for. Welcome is always included (they're signed in). */
export function qualifiedBadgeKeys(facts: BadgeFacts): BadgeKey[] {
  const keys: BadgeKey[] = ["welcome"];
  if (facts.isPublished) keys.push("portfolio_published");
  const sources = new Set(facts.platforms.filter(isIntegrationSource));
  if (facts.hasLinkedInImport) sources.add("linkedin");
  for (const source of INTEGRATION_BADGE_SOURCES) {
    if (sources.has(source)) keys.push(integrationBadgeKey(source));
  }
  return keys;
}

export interface EarnedBadgeRow {
  badgeKey: string;
  awardedAt: Date;
}

/** Earned badges only, in catalog order (unknown keys dropped). */
export function buildBadgeShelf(rows: EarnedBadgeRow[]) {
  const earned = new Map(rows.map((r) => [r.badgeKey, r]));
  return BADGES.flatMap((badge) => {
    const row = earned.get(badge.key);
    return row ? [{ ...badge, awardedAt: row.awardedAt.toISOString() }] : [];
  });
}


export interface BadgeAwarderDeps {
  /** Insert if absent; resolve true only when a new row was created. */
  createIfAbsent(userId: string, key: BadgeKey): Promise<boolean>;
  onFirstAward?(userId: string, badge: BadgeDefinition): Promise<unknown>;
  logError?: (message: string, error: unknown) => void;
}

/**
 * Idempotent, non-throwing awarder. Resolves true only on the first award;
 * `onFirstAward` (the notification) runs only then.
 */
export function createBadgeAwarder(deps: BadgeAwarderDeps) {
  const log = deps.logError ?? ((message, error) => console.error(message, error));
  return async function awardBadge(
    userId: string,
    key: BadgeKey,
    options: { silent?: boolean } = {},
  ): Promise<boolean> {
    try {
      const badge = getBadge(key);
      if (!userId || !badge) {
        log("[badges] invalid award", { key });
        return false;
      }
      const created = await deps.createIfAbsent(userId, key);
      if (created && !options.silent && deps.onFirstAward) {
        try {
          await deps.onFirstAward(userId, badge);
        } catch (error) {
          log("[badges] first-award hook failed", error);
        }
      }
      return created;
    } catch (error) {
      log("[badges] award failed", error);
      return false;
    }
  };
}

