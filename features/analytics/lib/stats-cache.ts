import { unstable_cache, revalidateTag } from "next/cache";
import { loadAnalyticsStats } from "./stats-loader";

const TTL_S = 30 * 60;

export function getAnalyticsCacheTtlMinutes() {
  return TTL_S / 60;
}

export function getCachedAnalyticsStats(portfolioId: string, isPublished: boolean) {
  return unstable_cache(loadAnalyticsStats, ["analytics-stats", portfolioId], {
    revalidate: TTL_S,
    tags: [`analytics:${portfolioId}`],
  })(portfolioId, isPublished);
}

export function revalidateAnalyticsCache(portfolioId: string) {
  revalidateTag(`analytics:${portfolioId}`);
}
