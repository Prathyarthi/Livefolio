import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { BlogPostRecord } from "@/features/blog/lib/db-posts";
import type { BlogPost } from "@/features/blog/types";

// In-memory stand-in for prisma.blogPost. No test touches a real database.
const rows = new Map<string, BlogPostRecord>();
let dbDown = false;

function guard() {
  if (dbDown) throw new Error("connect ECONNREFUSED 127.0.0.1:1");
}

const blogPost = {
  findUnique: mock(async ({ where }: { where: { slug: string } }) => {
    guard();
    return rows.get(where.slug) ?? null;
  }),
  findFirst: mock(async ({ where }: { where: { slug: string; status?: string } }) => {
    guard();
    const row = rows.get(where.slug);
    return row && (!where.status || row.status === where.status) ? row : null;
  }),
  findMany: mock(async ({ where }: { where?: { status?: string } } = {}) => {
    guard();
    return [...rows.values()].filter((row) => !where?.status || row.status === where.status);
  }),
  create: mock(async ({ data }: { data: Omit<BlogPostRecord, "id" | "createdAt" | "updatedAt"> }) => {
    guard();
    const now = new Date();
    const row: BlogPostRecord = { id: `id-${data.slug}`, createdAt: now, updatedAt: now, ...data };
    rows.set(row.slug, row);
    return row;
  }),
  update: mock(async ({ where, data }: { where: { slug: string }; data: Partial<BlogPostRecord> }) => {
    guard();
    const current = rows.get(where.slug);
    if (!current) throw Object.assign(new Error("not found"), { code: "P2025" });
    const row = { ...current, ...data, updatedAt: new Date() };
    rows.set(row.slug, row);
    return row;
  }),
};

const revalidatePath = mock((path: string) => void path);

mock.module("@/lib/prisma", () => ({ prisma: { blogPost } }));
mock.module("next/cache", () => ({ revalidatePath, revalidateTag: mock(() => {}) }));

const { createBlogPost, getBlogPostForApi, updateBlogPost } = await import(
  "@/features/blog/server/handlers"
);
const { apiKeysMatch } = await import("@/features/blog/server/auth");
const { mergePosts, recordToPost } = await import("@/features/blog/lib/db-posts");
const { getBlogPost, getBlogPosts } = await import("@/features/blog/lib/blog-posts");
const { getAllPosts } = await import("@/features/blog/lib/posts");
const { extractFaq } = await import("@/features/blog/lib/markdown");
const { getArticleSchema, getPostMetadata } = await import("@/features/blog/lib/seo");

const KEY = "test-blog-key-123";
const originalKey = process.env.BLOG_API_KEY;
const originalSiteUrl = process.env.NEXT_PUBLIC_APP_URL;

const validPost = {
  title: "How to build a portfolio",
  slug: "how-to-build-a-portfolio",
  date: "2026-11-16",
  description: "A short guide.",
  keyword: "portfolio website",
  cover: "https://cdn.example.com/cover.png",
  author: "Prathyarthi Kashyap, Founder",
  tags: ["portfolio", "resume"],
  body: "Intro.\n\n## FAQ\n\n### Is it free?\n\nYes, there is a free plan.\n",
};

