import { prisma } from "@/lib/prisma";
import {
  MAX_SECTION_ROWS,
  sanitizeImportedLabel,
  sanitizeImportedLongText,
  sanitizeImportedStoredUrl,
} from "@/lib/content-policy";
import type { LinkedInPost } from "@/lib/linkedin";

/** Article.source value for rows created from LinkedIn posts. */
export const LINKEDIN_ARTICLE_SOURCE = "linkedin";
const TITLE_MAX = 90;

const RELATIVE_UNITS_MS: Record<string, number> = {
  m: 60_000,
  min: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 7 * 86_400_000,
  mo: 30 * 86_400_000,
  y: 365 * 86_400_000,
  yr: 365 * 86_400_000,
};

/** Parses LinkedIn dates: ISO/absolute ("2026-10-01", "Oct 1, 2026") or relative ("2w", "3mo", "1y"). */
export function parseLinkedInPostDate(value: string | null, syncedAt: Date): Date | null {
  if (!value) return null;
  const text = value.trim().toLowerCase();
  const relative = text.match(/^(\d+)\s*(min|mo|yr|m|h|d|w|y)\b/);
  if (relative) {
    const ms = RELATIVE_UNITS_MS[relative[2]];
    return new Date(syncedAt.getTime() - Number(relative[1]) * ms);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** First line/sentence of the post, truncated on a word boundary. */
export function linkedInPostTitle(text: string): string {
  const firstLine =
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) ?? "LinkedIn post";
  const sentence = firstLine.match(/^(.+?[.!?])(\s|$)/)?.[1] ?? firstLine;
  if (sentence.length <= TITLE_MAX) return sentence;
  const cut = sentence.slice(0, TITLE_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:–-]+$/, "")}…`;
}

export function linkedInPostToArticle(post: LinkedInPost, syncedAt: Date) {
  const url = sanitizeImportedStoredUrl(post.url, "LinkedIn post URL");
  if (!url) return null;
  const title = sanitizeImportedLabel(linkedInPostTitle(post.text));
  if (!title) return null;
  return {
    title,
    description: sanitizeImportedLongText(post.text.trim()),
    url,
    tags: [] as string[],
    publishedAt: parseLinkedInPostDate(post.date, syncedAt),
    readTime: null,
    source: LINKEDIN_ARTICLE_SOURCE,
  };
}

/**
 * Mirrors the selected LinkedIn posts into the Articles section.
 * - Only touches rows with source "linkedin"; manual and other-source articles are untouched.
 * - Keyed by post URL: existing rows are kept as-is (preserving dashboard edits/order), missing
 *   selected posts are appended, deselected/removed posts are deleted.
 * - Pass an empty list to remove all LinkedIn articles.
 */
export async function syncLinkedInArticles(
  portfolioId: string,
  selectedPosts: LinkedInPost[],
  syncedAt: Date = new Date(),
) {
  const prepared = selectedPosts
    .map((post) => linkedInPostToArticle(post, syncedAt))
    .filter((article): article is NonNullable<typeof article> => Boolean(article));
  const wantedUrls = [...new Set(prepared.map((article) => article.url))];

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id" FROM "portfolios" WHERE "id" = ${portfolioId} FOR UPDATE
    `;
    const removed = await tx.article.deleteMany({
      where: {
        portfolioId,
        source: LINKEDIN_ARTICLE_SOURCE,
        url: { notIn: wantedUrls },
      },
    });
    const existing = await tx.article.findMany({
      where: { portfolioId, source: LINKEDIN_ARTICLE_SOURCE },
      select: { url: true },
    });
    const have = new Set(existing.map((row) => row.url));
    const total = await tx.article.count({ where: { portfolioId } });
    const maxOrder = await tx.article.aggregate({
      where: { portfolioId },
      _max: { sortOrder: true },
    });
    const seen = new Set<string>();
    const toCreate = prepared
      .filter((article) => !have.has(article.url) && !seen.has(article.url) && seen.add(article.url))
      .slice(0, Math.max(0, MAX_SECTION_ROWS - total))
      .map((article, index) => ({
        ...article,
        portfolioId,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1 + index,
      }));
    if (toCreate.length > 0) await tx.article.createMany({ data: toCreate });
    return { added: toCreate.length, removed: removed.count };
  });
}
