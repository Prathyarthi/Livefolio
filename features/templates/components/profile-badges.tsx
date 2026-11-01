"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { PublicBadge } from "@/lib/badges-catalog";
import { BadgeMedallion } from "@/features/badges/components/badge-medallion";

function formatEarned(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/**
 * GitHub-style "Achievements" block for every template's profile header:
 * heading between hairline separators, then a row of illustrated medallions.
 * Separators and heading inherit the template's text colour (currentColor).
 */
export function ProfileBadges({
  badges,
  className,
  label = "Achievements",
}: {
  badges: PublicBadge[] | undefined;
  className?: string;
  label?: string;
}) {
  if (!badges?.length) return null;
  return (
    <section className={cn("mt-6 w-full max-w-xl min-w-0", className)} aria-label={label} data-slot="profile-badges">
      <div className="border-t border-current/15 pt-3">
        <h2 className="text-sm font-semibold tracking-wide opacity-90">{label}</h2>
      </div>
      <ul className="mt-3 flex flex-wrap items-center gap-3 border-b border-current/15 pb-4">
        {badges.map((badge) => {
          const earned = formatEarned(badge.awardedAt);
          return (
            <li key={badge.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={earned ? `${badge.name}, earned ${earned}` : badge.name}
                    className="rounded-full outline-none transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 focus-visible:ring-2 focus-visible:ring-current/50"
                  >
                    <BadgeMedallion badgeKey={badge.key} className="size-16 @sm:size-[72px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-56 text-center">
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs opacity-85">{badge.description}</p>
                  {earned ? <p className="mt-0.5 text-[11px] opacity-70">Earned {earned}</p> : null}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
