import type { Metadata } from "next";
import { MarketingPageShell } from "@/features/landing/components/marketing-page-shell";
import { BlogCard } from "@/features/blog/components/blog-card";
import { JsonLd } from "@/components/json-ld";
import { getAllPosts } from "@/features/blog/lib/posts";
import {
  BLOG_DESCRIPTION,
  BLOG_PATH,
  BLOG_TITLE,
  getBlogIndexMetadata,
  postUrl,
} from "@/features/blog/lib/seo";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = getBlogIndexMetadata();

// Admin CMS can publish at any time; keep the index fresh.
export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    url: absoluteUrl(BLOG_PATH),
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: postUrl(post.slug),
      datePublished: `${post.date}T00:00:00Z`,
    })),
  };

  return (
    <MarketingPageShell>
      <JsonLd data={schema} />
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <p className="eyebrow uppercase">Blog</p>
          <h1 className="mt-3 text-h1 text-text-primary">Livefolio Blog</h1>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            {BLOG_DESCRIPTION}
          </p>
        </header>

        {posts.length === 0 ? (
          <p className="text-center text-body text-text-secondary">
            No articles yet. Check back soon.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post, index) => (
              <BlogCard key={post.slug} post={post} priority={index < 2} />
            ))}
          </div>
        )}
      </div>
    </MarketingPageShell>
  );
}
