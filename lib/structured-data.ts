import { FAQ_ITEMS } from "@/lib/faq-content";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const organizationId = () => `${getSiteUrl()}/#organization`;

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(),
    name: siteConfig.name,
    legalName: siteConfig.legalEntity,
    url: getSiteUrl(),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/brand/logo-512.png"),
      width: 512,
      height: 512,
    },
    email: siteConfig.supportEmail,
    description:
      "Livefolio turns a resume PDF into a live portfolio on its own subdomain, built on proof of work such as live projects, published writing, work samples and named references, for any role. Hiring teams use Livefolio to rank applicants on that proof.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: siteConfig.supportEmail,
        url: absoluteUrl("/contact"),
        availableLanguage: ["English"],
      },
    ],
    sameAs: [
      "https://www.linkedin.com/company/livefolio/",
      "https://x.com/livefolio_me",
    ],
  };
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${getSiteUrl()}/#website`,
    name: siteConfig.name,
    url: getSiteUrl(),
    description: siteConfig.description,
    inLanguage: "en",
    publisher: { "@id": organizationId() },
  };
}

export function getSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${getSiteUrl()}/#software`,
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: getSiteUrl(),
    description: siteConfig.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier with Minimal template; Pro unlocks all templates and imports.",
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

/**
 * Hiring product on /recruiters. Only the Free offer is described: recruiter
 * paid prices are changing, so no Pro or Business amount belongs in schema.
 */
export function getRecruiterSoftwareApplicationSchema() {
  const recruitersUrl = absoluteUrl("/recruiters");
  const pricingUrl = absoluteUrl("/recruiters#pricing");

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${recruitersUrl}#software`,
    name: "Livefolio for recruiters",
    url: recruitersUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Rank applicants for any role on proof and named references, not resume keywords. Post a role free and get a ranked shortlist with up to four plain reasons per score.",
    featureList: [
      "Proof-based ranking with a 0 to 100 score and up to four plain reasons",
      "Optional references in the ranking (up to 12 points, switched on by the recruiter)",
      "Compare applicants side by side",
      "Pool gap report",
      "Pipeline and shortlist",
      "Talent search across people who opted in (Pro and above)",
      "Frozen snapshots and job-scoped applicant pools",
    ],
    publisher: { "@id": organizationId() },
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        url: pricingUrl,
        price: "0",
        priceCurrency: "INR",
        description: "1 seat, 1 open job and 1 workspace, with proof-based ranking and references.",
      },
    ],
  };
}

export type BreadcrumbEntry = { name: string; path: string };

/** BreadcrumbList; "Home" is added as the first item. */
export function getBreadcrumbSchema(items: BreadcrumbEntry[]) {
  const trail: BreadcrumbEntry[] = [{ name: "Home", path: "/" }, ...items];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
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
