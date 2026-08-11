"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Clock,
  Eye,
  Flame,
  Lock,
  Minus,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FlowFooter } from "@/features/dashboard/components/flow-footer";
import type {
  DailyViewCount,
  HourlyViewCount,
} from "@/features/analytics/lib/stats";
import { formatHourTick, remapUtcHourlyToLocal } from "@/features/analytics/lib/stats";
import { cn } from "@/lib/utils";

const AnalyticsCharts = dynamic(
  () => import("@/features/analytics/components/analytics-charts"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-[340px] w-full rounded-xl" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    ),
  }
);

interface AnalyticsState {
  totalViews: number;
  todayViews: number;
  last7Days: number;
  last30Days: number;
  weekOverWeekChange: number | null;
  avgDaily7Days: number;
  avgDaily30Days: number;
  peakHour: { hour: number; label: string; count: number } | null;
  peakDay: { date: string; count: number } | null;
  bestStreak: number;
  isPublished: boolean;
  daily: DailyViewCount[];
  daily30: DailyViewCount[];
  hourly: HourlyViewCount[];
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
  cached?: boolean;
  generatedAt?: string;
  cacheExpiresAt?: string | null;
  cacheTtlMinutes?: number;
  access?: { canUseAnalytics?: boolean };
}

type RangeKey = "7d" | "30d";

const statCardClassName =
  "border-border-default bg-surface-raised shadow-[var(--shadow-card)]";

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className={statCardClassName}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-body-sm font-medium text-text-secondary">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-text-muted" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-text-primary md:text-4xl">
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function WeekChangeBadge({ change }: { change: number | null }) {
  if (change === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-text-muted">
        <Minus className="h-3 w-3" aria-hidden />
        No prior week data
      </span>
    );
  }

  const positive = change > 0;
  const neutral = change === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        positive && "text-success",
        neutral && "text-text-muted",
        !positive && !neutral && "text-danger"
      )}
    >
      {positive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : neutral ? (
        <Minus className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {positive ? "+" : ""}
      {change}% vs prior week
    </span>
  );
}

