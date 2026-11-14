import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { DocsBreadcrumbs } from "@/features/docs/components/docs-breadcrumbs";
import {
  getDocCategories,
  getDocCategory,
  getDocHref,
} from "@/features/docs/lib/docs";
import { createPageMetadata } from "@/lib/seo";

type Params = { category: string };

export function generateStaticParams(): Params[] {
  return getDocCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getDocCategory(slug);
  if (!category) return {};
  return createPageMetadata({
    title: `${category.title} | Docs`,
    description: category.description,
    path: getDocHref(category.slug),
  });
}

export default async function DocsCategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category: slug } = await params;
  const category = getDocCategory(slug);
  if (!category) notFound();

  const Icon = category.icon;

  return (
    <div className="mx-auto max-w-3xl">
      <DocsBreadcrumbs items={[{ label: category.title }]} />
      <header className="mb-8 flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-sunken">
          <Icon className="size-5 text-brand-primary" aria-hidden />
        </span>
        <div>
          <h1 className="text-h2 text-text-primary">{category.title}</h1>
          <p className="mt-1 text-body text-text-secondary">
            {category.description}
          </p>
        </div>
      </header>
      <ItemGroup className="gap-3">
        {category.articles.map((article) => (
          <Item key={article.slug} variant="outline" asChild>
            <Link
              href={getDocHref(category.slug, article.slug)}
              className="hover:bg-surface-sunken/60"
            >
              <ItemContent>
                <ItemTitle>{article.title}</ItemTitle>
                <ItemDescription>{article.description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <ArrowRight className="size-4 text-text-muted" aria-hidden />
              </ItemActions>
            </Link>
          </Item>
        ))}
      </ItemGroup>
    </div>
  );
}
