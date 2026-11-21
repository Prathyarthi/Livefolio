import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import {
  deleteAdminBlogPost,
  getAdminBlogPostById,
  updateAdminBlogPost,
} from "@/features/blog/lib/admin-store";

const postSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  date: z.string().trim().min(1).max(32),
  updated: z.string().trim().max(32).nullable().optional(),
  description: z.string().trim().min(1).max(500),
  keyword: z.string().trim().min(1).max(120),
  cover: z.string().trim().min(1).max(300),
  author: z.string().trim().max(160).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  content: z.string().trim().min(1).max(200_000),
  draft: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

function revalidateBlog(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/blog/rss.xml");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function GET(_req: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  const post = await getAdminBlogPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}

export async function PUT(req: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  const existing = await getAdminBlogPostById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const post = await updateAdminBlogPost(id, parsed.data);
    revalidateBlog(existing.slug);
    if (post.slug !== existing.slug) revalidateBlog(post.slug);
    return NextResponse.json({ post });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 },
      );
    }
    const message = error instanceof Error ? error.message : "Could not update post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { id } = await context.params;
  const existing = await getAdminBlogPostById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteAdminBlogPost(id);
  revalidateBlog(existing.slug);
  return NextResponse.json({ ok: true });
}
