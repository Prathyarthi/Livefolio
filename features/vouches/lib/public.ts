import { prisma } from "@/lib/prisma";
import { getPortfolioPublicUrl } from "@/lib/domain";
import type { ReferenceForSearch } from "@/features/search/lib/references";
import { VOUCH_RELATIONSHIP_LABELS, type VouchRelationship } from "./constants";
import { isVouchRelationship } from "./validation";

export type NamedVouch = {
  id: string;
  relationship: VouchRelationship;
  relationshipLabel: string;
  story: string;
  completedAt: string;
  referee: {
    name: string;
    avatarUrl: string | null;
    portfolioUrl: string | null;
  };
};

/** @deprecated Use NamedVouch. */
export type PublicVouch = NamedVouch;

const completedVouchWhere = {
  status: "completed" as const,
  refereeId: { not: null },
  story: { not: null },
  relationship: { not: null },
};

const refereeInclude = {
  referee: {
    select: {
      name: true,
      avatar: true,
      portfolio: {
        select: {
          slug: true,
          isPublished: true,
          avatarUrl: true,
          profileImageUrl: true,
        },
      },
    },
  },
} as const;

function toNamedVouch(row: {
  id: string;
  relationship: string | null;
  story: string | null;
  completedAt: Date | null;
  referee: {
    name: string;
    avatar: string | null;
    portfolio: {
      slug: string | null;
      isPublished: boolean;
      avatarUrl: string | null;
      profileImageUrl: string | null;
    } | null;
  } | null;
}): NamedVouch | null {
  if (
    !row.referee ||
    !row.story ||
    !isVouchRelationship(row.relationship) ||
    !row.completedAt
  ) {
    return null;
  }

  const publishedSlug =
    row.referee.portfolio?.isPublished && row.referee.portfolio.slug
      ? row.referee.portfolio.slug
      : null;

  return {
    id: row.id,
    relationship: row.relationship,
    relationshipLabel: VOUCH_RELATIONSHIP_LABELS[row.relationship],
    story: row.story,
    completedAt: row.completedAt.toISOString(),
    referee: {
      name: row.referee.name,
      avatarUrl:
        row.referee.portfolio?.profileImageUrl ||
        row.referee.portfolio?.avatarUrl ||
        row.referee.avatar ||
        null,
      portfolioUrl: publishedSlug
        ? getPortfolioPublicUrl(publishedSlug)
        : null,
    },
  };
}

export async function listNamedVouchesForUser(
  userId: string,
): Promise<NamedVouch[]> {
  const rows = await prisma.vouch.findMany({
    where: { requesterId: userId, ...completedVouchWhere },
    orderBy: { completedAt: "desc" },
    include: refereeInclude,
  });

  return rows.flatMap((row) => {
    const named = toNamedVouch(row);
    return named ? [named] : [];
  });
}

export async function listNamedVouchesByUserIds(
  userIds: string[],
): Promise<Map<string, NamedVouch[]>> {
  const map = new Map<string, NamedVouch[]>();
  for (const id of userIds) map.set(id, []);
  if (userIds.length === 0) return map;

  const rows = await prisma.vouch.findMany({
    where: { requesterId: { in: userIds }, ...completedVouchWhere },
    orderBy: { completedAt: "desc" },
    include: refereeInclude,
  });

  for (const row of rows) {
    const named = toNamedVouch(row);
    if (!named) continue;
    const list = map.get(row.requesterId) ?? [];
    list.push(named);
    map.set(row.requesterId, list);
  }

  return map;
}

export async function countNamedVouchesByUserIds(
  userIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const id of userIds) map.set(id, 0);
  if (userIds.length === 0) return map;

  const groups = await prisma.vouch.groupBy({
    by: ["requesterId"],
    where: { requesterId: { in: userIds }, ...completedVouchWhere },
    _count: { _all: true },
  });

  for (const group of groups) {
    map.set(group.requesterId, group._count._all);
  }

  return map;
}

export const listPublicVouchesForUser = listNamedVouchesForUser;

function toReferenceSignal(row: {
  story: string | null;
  relationship: string | null;
}): ReferenceForSearch | null {
  if (!row.story || !isVouchRelationship(row.relationship)) return null;
  return { relationship: row.relationship, story: row.story };
}

function groupReferenceSignals(
  rows: Array<{
    requesterId: string;
    story: string | null;
    relationship: string | null;
  }>,
): Map<string, ReferenceForSearch[]> {
  const map = new Map<string, ReferenceForSearch[]>();
  for (const row of rows) {
    const signal = toReferenceSignal(row);
    if (!signal) continue;
    const list = map.get(row.requesterId) ?? [];
    list.push(signal);
    map.set(row.requesterId, list);
  }
  return map;
}

/** Completed reference stories for ranking. Missing users are absent from the map. */
export async function listReferenceSignalsByUserIds(
  userIds: string[],
): Promise<Map<string, ReferenceForSearch[]>> {
  if (userIds.length === 0) return new Map();
  const rows = await prisma.vouch.findMany({
    where: { requesterId: { in: userIds }, ...completedVouchWhere },
    orderBy: { completedAt: "desc" },
    select: { requesterId: true, story: true, relationship: true },
  });
  return groupReferenceSignals(rows);
}

/**
 * Superset of people whose reference stories contain any of these terms.
 * Callers still apply word-boundary matching.
 */
export async function listReferenceSignalsByStoryTerms(
  terms: string[],
): Promise<Map<string, ReferenceForSearch[]>> {
  const needles = [...new Set(terms.map((term) => term.trim()).filter((term) => term.length >= 2))].slice(
    0,
    16,
  );
  if (needles.length === 0) return new Map();

  const rows = await prisma.vouch.findMany({
    where: {
      ...completedVouchWhere,
      OR: needles.map((term) => ({
        story: { contains: term, mode: "insensitive" as const },
      })),
    },
    orderBy: { completedAt: "desc" },
    select: { requesterId: true, story: true, relationship: true },
    take: 5000,
  });
  return groupReferenceSignals(rows);
}