function req(method: string, body?: unknown, key: string | null = KEY, raw?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (key !== null) headers.authorization = `Bearer ${key}`;
  return new Request("http://localhost/api/blog", {
    method,
    headers,
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
}

function record(overrides: Partial<BlogPostRecord> = {}): BlogPostRecord {
  const at = new Date("2026-11-16T10:00:00Z");
  return {
    id: "r1",
    slug: "db-post",
    title: "DB post",
    description: "From the API.",
    keyword: "k",
    cover: null,
    author: "Jane Doe, Writer",
    tags: ["x"],
    body: "Hello world",
    status: "PUBLISHED",
    date: new Date("2026-11-16T00:00:00Z"),
    publishedAt: at,
    createdAt: at,
    updatedAt: at,
    ...overrides,
  };
}

beforeEach(() => {
  rows.clear();
  dbDown = false;
  process.env.BLOG_API_KEY = KEY;
  process.env.NEXT_PUBLIC_APP_URL = "https://livefolio.me";
  revalidatePath.mockClear();
  for (const fn of Object.values(blogPost)) fn.mockClear();
});

afterAll(() => {
  if (originalKey === undefined) delete process.env.BLOG_API_KEY;
  else process.env.BLOG_API_KEY = originalKey;
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = originalSiteUrl;
});

describe("blog API auth", () => {
  test("missing Authorization header is 401", async () => {
    const res = await createBlogPost(req("POST", validPost, null));
    expect(res.status).toBe(401);
    expect(blogPost.create).not.toHaveBeenCalled();
  });

  test("wrong key is 401", async () => {
    const res = await createBlogPost(req("POST", validPost, "nope"));
    expect(res.status).toBe(401);
    const get = await getBlogPostForApi(req("GET", undefined, `${KEY}x`), "anything");
    expect(get.status).toBe(401);
    const patch = await updateBlogPost(req("PATCH", { status: "published" }, ""), "anything");
    expect(patch.status).toBe(401);
  });

  test("unset BLOG_API_KEY rejects every call, even with an empty bearer", async () => {
    delete process.env.BLOG_API_KEY;
    expect((await createBlogPost(req("POST", validPost, ""))).status).toBe(503);
    expect((await createBlogPost(req("POST", validPost, KEY))).status).toBe(503);
    expect((await getBlogPostForApi(req("GET"), "x")).status).toBe(503);
    expect((await updateBlogPost(req("PATCH", { status: "published" }), "x")).status).toBe(503);
    process.env.BLOG_API_KEY = "   ";
    expect((await createBlogPost(req("POST", validPost, ""))).status).toBe(503);
    expect(blogPost.create).not.toHaveBeenCalled();
  });

  test("apiKeysMatch compares exactly", () => {
    expect(apiKeysMatch(KEY, KEY)).toBe(true);
    expect(apiKeysMatch(KEY, `${KEY} `)).toBe(false);
    expect(apiKeysMatch("", KEY)).toBe(false);
  });
});

describe("POST /api/blog", () => {
  test("creates a draft by default and returns slug, status and url", async () => {
    const res = await createBlogPost(req("POST", validPost));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      slug: validPost.slug,
      status: "draft",
      url: `https://livefolio.me/blog/${validPost.slug}`,
    });
    const row = rows.get(validPost.slug)!;
    expect(row.status).toBe("DRAFT");
    expect(row.publishedAt).toBeNull();
    expect(row.date.toISOString()).toBe("2026-11-16T00:00:00.000Z");
    expect(revalidatePath).toHaveBeenCalledWith("/blog");
    expect(revalidatePath).toHaveBeenCalledWith(`/blog/${validPost.slug}`);
  });

  test("status published sets publishedAt; author and tags default", async () => {
    const { title, slug, date, description, keyword, body } = validPost;
    const minimal = { title, slug, date, description, keyword, body, status: "published" };
    const res = await createBlogPost(req("POST", minimal));
    expect(res.status).toBe(201);
    const row = rows.get(validPost.slug)!;
    expect(row.status).toBe("PUBLISHED");
    expect(row.publishedAt).toBeInstanceOf(Date);
    expect(row.author).toBe("Prathyarthi Kashyap, Founder");
    expect(row.tags).toEqual([]);
    expect(row.cover).toBeNull();
  });

  test("409 when the slug exists in the database", async () => {
    rows.set(validPost.slug, record({ slug: validPost.slug }));
    const res = await createBlogPost(req("POST", validPost));
    expect(res.status).toBe(409);
  });

  test("409 when the slug belongs to a markdown file post", async () => {
    const fileSlug = getAllPosts()[0]?.slug ?? "sample-post";
    const res = await createBlogPost(req("POST", { ...validPost, slug: fileSlug }));
    expect(res.status).toBe(409);
    expect(blogPost.create).not.toHaveBeenCalled();
  });

  test("409 on a unique-constraint race", async () => {
    blogPost.create.mockImplementationOnce(async () => {
      throw Object.assign(new Error("Unique constraint"), { code: "P2002" });
    });
    const res = await createBlogPost(req("POST", validPost));
    expect(res.status).toBe(409);
  });

  test("400 on invalid JSON", async () => {
    const res = await createBlogPost(req("POST", undefined, KEY, "{not json"));
    expect(res.status).toBe(400);
  });

  test.each([
    ["missing title", { ...validPost, title: undefined }, "title"],
    ["bad slug", { ...validPost, slug: "Bad Slug" }, "slug"],
    ["bad date format", { ...validPost, date: "16/11/2026" }, "date"],
    ["impossible date", { ...validPost, date: "2026-02-30" }, "date"],
    ["http cover", { ...validPost, cover: "http://cdn.example.com/c.png" }, "cover"],
    ["relative cover", { ...validPost, cover: "/blog/c.png" }, "cover"],
    ["bad status", { ...validPost, status: "live" }, "status"],
    ["tags not an array", { ...validPost, tags: "portfolio" }, "tags"],
    ["empty body", { ...validPost, body: "   " }, "body"],
    ["em dash in body", { ...validPost, body: "A \u2014 B" }, "body"],
    ["unknown field", { ...validPost, extra: 1 }, "(root)"],
  ])("400 for %s", async (_name, payload, path) => {
    const res = await createBlogPost(req("POST", payload));
    expect(res.status).toBe(400);
    const json = (await res.json()) as { issues: { path: string }[] };
    expect(json.issues.map((issue) => issue.path)).toContain(path);
    expect(blogPost.create).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/blog/[slug]", () => {
  test("flips a draft to published and sets publishedAt once", async () => {
    rows.set("db-post", record({ status: "DRAFT", publishedAt: null }));
    const res = await updateBlogPost(req("PATCH", { status: "published" }), "db-post");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      slug: "db-post",
      status: "published",
      url: "https://livefolio.me/blog/db-post",
    });
    const first = rows.get("db-post")!.publishedAt;
    expect(first).toBeInstanceOf(Date);

    await updateBlogPost(req("PATCH", { status: "draft" }), "db-post");
    expect(rows.get("db-post")!.status).toBe("DRAFT");
    await updateBlogPost(req("PATCH", { status: "published" }), "db-post");
    expect(rows.get("db-post")!.publishedAt).toEqual(first);
    expect(revalidatePath).toHaveBeenCalledWith("/blog/db-post");
  });

  test("partial update changes only the given fields", async () => {
    rows.set("db-post", record());
    const res = await updateBlogPost(
      req("PATCH", { title: "New title", date: "2026-11-20", cover: null }),
      "db-post",
    );
    expect(res.status).toBe(200);
    const row = rows.get("db-post")!;
    expect(row.title).toBe("New title");
    expect(row.date.toISOString()).toBe("2026-11-20T00:00:00.000Z");
    expect(row.cover).toBeNull();
    expect(row.body).toBe("Hello world");
  });

  test("404 for an unknown slug, 400 for empty or invalid updates", async () => {
    expect((await updateBlogPost(req("PATCH", { title: "x" }), "missing")).status).toBe(404);
    rows.set("db-post", record());
    expect((await updateBlogPost(req("PATCH", {}), "db-post")).status).toBe(400);
    expect((await updateBlogPost(req("PATCH", { slug: "renamed" }), "db-post")).status).toBe(400);
    expect((await updateBlogPost(req("PATCH", { status: "archived" }), "db-post")).status).toBe(400);
    expect(blogPost.update).not.toHaveBeenCalled();
  });
});

