import { prisma } from "@/lib/prisma";
import {
  DEFAULT_AUTHOR,
  DATE_RE,
  getFileSlugs,
  SLUG_RE,
} from "@/features/blog/lib/posts";
import {
  recordToPost,
  type BlogPostRecord,
} from "@/features/blog/lib/db-posts";
import type { BlogPost } from "@/features/blog/types";

export type AdminBlogPost = BlogPost & {
  id: string;
  draft: boolean;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostInput = {
  slug: string;
  title: string;
  date: string;
  description: string;
  keyword: string;
  cover?: string | null;
  author?: string;
  tags?: string[];
  content: string;
  draft?: boolean;
};

function assertDate(value: string, key: string) {
  if (!DATE_RE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`"${key}" must be YYYY-MM-DD`);
  }
}

function normalizeCover(cover: string | null | undefined): string | null {
  const value = cover?.trim() || "";
  if (!value) return null;
  if (value.startsWith("/")) return value;
  try {
    if (new URL(value).protocol === "https:") return value;
  } catch {
    // fall through
  }
  throw new Error(
    "Cover must be a path under /public (e.g. /blog/cover.png) or an https URL",
  );
}

export function validateBlogPostInput(input: BlogPostInput): {
  slug: string;
  title: string;
  date: string;
  description: string;
  keyword: string;
  cover: string | null;
  author: string;
  tags: string[];
  content: string;
  draft: boolean;
} {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    throw new Error("Slug must be lowercase letters, numbers and hyphens");
  }
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  const date = input.date.trim();
  assertDate(date, "date");
  const description = input.description.trim();
  if (!description) throw new Error("Description is required");
  const keyword = input.keyword.trim();
  if (!keyword) throw new Error("Keyword is required");
  const cover = normalizeCover(input.cover);
  const content = input.content.trim();
  if (!content) throw new Error("Content is required");
  const author = input.author?.trim() || DEFAULT_AUTHOR;
  const tags = (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean);

  return {
    slug,
    title,
    date,
    description,
    keyword,
    cover,
    author,
    tags,
    content,
    draft: Boolean(input.draft),
  };
}

function rowToAdminPost(row: BlogPostRecord): AdminBlogPost {
  const publicPost = recordToPost(row);
  return {
    ...publicPost,
    id: row.id,
    draft: row.status !== "PUBLISHED",
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export async function listAdminBlogPosts(): Promise<AdminBlogPost[]> {
  const rows = (await prisma.blogPost.findMany({
    orderBy: [{ date: "desc" }, { title: "asc" }],
  })) as BlogPostRecord[];
  return rows.map(rowToAdminPost);
}

export async function getAdminBlogPostById(
  id: string,
): Promise<AdminBlogPost | null> {
  const row = (await prisma.blogPost.findUnique({
    where: { id },
  })) as BlogPostRecord | null;
  return row ? rowToAdminPost(row) : null;
}

export async function getAdminBlogPostBySlug(
  slug: string,
): Promise<AdminBlogPost | null> {
  const row = (await prisma.blogPost.findUnique({
    where: { slug },
  })) as BlogPostRecord | null;
  return row ? rowToAdminPost(row) : null;
}

export async function createAdminBlogPost(
  input: BlogPostInput,
): Promise<AdminBlogPost> {
  const data = validateBlogPostInput(input);
  if (getFileSlugs().has(data.slug)) {
    throw new Error(
      `Slug "${data.slug}" is already used by a markdown file in content/blog`,
    );
  }

  const publish = !data.draft;
  const row = (await prisma.blogPost.create({
    data: {
      slug: data.slug,
      title: data.title,
      date: toDateOnly(data.date),
      description: data.description,
      keyword: data.keyword,
      cover: data.cover,
      author: data.author,
      tags: data.tags,
      body: data.content,
      status: publish ? "PUBLISHED" : "DRAFT",
      publishedAt: publish ? new Date() : null,
    },
  })) as BlogPostRecord;
  return rowToAdminPost(row);
}

export async function updateAdminBlogPost(
  id: string,
  input: BlogPostInput,
): Promise<AdminBlogPost> {
  const data = validateBlogPostInput(input);
  const existing = (await prisma.blogPost.findUnique({
    where: { id },
  })) as BlogPostRecord | null;
  if (!existing) throw new Error("Post not found");

  if (data.slug !== existing.slug && getFileSlugs().has(data.slug)) {
    throw new Error(
      `Slug "${data.slug}" is already used by a markdown file in content/blog`,
    );
  }

  const publish = !data.draft;
  const row = (await prisma.blogPost.update({
    where: { id },
    data: {
      slug: data.slug,
      title: data.title,
      date: toDateOnly(data.date),
      description: data.description,
      keyword: data.keyword,
      cover: data.cover,
      author: data.author,
      tags: data.tags,
      body: data.content,
      status: publish ? "PUBLISHED" : "DRAFT",
      // Never clear publishedAt; set it the first time the post goes live.
      publishedAt: publish
        ? (existing.publishedAt ?? new Date())
        : existing.publishedAt,
    },
  })) as BlogPostRecord;
  return rowToAdminPost(row);
}

export async function deleteAdminBlogPost(id: string): Promise<void> {
  await prisma.blogPost.delete({ where: { id } });
}
