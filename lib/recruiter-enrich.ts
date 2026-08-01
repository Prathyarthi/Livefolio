import {
  buildGitHubCachedStats,
  fetchGitHubContributionsFromProfilePage,
  fetchGitHubProfile,
} from "@/lib/github";
import { fetchLeetCodeStats } from "@/lib/leetcode";
import { fetchMediumArticles } from "@/lib/medium";
import type { ParsedResume } from "@/lib/gemini";

export type EnrichmentAdapterResult = {
  platform: string;
  fetchStatus: "enriched" | "failed" | "skipped" | "link_only";
  url: string;
  username: string | null;
  cachedStats: Record<string, unknown> | null;
  /** Extra projects/articles to attach to the dossier */
  projects?: Array<{
    title: string;
    description: string;
    techStack: string[];
    liveUrl: string | null;
    sourceUrl: string | null;
    origin: string;
    meta?: Record<string, unknown>;
  }>;
  articles?: Array<{
    title: string;
    description: string;
    url: string;
    publishedAt: string | null;
  }>;
};

type DetectedProfile = {
  platform: string;
  url: string;
  username: string | null;
};

const ENRICHABLE_PLATFORMS = new Set(["github", "leetcode", "medium"]);

/** Platforms we store as link-only (no public fetch adapter yet). */
const LINK_ONLY_PLATFORMS = new Set(["linkedin", "twitter", "instagram", "dribbble"]);

export function detectProfilesFromParsed(
  parsed: ParsedResume
): DetectedProfile[] {
  const out: DetectedProfile[] = [];
  const seen = new Set<string>();

  for (const sp of parsed.socialProfiles ?? []) {
    const platform = (sp.platform || "").toLowerCase().trim();
    if (!platform || seen.has(platform)) continue;
    seen.add(platform);
    out.push({
      platform,
      url: sp.url ?? "",
      username: sp.username ? sp.username.replace(/^@/, "") : null,
    });
  }

  return out;
}

async function enrichGitHub(
  username: string,
  url: string
): Promise<EnrichmentAdapterResult> {
  try {
    const data = await fetchGitHubProfile(username);
    const calendar = await fetchGitHubContributionsFromProfilePage(username);
    const cachedStats = buildGitHubCachedStats(data, calendar);
    const projects = data.repos.slice(0, 12).map((repo) => ({
      title: repo.name,
      description: repo.description ?? "",
      techStack: repo.language ? [repo.language, ...repo.topics.slice(0, 4)] : repo.topics.slice(0, 5),
      liveUrl: null as string | null,
      sourceUrl: repo.url,
      origin: "github",
      meta: {
        stars: repo.stars,
        forks: repo.forks,
        language: repo.language,
      },
    }));
    return {
      platform: "github",
      fetchStatus: "enriched",
      url: url || `https://github.com/${username}`,
      username,
      cachedStats,
      projects,
    };
  } catch {
    return {
      platform: "github",
      fetchStatus: "failed",
      url: url || `https://github.com/${username}`,
      username,
      cachedStats: null,
    };
  }
}

async function enrichLeetCode(
  username: string,
  url: string
): Promise<EnrichmentAdapterResult> {
  try {
    const stats = await fetchLeetCodeStats(username);
    return {
      platform: "leetcode",
      fetchStatus: "enriched",
      url: url || `https://leetcode.com/${username}`,
      username,
      cachedStats: { ...stats },
    };
  } catch {
    return {
      platform: "leetcode",
      fetchStatus: "failed",
      url: url || `https://leetcode.com/${username}`,
      username,
      cachedStats: null,
    };
  }
}

async function enrichMedium(
  username: string,
  url: string
): Promise<EnrichmentAdapterResult> {
  try {
    const profile = await fetchMediumArticles(username);
    return {
      platform: "medium",
      fetchStatus: "enriched",
      url: url || `https://medium.com/@${username}`,
      username,
      cachedStats: {
        articleCount: profile.articles.length,
        name: profile.name,
        latestPublishedAt: profile.articles[0]?.publishedAt ?? null,
      },
      articles: profile.articles.slice(0, 20).map((a) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        publishedAt: a.publishedAt ?? null,
      })),
    };
  } catch {
    return {
      platform: "medium",
      fetchStatus: "failed",
      url: url || `https://medium.com/@${username}`,
      username,
      cachedStats: null,
    };
  }
}

/**
 * Run enrichment adapters for profiles detected on a resume.
 * Only platforms with a username (or enrichable handle) are fetched.
 */
export async function enrichDetectedProfiles(
  profiles: DetectedProfile[]
): Promise<EnrichmentAdapterResult[]> {
  const results: EnrichmentAdapterResult[] = [];

  for (const profile of profiles) {
    const platform = profile.platform.toLowerCase();

    if (LINK_ONLY_PLATFORMS.has(platform) || !ENRICHABLE_PLATFORMS.has(platform)) {
      results.push({
        platform,
        fetchStatus: LINK_ONLY_PLATFORMS.has(platform) ? "link_only" : "skipped",
        url: profile.url,
        username: profile.username,
        cachedStats: null,
      });
      continue;
    }

    if (!profile.username) {
      results.push({
        platform,
        fetchStatus: "skipped",
        url: profile.url,
        username: null,
        cachedStats: null,
      });
      continue;
    }

    if (platform === "github") {
      results.push(await enrichGitHub(profile.username, profile.url));
    } else if (platform === "leetcode") {
      results.push(await enrichLeetCode(profile.username, profile.url));
    } else if (platform === "medium") {
      results.push(await enrichMedium(profile.username, profile.url));
    }
  }

  return results;
}

export function estimateYearsFromExperiences(
  experiences: Array<{ startDate: string | null; endDate: string | null }>
): number | null {
  let totalMs = 0;
  let counted = 0;
  const now = Date.now();

  for (const exp of experiences) {
    if (!exp.startDate) continue;
    const start = Date.parse(exp.startDate);
    if (Number.isNaN(start)) continue;
    const end = exp.endDate ? Date.parse(exp.endDate) : now;
    if (Number.isNaN(end) || end < start) continue;
    totalMs += end - start;
    counted += 1;
  }

  if (!counted) return null;
  return Math.round((totalMs / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;
}
