import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "@/features/landing/components/marketing-page-shell";
import { BlogCta } from "@/features/blog/components/blog-cta";
import { JsonLd } from "@/components/json-ld";
import { formatPostDate, getAllPosts, getPostBySlug } from "@/features/blog/lib/posts";
import { extractFaq, renderMarkdown } from "@/features/blog/lib/markdown";
import {
  getArticleSchema,
  getBreadcrumbSchema,
  getFaqSchema,
  getPostMetadata,
} from "@/features/blog/lib/seo";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

// The root layout reads headers() (footer), which makes routes dynamic by default.
// Blog pages are plain content, so force them to be prerendered at build time.
export const dynamic = "force-static";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return post ? getPostMetadata(post) : {};
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.content);
  const faq = extractFaq(post.content);
  const schemas: Record<string, unknown>[] = [
    getArticleSchema(post),
    getBreadcrumbSchema(post),
  ];
  if (faq.length > 0) schemas.push(getFaqSchema(faq));

  return (
    <MarketingPageShell>
      <JsonLd data={schemas} />
      <article className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-body-sm text-text-muted">
          <Link href="/blog" className="transition-colors hover:text-text-primary">
            Blog
          </Link>
        </nav>

        <header>
          {post.tags.length > 0 ? (
            <p className="eyebrow uppercase">{post.tags.join(" · ")}</p>
          ) : null}
          <h1 className="mt-3 text-h1 text-text-primary">{post.title}</h1>
          <p className="mt-4 text-body-lg text-text-secondary">{post.description}</p>
          <p className="mt-4 text-body-sm text-text-muted">
            By {post.authorName}
            {post.authorRole ? `, ${post.authorRole}` : ""}
            <span aria-hidden> · </span>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <span aria-hidden> · </span>
            {post.readingMinutes} min read
          </p>
        </header>

        <div className="relative mt-8 aspect-[1200/630] w-full overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-sunken">
          <Image
            src={post.cover}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="blog-prose mt-10" dangerouslySetInnerHTML={{ __html: html }} />

        <BlogCta />
      </article>
    </MarketingPageShell>
  );
}
