import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  listAccessibleWorkspaces,
  requireOrgMember,
  requireWorkspaceAccess,
} from "@/features/organization/lib/org-access";
import { getPortfolioPublicUrl } from "@/lib/domain";
import {
  talentIdsMatchingJsonAndArrays,
  talentTextSearchOr,
} from "@/features/talent/lib/search";
import { parsePageParams } from "@/lib/pagination";

const QUERY_MAX = 80;

function optionalTrim(value?: string | null) {
  if (value == null) return null;
  const trimmed = value.trim().slice(0, QUERY_MAX);
  return trimmed.length > 0 ? trimmed : null;
}

function contains(value: string) {
  return { contains: value, mode: "insensitive" as const };
}

export const talent = new Elysia({ prefix: "/talent" }).get(
  "/org/:orgSlug",
  async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const org = await prisma.organization.findUnique({
      where: { slug: ctx.params.orgSlug },
      select: { id: true },
    });
    if (!org) {
      ctx.set.status = 404;
      return { error: "Organization not found" };
    }

    const membership = await requireOrgMember(org.id, session.userId);
    if (!membership) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    const q = optionalTrim(ctx.query.q);
    const location = optionalTrim(ctx.query.location);
    const skill = optionalTrim(ctx.query.skill);
    const { page: requestedPage, pageSize } = parsePageParams(ctx.query);

    const jsonAndArrayIds = q ? await talentIdsMatchingJsonAndArrays(q) : [];

    const where = {
      openToWork: true,
      isPublished: true,
      slug: { not: null },
      ...(location ? { location: contains(location) } : {}),
      ...(skill ? { skills: { some: { name: contains(skill) } } } : {}),
      ...(q ? { OR: talentTextSearchOr(q, jsonAndArrayIds) } : {}),
    };

    const total = await prisma.portfolio.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
    const page = Math.min(requestedPage, pageCount);

    const rows = await prisma.portfolio.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        headline: true,
        location: true,
        avatarUrl: true,
        updatedAt: true,
        skills: {
          orderBy: { sortOrder: "asc" },
          take: 8,
          select: { name: true },
        },
        experiences: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { role: true, company: true },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const accessible = await listAccessibleWorkspaces(
      org.id,
      session.userId,
      membership.role,
    );
    const savedRows =
      rows.length > 0 && accessible.length > 0
        ? await prisma.workspaceTalent.findMany({
            where: {
              portfolioId: { in: rows.map((row) => row.id) },
              workspaceId: { in: accessible.map((workspace) => workspace.id) },
            },
            select: {
              portfolioId: true,
              workspace: { select: { id: true, slug: true, name: true } },
            },
          })
        : [];
    const savedByPortfolio = new Map<
      string,
      Array<{ id: string; slug: string; name: string }>
    >();
    for (const saved of savedRows) {
      const list = savedByPortfolio.get(saved.portfolioId) ?? [];
      list.push(saved.workspace);
      savedByPortfolio.set(saved.portfolioId, list);
    }

    return {
      total,
      page,
      pageSize,
      pageCount,
      people: rows.map((row) => {
        const slug = row.slug!;
        const recent = row.experiences[0];
        return {
          slug,
          title: row.title,
          headline: row.headline,
          location: row.location,
          avatarUrl: row.avatarUrl,
          skills: row.skills.map((s) => s.name),
          recentRole: recent
            ? { role: recent.role, company: recent.company }
            : null,
          livefolioUrl: getPortfolioPublicUrl(slug),
          savedWorkspaces: savedByPortfolio.get(row.id) ?? [],
        };
      }),
    };
  },
  {
    query: t.Object({
      q: t.Optional(t.String()),
      location: t.Optional(t.String()),
      skill: t.Optional(t.String()),
      page: t.Optional(t.String()),
      pageSize: t.Optional(t.String()),
    }),
  },
)
  .get(
    "/org/:orgSlug/workspaces/:workspaceSlug",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const org = await prisma.organization.findUnique({
        where: { slug: ctx.params.orgSlug },
        select: { id: true },
      });
      if (!org) {
        ctx.set.status = 404;
        return { error: "Organization not found" };
      }

      const access = await requireWorkspaceAccess(
        org.id,
        ctx.params.workspaceSlug,
        session.userId,
      );
      if (!access) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      const rows = await prisma.workspaceTalent.findMany({
        where: { workspaceId: access.workspace.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          portfolio: {
            select: {
              slug: true,
              title: true,
              headline: true,
              avatarUrl: true,
              isPublished: true,
            },
          },
        },
      });

      return {
        people: rows.flatMap((row) => {
          const slug = row.portfolio.slug;
          if (!slug) return [];
          return [
            {
              slug,
              title: row.portfolio.title,
              headline: row.portfolio.headline,
              avatarUrl: row.portfolio.avatarUrl,
              livefolioUrl: getPortfolioPublicUrl(slug),
            },
          ];
        }),
      };
    },
  )
  .post(
    "/org/:orgSlug/workspaces/:workspaceSlug",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const org = await prisma.organization.findUnique({
        where: { slug: ctx.params.orgSlug },
        select: { id: true },
      });
      if (!org) {
        ctx.set.status = 404;
        return { error: "Organization not found" };
      }

      const access = await requireWorkspaceAccess(
        org.id,
        ctx.params.workspaceSlug,
        session.userId,
      );
      if (!access) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }

      const slug = ctx.body.slug.trim();
      const portfolio = await prisma.portfolio.findFirst({
        where: {
          slug,
          openToWork: true,
          isPublished: true,
        },
        select: { id: true, slug: true },
      });
      if (!portfolio?.slug) {
        ctx.set.status = 404;
        return { error: "Talent not found" };
      }

      await prisma.workspaceTalent.upsert({
        where: {
          workspaceId_portfolioId: {
            workspaceId: access.workspace.id,
            portfolioId: portfolio.id,
          },
        },
        create: {
          workspaceId: access.workspace.id,
          portfolioId: portfolio.id,
          addedById: session.userId,
        },
        update: {},
      });

      return {
        ok: true,
        slug: portfolio.slug,
        workspace: {
          id: access.workspace.id,
          slug: access.workspace.slug,
          name: access.workspace.name,
        },
      };
    },
    {
      body: t.Object({
        slug: t.String({ minLength: 1, maxLength: 80 }),
      }),
    },
  );
