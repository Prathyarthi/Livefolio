import { prisma } from "@/lib/prisma";
import { getTemplate } from "@/features/templates/registry";
import { portfolioToTemplateData } from "@/features/templates/transform";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { canUseTemplate, resolveAccessForUser } from "@/lib/entitlements";
import { PortfolioViewTracker } from "@/features/analytics/components/portfolio-view-tracker";
import { PortfolioClickTracker } from "@/features/analytics/components/portfolio-click-tracker";
import { getPortfolioPublicUrl } from "@/lib/domain";
import { siteConfig } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await prisma.portfolio.findUnique({
    where: { slug, isPublished: true },
  });

  if (!portfolio) return {};

  const title = portfolio.metaTitle || portfolio.title || "Portfolio";
  const description =
    portfolio.metaDescription ||
    portfolio.headline ||
    portfolio.summary ||
    `Professional portfolio published on ${siteConfig.name}.`;

  const canonicalUrl = getPortfolioPublicUrl(slug);
  const ogImages = portfolio.avatarUrl
    ? [{ url: portfolio.avatarUrl, alt: title }]
    : [{ url: "/logo.svg", alt: `${siteConfig.name} portfolio` }];

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "profile",
      url: canonicalUrl,
      title,
      description,
      siteName: siteConfig.name,
      images: ogImages,
    },
    twitter: {
      card: portfolio.avatarUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImages.map((image) => image.url),
    },
    robots: { index: true, follow: true },
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { slug } = await params;

  const portfolio = await prisma.portfolio.findUnique({
    where: { slug, isPublished: true },
    include: {
      user: true,
      experiences: { orderBy: { sortOrder: "asc" } },
      educations: { orderBy: { sortOrder: "asc" } },
      skills: { orderBy: { sortOrder: "asc" } },
      projects: { orderBy: { sortOrder: "asc" } },
      articles: { orderBy: { sortOrder: "asc" } },
      socialProfiles: true,
      certifications: { orderBy: { sortOrder: "asc" } },
      achievements: { orderBy: { sortOrder: "asc" } },
      customSections: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!portfolio) notFound();

  const access = resolveAccessForUser(portfolio.user);
  const templateId = canUseTemplate(access, portfolio.templateId)
    ? portfolio.templateId
    : "minimal";
  const template = getTemplate(templateId);
  const TemplateComponent = template.component;
  const data = portfolioToTemplateData(portfolio);

  return (
    <>
      <PortfolioViewTracker slug={slug} />
      <PortfolioClickTracker slug={slug} />
      <TemplateComponent data={data} />
    </>
  );
}
