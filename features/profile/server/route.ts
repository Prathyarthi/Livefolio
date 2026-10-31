import Elysia, { t } from "elysia";
import type { Prisma } from "@/db/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  buildGitHubCachedStats,
  fetchGitHubContributionsFromProfilePage,
  fetchGitHubProfile,
} from "@/lib/github";
import { resolveGitHubProjectDescriptions } from "@/lib/github-project-description";
import { fetchCodeforcesStats } from "@/lib/codeforces";
import { fetchDevtoArticles } from "@/lib/devto";
import { fetchHashnodeArticles } from "@/lib/hashnode";
import { fetchStackOverflowProfile } from "@/lib/stackoverflow";
import { normalizeArticleSource } from "@/lib/article-source";
import { fetchLeetCodeStats } from "@/lib/leetcode";
import { fetchMediumArticles } from "@/lib/medium";
import { getPlanLimitMessage, resolveAccessForUser } from "@/lib/entitlements";
import { ensureUserPortfolio } from "@/lib/ensure-portfolio";
import {
  MAX_SECTION_ROWS,
  MAX_TECH_STACK_ITEM_CHARS,
  MAX_TECH_STACK_ITEMS,
  sanitizeImportedLabel,
  sanitizeImportedLongText,
  sanitizeImportedStringList,
  sanitizeImportedStoredUrl,
} from "@/lib/content-policy";
import {
  getStoredSectionLayout,
  normalizeHidden,
  normalizeOrder,
  toSectionLayoutPayload,
  type ReorderableSectionKey,
} from "@/features/templates/section-order";
import type { PortfolioCustomization } from "@/features/templates/types";
import { linkedin } from "./linkedin-route";

async function requireImportEntitlement(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return {
      ok: false as const,
      status: 401 as const,
      body: { error: "Unauthorized" },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) {
    return {
      ok: false as const,
      status: 404 as const,
      body: { error: "User not found" },
    };
  }

  const access = resolveAccessForUser(user);
  if (!access.canUseImports) {
    return {
      ok: false as const,
      status: 403 as const,
      body: {
        error: getPlanLimitMessage(access),
        code: "PLAN_LIMITED",
        access,
      },
    };
  }

  return { ok: true as const, session };
}

const importedArticleBody = t.Object({
  title: t.String(),
  description: t.String(),
  url: t.String(),
  publishedAt: t.String(),
  tags: t.Array(t.String()),
  readTime: t.Optional(t.Number()),
});

type ImportedArticleBody = {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  tags: string[];
  readTime?: number;
};

async function insertImportedArticles(
  portfolioId: string,
  articles: ImportedArticleBody[],
  source: string,
) {
  const articleSource = normalizeArticleSource(source);
  const prepared = articles.flatMap((article, index) => {
    const url = sanitizeImportedStoredUrl(article.url, `Articles[${index}].url`);
    const title = sanitizeImportedLabel(article.title);
    if (!url || !title) return [];

    let publishedAt: Date | null = null;
    if (article.publishedAt) {
      const parsed = new Date(article.publishedAt);
      if (!Number.isNaN(parsed.getTime())) publishedAt = parsed;
    }

    return [
      {
        title,
        description: sanitizeImportedLongText(article.description),
        url,
        tags: sanitizeImportedStringList(
          article.tags,
          MAX_TECH_STACK_ITEMS,
          MAX_TECH_STACK_ITEM_CHARS,
        ),
        publishedAt,
        readTime: article.readTime ?? null,
        source: articleSource,
      },
    ];
  });

  if (prepared.length === 0) return { count: 0 };

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id"
      FROM "portfolios"
      WHERE "id" = ${portfolioId}
      FOR UPDATE
    `;
    const existingCount = await tx.article.count({
      where: { portfolioId },
    });
    const boundedArticles = prepared
      .slice(0, Math.max(0, MAX_SECTION_ROWS - existingCount))
      .map((article, index) => ({
        ...article,
        portfolioId,
        sortOrder: existingCount + index,
      }));
    if (boundedArticles.length === 0) return { count: 0 };
    return tx.article.createMany({ data: boundedArticles });
  });
}

async function upsertImportedProfile(
  portfolioId: string,
  platform: string,
  url: string,
  username: string,
  cachedStats?: Record<string, unknown>,
) {
  const safeUrl = sanitizeImportedStoredUrl(url, "Social profile URL");
  const safeUsername = sanitizeImportedLabel(username);
  if (!safeUrl || !safeUsername) return;

  const stats =
    cachedStats == null
      ? {}
      : {
          cachedStats: cachedStats as Prisma.InputJsonValue,
          lastFetched: new Date(),
        };

  await prisma.socialProfile.upsert({
    where: {
      portfolioId_platform: { portfolioId, platform },
    },
    update: {
      url: safeUrl,
      username: safeUsername,
      ...stats,
    },
    create: {
      portfolioId,
      platform,
      url: safeUrl,
      username: safeUsername,
      ...stats,
    },
  });
}

function hashnodeProfileUrl(username: string, profileUrl?: string) {
  const explicit = profileUrl?.trim();
  if (explicit) return explicit;
  if (username.includes(".")) return `https://${username}`;
  return `https://${username}.hashnode.dev`;
}

