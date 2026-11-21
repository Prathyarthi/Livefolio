import { cache } from "react";
import { mergePosts, recordToPost, type BlogPostRecord } from "@/features/blog/lib/db-posts";
import { getAllPosts, getPostBySlug, SLUG_RE } from "@/features/blog/lib/posts";
import type { BlogPost } from "@/features/blog/types";

/**
 * Public blog reads: markdown files in content/blog plus PUBLISHED posts from
 * the database (written through /admin/blog). The database is optional here: if
 * it is unreachable (local builds, outages) the blog falls back to file posts.
 */

function logDbFailure(action: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[blog] Could not ${action} from the database, showing file posts only: ${message}`);
}

async function loadPublishedRecords(): Promise<BlogPostRecord[]> {
  try {
    // Imported lazily so a missing DATABASE_URL cannot break the file blog.
    const { prisma } = await import("@/lib/prisma");
    return (await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ date: "desc" }, { title: "asc" }],
    })) as BlogPostRecord[];
  } catch (error) {
    logDbFailure("load posts", error);
    return [];
  }
}

async function loadPublishedRecord(slug: string): Promise<BlogPostRecord | null> {
  try {
    const { prisma } = await import("@/lib/prisma");
    return (await prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
    })) as BlogPostRecord | null;
  } catch (error) {
    logDbFailure(`load post "${slug}"`, error);
    return null;
  }
}

/** All public posts (files + published DB posts), newest first. */
export const getBlogPosts = cache(async (): Promise<BlogPost[]> => {
  return mergePosts(getAllPosts(), await loadPublishedRecords());
});

/** One public post by slug. Drafts and unknown slugs return undefined (404). */
export const getBlogPost = cache(async (slug: string): Promise<BlogPost | undefined> => {
  const filePost = getPostBySlug(slug);
  if (filePost) return filePost;
  if (!SLUG_RE.test(slug)) return undefined;
  const record = await loadPublishedRecord(slug);
  return record && record.status === "PUBLISHED" ? recordToPost(record) : undefined;
});
