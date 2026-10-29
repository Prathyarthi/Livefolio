import Elysia, { t } from "elysia";
import type { Prisma } from "@/db/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { requireWorkspaceAccess } from "@/features/organization/lib/org-access";
import { getPortfolioPublicUrl } from "@/lib/domain";
import { talentKeywordWhere } from "@/features/talent/lib/search";
import { parsePageParams, paginateSlice } from "@/lib/pagination";
import {
  applicationSnapshotInclude,
  portfolioToSnapshot,
} from "@/features/applications/lib/snapshot";
import { summarizeSnapshot } from "@/features/applications/lib/applicant-summary";
import { buildSearchFacets } from "@/features/search/lib/facets";
import { matchesStructuredFilters } from "@/features/search/lib/filters";
import {
  matchesInterpretedQuery,
  snapshotSearchBlob,
} from "@/features/search/lib/match";
import { isProofKind, proofKindsOf } from "@/features/search/lib/proof";
import { interpretSearchQuery, parseSearchSort } from "@/features/search/lib/query";
import { RANKING_VERSION, rankCandidate } from "@/features/search/lib/rank";
import { refreshJobSearchProfile } from "@/features/jobs/lib/extract-search-profile";

const QUERY_MAX = 120;
/** Ranking runs in memory, so recall is capped to the most recently updated matches. */
const RECALL_CAP = 300;

function optionalTrim(value?: string | null) {
  if (value == null) return null;
  const trimmed = value.trim().slice(0, QUERY_MAX);
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value?: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function contains(value: string) {
  return { contains: value, mode: "insensitive" as const };
}

export const talent = new Elysia({ prefix: "/talent" }).get(
  "/org/:orgSlug/workspace/:workspaceSlug",
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

    const workspaceAccess = await requireWorkspaceAccess(
      org.id,
      ctx.params.workspaceSlug,
      session.userId,
    );
    if (!workspaceAccess) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    const q = optionalTrim(ctx.query.q);
    const location = optionalTrim(ctx.query.location);
    const skill = optionalTrim(ctx.query.skill);
    const proof = isProofKind(ctx.query.proof) ? ctx.query.proof : undefined;
    const minExperience = optionalNumber(ctx.query.minExperience);
    const maxExperience = optionalNumber(ctx.query.maxExperience);
    const sort = parseSearchSort(ctx.query.sort);
    const { page: requestedPage, pageSize } = parsePageParams(ctx.query);

    const jobId = optionalTrim(ctx.query.jobId);
    let job: { id: string; title: string } | null = null;
    if (jobId) {
      job = await prisma.job.findFirst({
        where: {
          id: jobId,
          organizationId: org.id,
          workspaceId: workspaceAccess.workspace.id,
        },
        select: { id: true, title: true },
      });
      if (!job) {
        ctx.set.status = 404;
        return { error: "Job not found in this workspace" };
      }
    }
    const jobProfile = job ? await refreshJobSearchProfile(job.id) : null;

    const interpreted = interpretSearchQuery(q ?? undefined);
    const jobTerms = jobProfile
      ? [...jobProfile.mustHaves, ...jobProfile.niceToHaves]
      : [];
    const recallTerms =
      interpreted.keywords.length > 0 ? interpreted.keywords : jobTerms;
    const [keywordWhere, skillWhere] = await Promise.all([
      talentKeywordWhere(
        recallTerms,
        interpreted.keywords.length > 0 ? interpreted.matchAny : true,
      ),
      skill ? talentKeywordWhere([skill], false) : Promise.resolve(null),
    ]);
    const resolvedLocation = location ?? interpreted.location ?? null;

    const filters: Prisma.PortfolioWhereInput[] = [
      { openToWork: true, isPublished: true, slug: { not: null } },
    ];
    if (resolvedLocation) filters.push({ location: contains(resolvedLocation) });
    if (keywordWhere) filters.push(keywordWhere);
    if (skillWhere) filters.push(skillWhere);

    const rows = await prisma.portfolio.findMany({
      where: { AND: filters },
      include: applicationSnapshotInclude,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: RECALL_CAP,
    });

    const matched = rows
      .map((row) => {
        const snapshot = portfolioToSnapshot(row);
        return { row, snapshot };
      })
      .filter(({ row, snapshot }) => {
        if (!matchesInterpretedQuery(snapshotSearchBlob(snapshot), interpreted)) {
          return false;
        }
        return matchesStructuredFilters(
          snapshot,
          {
            location: resolvedLocation ?? undefined,
            skill: skill ?? undefined,
            proof,
            minExperience: minExperience ?? interpreted.minExperience,
            maxExperience,
          },
          row.updatedAt,
        );
      })
      .map(({ row, snapshot }) => ({
        row,
        snapshot,
        rank: rankCandidate(snapshot, {
          jobProfile,
          query: interpreted,
          extras: { freshnessAt: row.updatedAt },
        }),
      }))
      .sort((a, b) => {
        if (sort === "relevance") {
          const diff = b.rank.score - a.rank.score;
          if (diff !== 0) return diff;
        }
        return b.row.updatedAt.getTime() - a.row.updatedAt.getTime();
      });

    const paged = paginateSlice(matched, requestedPage, pageSize);

    return {
      total: paged.total,
      truncated: rows.length >= RECALL_CAP,
      page: paged.page,
      pageSize: paged.pageSize,
      pageCount: paged.pageCount,
      sort,
      rankingVersion: RANKING_VERSION,
      job,
      interpreted,
      facets: buildSearchFacets(matched.map((item) => item.snapshot)),
      people: paged.items.map(({ row, snapshot, rank }) => {
        const slug = row.slug!;
        const recent = row.experiences[0];
        return {
          slug,
          title: row.title,
          headline: row.headline,
          location: row.location,
          avatarUrl: row.avatarUrl,
          skills: row.skills.slice(0, 8).map((s) => s.name),
          recentRole: recent
            ? { role: recent.role, company: recent.company }
            : null,
          yearsExperience: summarizeSnapshot(snapshot).yearsExperience,
          proof: proofKindsOf(snapshot),
          score: rank.score,
          reasons: rank.reasons,
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
      proof: t.Optional(t.String()),
      minExperience: t.Optional(t.String()),
      maxExperience: t.Optional(t.String()),
      jobId: t.Optional(t.String()),
      sort: t.Optional(t.String()),
      page: t.Optional(t.String()),
      pageSize: t.Optional(t.String()),
    }),
  },
);
