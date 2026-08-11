"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RangeKey = "7d" | "30d";

interface TrendPoint {
  date: string;
  label: string;
  count: number;
}

interface HourlyPoint {
  hour: number;
  label: string;
  tick: string;
  count: number;
}

interface ClickTypeRow {
  type: string;
  typeLabel: string;
  count: number;
  name: string;
}

interface TopLinkRow {
  type: string;
  typeLabel: string;
  label: string;
  url: string;
  count: number;
  name: string;
}

interface AnalyticsChartsProps {
  trendSeries: TrendPoint[];
  hourlyData: HourlyPoint[];
  clicksByTypeData: ClickTypeRow[];
  topLinksData: TopLinkRow[];
  range: RangeKey;
  rangeTotal: number;
  rangeAvg: number;
  onRangeChange: (range: RangeKey) => void;
  statCardClassName: string;
}

const viewsChartConfig = {
  count: { label: "Views", color: "var(--chart-1)" },
} satisfies ChartConfig;

const hourlyChartConfig = {
  count: { label: "Views", color: "var(--chart-1)" },
} satisfies ChartConfig;

const clicksByTypeChartConfig = {
  count: { label: "Clicks", color: "var(--chart-5)" },
} satisfies ChartConfig;

function formatDayLabel(dateKey: string, compact = false): string {
  const date = new Date(`${dateKey}T12:00:00`);
  if (compact) {
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function formatFullDay(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function AnalyticsCharts({
  trendSeries,
  hourlyData,
  clicksByTypeData,
  topLinksData,
  range,
  rangeTotal,
  rangeAvg,
  onRangeChange,
  statCardClassName,
}: AnalyticsChartsProps) {
  return (
    <>
      <Card className={statCardClassName}>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-h4 text-text-primary">Views over time</CardTitle>
            <CardDescription className="text-text-secondary">
              Daily visits to your live portfolio
            </CardDescription>
          </div>
          <Tabs value={range} onValueChange={(v) => onRangeChange(v as RangeKey)}>
            <TabsList>
              <TabsTrigger value="7d">7 days</TabsTrigger>
              <TabsTrigger value="30d">30 days</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ChartContainer config={viewsChartConfig} className="aspect-auto h-[240px] w-full">
            <AreaChart
              accessibilityLayer
              data={trendSeries}
              margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={range === "30d" ? 24 : 8}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tickMargin={4} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const date = payload?.[0]?.payload?.date as string | undefined;
                      return date ? formatFullDay(date) : "";
                    }}
                    indicator="line"
                  />
                }
              />
              <Area
                dataKey="count"
                type="monotone"
                fill="url(#fillViews)"
                stroke="var(--color-count)"
                strokeWidth={2}
                dot={range === "7d"}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className={statCardClassName}>
        <CardHeader>
          <CardTitle className="text-h4 text-text-primary">Traffic by hour</CardTitle>
          <CardDescription className="text-text-secondary">
            When visitors open your portfolio (last 30 days, your local time)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={hourlyChartConfig} className="aspect-auto h-[220px] w-full">
            <BarChart
              accessibilityLayer
              data={hourlyData}
              margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="tick" tickLine={false} axisLine={false} tickMargin={8} interval={2} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tickMargin={4} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const label = payload?.[0]?.payload?.label as string | undefined;
                      return label ?? "";
                    }}
                    indicator="dashed"
                  />
                }
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={statCardClassName}>
          <CardHeader>
            <CardTitle className="text-h4 text-text-primary">Clicks by type</CardTitle>
            <CardDescription className="text-text-secondary">
              How visitors engage with your links (last 30 days)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clicksByTypeData.length === 0 ? (
              <p className="py-10 text-center text-body-sm text-text-muted">
                No link clicks yet. Publish your portfolio and share it to start collecting click data.
              </p>
            ) : (
              <ChartContainer config={clicksByTypeChartConfig} className="aspect-auto h-[220px] w-full">
                <BarChart
                  accessibilityLayer
                  data={clicksByTypeData}
                  layout="vertical"
                  margin={{ left: 8, right: 12, top: 8, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    tickMargin={4}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className={statCardClassName}>
          <CardHeader>
            <CardTitle className="text-h4 text-text-primary">Top links</CardTitle>
            <CardDescription className="text-text-secondary">
              Most-clicked destinations in the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topLinksData.length === 0 ? (
              <p className="py-10 text-center text-body-sm text-text-muted">No link clicks yet.</p>
            ) : (
              <ul className="space-y-3">
                {topLinksData.map((row) => (
                  <li
                    key={`${row.type}-${row.url}`}
                    className="flex items-start justify-between gap-3 border-b border-border-default pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{row.label}</p>
                      <p className="mt-0.5 truncate text-xs text-text-muted">
                        {row.typeLabel}
                        {row.url ? ` · ${row.url.replace(/^https?:\/\//, "")}` : ""}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 rounded-full border-border-default bg-surface-sunken tabular-nums"
                    >
                      {row.count}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={statCardClassName}>
        <CardHeader className="pb-2">
          <CardTitle className="text-body-sm font-medium text-text-secondary">Selected range</CardTitle>
        </CardHeader>
        <CardContent className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-text-primary md:text-4xl">
              {rangeTotal.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {rangeAvg}/day · {range === "7d" ? "7 days" : "30 days"}
            </p>
          </div>
          <Badge variant="secondary" className="rounded-full border-border-default bg-surface-sunken">
            {range === "7d" ? "Week view" : "Month view"}
          </Badge>
        </CardContent>
      </Card>
    </>
  );
}

export default AnalyticsCharts;
