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
  "portfolio builder",
  "professional portfolio",
  "personal portfolio",
  "resume to portfolio",
  "portfolio website",
  "publish portfolio",
  "portfolio templates",
  "personal website builder",
] as const;

/** 1200x630 PNG in /public/og (SVG logos do not unfurl reliably on social apps). */
const OG_IMAGE = {
  url: "/og/default.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `${siteConfig.name}: resume to live portfolio, hire on proof`,
};

const HOME_TITLE = `${siteConfig.name}: Turn Your Resume Into a Live Portfolio`;

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
  openGraphType?: "website" | "article";
  /** Use `title` as-is instead of appending the "| Livefolio" template. */
  absoluteTitle?: boolean;
};

export function createPageMetadata({
  title,
  description,
  path = "/",
  keywords = [...SEO_KEYWORDS],
  noIndex = false,
  openGraphType = "website",
  absoluteTitle = false,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const socialTitle = absoluteTitle ? title : `${title} | ${siteConfig.name}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
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
      title: socialTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: siteConfig.name,
  title: {
    default: HOME_TITLE,
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
    title: HOME_TITLE,
    description: siteConfig.description,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: siteConfig.description,
    images: [OG_IMAGE.url],
  },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

/** Public marketing routes included in sitemap.xml */
/** Indexable routes only: /sign-in and /sign-up are noindex, so they stay out. */
export const PUBLIC_SITEMAP_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/recruiters", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/pricing", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/docs", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  { path: "/refund-policy", changeFrequency: "yearly" as const, priority: 0.3 },
];
