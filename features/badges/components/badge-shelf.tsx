"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useBadges } from "@/features/badges/api/use-badges";
import { BadgeMedallion } from "@/features/badges/components/badge-medallion";

function formatEarned(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Overview "Badges" shelf: earned badges only; renders nothing until one is earned. */
export function BadgeShelf() {
  const { data } = useBadges();
  const badges = data?.badges ?? [];
  if (!badges.length) return null;

  return (
    <section className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 text-h3 text-text-primary">Badges</h2>
      <ul className="flex flex-wrap gap-x-3 gap-y-4">
        {badges.map((badge) => (
          <li key={badge.key} className="flex w-24 flex-col items-center gap-1.5 text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={badge.name}
                  className="rounded-full outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <BadgeMedallion badgeKey={badge.key} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-56 text-center">
                <p className="font-semibold">{badge.name}</p>
                <p className="text-xs opacity-85">{badge.description}</p>
                <p className="mt-0.5 text-[11px] opacity-70">Earned {formatEarned(badge.awardedAt)}</p>
              </TooltipContent>
            </Tooltip>
            <p className="line-clamp-2 text-xs font-medium leading-tight text-text-primary">{badge.name}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
