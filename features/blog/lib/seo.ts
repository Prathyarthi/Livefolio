import type { Metadata } from "next";
import { absoluteUrl, OG_IMAGE } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import type { FaqItem } from "@/features/blog/lib/markdown";
import type { BlogPost } from "@/features/blog/types";

export const BLOG_PATH = "/blog";
export const BLOG_RSS_PATH = "/blog/rss.xml";
export const BLOG_TITLE = `${siteConfig.name} Blog`;
export const BLOG_DESCRIPTION =
  "Guides and ideas on portfolios, resumes and standing out when you apply for work, from the team behind Livefolio.";

export function postPath(slug: string): string {
  return `${BLOG_PATH}/${slug}`;
}

/** Canonical URL for a post, built on the site's single base URL (getSiteUrl). */
export function postUrl(slug: string): string {
  return absoluteUrl(postPath(slug));
}

/** True for absolute http(s) covers (API posts); false for /public paths. */
export function isExternalCover(cover: string): boolean {
  return /^https?:\/\//i.test(cover);
}

/** Absolute URL for a post cover, whether it is a /public path or already absolute. */
export function coverUrl(cover: string): string {
  return isExternalCover(cover) ? cover : absoluteUrl(cover);
}

const ROBOTS = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
} as const;

const RSS_ALTERNATE = {
  types: { "application/rss+xml": absoluteUrl(BLOG_RSS_PATH) },
};

export function getBlogIndexMetadata(): Metadata {
  const url = absoluteUrl(BLOG_PATH);
  return {
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    alternates: { canonical: url, ...RSS_ALTERNATE },
    robots: ROBOTS,
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: siteConfig.name,
      title: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
      images: [OG_IMAGE.url],
    },
  };
}

export function getPostMetadata(post: BlogPost): Metadata {
  const url = postUrl(post.slug);
  const image = coverUrl(post.cover);
  return {
    title: post.title,
    description: post.description,
    keywords: [post.keyword, ...post.tags],
    authors: [{ name: post.authorName }],
    alternates: { canonical: url, ...RSS_ALTERNATE },
    robots: ROBOTS,
    openGraph: {
      type: "article",
      locale: "en_US",
      url,
      siteName: siteConfig.name,
      title: post.title,
      description: post.description,
      publishedTime: `${post.date}T00:00:00Z`,
      modifiedTime: `${post.updated ?? post.date}T00:00:00Z`,
      authors: [post.authorName],
      tags: post.tags,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}

export function getArticleSchema(post: BlogPost) {
  const url = postUrl(post.slug);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: [coverUrl(post.cover)],
    datePublished: `${post.date}T00:00:00Z`,
    dateModified: `${post.updated ?? post.date}T00:00:00Z`,
    keywords: [post.keyword, ...post.tags].join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    author: {
      "@type": "Person",
      name: post.authorName,
      ...(post.authorRole ? { jobTitle: post.authorRole } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.legalEntity,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") },
    },
  };
}

export function getFaqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function getBreadcrumbSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl(BLOG_PATH) },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl(post.slug) },
    ],
  };
}
