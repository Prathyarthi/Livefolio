import Elysia from "elysia";
import { prisma } from "@/lib/prisma";
import { canUseTemplate, resolveAccessForUser } from "@/lib/entitlements";

export const publicPortfolio = new Elysia({ prefix: "/public" })

  // Get published portfolio by slug
  .get("/portfolio/:slug", async (ctx) => {
    const portfolio = await prisma.portfolio.findUnique({
      where: { slug: ctx.params.slug },
      include: {
        user: true,
        experiences: { orderBy: { sortOrder: "asc" } },
        educations: { orderBy: { sortOrder: "asc" } },
        skills: { orderBy: { sortOrder: "asc" } },
        projects: { orderBy: { sortOrder: "asc" } },
        articles: { orderBy: { sortOrder: "asc" } },
        socialProfiles: true,
        certifications: { orderBy: { sortOrder: "asc" } },
        achievements: { orderBy: { sortOrder: "asc" } },
        customSections: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!portfolio) {
      ctx.set.status = 404;
      return { error: "Portfolio not found" };
    }

    if (!portfolio.isPublished) {
      ctx.set.status = 404;
      return { error: "Portfolio is not published" };
    }

    // Strip sensitive fields
    const { userId, user, resumeUrl: _resumeUrl, ...publicData } = portfolio;
    const access = resolveAccessForUser(user);
    const templateId = canUseTemplate(access, publicData.templateId)
      ? publicData.templateId
      : "minimal";

    return {
      ...publicData,
      templateId,
    };
  })

  // List available templates
  .get("/templates", async () => {
    const templates = await prisma.template.findMany({
      orderBy: { name: "asc" },
    });
    return templates;
  });
