const PLATFORM_HOSTS: Record<string, string> = {
  "github.com": "github",
  "www.github.com": "github",
  "linkedin.com": "linkedin",
  "www.linkedin.com": "linkedin",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "instagram.com": "instagram",
  "medium.com": "medium",
  "dribbble.com": "dribbble",
  "leetcode.com": "leetcode",
};

export type SocialProfileInput = {
  platform: string;
  url: string | null;
  username: string | null;
};

export type NormalizedSocialProfile = {
  platform: string;
  url: string;
  username: string | null;
};

function stripAtPrefix(value: string): string {
  return value.replace(/^@+/, "").trim();
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function resolvePlatformFromUrl(url: string): {
  platform: string;
  url: string;
  username: string | null;
} | null {
  try {
    const parsed = new URL(normalizeUrl(url));
    const host = parsed.hostname.toLowerCase();
    const platform = PLATFORM_HOSTS[host];
    if (!platform) return null;

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    let username: string | null = null;

    if (platform === "github" || platform === "twitter" || platform === "instagram") {
      username = pathParts[0] ?? null;
    } else if (platform === "linkedin" && pathParts[0] === "in" && pathParts[1]) {
      username = pathParts[1];
    } else if (platform === "medium" && pathParts[0]?.startsWith("@")) {
      username = stripAtPrefix(pathParts[0]);
    } else if (platform === "leetcode") {
      username = pathParts[0] === "u" ? (pathParts[1] ?? null) : (pathParts[0] ?? null);
    }

    return {
      platform,
      url: parsed.toString(),
      username: username ? stripAtPrefix(username) : null,
    };
  } catch {
    return null;
  }
}

function inferPlatformFromUsername(username: string): NormalizedSocialProfile | null {
  const trimmed = username.trim();
  if (!trimmed) return null;

  const githubHandleMatch = trimmed.match(/@([A-Za-z0-9-]+)/);
  if (githubHandleMatch) {
    const handle = githubHandleMatch[1]!;
    return {
      platform: "github",
      url: `https://github.com/${handle}`,
      username: handle,
    };
  }

  const slashHandleMatch = trimmed.match(/^\/([A-Za-z0-9-]+)$/);
  if (slashHandleMatch) {
    const handle = slashHandleMatch[1]!;
    return {
      platform: "github",
      url: `https://github.com/${handle}`,
      username: handle,
    };
  }

  if (/^[A-Za-z0-9-]+$/.test(trimmed)) {
    return {
      platform: "github",
      url: `https://github.com/${trimmed}`,
      username: trimmed,
    };
  }

  return null;
}

function defaultUrlForPlatform(platform: string, username: string | null): string | null {
  if (!username) return null;
  const handle = stripAtPrefix(username);
  if (!handle) return null;

  switch (platform) {
    case "github":
      return `https://github.com/${handle}`;
    case "linkedin":
      return `https://linkedin.com/in/${handle}`;
    case "twitter":
      return `https://x.com/${handle}`;
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "medium":
      return `https://medium.com/@${handle}`;
    case "dribbble":
      return `https://dribbble.com/${handle}`;
    case "leetcode":
      return `https://leetcode.com/u/${handle}`;
    default:
      return null;
  }
}

export function normalizeSocialProfile(
  entry: SocialProfileInput,
): NormalizedSocialProfile | null {
  let platform = entry.platform.toLowerCase().trim();
  let url = entry.url?.trim() || null;
  let username = entry.username?.trim() || null;

  if (url) {
    const fromUrl = resolvePlatformFromUrl(url);
    if (fromUrl) {
      platform = fromUrl.platform;
      url = fromUrl.url;
      username = username ? stripAtPrefix(username) : fromUrl.username;
    }
  }

  if ((!platform || platform === "unknown") && username) {
    const inferred = inferPlatformFromUsername(username);
    if (inferred) {
      platform = inferred.platform;
      url = url ?? inferred.url;
      username = inferred.username;
    }
  }

  if (!platform || platform === "unknown") return null;

  if (!url) {
    url = defaultUrlForPlatform(platform, username);
  }
  if (!url) return null;

  username = username ? stripAtPrefix(username) : null;

  return { platform, url: normalizeUrl(url), username };
}

export function normalizeSocialProfiles(
  profiles: SocialProfileInput[],
): NormalizedSocialProfile[] {
  const byPlatform = new Map<string, NormalizedSocialProfile>();

  for (const profile of profiles) {
    const normalized = normalizeSocialProfile(profile);
    if (!normalized) continue;
    byPlatform.set(normalized.platform, normalized);
  }

  return Array.from(byPlatform.values());
}
