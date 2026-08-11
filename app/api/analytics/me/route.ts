import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";
import { resolveAccessForUser } from "@/lib/entitlements";
import {
  buildHourlySeries,
  buildLast7DayBuckets,
  buildLast30DayBuckets,
} from "@/features/analytics/lib/stats";
import {
  getAnalyticsCacheTtlMinutes,
  getCachedAnalyticsStats,
  revalidateAnalyticsCache,
} from "@/features/analytics/lib/stats-cache";
import { enforceAnalyticsMeRateLimit } from "@/lib/analytics-rate-limit";

const TTL_S = 30 * 60;

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
  const cacheHeaders = {
    "Cache-Control": "private, max-age=1800, stale-while-revalidate=3600",
  };

  if (!portfolioId) {
    return NextResponse.json(
      {
        access,
        ...emptyStats,
        cached: false,
        generatedAt: new Date().toISOString(),
        cacheExpiresAt: null,
        cacheTtlMinutes,
      },
      { headers: cacheHeaders }
    );
  }

  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "1";

  if (forceRefresh) {
    revalidateAnalyticsCache(portfolioId);
  }

  const stats = await getCachedAnalyticsStats(
    portfolioId,
    user.portfolio?.isPublished ?? false
  );

  const cached = Date.now() - new Date(stats.generatedAt).getTime() > 10_000;
  const cacheExpiresAt = new Date(
    new Date(stats.generatedAt).getTime() + TTL_S * 1000
  ).toISOString();

  return NextResponse.json(
    {
      access,
      ...stats,
      cached,
      cacheExpiresAt,
      cacheTtlMinutes,
    },
    { headers: cacheHeaders }
  );
}
