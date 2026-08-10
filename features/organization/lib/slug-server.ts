import { prisma } from "@/lib/prisma";
import { isValidOrgSlug, sanitizeHiringSlug } from "@/features/jobs/lib/slug";

export async function uniqueOrgSlug(base: string): Promise<string> {
  const sanitized = sanitizeHiringSlug(base);
  let candidate = isValidOrgSlug(sanitized)
    ? sanitized
    : `org-${sanitized || "company"}`;
  if (!isValidOrgSlug(candidate)) {
    candidate = `org-${Date.now().toString(36)}`;
  }

  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? candidate : `${candidate.slice(0, 50)}-${i + 1}`;
    const existing = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
  }

  return `${candidate.slice(0, 40)}-${Date.now().toString(36)}`;
}
