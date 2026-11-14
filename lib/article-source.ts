export const ARTICLE_SOURCES = [
  "medium",
  "devto",
  "hashnode",
  "stackoverflow",
  "linkedin",
] as const;

export type ArticleSource = (typeof ARTICLE_SOURCES)[number];

const ARTICLE_SOURCE_SET = new Set<string>(ARTICLE_SOURCES);

const PLATFORM_HOSTS: Record<ArticleSource, readonly string[]> = {
  medium: ["medium.com"],
  devto: ["dev.to"],
  hashnode: ["hashnode.com", "hashnode.dev"],
  stackoverflow: ["stackoverflow.com"],
  linkedin: ["linkedin.com"],
};

function hostnameOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function hostMatchesPlatform(host: string, platform: ArticleSource): boolean {
  return PLATFORM_HOSTS[platform].some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

export function normalizeArticleSource(value: unknown): ArticleSource | null {
  if (typeof value !== "string") return null;
  const source = value.trim().toLowerCase();
  return ARTICLE_SOURCE_SET.has(source) ? (source as ArticleSource) : null;
}

export function inferArticleSource(
  url: string | null | undefined,
  socialProfiles: Array<{ platform: string; url: string }> = [],
): ArticleSource | null {
  const host = hostnameOf(url);
  if (!host) return null;

  for (const platform of ARTICLE_SOURCES) {
    if (hostMatchesPlatform(host, platform)) return platform;
  }

  for (const profile of socialProfiles) {
    const platform = normalizeArticleSource(profile.platform);
    if (!platform) continue;
    const profileHost = hostnameOf(profile.url);
    if (profileHost && host === profileHost) return platform;
  }

  return null;
}

export function resolveArticleSource(
  url: string | null | undefined,
  stored?: string | null,
  socialProfiles: Array<{ platform: string; url: string }> = [],
): ArticleSource | null {
  return normalizeArticleSource(stored) ?? inferArticleSource(url, socialProfiles);
}