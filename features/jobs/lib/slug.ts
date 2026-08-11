const RESERVED_ORG_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "jobs",
  "company",
  "hiring",
  "careers",
  "new",
  "create",
  "settings",
  "organizations",
  "recruiters",
  "billing",
]);

export function sanitizeHiringSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function isValidOrgSlug(slug: string): boolean {
  if (!slug || slug.length < 2) return false;
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug)) return false;
  return !RESERVED_ORG_SLUGS.has(slug);
}

/** Public job IDs are opaque unique tokens, not role titles. */
export function isValidJobPublicId(slug: string): boolean {
  return /^[a-z0-9]{10,32}$/.test(slug);
}

/** Generate a compact unique public job id (not derived from the title). */
export function generateJobPublicId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
