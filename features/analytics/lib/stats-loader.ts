import { prisma } from "@/lib/prisma";
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
} from "./stats";
import { CLICK_TYPE_LABELS, isClickType } from "./click-types";

export type AnalyticsStatsPayload = {
  generatedAt: string;
  isPublished: boolean;
  totalViews: number;
  todayViews: number;
  last7Days: number;
  last30Days: number;
  previous7Days: number;
  weekOverWeekChange: number | null;
  avgDaily7Days: number;
  avgDaily30Days: number;
  peakHour: { hour: number; label: string; count: number } | null;
  peakDay: { date: string; count: number } | null;
  bestStreak: number;
  daily: ReturnType<typeof buildLast7DayBuckets>;
  daily30: ReturnType<typeof buildLast30DayBuckets>;
  hourly: ReturnType<typeof buildHourlySeries>;
  totalClicks: number;
  clicksLast30Days: number;
  topLinks: Array<{
    type: string;
    typeLabel: string;
    label: string;
    url: string;
    count: number;
  }>;
  clicksByType: Array<{ type: string; typeLabel: string; count: number }>;
};

export async function loadAnalyticsStats(
  portfolioId: string,
  isPublished: boolean,
): Promise<AnalyticsStatsPayload> {
  const now = new Date();
  const generatedAt = now.toISOString();

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
    generatedAt,
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
      ? { hour: peak.hour, label: formatHourLabel(peak.hour), count: peak.count }
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
