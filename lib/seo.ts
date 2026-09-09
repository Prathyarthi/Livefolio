import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

const DEFAULT_SITE_URL = "https://livefolio.me";

/** Canonical marketing site origin (server-safe). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return DEFAULT_SITE_URL;
}

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export const SEO_KEYWORDS = [
  "portfolio builder",
  "developer portfolio",
  "online portfolio",
  "resume to portfolio",
  "portfolio website",
  "publish portfolio",
  "GitHub portfolio",
  "LeetCode portfolio",
  "Medium portfolio import",
  "portfolio templates",
  "personal website builder",
  "recruiter portfolio",
  "software engineer portfolio",
  "live portfolio link",
  "portfolio subdomain",
  "Livefolio",
] as const;

const DEFAULT_OG_IMAGE = "/logo.svg";

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  openGraphType?: "website" | "article";
};

export function createPageMetadata({
  title,
  description,
  path = "/",
  keywords = [...SEO_KEYWORDS],
  noIndex = false,
  openGraphType = "website",
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: openGraphType,
      locale: "en_US",
      url,
      siteName: siteConfig.name,
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 512,
          height: 512,
          alt: `${siteConfig.name} logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteConfig.name}`,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} — Build & Publish Your Developer Portfolio`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...SEO_KEYWORDS],
  authors: [{ name: siteConfig.legalEntity, url: getSiteUrl() }],
  creator: siteConfig.legalEntity,
  publisher: siteConfig.legalEntity,
  category: "technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: getSiteUrl(),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getSiteUrl(),
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Build & Publish Your Developer Portfolio`,
    description: siteConfig.description,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 512,
        height: 512,
        alt: `${siteConfig.name} — portfolio builder`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Build & Publish Your Developer Portfolio`,
    description: siteConfig.description,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.svg", type: "image/svg+xml" }],
  },
};

/** Public marketing routes included in sitemap.xml */
export const PUBLIC_SITEMAP_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/recruiters", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/pricing", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/refund-policy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/sign-up", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/sign-in", changeFrequency: "monthly" as const, priority: 0.5 },
];
