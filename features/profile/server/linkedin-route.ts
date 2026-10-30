import Elysia, { t } from "elysia";
import { createHash } from "node:crypto";
import type { Prisma } from "@/db/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { resolveAccessForUser } from "@/lib/entitlements";
import { ensureUserPortfolio } from "@/lib/ensure-portfolio";
import {
  DEFAULT_LINKEDIN_SELECTION,
  LinkedInScrapeError,
  isLinkedInScrapingConfigured,
  linkedInSelectionSchema,
  normalizeLinkedInProfileUrl,
  parseLinkedInSelection,
  parseStoredPosts,
  parseStoredProfile,
  scrapeLinkedInProfile,
} from "@/lib/linkedin";

/** Minimum gap between syncs for one portfolio. */
export const LINKEDIN_SYNC_COOLDOWN_MS = 15 * 60 * 1000;
/** Hard cap on scrape attempts per user per day (failed attempts count too). */
const LINKEDIN_DAILY_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

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

/** Counts a scrape attempt in the shared RateLimitBucket table. */
async function consumeDailyScrape(userId: string) {
  const now = Date.now();
  const windowStart = Math.floor(now / DAY_MS) * DAY_MS;
  const expiresAt = new Date(windowStart + DAY_MS);
  const digest = createHash("sha256").update(userId).digest("hex");
  const key = `linkedin:sync:user:${digest}:${windowStart}`;
  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: { count: { increment: 1 }, expiresAt },
    select: { count: true },
  });
  return {
    allowed: bucket.count <= LINKEDIN_DAILY_LIMIT,
    retryAfterSec: Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
  };
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
  const nextSyncAt = row.lastSyncedAt
    ? new Date(row.lastSyncedAt.getTime() + LINKEDIN_SYNC_COOLDOWN_MS).toISOString()
    : null;
  return {
    profileUrl: row.profileUrl,
    profile: parseStoredProfile(row.profileData),
    posts: parseStoredPosts(row.posts),
    selection: parseLinkedInSelection(row.selection),
    showOnPortfolio: row.showOnPortfolio,
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
    nextSyncAt,
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

      if (existing?.lastSyncedAt) {
        const waitMs =
          existing.lastSyncedAt.getTime() + LINKEDIN_SYNC_COOLDOWN_MS - Date.now();
        if (waitMs > 0) {
          ctx.set.status = 429;
          ctx.set.headers["Retry-After"] = String(Math.ceil(waitMs / 1000));
          return {
            error: `You synced recently. Try again in ${Math.ceil(waitMs / 60000)} min.`,
            code: "COOLDOWN",
          };
        }
      }

      try {
        const limit = await consumeDailyScrape(gate.session.userId);
        if (!limit.allowed) {
          ctx.set.status = 429;
          ctx.set.headers["Retry-After"] = String(limit.retryAfterSec);
          return { error: "Daily LinkedIn sync limit reached. Try again tomorrow.", code: "DAILY_LIMIT" };
        }
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
        return { success: true, data: toPayload(row) };
      } catch (error) {
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
      return { success: true, data: toPayload(row) };
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
    return { success: true };
  });
