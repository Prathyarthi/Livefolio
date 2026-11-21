import { getBlogPostForApi, updateBlogPost } from "@/features/blog/server/handlers";

// Authenticated with `Authorization: Bearer <BLOG_API_KEY>`. See content/blog/README.md.
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  return getBlogPostForApi(request, slug);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  return updateBlogPost(request, slug);
}
