/** Safe internal path only — blocks open redirects. */
export function safeCallbackPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function isHiringCallback(path: string | null | undefined): boolean {
  return path === "/company" || Boolean(path?.startsWith("/company/"));
}

export const HIRING_FROM = "hiring";

export function withHiringFrom(href: string): string {
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}from=${HIRING_FROM}`;
}

export function marketingVariantFrom(
  from?: string,
): "candidate" | "recruiter" {
  return from === HIRING_FROM ? "recruiter" : "candidate";
}
