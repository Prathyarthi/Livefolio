import { DEFAULT_AUTHOR, readingMinutesFor, sortPosts, splitAuthor } from "@/features/blog/lib/posts";
import type { BlogPost } from "@/features/blog/types";
import { OG_IMAGE } from "@/lib/seo";

export type BlogPostStatusValue = "DRAFT" | "PUBLISHED";

/** Shape of a `blog_posts` row (matches the Prisma BlogPost model). */
export type BlogPostRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  keyword: string;
  cover: string | null;
  author: string;
  tags: string[];
  body: string;
  status: BlogPostStatusValue;
  date: Date;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Date -> YYYY-MM-DD (UTC). `date` is a Postgres DATE, read back as midnight UTC. */
export function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Convert a database row into the same BlogPost shape the markdown files produce. */
export function recordToPost(record: BlogPostRecord): BlogPost {
  const date = toIsoDate(record.date);
  const author = record.author.trim() || DEFAULT_AUTHOR;
  const { authorName, authorRole } = splitAuthor(author);

  // dateModified: only when the post was edited on a later day than it went live.
  const published = record.publishedAt ? toIsoDate(record.publishedAt) : null;
  const edited = toIsoDate(record.updatedAt);
  const updated = published && edited > published && edited > date ? edited : undefined;

  return {
    slug: record.slug,
    title: record.title,
    date,
    updated,
    description: record.description,
    keyword: record.keyword,
    cover: record.cover || OG_IMAGE.url,
    author,
    authorName,
    authorRole,
    tags: record.tags,
    content: record.body,
    readingMinutes: readingMinutesFor(record.body),
  };
}

/**
 * Public post list: every file post plus PUBLISHED database posts. Drafts are
 * dropped here even if the caller already filtered them. A file post wins if a
 * slug exists in both places (the admin CMS refuses to create such a post).
 */
export function mergePosts(filePosts: BlogPost[], records: BlogPostRecord[]): BlogPost[] {
  const fileSlugs = new Set(filePosts.map((post) => post.slug));
  const dbPosts = records
    .filter((record) => record.status === "PUBLISHED" && !fileSlugs.has(record.slug))
    .map(recordToPost);
  return sortPosts([...filePosts, ...dbPosts]);
}
