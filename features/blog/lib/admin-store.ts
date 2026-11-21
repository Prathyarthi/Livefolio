import { prisma } from "@/lib/prisma";
import { countWords } from "@/features/blog/lib/markdown";
import type { BlogPost } from "@/features/blog/types";

const DEFAULT_AUTHOR = "Prathyarthi Kashyap, Founder";

export type AdminBlogPost = BlogPost & {
  id: string;
  draft: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostInput = {
  slug: string;
  title: string;
  date: string;
  updated?: string | null;
  description: string;
  keyword: string;
  cover: string;
  author?: string;
  tags?: string[];
  content: string;
  draft?: boolean;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertDate(value: string, key: string) {
  if (!DATE_RE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`"${key}" must be YYYY-MM-DD`);
  }
}

export function validateBlogPostInput(input: BlogPostInput): BlogPostInput {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    throw new Error("Slug must be lowercase letters, numbers and hyphens");
  }
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  const date = input.date.trim();
  assertDate(date, "date");
  const updated = input.updated?.trim() || null;
  if (updated) assertDate(updated, "updated");
  const description = input.description.trim();
  if (!description) throw new Error("Description is required");
  const keyword = input.keyword.trim();
  if (!keyword) throw new Error("Keyword is required");
  const cover = input.cover.trim();
  if (!cover.startsWith("/")) {
    throw new Error("Cover must be a path under /public (e.g. /blog/cover.png)");
  }
  const content = input.content.trim();
  if (!content) throw new Error("Content is required");
  const author = input.author?.trim() || DEFAULT_AUTHOR;
  const tags = (input.tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    slug,
    title,
    date,
    updated,
    description,
    keyword,
    cover,
    author,
    tags,
    content,
    draft: Boolean(input.draft),
  };
}

function rowToAdminPost(row: {
  id: string;
  slug: string;
  title: string;
  date: string;
  updated: string | null;
  description: string;
  keyword: string;
  cover: string;
  author: string;
  tags: string[];
  content: string;
  draft: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminBlogPost {
  const [authorName, ...roleParts] = row.author.split(",");
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    date: row.date,
    updated: row.updated ?? undefined,
    description: row.description,
    keyword: row.keyword,
    cover: row.cover,
    author: row.author,
    authorName: authorName.trim(),
    authorRole: roleParts.join(",").trim() || undefined,
    tags: row.tags,
    content: row.content,
    readingMinutes: Math.max(1, Math.ceil(countWords(row.content) / 220)),
    draft: row.draft,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function adminPostToPublic(post: AdminBlogPost): BlogPost | null {
  if (post.draft) return null;
  const { id: _id, draft: _draft, createdAt: _c, updatedAt: _u, ...rest } = post;
  return rest;
}

export async function listAdminBlogPosts(): Promise<AdminBlogPost[]> {
  const rows = await prisma.blogPost.findMany({
    orderBy: [{ date: "desc" }, { title: "asc" }],
  });
  return rows.map(rowToAdminPost);
}

export async function listPublishedDbBlogPosts(): Promise<BlogPost[]> {
  const rows = await prisma.blogPost.findMany({
    where: { draft: false },
    orderBy: [{ date: "desc" }, { title: "asc" }],
  });
  return rows.map(rowToAdminPost).flatMap((post) => {
    const published = adminPostToPublic(post);
    return published ? [published] : [];
  });
}

export async function getAdminBlogPostById(
  id: string,
): Promise<AdminBlogPost | null> {
  const row = await prisma.blogPost.findUnique({ where: { id } });
  return row ? rowToAdminPost(row) : null;
}

export async function getAdminBlogPostBySlug(
  slug: string,
): Promise<AdminBlogPost | null> {
  const row = await prisma.blogPost.findUnique({ where: { slug } });
  return row ? rowToAdminPost(row) : null;
}

export async function createAdminBlogPost(
  input: BlogPostInput,
): Promise<AdminBlogPost> {
  const data = validateBlogPostInput(input);
  const row = await prisma.blogPost.create({
    data: {
      slug: data.slug,
      title: data.title,
      date: data.date,
      updated: data.updated ?? null,
      description: data.description,
      keyword: data.keyword,
      cover: data.cover,
      author: data.author || DEFAULT_AUTHOR,
      tags: data.tags ?? [],
      content: data.content,
      draft: Boolean(data.draft),
    },
  });
  return rowToAdminPost(row);
}

export async function updateAdminBlogPost(
  id: string,
  input: BlogPostInput,
): Promise<AdminBlogPost> {
  const data = validateBlogPostInput(input);
  const row = await prisma.blogPost.update({
    where: { id },
    data: {
      slug: data.slug,
      title: data.title,
      date: data.date,
      updated: data.updated ?? null,
      description: data.description,
      keyword: data.keyword,
      cover: data.cover,
      author: data.author || DEFAULT_AUTHOR,
      tags: data.tags ?? [],
      content: data.content,
      draft: Boolean(data.draft),
    },
  });
  return rowToAdminPost(row);
}

export async function deleteAdminBlogPost(id: string): Promise<void> {
  await prisma.blogPost.delete({ where: { id } });
}
