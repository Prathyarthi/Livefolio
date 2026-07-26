import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { resolveAccessForUser } from "@/lib/entitlements";
import {
  buildHourlyBuckets,
  buildHourlySeries,
  buildLast7DayBuckets,
  buildLast30DayBuckets,
  computeWeekOverWeekChange,
  findBestStreak,
  findPeakDay,
  findPeakHour,
  formatHourLabel,
  startOfDay,
} from "@/features/analytics/lib/stats";
import {
  CLICK_TYPE_LABELS,
  isClickType,
} from "@/features/analytics/lib/click-types";
import {
  getAnalyticsCacheTtlMinutes,
  getCachedAnalyticsStats,
  setCachedAnalyticsStats,
} from "@/features/analytics/lib/stats-cache";
import { enforceAnalyticsMeRateLimit } from "@/lib/analytics-rate-limit";

const emptyStats = {
  isPublished: false,
  totalViews: 0,
  todayViews: 0,
  last7Days: 0,
  last30Days: 0,
  previous7Days: 0,
  weekOverWeekChange: null as number | null,
  avgDaily7Days: 0,
  avgDaily30Days: 0,
  peakHour: null as { hour: number; label: string; count: number } | null,
  peakDay: null as { date: string; count: number } | null,
  bestStreak: 0,
  daily: buildLast7DayBuckets([]),
  daily30: buildLast30DayBuckets([]),
  hourly: buildHourlySeries([]),
  totalClicks: 0,
  clicksLast30Days: 0,
  topLinks: [] as Array<{
    type: string;
    typeLabel: string;
    label: string;
    url: string;
    count: number;
  }>,
  clicksByType: [] as Array<{ type: string; typeLabel: string; count: number }>,
};

type AnalyticsStatsPayload = typeof emptyStats & {
  isPublished: boolean;
};

async function loadAnalyticsStats(
  portfolioId: string,
  isPublished: boolean,
  now: Date
): Promise<AnalyticsStatsPayload> {
  const todayStart = startOfDay(now);
  const sevenDaysAgo = startOfDay(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const fourteenDaysAgo = startOfDay(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const thirtyDaysAgo = startOfDay(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalViews,
    todayViews,
    last7Days,
    previous7Days,
    last30Days,
    recentViews,
    monthlyViews,
    totalClicks,
    clicksLast30Days,
    clickGroups,
    clickTypeGroups,
  ] = await Promise.all([
    prisma.portfolioView.count({ where: { portfolioId } }),
    prisma.portfolioView.count({
      where: { portfolioId, viewedAt: { gte: todayStart } },
    }),
    prisma.portfolioView.count({
      where: { portfolioId, viewedAt: { gte: sevenDaysAgo } },
    }),
    prisma.portfolioView.count({
      where: {
        portfolioId,
        viewedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
    prisma.portfolioView.count({
      where: { portfolioId, viewedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.portfolioView.findMany({
      where: { portfolioId, viewedAt: { gte: sevenDaysAgo } },
      select: { viewedAt: true },
      orderBy: { viewedAt: "asc" },
    }),
    prisma.portfolioView.findMany({
      where: { portfolioId, viewedAt: { gte: thirtyDaysAgo } },
      select: { viewedAt: true },
      orderBy: { viewedAt: "asc" },
    }),
    prisma.portfolioClick.count({ where: { portfolioId } }),
    prisma.portfolioClick.count({
      where: { portfolioId, clickedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.portfolioClick.groupBy({
      by: ["type", "label", "url"],
      where: { portfolioId, clickedAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
    }),
    prisma.portfolioClick.groupBy({
      by: ["type"],
      where: { portfolioId, clickedAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
    }),
  ]);

  const hourlyBuckets = buildHourlyBuckets(monthlyViews);
  const peak = findPeakHour(hourlyBuckets);
  const daily30 = buildLast30DayBuckets(monthlyViews, now);
  const peakDay = findPeakDay(daily30);
  const weekOverWeekChange = computeWeekOverWeekChange(last7Days, previous7Days);

  const topLinks = clickGroups
    .map((row) => {
      const type = isClickType(row.type) ? row.type : "outbound";
      return {
        type,
        typeLabel: CLICK_TYPE_LABELS[type],
        label: row.label || row.url,
        url: row.url,
        count: row._count._all,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const clicksByType = clickTypeGroups
    .map((row) => {
      const type = isClickType(row.type) ? row.type : "outbound";
      return {
        type,
        typeLabel: CLICK_TYPE_LABELS[type],
        count: row._count._all,
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    isPublished,
    totalViews,
    todayViews,
    last7Days,
    last30Days,
    previous7Days,
    weekOverWeekChange,
    avgDaily7Days: Math.round((last7Days / 7) * 10) / 10,
    avgDaily30Days: Math.round((last30Days / 30) * 10) / 10,
    peakHour: peak
      ? {
          hour: peak.hour,
          label: formatHourLabel(peak.hour),
          count: peak.count,
        }
      : null,
    peakDay,
    bestStreak: findBestStreak(daily30),
    daily: buildLast7DayBuckets(recentViews, now),
    daily30,
    hourly: buildHourlySeries(monthlyViews),
    totalClicks,
    clicksLast30Days,
    topLinks,
    clicksByType,
  };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResponse = await enforceAnalyticsMeRateLimit(session.user.id);
  if (rateLimitResponse) return rateLimitResponse;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { portfolio: { select: { id: true, isPublished: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const access = resolveAccessForUser(user);

  if (!access.canUseAnalytics) {
    return NextResponse.json(
      { error: "Analytics is a Pro feature", access },
      { status: 403 }
    );
  }

  const portfolioId = user.portfolio?.id;
  const cacheTtlMinutes = getAnalyticsCacheTtlMinutes();
  if (!portfolioId) {
    const generatedAt = new Date().toISOString();
    return NextResponse.json({
      access,
      ...emptyStats,
      cached: false,
      generatedAt,
      cacheExpiresAt: null,
      cacheTtlMinutes,
    });
  }

  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";
  const cached = forceRefresh
    ? null
    : getCachedAnalyticsStats<AnalyticsStatsPayload>(portfolioId);

  if (cached) {
    return NextResponse.json({
      access,
      ...cached.payload,
      cached: true,
      generatedAt: cached.generatedAt,
      cacheExpiresAt: new Date(cached.expiresAt).toISOString(),
      cacheTtlMinutes,
    });
  }

  const now = new Date();
  const stats = await loadAnalyticsStats(
    portfolioId,
    user.portfolio?.isPublished ?? false,
    now
  );
  const entry = setCachedAnalyticsStats(portfolioId, stats, now);

  return NextResponse.json({
    access,
    ...stats,
    cached: false,
    generatedAt: entry.generatedAt,
    cacheExpiresAt: new Date(entry.expiresAt).toISOString(),
    cacheTtlMinutes,
  });
}
