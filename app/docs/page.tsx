import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { getDocCategories, getDocHref } from "@/features/docs/lib/docs";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Help & Docs",
  description: `Step-by-step guides for building, designing and publishing your ${siteConfig.name} portfolio.`,
  path: "/docs",
});

const POPULAR = [
  ["getting-started", "create-account"],
  ["build-your-portfolio", "import-resume"],
  ["design", "choose-template"],
  ["publish-and-share", "publish-portfolio"],
] as const;

export default function DocsHomePage() {
  const categories = getDocCategories();
  const popular = POPULAR.map(([categorySlug, articleSlug]) => {
    const category = categories.find((c) => c.slug === categorySlug);
    const article = category?.articles.find((a) => a.slug === articleSlug);
    return category && article
      ? { href: getDocHref(categorySlug, articleSlug), title: article.title, description: article.description }
      : null;
  }).filter((item) => item !== null);

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-10">
        <p className="eyebrow uppercase">Help center</p>
        <h1 className="mt-2 text-h1 text-text-primary">
          How can we help?
        </h1>
        <p className="mt-3 max-w-2xl text-body-lg text-text-secondary">
          Simple, step-by-step guides for everything in {siteConfig.name}, from
          signing up to publishing your portfolio.
        </p>
      </header>

      <section aria-labelledby="popular-heading" className="mb-12">
        <h2 id="popular-heading" className="mb-4 text-h4 text-text-primary">
          Popular articles
        </h2>
        <ItemGroup className="grid gap-3 sm:grid-cols-2">
          {popular.map((item) => (
            <Item key={item.href} variant="outline" asChild>
              <Link href={item.href} className="hover:bg-surface-sunken/60">
                <ItemContent>
                  <ItemTitle>{item.title}</ItemTitle>
                  <ItemDescription>{item.description}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <ArrowRight className="size-4 text-text-muted" aria-hidden />
                </ItemActions>
              </Link>
            </Item>
          ))}
        </ItemGroup>
      </section>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-4 text-h4 text-text-primary">
          Browse by topic
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.slug}
                className="flex flex-col rounded-xl border border-border-default bg-surface-raised p-5"
              >
                <Link href={getDocHref(category.slug)} className="group flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken">
                    <Icon className="size-4 text-brand-primary" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-text-primary group-hover:underline">
                      {category.title}
                    </span>
                    <span className="mt-0.5 block text-body-sm text-text-secondary">
                      {category.description}
                    </span>
                  </span>
                </Link>
                <ul className="mt-4 space-y-1.5 border-t border-border-default pt-4 text-sm">
                  {category.articles.slice(0, 4).map((article) => (
                    <li key={article.slug}>
                      <Link
                        href={getDocHref(category.slug, article.slug)}
                        className="text-text-secondary hover:text-text-primary"
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                  {category.articles.length > 4 ? (
                    <li>
                      <Link
                        href={getDocHref(category.slug)}
                        className="font-medium text-brand-primary hover:underline"
                      >
                        View all {category.articles.length} articles
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-12 flex flex-col items-start justify-between gap-4 rounded-xl border border-border-default bg-surface-sunken p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold text-text-primary">Still need help?</h2>
          <p className="text-body-sm text-text-secondary">
            Our team typically responds within one business day.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={`mailto:${siteConfig.supportEmail}`}>
            <Mail className="mr-2 size-4" aria-hidden />
            {siteConfig.supportEmail}
          </a>
        </Button>
      </section>
    </div>
  );
}
