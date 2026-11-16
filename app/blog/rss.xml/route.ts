import { getBlogPosts } from "@/features/blog/lib/blog-posts";
import { buildRssFeed } from "@/features/blog/lib/rss";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return new Response(buildRssFeed(await getBlogPosts()), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