export const profile = new Elysia({ prefix: "/profile" })
  .use(linkedin)

  // ── GitHub ──────────────────────────────────────────────
  .post(
    "/github/fetch",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      try {
        const data = await fetchGitHubProfile(
          ctx.body.username,
          process.env.GITHUB_TOKEN
        );
        return { success: true, data };
      } catch (error: unknown) {
        ctx.set.status = 400;
        const message =
          error instanceof Error ? error.message : "Failed to fetch GitHub data";
        const hint =
          message.includes("fetch") || message.includes("aborted")
            ? " (GitHub may be slow or unreachable; try again or set GITHUB_TOKEN in .env for higher rate limits.)"
            : "";
        return { error: `${message}${hint}` };
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1 }),
      }),
    }
  )

  .post(
    "/github/import",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      const portfolio = await ensureUserPortfolio(gate.session.userId);
      const username = sanitizeImportedLabel(ctx.body.username);
      const showHeatmap = ctx.body.showHeatmap === true;
      const resolvedDescriptions = await resolveGitHubProjectDescriptions(
        username,
        ctx.body.repos,
      );

      const projects = ctx.body.repos
        .map((repo, index) => ({
          title: sanitizeImportedLabel(repo.name),
          description: sanitizeImportedLongText(resolvedDescriptions[index]),
          sourceUrl: sanitizeImportedStoredUrl(
            repo.url,
            `Repositories[${index}].url`,
          ),
          techStack: sanitizeImportedStringList(
            [repo.language, ...repo.topics].filter(Boolean),
            MAX_TECH_STACK_ITEMS,
            MAX_TECH_STACK_ITEM_CHARS,
          ),
          githubStars: repo.stars,
          githubForks: repo.forks,
          language: sanitizeImportedLabel(repo.language) || null,
        }))
        .filter((project) => project.title);

      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`
          SELECT "id"
          FROM "portfolios"
          WHERE "id" = ${portfolio.id}
          FOR UPDATE
        `;
        const existingCount = await tx.project.count({
          where: { portfolioId: portfolio.id },
        });
        const boundedProjects = projects
          .slice(0, Math.max(0, MAX_SECTION_ROWS - existingCount))
          .map((project, index) => ({
            ...project,
            portfolioId: portfolio.id,
            sortOrder: existingCount + index,
          }));
        return tx.project.createMany({ data: boundedProjects });
      });

      if (username) {
        const token = process.env.GITHUB_TOKEN;
        let cachedStats: Record<string, unknown> | undefined;
        let lastFetched: Date | undefined;
        try {
          const ghData = await fetchGitHubProfile(username, token);
          const calendar = await fetchGitHubContributionsFromProfilePage(
            username
          );
          cachedStats = buildGitHubCachedStats(ghData, calendar);
          lastFetched = new Date();
        } catch {
          // Projects are already saved; still link GitHub without cached stats.
        }

        await prisma.socialProfile.upsert({
          where: {
            portfolioId_platform: {
              portfolioId: portfolio.id,
              platform: "github",
            },
          },
          update: {
            url: `https://github.com/${username}`,
            username,
            ...(cachedStats != null
              ? {
                  cachedStats: cachedStats as object,
                  lastFetched,
                }
              : {}),
          },
          create: {
            portfolioId: portfolio.id,
            platform: "github",
            url: `https://github.com/${username}`,
            username,
            ...(cachedStats != null
              ? {
                  cachedStats: cachedStats as object,
                  lastFetched,
                }
              : {}),
          },
        });

        // Sync heatmap visibility with the import preference.
        const existing =
          portfolio.customization &&
          typeof portfolio.customization === "object" &&
          !Array.isArray(portfolio.customization)
            ? (portfolio.customization as PortfolioCustomization)
            : {};
        const layout = getStoredSectionLayout(existing);
        const hidden: ReorderableSectionKey[] = normalizeHidden(
          layout.hidden,
        ).filter((key) => key !== "github");
        if (!showHeatmap) hidden.push("github");

        await prisma.portfolio.update({
          where: { id: portfolio.id },
          data: {
            customization: {
              ...existing,
              sectionLayout: toSectionLayoutPayload(
                normalizeOrder(layout.order),
                hidden,
              ),
            } as unknown as Prisma.InputJsonValue,
          },
        });
      }

      return { success: true, imported: result.count };
    },
    {
      body: t.Object({
        username: t.String(),
        showHeatmap: t.Optional(t.Boolean()),
        repos: t.Array(
          t.Object({
            name: t.String(),
            description: t.Union([t.String(), t.Null()]),
            url: t.String(),
            stars: t.Number(),
            forks: t.Number(),
            language: t.Union([t.String(), t.Null()]),
            topics: t.Array(t.String()),
          })
        ),
      }),
    }
  )

  // ── LeetCode ────────────────────────────────────────────
  .post(
    "/leetcode/fetch",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      try {
        const data = await fetchLeetCodeStats(ctx.body.username);
        return { success: true, data };
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch LeetCode stats",
        };
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1 }),
      }),
    }
  )

  .post(
    "/leetcode/import",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      const portfolio = await ensureUserPortfolio(gate.session.userId);
      const username = sanitizeImportedLabel(ctx.body.username);
      if (!username) {
        ctx.set.status = 400;
        return { error: "Username is required" };
      }

      const result = await prisma.socialProfile.upsert({
        where: {
          portfolioId_platform: {
            portfolioId: portfolio.id,
            platform: "leetcode",
          },
        },
        update: {
          url: `https://leetcode.com/u/${username}`,
          username,
          cachedStats: {
            ranking: ctx.body.ranking,
            totalSolved: ctx.body.totalSolved,
            easySolved: ctx.body.easySolved,
            mediumSolved: ctx.body.mediumSolved,
            hardSolved: ctx.body.hardSolved,
          },
          lastFetched: new Date(),
        },
        create: {
          portfolioId: portfolio.id,
          platform: "leetcode",
          url: `https://leetcode.com/u/${username}`,
          username,
          cachedStats: {
            ranking: ctx.body.ranking,
            totalSolved: ctx.body.totalSolved,
            easySolved: ctx.body.easySolved,
            mediumSolved: ctx.body.mediumSolved,
            hardSolved: ctx.body.hardSolved,
          },
          lastFetched: new Date(),
        },
      });

      return { success: true, profile: result };
    },
    {
      body: t.Object({
        username: t.String(),
        ranking: t.Number(),
        totalSolved: t.Number(),
        easySolved: t.Number(),
        mediumSolved: t.Number(),
        hardSolved: t.Number(),
      }),
    }
  )

  // ── Medium ──────────────────────────────────────────────
  .post(
    "/medium/fetch",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      try {
        const data = await fetchMediumArticles(ctx.body.username);
        return { success: true, data };
      } catch (error: unknown) {
        ctx.set.status = 400;
        const message =
          error instanceof Error ? error.message : "Failed to fetch Medium articles";
        return { error: message };
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1 }),
      }),
    }
  )

  .post(
    "/medium/import",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      const portfolio = await ensureUserPortfolio(gate.session.userId);
      const username = sanitizeImportedLabel(ctx.body.username);

      const articles = ctx.body.articles
        .flatMap((article, index) => {
          const url = sanitizeImportedStoredUrl(
            article.url,
            `Articles[${index}].url`,
          );
          if (!url) return [];

          let publishedAt: Date | null = null;
          if (article.publishedAt) {
            const parsed = new Date(article.publishedAt);
            if (!Number.isNaN(parsed.getTime())) publishedAt = parsed;
          }
          return [{
            title: sanitizeImportedLabel(article.title),
            description: sanitizeImportedLongText(article.description),
            url,
            tags: sanitizeImportedStringList(
              article.tags,
              MAX_TECH_STACK_ITEMS,
              MAX_TECH_STACK_ITEM_CHARS,
            ),
            publishedAt,
            readTime: article.readTime ?? null,
            source: "medium",
          }].filter((entry) => entry.title);
        });

      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`
          SELECT "id"
          FROM "portfolios"
          WHERE "id" = ${portfolio.id}
          FOR UPDATE
        `;
        const existingCount = await tx.article.count({
          where: { portfolioId: portfolio.id },
        });
        const boundedArticles = articles
          .slice(0, Math.max(0, MAX_SECTION_ROWS - existingCount))
          .map((article, index) => ({
            ...article,
            portfolioId: portfolio.id,
            sortOrder: existingCount + index,
          }));
        return tx.article.createMany({ data: boundedArticles });
      });

      if (username) {
        await prisma.socialProfile.upsert({
          where: {
            portfolioId_platform: {
              portfolioId: portfolio.id,
              platform: "medium",
            },
          },
          update: {
            url: `https://medium.com/@${username}`,
            username,
          },
          create: {
            portfolioId: portfolio.id,
            platform: "medium",
            url: `https://medium.com/@${username}`,
            username,
          },
        });
      }

      return { success: true, imported: result.count };
    },
    {
      body: t.Object({
        username: t.String(),
        articles: t.Array(
          t.Object({
            title: t.String(),
            description: t.String(),
            url: t.String(),
            publishedAt: t.String(),
            tags: t.Array(t.String()),
            readTime: t.Optional(t.Number()),
          })
        ),
      }),
    }
  )

  .post(
    "/devto/fetch",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      try {
        const data = await fetchDevtoArticles(ctx.body.username);
        return { success: true, data };
      } catch (error: unknown) {
        ctx.set.status = 400;
        return {
          error: error instanceof Error ? error.message : "Failed to fetch Dev.to articles",
        };
      }
    },
    { body: t.Object({ username: t.String({ minLength: 1 }) }) }
  )

  .post(
    "/devto/import",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      const portfolio = await ensureUserPortfolio(gate.session.userId);
      const username = sanitizeImportedLabel(ctx.body.username);
      const result = await insertImportedArticles(
        portfolio.id,
        ctx.body.articles,
        "devto",
      );
      if (username) {
        await upsertImportedProfile(
          portfolio.id,
          "devto",
          `https://dev.to/${username}`,
          username,
        );
      }
      return { success: true, imported: result.count };
    },
    {
      body: t.Object({
        username: t.String(),
        articles: t.Array(importedArticleBody),
      }),
    }
  )

  .post(
    "/hashnode/fetch",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      try {
        const data = await fetchHashnodeArticles(ctx.body.username);
        return { success: true, data };
      } catch (error: unknown) {
        ctx.set.status = 400;
        return {
          error: error instanceof Error ? error.message : "Failed to fetch Hashnode posts",
        };
      }
    },
    { body: t.Object({ username: t.String({ minLength: 1 }) }) }
  )

  .post(
    "/hashnode/import",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      const portfolio = await ensureUserPortfolio(gate.session.userId);
      const username = sanitizeImportedLabel(ctx.body.username);
      const result = await insertImportedArticles(
        portfolio.id,
        ctx.body.articles,
        "hashnode",
      );
      if (username) {
        await upsertImportedProfile(
          portfolio.id,
          "hashnode",
          hashnodeProfileUrl(username, ctx.body.profileUrl),
          username,
        );
      }
      return { success: true, imported: result.count };
    },
    {
      body: t.Object({
        username: t.String(),
        profileUrl: t.Optional(t.String()),
        articles: t.Array(importedArticleBody),
      }),
    }
  )

  .post(
    "/stackoverflow/fetch",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      try {
        const data = await fetchStackOverflowProfile(ctx.body.username);
        return { success: true, data };
      } catch (error: unknown) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch Stack Overflow profile",
        };
      }
    },
    { body: t.Object({ username: t.String({ minLength: 1 }) }) }
  )

  .post(
    "/stackoverflow/import",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      const portfolio = await ensureUserPortfolio(gate.session.userId);
      const username = sanitizeImportedLabel(ctx.body.username);
      const result = await insertImportedArticles(
        portfolio.id,
        ctx.body.answers,
        "stackoverflow",
      );
      if (username) {
        await upsertImportedProfile(
          portfolio.id,
          "stackoverflow",
          ctx.body.url,
          username,
          {
            reputation: ctx.body.reputation,
            goldBadges: ctx.body.goldBadges,
            silverBadges: ctx.body.silverBadges,
            bronzeBadges: ctx.body.bronzeBadges,
            answerCount: ctx.body.answerCount,
            questionCount: ctx.body.questionCount,
          },
        );
      }
      return { success: true, imported: result.count };
    },
    {
      body: t.Object({
        userId: t.Number(),
        username: t.String(),
        url: t.String(),
        reputation: t.Number(),
        goldBadges: t.Number(),
        silverBadges: t.Number(),
        bronzeBadges: t.Number(),
        answerCount: t.Number(),
        questionCount: t.Number(),
        answers: t.Array(importedArticleBody),
      }),
    }
  )

  .post(
    "/codeforces/fetch",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      try {
        const data = await fetchCodeforcesStats(ctx.body.username);
        return { success: true, data };
      } catch (error: unknown) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error ? error.message : "Failed to fetch Codeforces stats",
        };
      }
    },
    { body: t.Object({ username: t.String({ minLength: 1 }) }) }
  )

  .post(
    "/codeforces/import",
    async (ctx) => {
      const gate = await requireImportEntitlement(ctx.request);
      if (!gate.ok) {
        ctx.set.status = gate.status;
        return gate.body;
      }

      const portfolio = await ensureUserPortfolio(gate.session.userId);
      const handle = sanitizeImportedLabel(ctx.body.handle);
      if (!handle) {
        ctx.set.status = 400;
        return { error: "Handle is required" };
      }

      await upsertImportedProfile(
        portfolio.id,
        "codeforces",
        `https://codeforces.com/profile/${handle}`,
        handle,
        {
          rating: ctx.body.rating,
          maxRating: ctx.body.maxRating,
          rank: ctx.body.rank,
          maxRank: ctx.body.maxRank,
          solvedCount: ctx.body.solvedCount,
          solvedCountPartial: ctx.body.solvedCountPartial,
        },
      );

      return { success: true };
    },
    {
      body: t.Object({
        handle: t.String(),
        name: t.String(),
        rating: t.Union([t.Number(), t.Null()]),
        maxRating: t.Union([t.Number(), t.Null()]),
        rank: t.Union([t.String(), t.Null()]),
        maxRank: t.Union([t.String(), t.Null()]),
        solvedCount: t.Number(),
        solvedCountPartial: t.Boolean(),
      }),
    }
  );
