import { DOC_CATEGORIES } from "@/features/docs/content";
import type { DocArticle, DocCategory } from "@/features/docs/types";

export type DocArticleRef = {
  category: DocCategory;
  article: DocArticle;
  href: string;
};

export function getDocHref(categorySlug: string, articleSlug?: string) {
  return articleSlug
    ? `/docs/${categorySlug}/${articleSlug}`
    : `/docs/${categorySlug}`;
}

export function getDocCategories(): DocCategory[] {
  return DOC_CATEGORIES;
}

export function getDocCategory(slug: string): DocCategory | undefined {
  return DOC_CATEGORIES.find((category) => category.slug === slug);
}

/** All articles in sidebar order. */
export function getAllDocArticles(): DocArticleRef[] {
  return DOC_CATEGORIES.flatMap((category) =>
    category.articles.map((article) => ({
      category,
      article,
      href: getDocHref(category.slug, article.slug),
    })),
  );
}

export function getDocArticle(
  categorySlug: string,
  articleSlug: string,
): DocArticleRef | undefined {
  return getAllDocArticles().find(
    (ref) =>
      ref.category.slug === categorySlug && ref.article.slug === articleSlug,
  );
}

export function getAdjacentDocArticles(categorySlug: string, articleSlug: string) {
  const all = getAllDocArticles();
  const index = all.findIndex(
    (ref) =>
      ref.category.slug === categorySlug && ref.article.slug === articleSlug,
  );

  return {
    previous: index > 0 ? all[index - 1] : undefined,
    next: index >= 0 && index < all.length - 1 ? all[index + 1] : undefined,
  };
}