function formatRelativeTime(iso: string, nowMs: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";
  const diffSec = Math.max(0, Math.round((nowMs - then) / 1000));
  if (diffSec < 45) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDayLabel(dateKey: string, compact = false): string {
  const date = new Date(`${dateKey}T12:00:00`);
  if (compact) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locked, setLocked] = useState(false);
  const [stats, setStats] = useState<AnalyticsState | null>(null);
  const [range, setRange] = useState<RangeKey>("7d");

  const loadStats = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(
        forceRefresh ? "/api/analytics/me?refresh=1" : "/api/analytics/me"
      );
      const data = (await res.json().catch(() => ({}))) as AnalyticsState & {
        error?: string;
      };

      if (res.status === 403) {
        setLocked(true);
        setStats(null);
        return;
      }

      if (!res.ok) {
        setLocked(false);
        setStats(null);
        return;
      }

      setLocked(false);
      setStats(data);
    } catch {
      setLocked(false);
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadStats(false);
    // Initial load only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cacheNote = useMemo(() => {
    if (!stats?.generatedAt) return null;
    const ttl = stats.cacheTtlMinutes ?? 30;
    const updated = formatRelativeTime(stats.generatedAt);
    if (stats.cached) {
      return `Updated ${updated}. Stats are cached for ${ttl} minutes to keep the dashboard fast.`;
    }
    return `Updated ${updated}. Fresh from the database — next loads are cached for ${ttl} minutes.`;
  }, [stats?.generatedAt, stats?.cached, stats?.cacheTtlMinutes]);

  const trendSeries = useMemo(() => {
    if (!stats) return [];
    const source = range === "7d" ? stats.daily : stats.daily30;
    return source.map((day) => ({
      ...day,
      label: formatDayLabel(day.date, range === "30d"),
    }));
  }, [stats, range]);

  const rangeTotal = range === "7d" ? stats?.last7Days ?? 0 : stats?.last30Days ?? 0;
  const rangeAvg =
    range === "7d" ? stats?.avgDaily7Days ?? 0 : stats?.avgDaily30Days ?? 0;

  const hourlyData = useMemo(
    () =>
      remapUtcHourlyToLocal(stats?.hourly ?? []).map((bucket) => ({
        ...bucket,
        tick: formatHourTick(bucket.hour),
      })),
    [stats?.hourly]
  );

  const peakHourLocal = useMemo(() => {
    const series = remapUtcHourlyToLocal(stats?.hourly ?? []);
    let peak: { hour: number; label: string; count: number } | null = null;
    for (const bucket of series) {
      if (!peak || bucket.count > peak.count) {
        peak = bucket;
      }
    }
    return peak?.count ? peak : null;
  }, [stats?.hourly]);

  const clicksByTypeData = useMemo(
    () =>
      (stats?.clicksByType ?? []).map((row) => ({
        ...row,
        name: row.typeLabel,
      })),
    [stats?.clicksByType]
  );

  const topLinksData = useMemo(
    () =>
      (stats?.topLinks ?? []).map((row) => ({
        ...row,
        name:
          row.label.length > 28 ? `${row.label.slice(0, 28)}…` : row.label,
      })),
    [stats?.topLinks]
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-2 md:py-6">
      <header className="space-y-1">
        <p className="eyebrow uppercase">Insights</p>
        <h1 className="text-h2 text-text-primary">Portfolio analytics</h1>
        <p className="text-body-sm text-text-secondary">
          See how many people visit your live portfolio and how traffic trends
          over time.
        </p>
        {cacheNote && !loading && !locked ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {cacheNote}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-text-secondary"
              disabled={refreshing}
              onClick={() => void loadStats(true)}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                aria-hidden
              />
              {refreshing ? "Refreshing…" : "Refresh now"}
            </Button>
          </div>
        ) : null}
      </header>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className={statCardClassName}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className={statCardClassName}>
            <CardContent className="pt-6">
              <Skeleton className="h-[220px] w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      ) : locked ? (
        <Card className={statCardClassName}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-warning" aria-hidden />
              <CardTitle className="text-h4 text-text-primary">Pro feature</CardTitle>
            </div>
            <CardDescription className="text-text-secondary">
              Visit analytics is included with Pro and during your free month.
              Upgrade to keep seeing view counts and trends after the trial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-full">
              <Link href="/dashboard/billing">Upgrade to Pro</Link>
            </Button>
          </CardContent>
        </Card>
      ) : stats ? (
        <div className="space-y-6">
          {!stats.isPublished && (
            <div className="rounded-[var(--radius-md)] border border-warning/30 bg-warning-bg px-4 py-3 text-body-sm">
              <p className="font-medium text-text-primary">Portfolio not live yet</p>
              <p className="mt-1 text-text-secondary">
                Publish your portfolio to start collecting visits. Views are
                recorded when someone opens your public link.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total views"
              value={stats.totalViews.toLocaleString()}
              icon={Eye}
            />
            <StatCard
              title="Today"
              value={stats.todayViews.toLocaleString()}
              icon={BarChart3}
            />
            <StatCard
              title="Last 30 days"
              value={stats.last30Days.toLocaleString()}
              hint={`${stats.avgDaily30Days}/day average`}
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className={statCardClassName}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-body-sm font-medium text-text-secondary">
                  Last 7 days
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-text-muted" aria-hidden />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums tracking-tight text-text-primary md:text-4xl">
                  {stats.last7Days.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {stats.avgDaily7Days}/day average
                </p>
                <div className="mt-2">
                  <WeekChangeBadge change={stats.weekOverWeekChange} />
                </div>
              </CardContent>
            </Card>
            <StatCard
              title="Peak hour"
              value={peakHourLocal?.label ?? "—"}
              hint={
                peakHourLocal
                  ? `${peakHourLocal.count} views in last 30 days`
                  : "Not enough data yet"
              }
              icon={Clock}
            />
            <StatCard
              title="Busiest day"
              value={
                stats.peakDay
                  ? new Date(`${stats.peakDay.date}T12:00:00`).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"
              }
              hint={
                stats.peakDay
                  ? `${stats.peakDay.count} view${stats.peakDay.count === 1 ? "" : "s"}`
                  : "Not enough data yet"
              }
              icon={CalendarDays}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              title="Best streak"
              value={
                stats.bestStreak > 0
                  ? `${stats.bestStreak} day${stats.bestStreak === 1 ? "" : "s"}`
                  : "—"
              }
              hint="Consecutive days with at least one view (last 30 days)"
              icon={Flame}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                title="Link clicks"
                value={(stats.totalClicks ?? 0).toLocaleString()}
                hint="All-time outbound clicks from your live portfolio"
                icon={MousePointerClick}
              />
              <StatCard
                title="Clicks (30 days)"
                value={(stats.clicksLast30Days ?? 0).toLocaleString()}
                hint="Projects, articles, socials, and other links"
                icon={MousePointerClick}
              />
            </div>
          </div>

          <AnalyticsCharts
            trendSeries={trendSeries}
            hourlyData={hourlyData}
            clicksByTypeData={clicksByTypeData}
            topLinksData={topLinksData}
            range={range}
            rangeTotal={rangeTotal}
            rangeAvg={rangeAvg}
            onRangeChange={setRange}
            statCardClassName={statCardClassName}
          />
        </div>
      ) : (
        <Card className={statCardClassName}>
          <CardContent className="py-8 text-center text-body-sm text-text-secondary">
            Could not load analytics. Try refreshing the page.
          </CardContent>
        </Card>
      )}

      <FlowFooter
        previous={{ href: "/dashboard", label: "Overview" }}
        next={{ href: "/dashboard/billing", label: "Billing" }}
      />
    </div>
  );
}
