import Elysia, { t } from "elysia";
import { createHash } from "node:crypto";
import type { Prisma } from "@/db/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { resolveAccessForUser } from "@/lib/entitlements";
import { ensureUserPortfolio } from "@/lib/ensure-portfolio";
import { syncLinkedInArticles } from "@/lib/linkedin-articles";
import { notify } from "@/lib/notifications";
import { awardIntegrationBadge } from "@/lib/badges";
import {
  DEFAULT_LINKEDIN_SELECTION,
  LINKEDIN_DAILY_FAILURE_LIMIT,
  LINKEDIN_DAILY_SYNC_LIMIT,
  LINKEDIN_MONTHLY_SYNC_LIMIT,
  linkedInDayWindow,
  linkedInMonthWindow,
  toLinkedInQuota,
  LinkedInScrapeError,
  isLinkedInScrapingConfigured,
  linkedInSelectionSchema,
  normalizeLinkedInProfileUrl,
  parseLinkedInSelection,
  parseStoredPosts,
  parseStoredProfile,
  scrapeLinkedInProfile,
  selectedLinkedInPosts,
} from "@/lib/linkedin";

const PRO_REQUIRED_MESSAGE = "LinkedIn import is a Pro feature. Upgrade to Pro to use it.";

async function requireLinkedInEntitlement(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return { ok: false as const, status: 401 as const, body: { error: "Unauthorized" } };
  }
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return { ok: false as const, status: 404 as const, body: { error: "User not found" } };
  }
  const access = resolveAccessForUser(user);
  if (!access.canUseLinkedInImport) {
    return {
      ok: false as const,
      status: 403 as const,
      body: { error: PRO_REQUIRED_MESSAGE, code: "PLAN_LIMITED", access },
    };
  }
  return { ok: true as const, session };
}

type BucketKind = "month" | "day" | "fail";

function bucketKey(kind: BucketKind, userId: string, window: string) {
  const digest = createHash("sha256").update(userId).digest("hex");
  return `linkedin:sync:${kind}:user:${digest}:${window}`;
}

async function readBucket(key: string) {
  const bucket = await prisma.rateLimitBucket.findUnique({ where: { key }, select: { count: true } });
  return bucket?.count ?? 0;
}

async function readQuota(userId: string, now = new Date()) {
  const [month, today] = await Promise.all([
    readBucket(bucketKey("month", userId, linkedInMonthWindow(now).key)),
    readBucket(bucketKey("day", userId, linkedInDayWindow(now).key)),
  ]);
  return toLinkedInQuota(month, today, now);
}

/** Atomically increments a bucket; rolls back and returns false if it would exceed `limit`. */
async function reserve(key: string, limit: number, expiresAt: Date) {
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: { count: { increment: 1 }, expiresAt },
    select: { count: true },
  });
  if (bucket.count <= limit) return true;
  await release(key);
  return false;
}

async function release(key: string) {
  await prisma.rateLimitBucket
    .update({ where: { key }, data: { count: { decrement: 1 } } })
    .catch((error) => console.error("[linkedin.sync] failed to release quota", error));
}

/**
 * Reserves one daily + one monthly sync slot up front (so concurrent requests
 * can't overshoot). Slots are released if the scrape fails, so only successful
 * syncs count.
 */
async function reserveSync(userId: string, now = new Date()) {
  const day = linkedInDayWindow(now);
  const month = linkedInMonthWindow(now);
  const dayKey = bucketKey("day", userId, day.key);
  const monthKey = bucketKey("month", userId, month.key);
  if (!(await reserve(monthKey, LINKEDIN_MONTHLY_SYNC_LIMIT, month.resetsAt))) {
    return { ok: false as const, blockedBy: "monthly" as const };
  }
  if (!(await reserve(dayKey, LINKEDIN_DAILY_SYNC_LIMIT, day.resetsAt))) {
    await release(monthKey);
    return { ok: false as const, blockedBy: "daily" as const };
  }
  return { ok: true as const, keys: [dayKey, monthKey] };
}

async function recordFailure(userId: string, now = new Date()) {
  const day = linkedInDayWindow(now);
  const key = bucketKey("fail", userId, day.key);
  await prisma.rateLimitBucket
    .upsert({
      where: { key },
      create: { key, count: 1, expiresAt: day.resetsAt },
      update: { count: { increment: 1 } },
    })
    .catch((error) => console.error("[linkedin.sync] failed to record failure", error));
}

function formatUtcDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function retryAfterSeconds(at: Date) {
  return String(Math.max(1, Math.ceil((at.getTime() - Date.now()) / 1000)));
}

/** Mirror selected posts into Articles (or clear them when the section is hidden). */
async function syncArticlesFor(row: {
  portfolioId: string;
  posts: unknown;
  selection: unknown;
  showOnPortfolio: boolean;
  lastSyncedAt: Date | null;
}) {
  const posts = row.showOnPortfolio ? selectedLinkedInPosts(row.posts, row.selection) : [];
  try {
    await syncLinkedInArticles(row.portfolioId, posts, row.lastSyncedAt ?? new Date());
    return null;
  } catch (error) {
    // Non-fatal: the selection is saved; report so the UI can warn.
    console.error("[linkedin] failed to sync LinkedIn posts into articles", error);
    return "Saved, but your Articles section couldn't be updated. Save again to retry.";
  }
}

function toPayload(
  row: {
    profileUrl: string;
    profileData: unknown;
    posts: unknown;
    selection: unknown;
    showOnPortfolio: boolean;
    lastSyncedAt: Date | null;
  } | null,
) {
  if (!row) return null;
  return {
    profileUrl: row.profileUrl,
    profile: parseStoredProfile(row.profileData),
    posts: parseStoredPosts(row.posts),
    selection: parseLinkedInSelection(row.selection),
    showOnPortfolio: row.showOnPortfolio,
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
  };
}

