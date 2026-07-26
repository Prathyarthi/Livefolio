export interface DailyViewCount {
  date: string;
  count: number;
}

export interface HourlyViewCount {
  hour: number;
  label: string;
  count: number;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function buildLastNDayBuckets(
  views: { viewedAt: Date }[],
  days: number,
  now: Date = new Date()
): DailyViewCount[] {
  const buckets = new Map<string, number>();

  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(now);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const view of views) {
    const key = view.viewedAt.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export function buildLast7DayBuckets(
  views: { viewedAt: Date }[],
  now: Date = new Date()
): DailyViewCount[] {
  return buildLastNDayBuckets(views, 7, now);
}

export function buildLast30DayBuckets(
  views: { viewedAt: Date }[],
  now: Date = new Date()
): DailyViewCount[] {
  return buildLastNDayBuckets(views, 30, now);
}

export function buildHourlyBuckets(
  views: { viewedAt: Date }[]
): { hour: number; count: number }[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));

  for (const view of views) {
    // Always bucket in UTC; the analytics UI remaps to the viewer's local timezone.
    const hour = view.viewedAt.getUTCHours();
    buckets[hour].count += 1;
  }

  return buckets;
}

export function buildHourlySeries(
  views: { viewedAt: Date }[]
): HourlyViewCount[] {
  return buildHourlyBuckets(views).map((bucket) => ({
    hour: bucket.hour,
    label: formatHourLabel(bucket.hour),
    count: bucket.count,
  }));
}

/** Remap UTC-hour buckets into the browser's local timezone. */
export function remapUtcHourlyToLocal(
  hourlyUtc: Array<{ hour: number; count: number }>
): HourlyViewCount[] {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const localCounts = Array.from({ length: 24 }, () => 0);

  for (const bucket of hourlyUtc) {
    const utcMinutes = bucket.hour * 60;
    const localMinutes = ((utcMinutes + offsetMinutes) % (24 * 60) + 24 * 60) % (24 * 60);
    const localHour = Math.floor(localMinutes / 60);
    localCounts[localHour] += bucket.count;
  }

  return localCounts.map((count, hour) => ({
    hour,
    label: formatHourLabel(hour),
    count,
  }));
}

export function findPeakHour(
  hourly: { hour: number; count: number }[]
): { hour: number; count: number } | null {
  let peak: { hour: number; count: number } | null = null;

  for (const bucket of hourly) {
    if (!peak || bucket.count > peak.count) {
      peak = bucket;
    }
  }

  return peak?.count ? peak : null;
}

export function formatHourLabel(hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatHourTick(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

export function computeWeekOverWeekChange(
  current: number,
  previous: number
): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 100);
}

/** Best consecutive day streak with at least one view (within the given series). */
export function findBestStreak(daily: DailyViewCount[]): number {
  let best = 0;
  let current = 0;
  for (const day of daily) {
    if (day.count > 0) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

/** Busiest single day in a series. */
export function findPeakDay(
  daily: DailyViewCount[]
): DailyViewCount | null {
  let peak: DailyViewCount | null = null;
  for (const day of daily) {
    if (!peak || day.count > peak.count) {
      peak = day;
    }
  }
  return peak?.count ? peak : null;
}
