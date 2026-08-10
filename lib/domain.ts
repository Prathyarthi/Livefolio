const DEFAULT_ROOT_DOMAIN = "livefolio.me";

/** Subdomains reserved for the platform — not assignable to portfolios. */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "mail",
  "ftp",
  "staging",
  "dev",
  "test",
  "status",
  "blog",
  "docs",
  "support",
  "help",
  "cdn",
  "static",
  "assets",
  "auth",
  "billing",
  "pricing",
  "jobs",
  "company",
  "hiring",
  "careers",
  "organizations",
]);

export function getPortfolioRootDomain(): string {
  const fromEnv = process.env.NEXT_PUBLIC_PORTFOLIO_ROOT_DOMAIN?.trim();
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV === "development") return "localhost";
  return DEFAULT_ROOT_DOMAIN;
}

export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const rootDomain = getPortfolioRootDomain();
  const protocol =
    process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${rootDomain}`;
}

export function sanitizePortfolioSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function isReservedSubdomain(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug.toLowerCase());
}

export function isValidPortfolioSlug(slug: string): boolean {
  if (!slug || slug.length < 2) return false;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) return false;
  return !isReservedSubdomain(slug);
}

/** Strip port from host header (e.g. localhost:3000 → localhost). */
export function normalizeHost(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

/**
 * Returns the portfolio slug when the request host is `{slug}.{rootDomain}`.
 * Returns null for apex, www, reserved subdomains, and localhost (unless root domain is localhost).
 */
export function extractPortfolioSubdomain(host: string): string | null {
  const hostname = normalizeHost(host);
  const rootDomain = getPortfolioRootDomain().toLowerCase();

  if (!hostname || hostname === rootDomain) return null;
  if (hostname === `www.${rootDomain}`) return null;

  const suffix = `.${rootDomain}`;
  if (!hostname.endsWith(suffix)) return null;

  const subdomain = hostname.slice(0, -suffix.length);
  if (!subdomain || subdomain.includes(".")) return null;
  if (isReservedSubdomain(subdomain)) return null;
  if (!isValidPortfolioSlug(subdomain)) return null;

  return subdomain;
}

export function getPortfolioSubdomainHost(slug: string): string {
  return `${slug}.${getPortfolioRootDomain()}`;
}

function getPortfolioPublicPort(): string {
  if (typeof window !== "undefined" && window.location.port) {
    return window.location.port;
  }

  try {
    const origin = getAppOrigin();
    const url = new URL(origin);
    return url.port;
  } catch {
    return "";
  }
}

/** Public portfolio URL — always `{slug}.{rootDomain}`. */
export function getPortfolioPublicUrl(slug: string): string {
  const rootDomain = getPortfolioRootDomain();
  const protocol =
    process.env.NODE_ENV === "development" ? "http" : "https";
  const port = getPortfolioPublicPort();
  const host = port
    ? `${slug}.${rootDomain}:${port}`
    : `${slug}.${rootDomain}`;

  return `${protocol}://${host}`;
}

/** Internal App Router path for portfolio pages (subdomain rewrite target). */
export const INTERNAL_PORTFOLIO_PATH_PREFIX = "/sites";

export function getInternalPortfolioPath(slug: string): string {
  return `${INTERNAL_PORTFOLIO_PATH_PREFIX}/${slug}`;
}

/** True when the request is for a published portfolio (subdomain or /sites rewrite). */
export function isPortfolioRequest(pathname: string, host: string): boolean {
  if (extractPortfolioSubdomain(host)) return true;
  return (
    pathname === INTERNAL_PORTFOLIO_PATH_PREFIX ||
    pathname.startsWith(`${INTERNAL_PORTFOLIO_PATH_PREFIX}/`)
  );
}

export function shouldShowMarketingFooter(
  pathname: string,
  host: string,
): boolean {
  return !isPortfolioRequest(pathname, host);
}

/** App routes that should not be served from portfolio subdomains. */
export const APP_ROUTE_PREFIXES = [
  "/api",
  "/dashboard",
  "/sign-in",
  "/sign-up",
  "/pricing",
  "/_next",
] as const;
