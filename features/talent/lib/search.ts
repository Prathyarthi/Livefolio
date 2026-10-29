import type { Prisma } from "@/db/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { expandSkillTerm } from "@/features/search/lib/skill-families";

function contains(value: string) {
  return { contains: value, mode: "insensitive" as const };
}

/** Match one term against every Livefolio section, including custom section items. */
export function talentTextSearchOr(
  q: string,
  extraIds: string[] = [],
): Prisma.PortfolioWhereInput[] {
  const clauses: Prisma.PortfolioWhereInput[] = [
    { title: contains(q) },
    { headline: contains(q) },
    { summary: contains(q) },
    { location: contains(q) },
    {
      skills: {
        some: {
          OR: [{ name: contains(q) }, { category: contains(q) }],
        },
      },
    },
    {
      experiences: {
        some: {
          OR: [
            { role: contains(q) },
            { company: contains(q) },
            { description: contains(q) },
            { location: contains(q) },
          ],
        },
      },
    },
    {
      educations: {
        some: {
          OR: [
            { institution: contains(q) },
            { degree: contains(q) },
            { field: contains(q) },
            { description: contains(q) },
          ],
        },
      },
    },
    {
      projects: {
        some: {
          OR: [
            { title: contains(q) },
            { description: contains(q) },
            { language: contains(q) },
          ],
        },
      },
    },
    {
      articles: {
        some: {
          OR: [{ title: contains(q) }, { description: contains(q) }],
        },
      },
    },
    {
      certifications: {
        some: {
          OR: [{ name: contains(q) }, { issuer: contains(q) }],
        },
      },
    },
    { achievements: { some: { title: contains(q) } } },
    {
      socialProfiles: {
        some: {
          OR: [{ platform: contains(q) }, { username: contains(q) }],
        },
      },
    },
    {
      customSections: {
        some: {
          OR: [{ label: contains(q) }, { sectionType: contains(q) }],
        },
      },
    },
  ];

  if (extraIds.length > 0) {
    clauses.push({ id: { in: extraIds } });
  }

  return clauses;
}

/**
 * Custom section `items` are JSON, and project tech / article tags are
 * string arrays — Prisma `contains` does not cover those. Match them in SQL.
 */
export async function talentIdsMatchingJsonAndArrays(q: string): Promise<string[]> {
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p.id
    FROM portfolios p
    WHERE p."openToWork" = true
      AND p."isPublished" = true
      AND p.slug IS NOT NULL
      AND (
        EXISTS (
          SELECT 1
          FROM custom_sections cs
          WHERE cs."portfolioId" = p.id
            AND cs.items::text ILIKE ${pattern}
        )
        OR EXISTS (
          SELECT 1
          FROM projects pr
          WHERE pr."portfolioId" = p.id
            AND array_to_string(pr."techStack", ' ') ILIKE ${pattern}
        )
        OR EXISTS (
          SELECT 1
          FROM articles art
          WHERE art."portfolioId" = p.id
            AND array_to_string(art.tags, ' ') ILIKE ${pattern}
        )
      )
  `;
  return rows.map((row) => row.id);
}

const MAX_RECALL_TERMS = 6;
const MAX_VARIANTS_PER_TERM = 4;

/**
 * Database recall for a parsed query: each keyword (or any keyword, for OR queries)
 * must appear somewhere, counting its skill-family synonyms. Exact word-boundary
 * matching and exclusions run afterwards in memory.
 */
export async function talentKeywordWhere(
  keywords: string[],
  matchAny: boolean,
): Promise<Prisma.PortfolioWhereInput | null> {
  const terms = keywords.slice(0, MAX_RECALL_TERMS);
  if (terms.length === 0) return null;

  const perTerm = await Promise.all(
    terms.map(async (term) => {
      const variants = expandSkillTerm(term).slice(0, MAX_VARIANTS_PER_TERM);
      const clauses = await Promise.all(
        variants.map(async (variant) =>
          talentTextSearchOr(variant, await talentIdsMatchingJsonAndArrays(variant)),
        ),
      );
      return { OR: clauses.flat() } satisfies Prisma.PortfolioWhereInput;
    }),
  );

  return matchAny ? { OR: perTerm } : { AND: perTerm };
}
