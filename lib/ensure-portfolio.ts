import { prisma } from "@/lib/prisma";
import {
  normalizeOptionalEmail,
  normalizeOptionalStoredUrl,
} from "@/lib/content-policy";
import { getTemplateDefaultAccent } from "@/features/templates/template-accent-palettes";
import { attachLatestResumeToPortfolio } from "@/features/uploads/server/stored-files";

type EnsurePortfolioUser = {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
};

export async function ensureUserPortfolio(
  userId: string,
  user?: EnsurePortfolioUser | null,
) {
  const existing = await prisma.portfolio.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  const dbUser =
    user ??
    (await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, avatar: true },
    }));
  let avatarUrl: string | null = null;
  let contactEmail: string | null = null;
  try {
    avatarUrl = normalizeOptionalStoredUrl(dbUser?.avatar, "User avatar URL");
  } catch {
    // An invalid provider image must not become stored portfolio content.
  }
  try {
    contactEmail = normalizeOptionalEmail(dbUser?.email, "Contact email");
  } catch {
    // An invalid provider email must not become stored portfolio content.
  }

  const defaultTemplateId = "pulse";

  const created = await prisma.portfolio.create({
    data: {
      userId,
      slug: null,
      title: dbUser?.name ?? "",
      contactEmail,
      templateId: defaultTemplateId,
      customization: {
        primaryColor: getTemplateDefaultAccent(defaultTemplateId),
      },
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  });

  try {
    await attachLatestResumeToPortfolio(userId, created.id);
  } catch (error) {
    console.error("[ensureUserPortfolio] Failed to attach resume", error);
  }

  return prisma.portfolio.findUniqueOrThrow({ where: { id: created.id } });
}
