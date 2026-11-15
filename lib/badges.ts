import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import {
  createBadgeAwarder,
  integrationBadgeKey,
  qualifiedBadgeKeys,
  type BadgeKey,
  type IntegrationSource,
} from "@/lib/badges-catalog";

export * from "@/lib/badges-catalog";

/**
 * `void awardBadge(userId, key)` from event sites. Idempotent (unique userId+badgeKey,
 * insert with skipDuplicates), never throws, and notifies only on first award.
 */
export const awardBadge = createBadgeAwarder({
  async createIfAbsent(userId, key) {
    const { count } = await prisma.userBadge.createMany({
      data: [{ userId, badgeKey: key }],
      skipDuplicates: true,
    });
    return count === 1;
  },
  onFirstAward: (userId, badge) =>
    notify({
      userId,
      type: "badge_earned",
      title: `Badge earned: ${badge.name}`,
      body: badge.description,
      href: "/dashboard",
      metadata: { badgeKey: badge.key },
    }),
});

export function awardIntegrationBadge(userId: string, source: IntegrationSource) {
  return awardBadge(userId, integrationBadgeKey(source));
}

/**
 * Lazy backfill, run when the user loads their badge shelf. Awards anything the
 * user already qualifies for from existing data. Welcome notifies (it is the
 * first-dashboard-visit trigger); historical badges are awarded silently so
 * existing users don't get a burst of notifications. Never throws.
 */
export async function backfillBadges(userId: string, existing: Set<string>) {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      select: {
        isPublished: true,
        socialProfiles: { select: { platform: true } },
        linkedinImport: { select: { id: true } },
      },
    });
    const keys = qualifiedBadgeKeys({
      isPublished: portfolio?.isPublished ?? false,
      platforms: portfolio?.socialProfiles.map((p) => p.platform) ?? [],
      hasLinkedInImport: Boolean(portfolio?.linkedinImport),
    }).filter((key) => !existing.has(key));
    const awarded: BadgeKey[] = [];
    for (const key of keys) {
      if (await awardBadge(userId, key, { silent: key !== "welcome" })) awarded.push(key);
    }
    return awarded;
  } catch (error) {
    console.error("[badges] backfill failed", error);
    return [];
  }
}
