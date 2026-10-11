import type { ImportSourceValue } from "@/features/portfolio/constants/import-sources";

type SocialProfileLike = {
  platform?: string | null;
  cachedStats?: unknown;
  lastFetched?: string | Date | null;
};

type ProjectLike = {
  githubStars?: number | null;
  githubForks?: number | null;
};

type PortfolioLike = {
  title?: string | null;
  experiences?: unknown[] | null;
  projects?: ProjectLike[] | null;
  articles?: unknown[] | null;
  socialProfiles?: SocialProfileLike[] | null;
} | null | undefined;

function getSocialProfile(
  portfolio: PortfolioLike,
  platform: string
): SocialProfileLike | null {
  return (
    portfolio?.socialProfiles?.find(
      (profile) => profile.platform?.toLowerCase() === platform
    ) ?? null
  );
}

/** True only after a GitHub import (not OAuth link or resume projects alone). */
function hasGithubImport(portfolio: PortfolioLike): boolean {
  const profile = getSocialProfile(portfolio, "github");
  if (profile?.lastFetched || profile?.cachedStats) return true;

  return (
    portfolio?.projects?.some(
      (project) => project.githubStars != null || project.githubForks != null
    ) ?? false
  );
}

export function isImportSourceConnected(
  source: ImportSourceValue,
  portfolio: PortfolioLike
): boolean {
  if (!portfolio) return false;

  switch (source) {
    case "resume":
      return (
        Boolean(portfolio.title?.trim()) &&
        (portfolio.experiences?.length ?? 0) > 0
      );
    case "github":
      return hasGithubImport(portfolio);
    case "medium":
      // Medium import upserts the social profile; don't use articles alone
      // (resume/manual entries can create articles without a Medium import).
      return Boolean(getSocialProfile(portfolio, "medium"));
    case "leetcode":
      return Boolean(getSocialProfile(portfolio, "leetcode"));
    default:
      return false;
  }
}
