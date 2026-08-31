import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  APP_ROUTE_PREFIXES,
  extractPortfolioSubdomain,
  getAppOrigin,
  getInternalPortfolioPath,
  getPortfolioRootDomain,
} from "@/lib/domain";
import {
  DEFAULT_JSON_BODY_LIMIT_BYTES,
  MAX_BULK_IMPORT_BODY_BYTES,
  MAX_RESUME_UPLOAD_BODY_BYTES,
} from "@/lib/content-policy";
import { exceedsRequestBodyLimit } from "@/lib/request-body-limit";
import { shouldUseSecureCookies } from "@/lib/auth-cookies";

/** Safe internal path only — blocks open redirects. */
function safeCallbackPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function redirectToPortfolioSubdomain(request: NextRequest, slug: string) {
  const rootDomain = getPortfolioRootDomain();
  const { protocol, port, search } = request.nextUrl;
  const host = port ? `${slug}.${rootDomain}:${port}` : `${slug}.${rootDomain}`;
  const destination = new URL(`${protocol}//${host}/`);
  destination.search = search;
  return NextResponse.redirect(destination);
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = extractPortfolioSubdomain(host);
  const { pathname, search } = request.nextUrl;
  const isResumeUpload =
    pathname === "/api/resume/parse"
    && request.headers.get("content-type")?.toLowerCase().includes(
      "multipart/form-data",
    );
  const isBulkImport = pathname === "/api/portfolio/bulk-import";

  const bodyLimitBytes = isResumeUpload
    ? MAX_RESUME_UPLOAD_BODY_BYTES
    : isBulkImport
      ? MAX_BULK_IMPORT_BODY_BYTES
      : DEFAULT_JSON_BODY_LIMIT_BYTES;

  if (
    pathname.startsWith("/api")
    && await exceedsRequestBodyLimit(request, bodyLimitBytes)
  ) {
    return NextResponse.json(
      { error: "Request body is too large" },
      { status: 413 },
    );
  }

  const legacyPathMatch = pathname.match(/^\/(?:p|sites)\/([a-z0-9-]+)\/?$/);

  if (!subdomain && legacyPathMatch) {
    return redirectToPortfolioSubdomain(request, legacyPathMatch[1]);
  }

  if (!subdomain) {
    // Logged-in users shouldn't loop through sign-in / sign-up.
    if (pathname === "/sign-in" || pathname === "/sign-up") {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: shouldUseSecureCookies(),
      });
      if (token) {
        const callback =
          safeCallbackPath(request.nextUrl.searchParams.get("callbackUrl")) ??
          "/dashboard";
        return NextResponse.redirect(new URL(callback, request.url));
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/p/") || pathname.startsWith("/sites/")) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/";
    return NextResponse.redirect(destination);
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const isAppPage = APP_ROUTE_PREFIXES.some(
    (prefix) => prefix !== "/api" && pathname.startsWith(prefix),
  );

  if (isAppPage) {
    const apex = getAppOrigin();
    return NextResponse.redirect(new URL(`${pathname}${search}`, apex));
  }

  if (pathname === "/" || pathname === "") {
    const url = request.nextUrl.clone();
    url.pathname = getInternalPortfolioPath(subdomain);
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};