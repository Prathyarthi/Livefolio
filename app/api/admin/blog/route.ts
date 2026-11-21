import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import {
  createAdminBlogPost,
  listAdminBlogPosts,
} from "@/features/blog/lib/admin-store";
import { revalidatePath } from "next/cache";

const postSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  date: z.string().trim().min(1).max(32),
  description: z.string().trim().min(1).max(500),
  keyword: z.string().trim().min(1).max(120),
  cover: z.string().trim().max(2000).nullable().optional(),
  author: z.string().trim().max(160).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  content: z.string().trim().min(1).max(200_000),
  draft: z.boolean().optional(),
});

function revalidateBlog(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/blog/rss.xml");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const posts = await listAdminBlogPosts();
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
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
    const post = await createAdminBlogPost(parsed.data);
    revalidateBlog(post.slug);
    return NextResponse.json({ post }, { status: 201 });
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
    const message = error instanceof Error ? error.message : "Could not create post";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
