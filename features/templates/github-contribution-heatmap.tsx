import type { GitHubContributionCalendar } from "@/lib/github";
import { cn } from "@/lib/utils";

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", { month: "short" });
const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export function parseContributionCalendar(
  raw: unknown
): GitHubContributionCalendar | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const weeks = o.weeks;
  const total = o.totalContributions;
  if (!Array.isArray(weeks) || typeof total !== "number") return null;
  const normalized: GitHubContributionCalendar["weeks"] = [];
  for (const w of weeks) {
    if (!w || typeof w !== "object") continue;
    const days = (w as Record<string, unknown>).contributionDays;
    if (!Array.isArray(days)) continue;
    const contributionDays: Array<{ date: string; contributionCount: number }> =
      [];
    for (const d of days) {
      if (!d || typeof d !== "object") continue;
      const rec = d as Record<string, unknown>;
      if (typeof rec.date !== "string") continue;
      const c = rec.contributionCount;
      const count =
        typeof c === "number"
          ? c
          : typeof c === "string"
            ? Number(c) || 0
            : 0;
      contributionDays.push({ date: rec.date, contributionCount: count });
    }
    normalized.push({ contributionDays });
  }
  if (normalized.length === 0) return null;
  return { totalContributions: total, weeks: normalized };
}

export function GitHubContributionHeatmap({
  calendar,
  profileUrl,
  username,
  variant = "developer",
  label = null,
  stretch = false,
  className,
  frameClassName,
  metaClassName,
}: {
  calendar: GitHubContributionCalendar;
  profileUrl?: string | null;
  username?: string | null;
  variant?: "developer" | "modern" | "corporate" | "minimal" | "creative" | "blueprint";
  label?: string | null;
  /** Grow week columns so the grid fills the section width. */
  stretch?: boolean;
  className?: string;
  frameClassName?: string;
  metaClassName?: string;
}) {
  const monthLabels = calendar.weeks.map((week, index) => {
    const firstRealDay = week.contributionDays.find((day) =>
      /^\d{4}-\d{2}-\d{2}$/.test(day.date)
    );
    if (!firstRealDay) return "";

    const label = MONTH_LABEL_FORMATTER.format(new Date(`${firstRealDay.date}T00:00:00`));
    if (index === 0) return label;

    const prevRealDay = calendar.weeks[index - 1]?.contributionDays.find((day) =>
      /^\d{4}-\d{2}-\d{2}$/.test(day.date)
    );
    if (!prevRealDay) return label;

    const prevLabel = MONTH_LABEL_FORMATTER.format(
      new Date(`${prevRealDay.date}T00:00:00`)
    );
    return prevLabel === label ? "" : label;
  });
  const monthSpans = groupMonthLabelSpans(monthLabels);

  const theme = getHeatmapTheme(variant);

  const cellClass = (count: number) => {
    if (count === 0) return theme.cells[0];
    if (count <= 2) return theme.cells[1];
    if (count <= 5) return theme.cells[2];
    if (count <= 9) return theme.cells[3];
    return theme.cells[4];
  };

  return (
    <div className={cn(theme.rootClassName, className)}>
      {label ? <p className={theme.labelClassName}>{label}</p> : null}
      <div className={cn(theme.metaClassName, metaClassName)}>
        <p>
          <span className={theme.totalClassName}>
            {calendar.totalContributions}
          </span>{" "}
          contributions in the last year
        </p>
        {profileUrl && username ? (
          <p>
            <span className={theme.separatorClassName}>·</span>{" "}
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={theme.linkClassName}
            >
              @{username}
            </a>
          </p>
        ) : null}
      </div>
      <div className={cn(stretch ? "overflow-x-auto scrollbar-none" : "overflow-x-auto pb-1")}>
        <div
          className={cn(
            theme.frameClassName,
            stretch && "block w-full min-w-[48rem]",
            frameClassName,
          )}
        >
          <div
            className={cn(
              "mb-2 flex gap-[3px] pl-8 text-[10px] uppercase tracking-wide",
              stretch ? "w-full min-w-0" : "w-max",
              theme.axisClassName,
            )}
          >
            {stretch
              ? monthSpans.map((item, index) => {
                  const hangLeft =
                    index === monthSpans.length - 1 && item.span < 3;
                  return (
                  <div
                    key={`${item.label || "month"}-${index}`}
                    className={cn(
                      "min-w-0 whitespace-nowrap",
                      hangLeft || item.span < 2
                        ? "relative z-1 overflow-visible"
                        : "overflow-hidden",
                    )}
                    style={{ flex: `${item.span} 1 0%` }}
                  >
                    {hangLeft ? (
                      <span className="absolute right-0">{item.label}</span>
                    ) : (
                      item.label
                    )}
                  </div>
                  );
                })
              : monthLabels.map((monthLabel, index) => (
                  <div
                    key={`${monthLabel || "month"}-${index}`}
                    className="w-3"
                  >
                    {monthLabel}
                  </div>
                ))}
          </div>
          <div className={cn("flex gap-2", stretch ? "w-full" : "w-max")}>
            <div
              className={cn(
                "flex shrink-0 flex-col gap-[3px] pt-px text-[10px]",
                theme.axisClassName,
              )}
            >
              {WEEKDAY_LABELS.map((dayLabel, index) => (
                <div
                  key={`${dayLabel || "day"}-${index}`}
                  className={cn(
                    "flex items-center",
                    stretch ? "min-h-3 flex-1" : "h-3",
                  )}
                >
                  {dayLabel}
                </div>
              ))}
            </div>
            <div className={cn("flex gap-[3px]", stretch && "min-w-0 flex-1")}>
              {calendar.weeks.map((week, wi) => (
                <div
                  key={wi}
                  className={cn(
                    "flex flex-col gap-[3px]",
                    stretch && "min-w-0 flex-1",
                  )}
                >
                  {week.contributionDays.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.contributionCount} contribution${
                        day.contributionCount === 1 ? "" : "s"
                      }`}
                      className={cn(
                        "rounded-[3px]",
                        !stretch && "transition-transform duration-150 hover:scale-110",
                        stretch ? "aspect-square w-full" : "h-3 w-3",
                        cellClass(day.contributionCount),
                      )}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className={`mt-4 flex items-center justify-between gap-4 text-[10px] ${theme.axisClassName}`}>
            <span>Less</span>
            <div className="flex items-center gap-[3px]">
              {[0, 1, 4, 8, 16].map((count) => (
                <div
                  key={count}
                  className={`h-3 w-3 rounded-[3px] ${cellClass(count)}`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Collapse per-week labels into spans so "Oct" can use the month's full width. */
function groupMonthLabelSpans(labels: string[]): Array<{ label: string; span: number }> {
  const spans: Array<{ label: string; span: number }> = [];
  for (const label of labels) {
    if (spans.length === 0 || label) {
      spans.push({ label, span: 1 });
    } else {
      spans[spans.length - 1]!.span += 1;
    }
  }
  return spans;
}

/** Intensity steps for contribution cells — tinted from `--lf-accent`. */
const LIGHT_ACCENT_CELLS = [
  "bg-transparent ring-1 ring-inset ring-stone-300",
  "bg-[color-mix(in_srgb,var(--lf-accent)_18%,white)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--lf-accent)_28%,transparent)]",
  "bg-[color-mix(in_srgb,var(--lf-accent)_38%,white)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--lf-accent)_40%,transparent)]",
  "bg-[color-mix(in_srgb,var(--lf-accent)_62%,white)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--lf-accent)_35%,transparent)]",
  "bg-[var(--lf-accent)] ring-1 ring-inset ring-black/10",
] as const;

const DARK_ACCENT_CELLS = [
  "bg-[var(--lf-heatmap-empty,#18181b)] ring-1 ring-inset ring-white/5",
  "bg-[color-mix(in_srgb,var(--lf-accent)_22%,#0a0a0a)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--lf-accent)_30%,transparent)]",
  "bg-[color-mix(in_srgb,var(--lf-accent)_42%,#0a0a0a)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--lf-accent)_40%,transparent)]",
  "bg-[color-mix(in_srgb,var(--lf-accent)_65%,#0a0a0a)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--lf-accent)_45%,transparent)]",
  "bg-[var(--lf-accent)] ring-1 ring-inset ring-white/15",
] as const;

const BLUEPRINT_CELLS = [
  "bg-[color-mix(in_srgb,var(--lf-accent)_5%,#003366)] ring-1 ring-inset ring-white/20",
  "bg-[color-mix(in_srgb,var(--lf-accent)_28%,#003366)] ring-1 ring-inset ring-white/20",
  "bg-[color-mix(in_srgb,var(--lf-accent)_50%,#003366)] ring-1 ring-inset ring-white/25",
  "bg-[color-mix(in_srgb,var(--lf-accent)_75%,#003366)] ring-1 ring-inset ring-white/30",
  "bg-[var(--lf-accent)] ring-1 ring-inset ring-white/40",
] as const;

function getHeatmapTheme(
  variant: "developer" | "modern" | "corporate" | "minimal" | "creative" | "blueprint",
) {
  switch (variant) {
    case "corporate":
      return {
        rootClassName: "mt-8 border-t border-slate-200 pt-6",
        labelClassName:
          "mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400",
        metaClassName:
          "mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500",
        totalClassName: "font-semibold text-slate-900",
        separatorClassName: "text-slate-300",
        linkClassName:
          "text-[var(--lf-accent)] underline decoration-[color-mix(in_srgb,var(--lf-accent)_30%,transparent)] underline-offset-2 transition-colors hover:opacity-80",
        frameClassName:
          "inline-block min-w-full rounded-xl border border-slate-200 bg-slate-50 p-4",
        axisClassName: "text-slate-400",
        cells: [...LIGHT_ACCENT_CELLS],
      };
    case "minimal":
      return {
        rootClassName: "mt-8 border-t border-stone-200 pt-6",
        labelClassName:
          "mb-1 text-xs font-medium uppercase tracking-[0.22em] text-stone-400",
        metaClassName:
          "mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500",
        totalClassName: "font-medium text-stone-900",
        separatorClassName: "text-stone-300",
        linkClassName:
          "text-[var(--lf-accent)] underline decoration-[color-mix(in_srgb,var(--lf-accent)_30%,transparent)] underline-offset-2 transition-colors hover:opacity-80",
        frameClassName:
          "inline-block min-w-full rounded-xl border border-stone-200 bg-[#fffdf8] p-4",
        axisClassName: "text-stone-400",
        cells: [...LIGHT_ACCENT_CELLS],
      };
    case "creative":
      return {
        rootClassName: "mt-8 border-t border-pink-100 pt-6",
        labelClassName:
          "mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lf-accent)]",
        metaClassName:
          "mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500",
        totalClassName: "font-semibold text-gray-900",
        separatorClassName: "text-[color-mix(in_srgb,var(--lf-accent)_45%,transparent)]",
        linkClassName:
          "text-[var(--lf-accent)] underline decoration-[color-mix(in_srgb,var(--lf-accent)_30%,transparent)] underline-offset-2 transition-colors hover:opacity-80",
        frameClassName:
          "inline-block min-w-full rounded-2xl border border-pink-100 bg-white p-4",
        axisClassName: "text-gray-400",
        cells: [...LIGHT_ACCENT_CELLS],
      };
    case "blueprint":
      return {
        rootClassName: "",
        labelClassName:
          "mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/50",
        metaClassName:
          "mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-widest text-white/60",
        totalClassName: "font-bold text-white",
        separatorClassName: "text-white/35",
        linkClassName:
          "text-white underline decoration-white/35 underline-offset-4 transition-colors hover:text-[var(--lf-accent)]",
        frameClassName:
          "block w-full rounded-none border-2 border-white/50 bg-[#003366]/80 p-5 backdrop-blur-sm",
        axisClassName: "text-white/45",
        cells: [...BLUEPRINT_CELLS],
      };
    case "modern":
      return {
        rootClassName: "mt-8 border-t border-white/10 pt-6",
        labelClassName:
          "mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500",
        metaClassName:
          "mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400",
        totalClassName: "font-semibold text-white",
        separatorClassName: "text-zinc-600",
        linkClassName:
          "text-[var(--lf-accent)] underline decoration-[color-mix(in_srgb,var(--lf-accent)_25%,transparent)] underline-offset-2 transition-colors hover:opacity-90",
        frameClassName:
          "inline-block min-w-full rounded-xl border border-white/10 bg-black/20 p-4 shadow-[0_0_0_1px_color-mix(in_srgb,var(--lf-accent)_8%,transparent)]",
        axisClassName: "text-zinc-500",
        cells: [...DARK_ACCENT_CELLS],
      };
    case "developer":
    default:
      return {
        rootClassName:
          "mt-10 border-t border-[color-mix(in_srgb,var(--lf-accent)_25%,transparent)] pt-8",
        labelClassName: "mb-3 text-xs text-gray-600",
        metaClassName:
          "mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-500",
        totalClassName: "font-medium text-[var(--lf-accent)]",
        separatorClassName: "text-gray-700",
        linkClassName:
          "text-[var(--lf-accent)]/80 underline decoration-[color-mix(in_srgb,var(--lf-accent)_35%,transparent)] underline-offset-2 transition-colors hover:text-[var(--lf-accent)]",
        frameClassName:
          "inline-block min-w-full rounded-xl border border-white/5 bg-black/20 p-4 shadow-[0_0_0_1px_color-mix(in_srgb,var(--lf-accent)_8%,transparent)]",
        axisClassName: "text-gray-600",
        cells: [...DARK_ACCENT_CELLS],
      };
  }
}
