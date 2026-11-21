import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toIsoDate, type BlogPostRecord } from "@/features/blog/lib/db-posts";
import { DEFAULT_AUTHOR, getFileSlugs, SLUG_RE } from "@/features/blog/lib/posts";
import { BLOG_PATH, BLOG_RSS_PATH, postPath, postUrl } from "@/features/blog/lib/seo";
import { requireBlogApiKey } from "@/features/blog/server/auth";
import {
  createBlogPostSchema,
  formatIssues,
  updateBlogPostSchema,
} from "@/features/blog/server/schema";

type ApiStatus = "draft" | "published";

function toApiStatus(status: BlogPostRecord["status"]): ApiStatus {
  return status === "PUBLISHED" ? "published" : "draft";
}

function toDbStatus(status: ApiStatus): BlogPostRecord["status"] {
  return status === "published" ? "PUBLISHED" : "DRAFT";
}

function toDbDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function serializePost(record: BlogPostRecord) {
  return {
    slug: record.slug,
    status: toApiStatus(record.status),
    url: postUrl(record.slug),
    title: record.title,
    date: toIsoDate(record.date),
    description: record.description,
    keyword: record.keyword,
    cover: record.cover,
    author: record.author,
    tags: record.tags,
    body: record.body,
    publishedAt: record.publishedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function summary(record: BlogPostRecord) {
  return { slug: record.slug, status: toApiStatus(record.status), url: postUrl(record.slug) };
}

/** Refresh every public page that lists or renders posts. */
function revalidateBlog(slug: string) {
  for (const path of [BLOG_PATH, postPath(slug), BLOG_RSS_PATH, "/sitemap.xml"]) {
    try {
      revalidatePath(path);
    } catch (error) {
      console.error(`[blog-api] revalidatePath(${path}) failed`, error);
    }
  }
}

async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false };
  }
}

function invalidJson() {
  return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

function slugTaken(slug: string) {
  return NextResponse.json({ error: `A post with slug "${slug}" already exists.` }, { status: 409 });
}

function notFoundResponse(slug: string) {
  return NextResponse.json({ error: `No API post with slug "${slug}".` }, { status: 404 });
}

function serverError(action: string, error: unknown) {
  console.error(`[blog-api] ${action} failed`, error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/** POST /api/blog */
export async function createBlogPost(request: Request): Promise<NextResponse> {
  const denied = requireBlogApiKey(request);
  if (denied) return denied;

  const json = await readJson(request);
  if (!json.ok) return invalidJson();

  const parsed = createBlogPostSchema.safeParse(json.body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid post", issues: formatIssues(parsed.error) },
      { status: 400 },
    );
  }
  const input = parsed.data;

  if (getFileSlugs().has(input.slug)) return slugTaken(input.slug);

  const status = toDbStatus(input.status ?? "draft");
  try {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (existing) return slugTaken(input.slug);

    const record = (await prisma.blogPost.create({
      data: {
        slug: input.slug,
        title: input.title,
        description: input.description,
        keyword: input.keyword,
        cover: input.cover ?? null,
        author: input.author ?? DEFAULT_AUTHOR,
        tags: input.tags ?? [],
        body: input.body,
        status,
        date: toDbDate(input.date),
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    })) as BlogPostRecord;

    revalidateBlog(record.slug);
    return NextResponse.json(summary(record), { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return slugTaken(input.slug);
    return serverError("create", error);
  }
}

/** GET /api/blog/[slug]: the post as stored, drafts included. */
export async function getBlogPostForApi(request: Request, slug: string): Promise<NextResponse> {
  const denied = requireBlogApiKey(request);
  if (denied) return denied;
  if (!SLUG_RE.test(slug)) return notFoundResponse(slug);

  try {
    const record = (await prisma.blogPost.findUnique({ where: { slug } })) as BlogPostRecord | null;
    if (!record) return notFoundResponse(slug);
    return NextResponse.json(serializePost(record));
  } catch (error) {
    return serverError("read", error);
  }
}

/** PATCH /api/blog/[slug]: partial update. `{"status":"published"}` publishes a draft. */
export async function updateBlogPost(request: Request, slug: string): Promise<NextResponse> {
  const denied = requireBlogApiKey(request);
  if (denied) return denied;
  if (!SLUG_RE.test(slug)) return notFoundResponse(slug);

  const json = await readJson(request);
  if (!json.ok) return invalidJson();

  const parsed = updateBlogPostSchema.safeParse(json.body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update", issues: formatIssues(parsed.error) },
      { status: 400 },
    );
  }
  const input = parsed.data;
  if (Object.keys(input).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const current = (await prisma.blogPost.findUnique({ where: { slug } })) as BlogPostRecord | null;
    if (!current) return notFoundResponse(slug);

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.keyword !== undefined) data.keyword = input.keyword;
    if (input.cover !== undefined) data.cover = input.cover;
    if (input.author !== undefined) data.author = input.author;
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.body !== undefined) data.body = input.body;
    if (input.date !== undefined) data.date = toDbDate(input.date);
    if (input.status !== undefined) {
      data.status = toDbStatus(input.status);
      if (input.status === "published" && !current.publishedAt) data.publishedAt = new Date();
    }

    const record = (await prisma.blogPost.update({ where: { slug }, data })) as BlogPostRecord;
    revalidateBlog(slug);
    return NextResponse.json(summary(record));
  } catch (error) {
    return serverError("update", error);
  }
}
