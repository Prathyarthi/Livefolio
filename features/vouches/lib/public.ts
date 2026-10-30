import { prisma } from "@/lib/prisma";
import { getPortfolioPublicUrl } from "@/lib/domain";
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