describe("GET /api/blog/[slug]", () => {
  test("returns drafts with all fields", async () => {
    rows.set("db-post", record({ status: "DRAFT", publishedAt: null }));
    const res = await getBlogPostForApi(req("GET"), "db-post");
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.status).toBe("draft");
    expect(json.date).toBe("2026-11-16");
    expect(json.body).toBe("Hello world");
    expect(json.url).toBe("https://livefolio.me/blog/db-post");
  });

  test("404 when missing", async () => {
    expect((await getBlogPostForApi(req("GET"), "missing")).status).toBe(404);
  });
});

describe("public blog merge", () => {
  const filePost: BlogPost = {
    ...recordToPost(record({ slug: "file-post", title: "File" })),
    date: "2026-11-15",
    cover: "/blog/placeholder-cover.png",
  };

  test("mergePosts keeps file posts, adds published DB posts and drops drafts", () => {
    const merged = mergePosts(
      [filePost],
      [
        record({ slug: "published-one", date: new Date("2026-11-18T00:00:00Z") }),
        record({ slug: "draft-one", status: "DRAFT", publishedAt: null }),
        record({ slug: "file-post", title: "Shadow" }),
      ],
    );
    expect(merged.map((post) => post.slug)).toEqual(["published-one", "file-post"]);
    expect(merged.find((post) => post.slug === "file-post")?.title).toBe("File");
  });

  test("recordToPost renders like a file post", () => {
    const post = recordToPost(record());
    expect(post.date).toBe("2026-11-16");
    expect(post.authorName).toBe("Jane Doe");
    expect(post.authorRole).toBe("Writer");
    expect(post.cover).toBe("/og/default.png");
    expect(post.content).toBe("Hello world");
    expect(post.updated).toBeUndefined();
    const edited = recordToPost(record({ updatedAt: new Date("2026-11-20T09:00:00Z") }));
    expect(edited.updated).toBe("2026-11-20");
  });

  test("getBlogPosts includes published DB posts but never drafts", async () => {
    rows.set("live", record({ slug: "live" }));
    rows.set("hidden", record({ slug: "hidden", status: "DRAFT", publishedAt: null }));
    const slugs = (await getBlogPosts()).map((post) => post.slug);
    expect(slugs).toContain("live");
    expect(slugs).not.toContain("hidden");
    for (const post of getAllPosts()) expect(slugs).toContain(post.slug);
  });

  test("getBlogPost returns undefined (404) for drafts and unknown slugs", async () => {
    rows.set("live", record({ slug: "live" }));
    rows.set("hidden", record({ slug: "hidden", status: "DRAFT", publishedAt: null }));
    expect((await getBlogPost("live"))?.title).toBe("DB post");
    expect(await getBlogPost("hidden")).toBeUndefined();
    expect(await getBlogPost("nope")).toBeUndefined();
  });

  test("falls back to file posts when the database is unreachable", async () => {
    dbDown = true;
    const originalError = console.error;
    console.error = () => {};
    try {
      expect((await getBlogPosts()).map((p) => p.slug)).toEqual(getAllPosts().map((p) => p.slug));
      expect(await getBlogPost("live")).toBeUndefined();
    } finally {
      console.error = originalError;
    }
  });
});

describe("DB post SEO", () => {
  test("external cover and FAQ flow into metadata and JSON-LD", () => {
    const post = recordToPost(
      record({ cover: "https://cdn.example.com/c.png", body: validPost.body }),
    );
    const meta = getPostMetadata(post);
    expect(meta.alternates?.canonical).toBe("https://livefolio.me/blog/db-post");
    expect(JSON.stringify(meta.openGraph)).toContain("https://cdn.example.com/c.png");
    expect(getArticleSchema(post).image).toEqual(["https://cdn.example.com/c.png"]);
    expect(extractFaq(post.content)).toEqual([
      { question: "Is it free?", answer: "Yes, there is a free plan." },
    ]);
  });
});
