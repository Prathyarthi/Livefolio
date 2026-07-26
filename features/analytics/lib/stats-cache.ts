const ANALYTICS_CACHE_TTL_MS = 30 * 60 * 1000;

type AnalyticsCacheEntry<T> = {
  expiresAt: number;
  generatedAt: string;
  payload: T;
};

const globalForAnalytics = globalThis as unknown as {
  analyticsStatsCache?: Map<string, AnalyticsCacheEntry<unknown>>;
};

function getCacheStore() {
  if (!globalForAnalytics.analyticsStatsCache) {
    globalForAnalytics.analyticsStatsCache = new Map();
  }
  return globalForAnalytics.analyticsStatsCache;
}

export function getCachedAnalyticsStats<T>(
  portfolioId: string
): AnalyticsCacheEntry<T> | null {
  const store = getCacheStore();
  const entry = store.get(portfolioId) as AnalyticsCacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    store.delete(portfolioId);
    return null;
  }
  return entry;
}

export function setCachedAnalyticsStats<T>(
  portfolioId: string,
  payload: T,
  now: Date = new Date()
): AnalyticsCacheEntry<T> {
  const entry: AnalyticsCacheEntry<T> = {
    generatedAt: now.toISOString(),
    expiresAt: now.getTime() + ANALYTICS_CACHE_TTL_MS,
    payload,
  };
  getCacheStore().set(portfolioId, entry as AnalyticsCacheEntry<unknown>);
  return entry;
}

export function clearCachedAnalyticsStats(portfolioId?: string) {
  const store = getCacheStore();
  if (portfolioId) {
    store.delete(portfolioId);
    return;
  }
  store.clear();
}

export function getAnalyticsCacheTtlMinutes() {
  return ANALYTICS_CACHE_TTL_MS / (60 * 1000);
}
