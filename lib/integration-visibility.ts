const INTEGRATION_PLATFORMS = [
  "github",
  "medium",
  "leetcode",
  "devto",
  "hashnode",
  "stackoverflow",
  "codeforces",
] as const;

const INTEGRATION_PLATFORM_SET = new Set<string>(INTEGRATION_PLATFORMS);

const PLATFORM_HOSTS: Record<string, readonly string[]> = {
  github: ["github.com"],
  medium: ["medium.com"],
  leetcode: ["leetcode.com"],
  devto: ["dev.to"],
  hashnode: ["hashnode.com", "hashnode.dev"],
  stackoverflow: ["stackoverflow.com"],
  codeforces: ["codeforces.com"],
};

export function normalizeHiddenIntegrations(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const id = item.trim().toLowerCase();
    if (!INTEGRATION_PLATFORM_SET.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function getHiddenIntegrations(
  customization: { hiddenIntegrations?: unknown } | null | undefined,
): string[] {
  return normalizeHiddenIntegrations(customization?.hiddenIntegrations);
}

function hostnameOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function hostMatchesPlatform(host: string, platform: string): boolean {
  const suffixes = PLATFORM_HOSTS[platform] ?? [];
  return suffixes.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

export function isHiddenIntegrationUrl(
  url: string | null | undefined,
  hidden: ReadonlySet<string>,
  profileHosts: ReadonlyMap<string, string>,
): boolean {
  const host = hostnameOf(url);
  if (!host || hidden.size === 0) return false;

  for (const platform of hidden) {
    if (hostMatchesPlatform(host, platform)) return true;
    const profileHost = profileHosts.get(platform);
    if (profileHost && host === profileHost) return true;
  }
  return false;
}

type VisibilityInput = {
  customization?: { hiddenIntegrations?: unknown } | null;
  socialProfiles: Array<{ platform: string; url: string }>;
  articles: Array<{ url: string }>;
  projects: Array<{ sourceUrl: string | null }>;
};

/** Drop a hidden integration's profile, stats, articles, and GitHub repos. */
export function applyHiddenIntegrations<T extends VisibilityInput>(data: T): T {
  const hidden = new Set(getHiddenIntegrations(data.customization));
  if (hidden.size === 0) return data;

  const profileHosts = new Map<string, string>();
  for (const profile of data.socialProfiles) {
    const platform = profile.platform.toLowerCase();
    if (!hidden.has(platform)) continue;
    const host = hostnameOf(profile.url);
    if (host) profileHosts.set(platform, host);
  }

  return {
    ...data,
    socialProfiles: data.socialProfiles.filter(
      (profile) => !hidden.has(profile.platform.toLowerCase()),
    ),
    articles: data.articles.filter(
      (article) => !isHiddenIntegrationUrl(article.url, hidden, profileHosts),
    ),
    projects: data.projects.filter(
      (project) =>
        !hidden.has("github") ||
        !isHiddenIntegrationUrl(project.sourceUrl, new Set(["github"]), profileHosts),
    ),
  };
}