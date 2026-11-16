import { prisma } from "@/lib/prisma";
import { getPortfolioRootDomain } from "@/lib/domain";
import { renderOgCard } from "@/lib/og-card";
import { siteConfig } from "@/lib/site";

/** Branded card for a published portfolio. Falls back to a generic card. */
export async function renderPortfolioOgCard(slug: string) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, headline: true, metaTitle: true },
  });

  if (!portfolio) {
    return renderOgCard({
      title: siteConfig.name,
      subtitle: "Resume to live portfolio. Hire on proof.",
    });
  }

  return renderOgCard({
    title: portfolio.metaTitle || portfolio.title || "Portfolio",
    subtitle: portfolio.headline || undefined,
    footer: `${slug}.${getPortfolioRootDomain()}`,
  });
}
