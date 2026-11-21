import type { MetadataRoute } from "next";
import {
  getAllDocArticles,
  getDocCategories,
  getDocHref,
} from "@/features/docs/lib/docs";
import { getBlogPosts } from "@/features/blog/lib/blog-posts";
import { postUrl } from "@/features/blog/lib/seo";
import { PUBLIC_SITEMAP_ROUTES, absoluteUrl } from "@/lib/seo";

/**
 * Last real content change per page (YYYY-MM-DD). Never use the request time:
 * a lastmod that changes on every fetch teaches crawlers to ignore it.
 * Bump a value when that page's content meaningfully changes.
 * Policy pages match the "Last updated" date printed on the page.
 */
const LAST_MODIFIED: Record<string, string> = {
  "/": "2026-11-15",
  "/recruiters": "2026-11-15",
  "/pricing": "2026-10-12",
  "/contact": "2026-07-18",
  "/docs": "2026-11-15",
  "/blog": "2026-11-15",
  "/privacy": "2026-11-02",
  "/terms": "2026-11-02",
  "/refund-policy": "2026-07-18",
};
const DEFAULT_LAST_MODIFIED = "2026-11-15";
/** Docs have no per-article timestamps; last commit to features/docs/content. */
const DOCS_LAST_MODIFIED = "2026-11-15";

// Blog posts can be published through /api/blog without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = PUBLIC_SITEMAP_ROUTES.map(
    ({ path, changeFrequency, priority }) => ({
      url: absoluteUrl(path),
      lastModified: LAST_MODIFIED[path] ?? DEFAULT_LAST_MODIFIED,
      changeFrequency,
      priority,
    }),
  );

  const listed = new Set(PUBLIC_SITEMAP_ROUTES.map(({ path }) => path));
  const docPaths = [
    ...getDocCategories().map((category) => getDocHref(category.slug)),
    ...getAllDocArticles().map(({ href }) => href),
  ].filter((path) => !listed.has(path));

  const docs: MetadataRoute.Sitemap = docPaths.map((path) => ({
    url: absoluteUrl(path),
    lastModified: DOCS_LAST_MODIFIED,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const posts: MetadataRoute.Sitemap = (await getBlogPosts()).map((post) => ({
    url: postUrl(post.slug),
    lastModified: new Date(`${post.updated ?? post.date}T00:00:00Z`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...pages, ...docs, ...posts];
}
