import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { requireApplicantViewer } from "@/features/organization/lib/org-access";
import { getPortfolioPublicUrl } from "@/lib/domain";
import {
  talentIdsMatchingJsonAndArrays,
  talentTextSearchOr,
} from "@/features/talent/lib/search";

const TALENT_LIMIT = 50;
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

    const membership = await requireApplicantViewer(org.id, session.userId);
    if (!membership) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    const q = optionalTrim(ctx.query.q);
    const location = optionalTrim(ctx.query.location);
    const skill = optionalTrim(ctx.query.skill);

    const jsonAndArrayIds = q ? await talentIdsMatchingJsonAndArrays(q) : [];

    const where = {
      openToWork: true,
      isPublished: true,
      slug: { not: null },
      ...(location ? { location: contains(location) } : {}),
      ...(skill ? { skills: { some: { name: contains(skill) } } } : {}),
      ...(q ? { OR: talentTextSearchOr(q, jsonAndArrayIds) } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.portfolio.findMany({
        where,
        select: {
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
        orderBy: { updatedAt: "desc" },
        take: TALENT_LIMIT,
      }),
      prisma.portfolio.count({ where }),
    ]);

    return {
      total,
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
        };
      }),
    };
  },
  {
    query: t.Object({
      q: t.Optional(t.String()),
      location: t.Optional(t.String()),
      skill: t.Optional(t.String()),
    }),
  },
);