export const linkedin = new Elysia({ prefix: "/linkedin" })
  .get("/", async (ctx) => {
    const gate = await requireLinkedInEntitlement(ctx.request);
    if (!gate.ok) {
      ctx.set.status = gate.status;
      return gate.body;
    }
    const portfolio = await ensureUserPortfolio(gate.session.userId);
    const row = await prisma.linkedInImport.findUnique({
      where: { portfolioId: portfolio.id },
    });
    return {
      success: true,
      configured: isLinkedInScrapingConfigured(),
      data: toPayload(row),
      quota: await readQuota(gate.session.userId),
    };
  })

  .post(
    "/sync",
    async (ctx) => {
      const gate = await requireLinkedInEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      const profileUrl = normalizeLinkedInProfileUrl(ctx.body.url);
      if (!profileUrl) {
        ctx.set.status = 400;
        return {
          error: "Enter a LinkedIn profile URL like https://www.linkedin.com/in/your-name",
          code: "INVALID_URL",
        };
      }

      const portfolio = await ensureUserPortfolio(gate.session.userId);
      const existing = await prisma.linkedInImport.findUnique({
        where: { portfolioId: portfolio.id },
      });

      const userId = gate.session.userId;
      let reservedKeys: string[];
      try {
        const day = linkedInDayWindow();
        const failures = await readBucket(bucketKey("fail", userId, day.key));
        if (failures >= LINKEDIN_DAILY_FAILURE_LIMIT) {
          ctx.set.status = 429;
          ctx.set.headers["Retry-After"] = retryAfterSeconds(day.resetsAt);
          return {
            error: "Too many failed LinkedIn syncs today. Try again tomorrow.",
            code: "SYNC_FAILURE_LIMIT",
            nextAvailableAt: day.resetsAt.toISOString(),
            quota: await readQuota(userId),
          };
        }
        const reservation = await reserveSync(userId);
        if (!reservation.ok) {
          const quota = await readQuota(userId);
          const monthly = reservation.blockedBy === "monthly";
          const unlocksAt = monthly ? new Date(quota.resetsAt) : day.resetsAt;
          ctx.set.status = 429;
          ctx.set.headers["Retry-After"] = retryAfterSeconds(unlocksAt);
          return {
            error: monthly
              ? `You've used all ${LINKEDIN_MONTHLY_SYNC_LIMIT} LinkedIn syncs this month. Syncing resets on ${formatUtcDate(unlocksAt)}.`
              : `You can sync LinkedIn once per day. Next sync available ${unlocksAt.toISOString().replace(".000Z", "Z")} (00:00 UTC).`,
            code: monthly ? "MONTHLY_SYNC_LIMIT" : "DAILY_SYNC_LIMIT",
            nextAvailableAt: unlocksAt.toISOString(),
            quota,
          };
        }
        reservedKeys = reservation.keys;
      } catch (error) {
        console.error("[linkedin.sync] rate limiter failed", error);
        ctx.set.status = 503;
        return { error: "LinkedIn import is temporarily unavailable." };
      }

      try {
        const { profile, posts } = await scrapeLinkedInProfile(profileUrl);
        const prevSelection = existing
          ? parseLinkedInSelection(existing.selection)
          : DEFAULT_LINKEDIN_SELECTION;
        // Keep previously chosen posts that still exist after a re-sync.
        const ids = new Set(posts.map((post) => post.id));
        const selection = {
          fields: prevSelection.fields,
          postIds: existing
            ? prevSelection.postIds.filter((id) => ids.has(id))
            : posts.slice(0, 3).map((post) => post.id),
        };
        const data = {
          profileUrl,
          profileData: profile as unknown as Prisma.InputJsonValue,
          posts: posts as unknown as Prisma.InputJsonValue,
          selection: selection as Prisma.InputJsonValue,
          lastSyncedAt: new Date(),
        };
        const row = await prisma.linkedInImport.upsert({
          where: { portfolioId: portfolio.id },
          update: data,
          create: { portfolioId: portfolio.id, ...data },
        });
        const warning = await syncArticlesFor(row);
        void notify({
          userId,
          type: "linkedin.sync_succeeded",
          title: "LinkedIn profile synced",
          body: warning ?? `Imported ${posts.length} post${posts.length === 1 ? "" : "s"} from LinkedIn.`,
          href: "/dashboard/import",
          metadata: { postCount: posts.length, hasWarning: Boolean(warning) },
        });
        void awardIntegrationBadge(userId, "linkedin");
        return { success: true, data: toPayload(row), quota: await readQuota(userId), warning };
      } catch (error) {
        // Failed syncs never use the quota; they count toward the daily failure cap instead.
        await Promise.all(reservedKeys.map(release));
        await recordFailure(userId);
        void notify({
          userId,
          type: "linkedin.sync_failed",
          title: "LinkedIn sync failed",
          body:
            error instanceof LinkedInScrapeError
              ? error.message
              : "We couldn't sync your LinkedIn profile. Your quota wasn't used; try again later.",
          href: "/dashboard/import",
          metadata: { code: error instanceof LinkedInScrapeError ? error.code : "UNKNOWN" },
        });
        if (error instanceof LinkedInScrapeError) {
          ctx.set.status = error.status;
          return { error: error.message, code: error.code };
        }
        console.error("[linkedin.sync] failed", error);
        ctx.set.status = 500;
        return { error: "Failed to sync LinkedIn profile" };
      }
    },
    { body: t.Object({ url: t.String({ minLength: 1, maxLength: 300 }) }) },
  )

  .put(
    "/selection",
    async (ctx) => {
      const gate = await requireLinkedInEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }
      const parsed = linkedInSelectionSchema.safeParse(ctx.body.selection);
      if (!parsed.success) {
        ctx.set.status = 400;
        return { error: "Invalid selection" };
      }
      const portfolio = await ensureUserPortfolio(gate.session.userId);
      const existing = await prisma.linkedInImport.findUnique({
        where: { portfolioId: portfolio.id },
      });
      if (!existing) {
        ctx.set.status = 404;
        return { error: "Sync your LinkedIn profile first" };
      }
      const known = new Set(parseStoredPosts(existing.posts).map((post) => post.id));
      const selection = {
        fields: [...new Set(parsed.data.fields)],
        postIds: [...new Set(parsed.data.postIds)].filter((id) => known.has(id)),
      };
      const row = await prisma.linkedInImport.update({
        where: { portfolioId: portfolio.id },
        data: {
          selection: selection as Prisma.InputJsonValue,
          ...(ctx.body.showOnPortfolio === undefined
            ? {}
            : { showOnPortfolio: ctx.body.showOnPortfolio }),
        },
      });
      const warning = await syncArticlesFor(row);
      return { success: true, data: toPayload(row), warning };
    },
    {
      body: t.Object({
        selection: t.Unknown(),
        showOnPortfolio: t.Optional(t.Boolean()),
      }),
    },
  )

  .delete("/", async (ctx) => {
    const gate = await requireLinkedInEntitlement(ctx.request);
    if (!gate.ok) {
      ctx.set.status = gate.status;
      return gate.body;
    }
    const portfolio = await ensureUserPortfolio(gate.session.userId);
    await prisma.linkedInImport.deleteMany({ where: { portfolioId: portfolio.id } });
    await syncLinkedInArticles(portfolio.id, []);
    return { success: true };
  });
