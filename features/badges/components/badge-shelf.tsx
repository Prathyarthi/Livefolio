"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBadges, type ShelfBadge } from "@/features/badges/api/use-badges";
import { BadgeMedallion } from "@/features/badges/components/badge-medallion";

function formatEarned(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ShelfItem({ badge, highlight }: { badge: ShelfBadge; highlight?: boolean }) {
  const earned = formatEarned(badge.awardedAt);
  return (
    <li className="flex w-24 flex-col items-center gap-1.5 text-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={badge.earned ? badge.name : `${badge.name} (locked)`}
            className={cn(
              "rounded-full outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-primary",
              highlight && "ring-2 ring-brand-primary/60 ring-offset-2 ring-offset-surface-raised",
            )}
          >
            <BadgeMedallion badgeKey={badge.key} locked={!badge.earned} />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-56 text-center">
          <p className="font-semibold">{badge.name}</p>
          <p className="text-xs opacity-85">{badge.earned ? badge.description : badge.unlockHint}</p>
          {earned ? <p className="mt-0.5 text-[11px] opacity-70">Earned {earned}</p> : null}
          {badge.earned && !badge.publicEligible ? (
            <p className="mt-0.5 text-[11px] opacity-70">Private: not shown on your portfolio</p>
          ) : null}
        </TooltipContent>
      </Tooltip>
      <p className={cn("line-clamp-2 text-xs leading-tight", badge.earned ? "font-medium text-text-primary" : "text-text-muted")}>
        {badge.name}
      </p>
    </li>
  );
}

export function BadgeShelf() {
  const { data, isLoading, isError } = useBadges();
  if (isLoading || isError || !data) return null;

  const earned = data.badges.filter((b) => b.earned);
  const locked = data.badges.filter((b) => !b.earned);
  const next = data.badges.find((b) => b.key === data.nextBadgeKey);

  return (
    <section className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h3 text-text-primary">Achievements</h2>
        <p className="text-xs text-text-muted">
          {earned.length} of {data.badges.length} earned
        </p>
      </div>
      <p className="mb-5 text-xs text-text-muted">
        Earned badges (except Welcome Aboard) appear in the profile section of your public portfolio.
      </p>

      {earned.length ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-4">
          {earned.map((badge) => (
            <ShelfItem key={badge.key} badge={badge} />
          ))}
        </ul>
      ) : null}

      {next ? (
        <div className="mt-6 flex items-center gap-4 rounded-[var(--radius-md)] border border-dashed border-border-default bg-surface-sunken p-4">
          <BadgeMedallion badgeKey={next.key} locked className="size-14" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Next badge</p>
            <p className="text-sm font-medium text-text-primary">{next.name}</p>
            <p className="text-xs text-text-secondary">{next.unlockHint}</p>
          </div>
        </div>
      ) : null}

      {locked.length > 1 ? (
        <>
          <p className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Locked</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-4">
            {locked.map((badge) => (
              <ShelfItem key={badge.key} badge={badge} highlight={badge.key === next?.key} />
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
