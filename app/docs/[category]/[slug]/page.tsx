import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocBlocks } from "@/features/docs/components/doc-blocks";
import { DocsBreadcrumbs } from "@/features/docs/components/docs-breadcrumbs";
import { DocsPager } from "@/features/docs/components/docs-pager";
import {
  getAdjacentDocArticles,
  getAllDocArticles,
  getDocArticle,
  getDocHref,
} from "@/features/docs/lib/docs";
import { JsonLd } from "@/components/json-ld";
import { getDocMetaDescription } from "@/features/docs/lib/docs-seo";
import { createPageMetadata } from "@/lib/seo";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { siteConfig } from "@/lib/site";

type Params = { category: string; slug: string };

export function generateStaticParams(): Params[] {
  return getAllDocArticles().map(({ category, article }) => ({
    category: category.slug,
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const ref = getDocArticle(category, slug);
  if (!ref) return {};
  return createPageMetadata({
    title: `${ref.article.title} | Docs`,
    description: getDocMetaDescription(ref.href, ref.article.description),
    path: ref.href,
    openGraphType: "article",
  });
}

export default async function DocsArticlePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category: categorySlug, slug } = await params;
  const ref = getDocArticle(categorySlug, slug);
  if (!ref) notFound();

  const { category, article } = ref;
  const { previous, next } = getAdjacentDocArticles(categorySlug, slug);

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Docs", path: "/docs" },
          { name: category.title, path: getDocHref(category.slug) },
          { name: article.title, path: ref.href },
        ])}
      />
      <DocsBreadcrumbs
        items={[
          { label: category.title, href: getDocHref(category.slug) },
          { label: article.title },
        ]}
      />
      <header className="mb-6 border-b border-border-default pb-6">
        <h1 className="text-h2 text-text-primary">{article.title}</h1>
        <p className="mt-2 text-body-lg text-text-secondary">
          {article.description}
        </p>
        {article.appPath ? (
          <Button variant="outline" size="sm" className="mt-4" asChild>
            <Link href={article.appPath}>
              Open in {siteConfig.name}
              <ExternalLink className="ml-1.5 size-3.5" aria-hidden />
            </Link>
          </Button>
        ) : null}
      </header>

      <DocBlocks blocks={article.blocks} />

      <DocsPager previous={previous} next={next} />
    </article>
  );
}
