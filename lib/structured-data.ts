import { FAQ_ITEMS } from "@/lib/faq-content";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    legalName: siteConfig.legalEntity,
    url: getSiteUrl(),
    logo: absoluteUrl("/logo.svg"),
    email: siteConfig.supportEmail,
    description: siteConfig.description,
  };
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: getSiteUrl(),
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.legalEntity,
    },
  };
}

export function getSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: getSiteUrl(),
    description: siteConfig.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier with free templates and publishing; Pro unlocks all templates and imports.",
    },
    featureList: [
      "AI resume PDF import",
      "GitHub repository import",
      "Medium article import",
      "LeetCode stats import",
      "Multiple portfolio templates",
      "Custom subdomain publishing",
      "Live portfolio preview",
    ],
  };
}

export function getFaqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function getLandingPageStructuredData() {
  return [
    getOrganizationSchema(),
    getWebSiteSchema(),
    getSoftwareApplicationSchema(),
    getFaqPageSchema(),
  ];
}
