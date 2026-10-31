"use client";

import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useBadges, useToggleBadgeVisibility, type ShelfBadge } from "@/features/badges/api/use-badges";
import { BadgeIcon } from "@/features/badges/components/badge-icon";

function BadgeTile({ badge }: { badge: ShelfBadge }) {
  const toggle = useToggleBadgeVisibility();
  const switchId = `badge-public-${badge.key}`;
  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-2 rounded-[var(--radius-md)] border p-3",
        badge.earned
          ? "border-brand-primary/40 bg-brand-light/40"
          : "border-border-default bg-surface-sunken opacity-60 grayscale",
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                badge.earned ? "bg-brand-primary text-white" : "bg-surface-raised text-text-muted",
              )}
            >
              {badge.earned ? <BadgeIcon name={badge.icon} className="size-4" /> : <Lock className="size-3.5" aria-hidden />}
            </span>
            <p className="truncate text-sm font-medium text-text-primary">{badge.name}</p>
          </div>
        </TooltipTrigger>
        <TooltipContent>{badge.earned ? badge.description : badge.unlockHint}</TooltipContent>
      </Tooltip>
      {badge.earned && badge.publicEligible ? (
        <label htmlFor={switchId} className="flex items-center justify-between gap-2 text-xs text-text-secondary">
          Show on portfolio
          <Switch
            id={switchId}
            checked={badge.showOnPortfolio}
            onCheckedChange={(showOnPortfolio) =>
              toggle.mutate(
                { key: badge.key, showOnPortfolio },
                { onError: (error) => toast.error(error.message) },
              )
            }
          />
        </label>
      ) : null}
    </li>
  );
}

export function BadgeShelf() {
  const { data, isLoading, isError } = useBadges();
  if (isLoading || isError || !data) return null;

  const earnedCount = data.badges.filter((b) => b.earned).length;
  const next = data.badges.find((b) => b.key === data.nextBadgeKey);
  const ordered = [...data.badges].sort((a, b) => Number(b.earned) - Number(a.earned));

  return (
    <section className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h3 text-text-primary">Badges</h2>
        <p className="text-xs text-text-muted">
          {earnedCount} of {data.badges.length} earned
        </p>
      </div>
      {next ? (
        <p className="mb-4 rounded-[var(--radius-md)] bg-surface-sunken px-3 py-2 text-xs text-text-secondary">
          <span className="font-medium text-text-primary">Next badge: {next.name}.</span> {next.unlockHint}
        </p>
      ) : null}
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {ordered.map((badge) => (
          <BadgeTile key={badge.key} badge={badge} />
        ))}
      </ul>
    </section>
  );
}
