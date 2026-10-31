import type { BadgeDefinition } from "@/lib/badges-catalog";
import { BadgeIcon } from "@/features/badges/components/badge-icon";

/**
 * Template-agnostic strip of a portfolio owner's public badges. Uses
 * currentColor/neutral styling so it sits on any template background.
 */
export function PortfolioBadges({ badges }: { badges: Pick<BadgeDefinition, "key" | "name" | "description" | "icon">[] }) {
  if (!badges.length) return null;
  return (
    <section aria-label="Badges" className="mx-auto w-full max-w-5xl px-6 py-6">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {badges.map((badge) => (
          <li
            key={badge.key}
            title={badge.description}
            className="inline-flex items-center gap-1.5 rounded-full border border-current/20 bg-current/5 px-3 py-1 text-xs font-medium opacity-80"
          >
            <BadgeIcon name={badge.icon} className="size-3.5" />
            {badge.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
