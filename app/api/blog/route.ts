import { createBlogPost } from "@/features/blog/server/handlers";

// Authenticated with `Authorization: Bearer <BLOG_API_KEY>`. See content/blog/README.md.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return createBlogPost(request);
}
