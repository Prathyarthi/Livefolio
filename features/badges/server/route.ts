import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { backfillBadges, buildBadgeShelf, canShowOnPortfolio, getBadge } from "@/lib/badges";

async function requireUser(request: Request) {
  const session = await getSession(request);
  return session?.userId ?? null;
}

const ROW_SELECT = { badgeKey: true, awardedAt: true, showOnPortfolio: true } as const;

export const badges = new Elysia({ prefix: "/badges" })
  .get("/", async (ctx) => {
    const userId = await requireUser(ctx.request);
    if (!userId) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    let rows = await prisma.userBadge.findMany({ where: { userId }, select: ROW_SELECT });
    // Lazy backfill: award anything existing data already qualifies for.
    const awarded = await backfillBadges(userId, new Set(rows.map((r) => r.badgeKey)));
    if (awarded.length) {
      rows = await prisma.userBadge.findMany({ where: { userId }, select: ROW_SELECT });
    }
    return { success: true, ...buildBadgeShelf(rows), newlyAwarded: awarded };
  })

  .patch(
    "/:key",
    async (ctx) => {
      const userId = await requireUser(ctx.request);
      if (!userId) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const key = ctx.params.key;
      if (!getBadge(key)) {
        ctx.set.status = 404;
        return { error: "Unknown badge" };
      }
      if (ctx.body.showOnPortfolio && !canShowOnPortfolio(key)) {
        ctx.set.status = 400;
        return { error: "This badge can't be shown on your portfolio", code: "NOT_PUBLIC_ELIGIBLE" };
      }
      const { count } = await prisma.userBadge.updateMany({
        where: { userId, badgeKey: key },
        data: { showOnPortfolio: ctx.body.showOnPortfolio },
      });
      if (!count) {
        ctx.set.status = 404;
        return { error: "You haven't earned this badge yet" };
      }
      return { success: true, key, showOnPortfolio: ctx.body.showOnPortfolio };
    },
    {
      params: t.Object({ key: t.String({ maxLength: 64 }) }),
      body: t.Object({ showOnPortfolio: t.Boolean() }),
    },
  );
