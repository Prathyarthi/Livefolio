import type { MetadataRoute } from "next";
import { PUBLIC_SITEMAP_ROUTES, getSiteUrl } from "@/lib/seo";
import { getAllPosts } from "@/features/blog/lib/posts";
import { postUrl } from "@/features/blog/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const pages: MetadataRoute.Sitemap = PUBLIC_SITEMAP_ROUTES.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${siteUrl}${path === "/" ? "" : path}`,
      lastModified,
      changeFrequency,
      priority,
    }),
  );

  const posts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: postUrl(post.slug),
    lastModified: new Date(`${post.updated ?? post.date}T00:00:00Z`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...pages, ...posts];
}
