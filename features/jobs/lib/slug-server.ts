import { prisma } from "@/lib/prisma";
import { generateJobPublicId } from "@/features/jobs/lib/slug";

/** Opaque public job id — never derived from the role title. */
export async function createUniqueJobPublicId(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const slug = generateJobPublicId();
    const existing = await prisma.job.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
  }

  return crypto.randomUUID().replace(/-/g, "");
}
