import { getAllPosts } from "@/features/blog/lib/posts";
import { buildRssFeed } from "@/features/blog/lib/rss";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getAllPosts();
  return new Response(buildRssFeed(posts), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
