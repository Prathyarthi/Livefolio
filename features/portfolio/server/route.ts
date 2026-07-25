import Elysia, { t } from "elysia";
import type { Prisma } from "@/db/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ensureUserPortfolio } from "@/lib/ensure-portfolio";
import { validatePortfolioSlug } from "@/lib/slug";
import {
  canUseTemplate,
  getPlanLimitMessage,
  resolveAccessForUser,
} from "@/lib/entitlements";
import { bulkImportPortfolioData } from "./bulk-import";
import {
  getMaxLivePreviews,
  sanitizeLivePreviewProjectIds,
} from "@/lib/live-preview";
import {
  normalizeHidden,
  normalizeOrder,
} from "@/features/templates/section-order";
import {
  ContentValidationError,
  MAX_CUSTOM_SECTION_ITEMS,
  MAX_CUSTOM_SECTIONS,
  MAX_EMAIL_CHARS,
  MAX_LONG_TEXT_CHARS,
  MAX_PHONE_CHARS,
  MAX_SECTION_ROWS,
  MAX_SHORT_LABEL_CHARS,
  MAX_SKILL_FIELD_CHARS,
  MAX_SKILLS,
  MAX_STORED_URL_CHARS,
  MAX_TECH_STACK_ITEM_CHARS,
  MAX_TECH_STACK_ITEMS,
  normalizeLongText,
  normalizeOptionalEmail,
  normalizeOptionalLabel,
  normalizeOptionalPhone,
  normalizeOptionalStoredUrl,
  normalizeRequiredLabel,
  normalizeRequiredStoredUrl,
  normalizeStringList,
  normalizeStoredUrlsInJson,
  validateCustomSectionItems,
} from "@/lib/content-policy";

function toDateOrThrow(value: string) {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);

  if (Number.isNaN(normalized.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return normalized;
}

async function withPortfolioWriteLock<T>(
  portfolioId: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id"
      FROM "portfolios"
      WHERE "id" = ${portfolioId}
      FOR UPDATE
    `;
    return operation(tx);
  });
}

/** Parses dates often returned by resume parsers (not only ISO YYYY-MM-DD). */
function resumeDateOrThrow(value: string) {
  const v = value.trim();
  if (!v) {
    throw new Error("Invalid date: (empty)");
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return toDateOrThrow(v);
  }

  const mdy = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    const iso = `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
    return toDateOrThrow(iso);
  }

  const my = v.match(/^(\d{1,2})[/.-](\d{4})$/);
  if (my) {
    const [, m, y] = my;
    return toDateOrThrow(`${y}-${m!.padStart(2, "0")}-01`);
  }

  if (/^\d{4}$/.test(v)) {
    return toDateOrThrow(`${v}-01-01`);
  }

  const parsed = Date.parse(v);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed);
  }

  return toDateOrThrow(v);
}

function toOptionalDate(value?: string | null) {
  if (!value) return null;
  return toDateOrThrow(value);
}

function toOptionalResumeEndDate(value?: string | null) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (/^(present|current|now|ongoing|till date|to date)$/i.test(s)) return null;
  return resumeDateOrThrow(s);
}

const portfolioInclude = {
  experiences: { orderBy: { sortOrder: "asc" } },
  educations: { orderBy: { sortOrder: "asc" } },
  skills: { orderBy: { sortOrder: "asc" } },
  projects: { orderBy: { sortOrder: "asc" } },
  articles: { orderBy: { sortOrder: "asc" } },
  socialProfiles: true,
  certifications: { orderBy: { sortOrder: "asc" } },
  achievements: { orderBy: { sortOrder: "asc" } },
  customSections: { orderBy: { sortOrder: "asc" } },
} as const;

export const portfolio = new Elysia({ prefix: "/portfolio" })
  // Get current user's portfolio
  .get("/", async (ctx) => {
    try {
      console.log("[GET /api/portfolio] start");
      const session = await getSession(ctx.request);
      console.log("[GET /api/portfolio] session", session ? { userId: session.userId } : null);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const existing = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
        include: portfolioInclude,
      });
      console.log("[GET /api/portfolio] portfolio", existing ? { id: existing.id } : null);

      if (!existing) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      return existing;
    } catch (error) {
      console.error("[GET /api/portfolio] error", error);
      ctx.set.status = 500;
      return {
        error: error instanceof Error ? error.message : "Internal server error",
      };
    }
  })

  // Create portfolio for current user
  .post(
    "/",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const existing = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
        include: portfolioInclude,
      });

      if (existing) return existing;

      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      const created = await ensureUserPortfolio(session.userId, user);

      return prisma.portfolio.findUniqueOrThrow({
        where: { id: created.id },
        include: portfolioInclude,
      });
    },
  )

  // Update portfolio fields
  .patch(
    "/",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const body = ctx.body ?? {};
      const {
        customization,
        headline,
        summary,
        templateId,
        title,
        avatarUrl,
        contactEmail,
        phone,
        location,
        websiteUrl,
        metaTitle,
        metaDescription,
        ...rest
      } = body;
      const existingCustomization = customization
        ? await prisma.portfolio.findUnique({
          where: { userId: session.userId },
          select: { customization: true },
        })
        : null;
      let resolvedTemplateId: string | undefined;
      if (templateId !== undefined) {
        if (typeof templateId !== "string") {
          ctx.set.status = 400;
          return { error: "Template id must be a string" };
        }
        const requestedTemplate = templateId.trim();
        if (!requestedTemplate) {
          ctx.set.status = 400;
          return { error: "Template id is required" };
        }
        const user = await prisma.user.findUnique({
          where: { id: session.userId },
        });
        if (!user) {
          ctx.set.status = 404;
          return { error: "User not found" };
        }
        const access = resolveAccessForUser(user);
        if (!canUseTemplate(access, requestedTemplate)) {
          ctx.set.status = 403;
          return {
            error: getPlanLimitMessage(access),
            code: "PLAN_LIMITED",
            access,
          };
        }
        resolvedTemplateId = requestedTemplate;
      }

      let portfolioFields;
      let normalizedCustomization = customization;
      try {
        if (customization?.sectionLabels) {
          normalizedCustomization = {
            ...customization,
            sectionLabels: Object.fromEntries(
              Object.entries(customization.sectionLabels).map(
                ([key, value]) => {
                  if (typeof value !== "string") {
                    throw new ContentValidationError(
                      `Section label ${key} must be a string`,
                    );
                  }
                  return [
                    key,
                    normalizeRequiredLabel(value, `Section label ${key}`),
                  ];
                },
              ),
            ),
          };
        }
        if (customization?.heroTagline !== undefined) {
          normalizedCustomization = {
            ...normalizedCustomization,
            heroTagline: normalizeOptionalLabel(
              customization.heroTagline,
              "Hero tagline",
            ) ?? "",
          };
        }
        if (customization?.sectionLayout !== undefined) {
          const sectionLayout = customization.sectionLayout;
          if (
            sectionLayout === null ||
            typeof sectionLayout !== "object" ||
            Array.isArray(sectionLayout)
          ) {
            throw new ContentValidationError(
              "Section layout must be an object",
            );
          }
          normalizedCustomization = {
            ...normalizedCustomization,
            sectionLayout: {
              order: normalizeOrder(
                (sectionLayout as { order?: unknown }).order,
              ),
              hidden: normalizeHidden(
                (sectionLayout as { hidden?: unknown }).hidden,
              ),
            },
          };
        }
        portfolioFields = {
          ...rest,
          ...(title !== undefined
            ? { title: normalizeRequiredLabel(title, "Title") }
            : {}),
          ...(headline !== undefined
            ? {
                headline:
                  normalizeOptionalLabel(headline, "Headline") ?? "",
              }
            : {}),
          ...(summary !== undefined
            ? { summary: normalizeLongText(summary, "Summary") }
            : {}),
          ...(resolvedTemplateId !== undefined ? { templateId: resolvedTemplateId } : {}),
          ...(contactEmail !== undefined
            ? {
                contactEmail: normalizeOptionalEmail(
                  contactEmail,
                  "Contact email",
                ),
              }
            : {}),
          ...(phone !== undefined
            ? { phone: normalizeOptionalPhone(phone) }
            : {}),
          ...(location !== undefined
            ? { location: normalizeOptionalLabel(location, "Location") }
            : {}),
          ...(metaTitle !== undefined
            ? { metaTitle: normalizeOptionalLabel(metaTitle, "Meta title") }
            : {}),
          ...(metaDescription !== undefined
            ? {
                metaDescription:
                  metaDescription == null
                    ? null
                    : normalizeLongText(metaDescription, "Meta description"),
              }
            : {}),
          ...(avatarUrl !== undefined
            ? {
                avatarUrl: normalizeOptionalStoredUrl(
                  avatarUrl,
                  "Avatar URL",
                ),
              }
            : {}),
          ...(websiteUrl !== undefined
            ? {
                websiteUrl: normalizeOptionalStoredUrl(
                  websiteUrl,
                  "Website URL",
                ),
              }
            : {}),
        };
      } catch (error) {
        ctx.set.status = 400;
        return {
          error: error instanceof Error ? error.message : "Invalid URL",
        };
      }

      const existingPortfolio = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (!existingPortfolio) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      const updated = await prisma.portfolio.update({
        where: { userId: session.userId },
        data: {
          ...portfolioFields,
          ...(normalizedCustomization
            ? {
              customization: {
                ...(existingCustomization?.customization &&
                  typeof existingCustomization.customization === "object" &&
                  !Array.isArray(existingCustomization.customization)
                  ? existingCustomization.customization
                  : {}),
                ...normalizedCustomization,
              },
            }
            : {}),
        },
      });

      return updated;
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String({ minLength: 1, maxLength: MAX_SHORT_LABEL_CHARS }),
          headline: t.Union([
            t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            t.Null(),
          ]),
          summary: t.Union([
            t.String({ maxLength: MAX_LONG_TEXT_CHARS }),
            t.Null(),
          ]),
          avatarUrl: t.Union([
            t.String({ maxLength: MAX_STORED_URL_CHARS }),
            t.Null(),
          ]),
          contactEmail: t.Union([
            t.String({ maxLength: MAX_EMAIL_CHARS }),
            t.Null(),
          ]),
          phone: t.Union([
            t.String({ maxLength: MAX_PHONE_CHARS }),
            t.Null(),
          ]),
          location: t.Union([
            t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            t.Null(),
          ]),
          websiteUrl: t.Union([
            t.String({ maxLength: MAX_STORED_URL_CHARS }),
            t.Null(),
          ]),
          templateId: t.String(),
          metaTitle: t.Union([
            t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            t.Null(),
          ]),
          metaDescription: t.Union([
            t.String({ maxLength: MAX_LONG_TEXT_CHARS }),
            t.Null(),
          ]),
          customization: t.Object({
            navbar: t.Optional(
              t.Object({
                enabled: t.Optional(t.Boolean()),
                sections: t.Optional(
                  t.Object({
                    about: t.Optional(t.Boolean()),
                    work: t.Optional(t.Boolean()),
                    experience: t.Optional(t.Boolean()),
                    profiles: t.Optional(t.Boolean()),
                  }),
                ),
              }),
            ),
            sectionLabels: t.Optional(
              t.Record(
                t.String(),
                t.String({
                  minLength: 1,
                  maxLength: MAX_SHORT_LABEL_CHARS,
                }),
              ),
            ),
            heroTagline: t.Optional(
              t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            ),
            sectionLayout: t.Optional(
              t.Object({
                order: t.Optional(
                  t.Array(t.String({ maxLength: 64 }), { maxItems: 32 }),
                ),
                hidden: t.Optional(
                  t.Array(t.String({ maxLength: 64 }), { maxItems: 32 }),
                ),
              }),
            ),
          }),
        }),
      ),
    },
  )

  // Change template
  .patch(
    "/template",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const rawTemplateId = ctx.body?.templateId;
      if (typeof rawTemplateId !== "string") {
        ctx.set.status = 400;
        return { error: "Template id must be a string" };
      }
      const requestedTemplate = rawTemplateId.trim();
      if (!requestedTemplate) {
        ctx.set.status = 400;
        return { error: "Template id is required" };
      }
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });
      if (!user) {
        ctx.set.status = 404;
        return { error: "User not found" };
      }

      const access = resolveAccessForUser(user);
      if (!canUseTemplate(access, requestedTemplate)) {
        ctx.set.status = 403;
        return {
          error: getPlanLimitMessage(access),
          code: "PLAN_LIMITED",
          access,
        };
      }

      const existingPortfolio = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      if (!existingPortfolio) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      const updated = await prisma.portfolio.update({
        where: { userId: session.userId },
        data: { templateId: requestedTemplate },
      });

      return updated;
    },
    {
      body: t.Object({ templateId: t.String() }),
    },
  )

  // Publish/unpublish
  .patch(
    "/publish",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const portfolio = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
      });

      if (!portfolio) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      if (ctx.body.isPublished && !portfolio.slug) {
        ctx.set.status = 400;
        return { error: "Choose a subdomain before publishing" };
      }

      const updated = await prisma.portfolio.update({
        where: { userId: session.userId },
        data: { isPublished: ctx.body.isPublished },
      });

      return updated;
    },
    {
      body: t.Object({ isPublished: t.Boolean() }),
    },
  )

  // Check slug availability
  .post(
    "/slug/check",
    async (ctx) => {
      const validated = validatePortfolioSlug(ctx.body.slug);
      if (!validated) {
        return { available: false, reason: "invalid" as const };
      }

      const existing = await prisma.portfolio.findUnique({
        where: { slug: validated },
      });
      return { available: !existing };
    },
    {
      body: t.Object({ slug: t.String() }),
    },
  )

  // Change slug
  .patch(
    "/slug",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const validated = validatePortfolioSlug(ctx.body.slug);
      if (!validated) {
        ctx.set.status = 400;
        return { error: "Invalid or reserved subdomain" };
      }

      const existing = await prisma.portfolio.findUnique({
        where: { slug: validated },
      });
      if (existing && existing.userId !== session.userId) {
        ctx.set.status = 409;
        return { error: "Slug already taken" };
      }

      const updated = await prisma.portfolio.update({
        where: { userId: session.userId },
        data: { slug: validated },
      });

      return updated;
    },
    {
      body: t.Object({ slug: t.String() }),
    },
  )

  // Remove sections typically filled by resume import (avoids duplicates on re-import)
  .post("/clear-importable", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const p = await prisma.portfolio.findUnique({
      where: { userId: session.userId },
    });
    if (!p) {
      ctx.set.status = 404;
      return { error: "Portfolio not found" };
    }

    await withPortfolioWriteLock(p.id, async (tx) => {
      await Promise.all([
        tx.experience.deleteMany({ where: { portfolioId: p.id } }),
        tx.education.deleteMany({ where: { portfolioId: p.id } }),
        tx.skill.deleteMany({ where: { portfolioId: p.id } }),
        tx.project.deleteMany({ where: { portfolioId: p.id } }),
        tx.article.deleteMany({ where: { portfolioId: p.id } }),
        tx.certification.deleteMany({ where: { portfolioId: p.id } }),
        tx.achievement.deleteMany({ where: { portfolioId: p.id } }),
        tx.customSection.deleteMany({ where: { portfolioId: p.id } }),
        tx.socialProfile.deleteMany({ where: { portfolioId: p.id } }),
      ]);
      await tx.portfolio.update({
        where: { id: p.id },
        data: { livePreviewProjectIds: [] },
      });
    });

    return { success: true };
  })

  // === EXPERIENCE CRUD ===
  .post(
    "/experience",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const p = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
      });
      if (!p) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      try {
        const description = normalizeLongText(
          ctx.body.description,
          "Experience description",
        );

        return await withPortfolioWriteLock(p.id, async (tx) => {
          const count = await tx.experience.count({
            where: { portfolioId: p.id },
          });
          if (count >= MAX_SECTION_ROWS) {
            throw new ContentValidationError(
              `Experiences must contain at most ${MAX_SECTION_ROWS} items`,
            );
          }
          return tx.experience.create({
            data: {
              company: normalizeRequiredLabel(ctx.body.company, "Company"),
              role: normalizeRequiredLabel(ctx.body.role, "Role"),
              description,
              location: normalizeOptionalLabel(
                ctx.body.location,
                "Experience location",
              ),
              portfolioId: p.id,
              sortOrder: count,
              startDate: ctx.body.startDate
                ? resumeDateOrThrow(ctx.body.startDate)
                : null,
              endDate: toOptionalResumeEndDate(ctx.body.endDate),
            },
          });
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to create experience",
        };
      }
    },
    {
      body: t.Object({
        company: t.String({ minLength: 1, maxLength: MAX_SHORT_LABEL_CHARS }),
        role: t.String({ minLength: 1, maxLength: MAX_SHORT_LABEL_CHARS }),
        description: t.Optional(
          t.Union([t.String({ maxLength: MAX_LONG_TEXT_CHARS }), t.Null()]),
        ),
        startDate: t.Optional(t.Union([t.String(), t.Null()])),
        endDate: t.Optional(t.Union([t.String(), t.Null()])),
        location: t.Optional(
          t.Union([
            t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            t.Null(),
          ]),
        ),
      }),
    },
  )
  .patch(
    "/experience/:id",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      try {
        const { startDate, endDate, ...rest } = ctx.body;
        const data: Prisma.ExperienceUpdateManyMutationInput = { ...rest };
        if (ctx.body.company !== undefined) {
          data.company = normalizeRequiredLabel(ctx.body.company, "Company");
        }
        if (ctx.body.role !== undefined) {
          data.role = normalizeRequiredLabel(ctx.body.role, "Role");
        }
        if (ctx.body.description !== undefined) {
          data.description = normalizeLongText(
            ctx.body.description,
            "Experience description",
          );
        }
        if (ctx.body.location !== undefined) {
          data.location = normalizeOptionalLabel(
            ctx.body.location,
            "Experience location",
          );
        }
        if (startDate !== undefined) {
          data.startDate = startDate
            ? toDateOrThrow(startDate)
            : null;
        }
        if (endDate !== undefined) {
          data.endDate = endDate
            ? toOptionalDate(endDate)
            : null;
        }

        const { count } = await prisma.experience.updateMany({
          where: {
            id: ctx.params.id,
            portfolio: { userId: session.userId },
          },
          data,
        });
        if (count === 0) {
          ctx.set.status = 404;
          return { error: "Experience not found" };
        }

        return prisma.experience.findUniqueOrThrow({
          where: { id: ctx.params.id },
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to update experience",
        };
      }
    },
    {
      body: t.Partial(
        t.Object({
          company: t.String({ minLength: 1, maxLength: MAX_SHORT_LABEL_CHARS }),
          role: t.String({ minLength: 1, maxLength: MAX_SHORT_LABEL_CHARS }),
          description: t.String({ maxLength: MAX_LONG_TEXT_CHARS }),
          startDate: t.String(),
          endDate: t.Union([t.String(), t.Null()]),
          location: t.Union([
            t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            t.Null(),
          ]),
          sortOrder: t.Number(),
        }),
      ),
    },
  )
  .delete("/experience/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const { count } = await prisma.experience.deleteMany({
      where: {
        id: ctx.params.id,
        portfolio: { userId: session.userId },
      },
    });
    if (count === 0) {
      ctx.set.status = 404;
      return { error: "Experience not found" };
    }
    return { success: true };
  })

  // === EDUCATION CRUD ===
  .post(
    "/education",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const p = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
      });
      if (!p) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      try {
        return await withPortfolioWriteLock(p.id, async (tx) => {
          const count = await tx.education.count({
            where: { portfolioId: p.id },
          });
          if (count >= MAX_SECTION_ROWS) {
            throw new ContentValidationError(
              `Education must contain at most ${MAX_SECTION_ROWS} items`,
            );
          }
          return tx.education.create({
            data: {
              ...ctx.body,
              institution: normalizeRequiredLabel(
                ctx.body.institution,
                "Institution",
              ),
              degree: normalizeRequiredLabel(ctx.body.degree, "Degree"),
              field: normalizeOptionalLabel(ctx.body.field, "Field of study"),
              gpa: normalizeOptionalLabel(ctx.body.gpa, "GPA"),
              description:
                ctx.body.description == null
                  ? null
                  : normalizeLongText(
                      ctx.body.description,
                      "Education description",
                    ),
              portfolioId: p.id,
              sortOrder: count,
              startDate: ctx.body.startDate
                ? resumeDateOrThrow(ctx.body.startDate)
                : null,
              endDate: toOptionalResumeEndDate(ctx.body.endDate),
            },
          });
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to create education",
        };
      }
    },
    {
      body: t.Object({
        institution: t.String({
          minLength: 1,
          maxLength: MAX_SHORT_LABEL_CHARS,
        }),
        degree: t.String({ minLength: 1, maxLength: MAX_SHORT_LABEL_CHARS }),
        field: t.Optional(
          t.Union([
            t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            t.Null(),
          ]),
        ),
        description: t.Optional(
          t.Union([t.String({ maxLength: MAX_LONG_TEXT_CHARS }), t.Null()]),
        ),
        startDate: t.Optional(t.Union([t.String(), t.Null()])),
        endDate: t.Optional(t.Union([t.String(), t.Null()])),
        gpa: t.Optional(
          t.Union([
            t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            t.Null(),
          ]),
        ),
      }),
    },
  )
  .patch(
    "/education/:id",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      try {
        const { startDate, endDate, ...rest } = ctx.body;
        const data: Prisma.EducationUpdateManyMutationInput = { ...rest };
        if (ctx.body.institution !== undefined) {
          data.institution = normalizeRequiredLabel(
            ctx.body.institution,
            "Institution",
          );
        }
        if (ctx.body.degree !== undefined) {
          data.degree = normalizeRequiredLabel(ctx.body.degree, "Degree");
        }
        if (ctx.body.field !== undefined) {
          data.field = normalizeOptionalLabel(
            ctx.body.field,
            "Field of study",
          );
        }
        if (ctx.body.description !== undefined) {
          data.description =
            ctx.body.description == null
              ? null
              : normalizeLongText(
                  ctx.body.description,
                  "Education description",
                );
        }
        if (ctx.body.gpa !== undefined) {
          data.gpa = normalizeOptionalLabel(ctx.body.gpa, "GPA");
        }
        if (startDate !== undefined) {
          data.startDate = startDate
            ? toDateOrThrow(startDate)
            : null;
        }
        if (endDate !== undefined) {
          data.endDate = endDate
            ? toOptionalDate(endDate)
            : null;
        }

        const { count } = await prisma.education.updateMany({
          where: {
            id: ctx.params.id,
            portfolio: { userId: session.userId },
          },
          data,
        });
        if (count === 0) {
          ctx.set.status = 404;
          return { error: "Education not found" };
        }

        return prisma.education.findUniqueOrThrow({
          where: { id: ctx.params.id },
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to update education",
        };
      }
    },
    {
      body: t.Partial(
        t.Object({
          institution: t.String({
            minLength: 1,
            maxLength: MAX_SHORT_LABEL_CHARS,
          }),
          degree: t.String({
            minLength: 1,
            maxLength: MAX_SHORT_LABEL_CHARS,
          }),
          field: t.Union([
            t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            t.Null(),
          ]),
          description: t.Union([
            t.String({ maxLength: MAX_LONG_TEXT_CHARS }),
            t.Null(),
          ]),
          startDate: t.String(),
          endDate: t.Union([t.String(), t.Null()]),
          gpa: t.Union([
            t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            t.Null(),
          ]),
          sortOrder: t.Number(),
        }),
      ),
    },
  )
  .delete("/education/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const { count } = await prisma.education.deleteMany({
      where: {
        id: ctx.params.id,
        portfolio: { userId: session.userId },
      },
    });
    if (count === 0) {
      ctx.set.status = 404;
      return { error: "Education not found" };
    }
    return { success: true };
  })

  // === SKILLS ===
  .post(
    "/skill",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const p = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
      });
      if (!p) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }
      try {
        const name = normalizeRequiredLabel(
          ctx.body.name,
          "Skill name",
          MAX_SKILL_FIELD_CHARS,
        );
        const category =
          normalizeOptionalLabel(
            ctx.body.category,
            "Skill category",
            MAX_SKILL_FIELD_CHARS,
          ) ?? "General";
        return await withPortfolioWriteLock(p.id, async (tx) => {
          const existing = await tx.skill.findFirst({
            where: {
              portfolioId: p.id,
              name: { equals: name, mode: "insensitive" },
              category: { equals: category, mode: "insensitive" },
            },
          });
          if (existing) return existing;
          const count = await tx.skill.count({
            where: { portfolioId: p.id },
          });
          if (count >= MAX_SKILLS) {
            throw new ContentValidationError(
              `Skills must contain at most ${MAX_SKILLS} items`,
            );
          }
          return tx.skill.create({
            data: {
              ...ctx.body,
              name,
              category,
              portfolioId: p.id,
            },
          });
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error: error instanceof Error ? error.message : "Invalid skill",
        };
      }
    },
    {
      body: t.Object({
        name: t.String({
          minLength: 1,
          maxLength: MAX_SKILL_FIELD_CHARS,
        }),
        category: t.Optional(
          t.String({ maxLength: MAX_SKILL_FIELD_CHARS }),
        ),
        level: t.Optional(t.Union([t.Number(), t.Null()])),
      }),
    },
  )
  .delete("/skill/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const { count } = await prisma.skill.deleteMany({
      where: {
        id: ctx.params.id,
        portfolio: { userId: session.userId },
      },
    });
    if (count === 0) {
      ctx.set.status = 404;
      return { error: "Skill not found" };
    }
    return { success: true };
  })
  .post(
    "/skill/bulk",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const p = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
      });
      if (!p) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      let skills;
      try {
        const seen = new Set<string>();
        skills = ctx.body.skills.flatMap((skill) => {
          const name = normalizeRequiredLabel(
            skill.name,
            "Skill name",
            MAX_SKILL_FIELD_CHARS,
          );
          const category =
            normalizeOptionalLabel(
              skill.category,
              "Skill category",
              MAX_SKILL_FIELD_CHARS,
            ) ?? "General";
          const key = `${name.toLowerCase()}:${category.toLowerCase()}`;
          if (seen.has(key)) return [];
          seen.add(key);
          return [{ ...skill, name, category }];
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error: error instanceof Error ? error.message : "Invalid skills",
        };
      }

      const created = await withPortfolioWriteLock(p.id, async (tx) => {
        await tx.skill.deleteMany({ where: { portfolioId: p.id } });
        return tx.skill.createMany({
          data: skills.map((s, i) => ({
            ...s,
            portfolioId: p.id,
            sortOrder: i,
          })),
        });
      });

      return { count: created.count };
    },
    {
      body: t.Object({
        skills: t.Array(
          t.Object({
            name: t.String({
              minLength: 1,
              maxLength: MAX_SKILL_FIELD_CHARS,
            }),
            category: t.Optional(
              t.String({ maxLength: MAX_SKILL_FIELD_CHARS }),
            ),
            level: t.Optional(t.Union([t.Number(), t.Null()])),
          }),
          { maxItems: MAX_SKILLS },
        ),
      }),
    },
  )

  // === PROJECTS CRUD ===
  .post(
    "/project",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const p = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
      });
      if (!p) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      try {
        return await withPortfolioWriteLock(p.id, async (tx) => {
          const count = await tx.project.count({
            where: { portfolioId: p.id },
          });
          if (count >= MAX_SECTION_ROWS) {
            throw new ContentValidationError(
              `Projects must contain at most ${MAX_SECTION_ROWS} items`,
            );
          }
          return tx.project.create({
            data: {
              ...ctx.body,
              title: normalizeRequiredLabel(ctx.body.title, "Project title"),
              description: normalizeLongText(
                ctx.body.description,
                "Project description",
              ),
              imageUrl: normalizeOptionalStoredUrl(
                ctx.body.imageUrl,
                "Project image URL",
              ),
              liveUrl: normalizeOptionalStoredUrl(
                ctx.body.liveUrl,
                "Project live URL",
              ),
              sourceUrl: normalizeOptionalStoredUrl(
                ctx.body.sourceUrl,
                "Project source URL",
              ),
              techStack: normalizeStringList(
                ctx.body.techStack ?? [],
                "Tech stack",
                MAX_TECH_STACK_ITEMS,
                MAX_TECH_STACK_ITEM_CHARS,
              ),
              language: normalizeOptionalLabel(
                ctx.body.language,
                "Project language",
              ),
              portfolioId: p.id,
              sortOrder: count,
            },
          });
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error: error instanceof Error ? error.message : "Invalid project",
        };
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: MAX_SHORT_LABEL_CHARS }),
        description: t.String({ maxLength: MAX_LONG_TEXT_CHARS }),
        imageUrl: t.Optional(
          t.Union([
            t.String({ maxLength: MAX_STORED_URL_CHARS }),
            t.Null(),
          ]),
        ),
        liveUrl: t.Optional(
          t.Union([
            t.String({ maxLength: MAX_STORED_URL_CHARS }),
            t.Null(),
          ]),
        ),
        sourceUrl: t.Optional(
          t.Union([
            t.String({ maxLength: MAX_STORED_URL_CHARS }),
            t.Null(),
          ]),
        ),
        techStack: t.Optional(
          t.Array(
            t.String({ minLength: 1, maxLength: MAX_TECH_STACK_ITEM_CHARS }),
            { maxItems: MAX_TECH_STACK_ITEMS },
          ),
        ),
        featured: t.Optional(t.Boolean()),
        githubStars: t.Optional(t.Union([t.Number(), t.Null()])),
        githubForks: t.Optional(t.Union([t.Number(), t.Null()])),
        language: t.Optional(
          t.Union([
            t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            t.Null(),
          ]),
        ),
      }),
    },
  )
  .patch(
    "/project/:id",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      let data;
      try {
        data = {
          ...ctx.body,
          ...(ctx.body.title !== undefined
            ? {
                title: normalizeRequiredLabel(
                  ctx.body.title,
                  "Project title",
                ),
              }
            : {}),
          ...(ctx.body.description !== undefined
            ? {
                description: normalizeLongText(
                  ctx.body.description,
                  "Project description",
                ),
              }
            : {}),
          ...(ctx.body.imageUrl !== undefined
            ? {
                imageUrl: normalizeOptionalStoredUrl(
                  ctx.body.imageUrl,
                  "Project image URL",
                ),
              }
            : {}),
          ...(ctx.body.liveUrl !== undefined
            ? {
                liveUrl: normalizeOptionalStoredUrl(
                  ctx.body.liveUrl,
                  "Project live URL",
                ),
              }
            : {}),
          ...(ctx.body.sourceUrl !== undefined
            ? {
                sourceUrl: normalizeOptionalStoredUrl(
                  ctx.body.sourceUrl,
                  "Project source URL",
                ),
              }
            : {}),
          ...(ctx.body.techStack !== undefined
            ? {
                techStack: normalizeStringList(
                  ctx.body.techStack,
                  "Tech stack",
                  MAX_TECH_STACK_ITEMS,
                  MAX_TECH_STACK_ITEM_CHARS,
                ),
              }
            : {}),
        };
      } catch (error) {
        ctx.set.status = 400;
        return {
          error: error instanceof Error ? error.message : "Invalid project URL",
        };
      }

      const { count } = await prisma.project.updateMany({
        where: {
          id: ctx.params.id,
          portfolio: { userId: session.userId },
        },
        data,
      });
      if (count === 0) {
        ctx.set.status = 404;
        return { error: "Project not found" };
      }

      return prisma.project.findUniqueOrThrow({
        where: { id: ctx.params.id },
      });
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String({
            minLength: 1,
            maxLength: MAX_SHORT_LABEL_CHARS,
          }),
          description: t.String({ maxLength: MAX_LONG_TEXT_CHARS }),
          imageUrl: t.Union([
            t.String({ maxLength: MAX_STORED_URL_CHARS }),
            t.Null(),
          ]),
          liveUrl: t.Union([
            t.String({ maxLength: MAX_STORED_URL_CHARS }),
            t.Null(),
          ]),
          sourceUrl: t.Union([
            t.String({ maxLength: MAX_STORED_URL_CHARS }),
            t.Null(),
          ]),
          techStack: t.Array(
            t.String({ minLength: 1, maxLength: MAX_TECH_STACK_ITEM_CHARS }),
            { maxItems: MAX_TECH_STACK_ITEMS },
          ),
          featured: t.Boolean(),
          sortOrder: t.Number(),
        }),
      ),
    },
  )
  .delete("/project/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const { count } = await prisma.project.deleteMany({
      where: {
        id: ctx.params.id,
        portfolio: { userId: session.userId },
      },
    });
    if (count === 0) {
      ctx.set.status = 404;
      return { error: "Project not found" };
    }
    return { success: true };
  })

  // === CERTIFICATIONS CRUD ===
  .post(
    "/certification",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const p = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
      });
      if (!p) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      try {
        return await withPortfolioWriteLock(p.id, async (tx) => {
          const count = await tx.certification.count({
            where: { portfolioId: p.id },
          });
          if (count >= MAX_SECTION_ROWS) {
            throw new ContentValidationError(
              `Certifications must contain at most ${MAX_SECTION_ROWS} items`,
            );
          }
          return tx.certification.create({
            data: {
              ...ctx.body,
              name: normalizeRequiredLabel(
                ctx.body.name,
                "Certification name",
              ),
              issuer: normalizeRequiredLabel(ctx.body.issuer, "Issuer"),
              portfolioId: p.id,
              issueDate: toOptionalDate(ctx.body.issueDate),
              expiryDate: toOptionalDate(ctx.body.expiryDate),
              url: normalizeOptionalStoredUrl(
                ctx.body.url,
                "Certification URL",
              ),
            },
          });
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to create certification",
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: MAX_SHORT_LABEL_CHARS }),
        issuer: t.String({ minLength: 1, maxLength: MAX_SHORT_LABEL_CHARS }),
        issueDate: t.Optional(t.Union([t.String(), t.Null()])),
        expiryDate: t.Optional(t.Union([t.String(), t.Null()])),
        url: t.Optional(
          t.Union([
            t.String({ maxLength: MAX_STORED_URL_CHARS }),
            t.Null(),
          ]),
        ),
      }),
    },
  )
  .patch(
    "/certification/:id",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      try {
        const data = {
          ...ctx.body,
          name:
            ctx.body.name === undefined
              ? undefined
              : normalizeRequiredLabel(
                  ctx.body.name,
                  "Certification name",
                ),
          issuer:
            ctx.body.issuer === undefined
              ? undefined
              : normalizeRequiredLabel(ctx.body.issuer, "Issuer"),
          issueDate:
            ctx.body.issueDate === undefined
              ? undefined
              : toOptionalDate(ctx.body.issueDate),
          expiryDate:
            ctx.body.expiryDate === undefined
              ? undefined
              : toOptionalDate(ctx.body.expiryDate),
          url:
            ctx.body.url === undefined
              ? undefined
              : normalizeOptionalStoredUrl(
                  ctx.body.url,
                  "Certification URL",
                ),
        };

        const { count } = await prisma.certification.updateMany({
          where: {
            id: ctx.params.id,
            portfolio: { userId: session.userId },
          },
          data,
        });
        if (count === 0) {
          ctx.set.status = 404;
          return { error: "Certification not found" };
        }

        return prisma.certification.findUniqueOrThrow({
          where: { id: ctx.params.id },
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error
              ? error.message
              : "Failed to update certification",
        };
      }
    },
    {
      body: t.Partial(
        t.Object({
          name: t.String({
            minLength: 1,
            maxLength: MAX_SHORT_LABEL_CHARS,
          }),
          issuer: t.String({
            minLength: 1,
            maxLength: MAX_SHORT_LABEL_CHARS,
          }),
          issueDate: t.Union([t.String(), t.Null()]),
          expiryDate: t.Union([t.String(), t.Null()]),
          url: t.Union([
            t.String({ maxLength: MAX_STORED_URL_CHARS }),
            t.Null(),
          ]),
          sortOrder: t.Number(),
        }),
      ),
    },
  )
  .delete("/certification/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const { count } = await prisma.certification.deleteMany({
      where: {
        id: ctx.params.id,
        portfolio: { userId: session.userId },
      },
    });
    if (count === 0) {
      ctx.set.status = 404;
      return { error: "Certification not found" };
    }
    return { success: true };
  })

  // === SOCIAL PROFILES ===
  .post(
    "/social",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const p = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
      });
      if (!p) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      try {
        const url = normalizeRequiredStoredUrl(
          ctx.body.url,
          "Social profile URL",
        );
        const platform = normalizeRequiredLabel(
          ctx.body.platform,
          "Social platform",
        );
        const username = normalizeOptionalLabel(
          ctx.body.username,
          "Social username",
        );
        return await prisma.socialProfile.upsert({
          where: {
            portfolioId_platform: {
              portfolioId: p.id,
              platform,
            },
          },
          update: {
            url,
            username,
          },
          create: {
            ...ctx.body,
            platform,
            url,
            username,
            portfolioId: p.id,
          },
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error ? error.message : "Invalid social profile URL",
        };
      }
    },
    {
      body: t.Object({
        platform: t.String({
          minLength: 1,
          maxLength: MAX_SHORT_LABEL_CHARS,
        }),
        url: t.String({ maxLength: MAX_STORED_URL_CHARS }),
        username: t.Optional(
          t.Union([
            t.String({ maxLength: MAX_SHORT_LABEL_CHARS }),
            t.Null(),
          ]),
        ),
      }),
    },
  )
  .delete("/social/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const { count } = await prisma.socialProfile.deleteMany({
      where: {
        id: ctx.params.id,
        portfolio: { userId: session.userId },
      },
    });
    if (count === 0) {
      ctx.set.status = 404;
      return { error: "Social profile not found" };
    }
    return { success: true };
  })

  // === ACHIEVEMENTS CRUD ===
  .post(
    "/achievement",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const p = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
      });
      if (!p) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      try {
        return await withPortfolioWriteLock(p.id, async (tx) => {
          const count = await tx.achievement.count({
            where: { portfolioId: p.id },
          });
          if (count >= MAX_SECTION_ROWS) {
            throw new ContentValidationError(
              `Achievements must contain at most ${MAX_SECTION_ROWS} items`,
            );
          }
          return tx.achievement.create({
            data: {
              ...ctx.body,
              title: normalizeRequiredLabel(
                ctx.body.title,
                "Achievement title",
              ),
              portfolioId: p.id,
              sortOrder: count,
              date: ctx.body.date ? resumeDateOrThrow(ctx.body.date) : null,
            },
          });
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error: error instanceof Error ? error.message : "Invalid achievement",
        };
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: MAX_SHORT_LABEL_CHARS }),
        date: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    },
  )
  .patch(
    "/achievement/:id",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      let updateData: Prisma.AchievementUpdateManyMutationInput;
      try {
        const { date, ...rest } = ctx.body;
        updateData = { ...rest };
        if (ctx.body.title !== undefined) {
          updateData.title = normalizeRequiredLabel(
            ctx.body.title,
            "Achievement title",
          );
        }
        if (date !== undefined) {
          updateData.date = date
            ? resumeDateOrThrow(date)
            : null;
        }
      } catch (error) {
        ctx.set.status = 400;
        return {
          error: error instanceof Error ? error.message : "Invalid achievement",
        };
      }
      const { count } = await prisma.achievement.updateMany({
        where: {
          id: ctx.params.id,
          portfolio: { userId: session.userId },
        },
        data: updateData,
      });
      if (count === 0) {
        ctx.set.status = 404;
        return { error: "Achievement not found" };
      }

      return prisma.achievement.findUniqueOrThrow({
        where: { id: ctx.params.id },
      });
    },
    {
      body: t.Partial(
        t.Object({
          title: t.String({
            minLength: 1,
            maxLength: MAX_SHORT_LABEL_CHARS,
          }),
          date: t.Union([t.String(), t.Null()]),
          sortOrder: t.Number(),
        }),
      ),
    },
  )
  .delete("/achievement/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const { count } = await prisma.achievement.deleteMany({
      where: {
        id: ctx.params.id,
        portfolio: { userId: session.userId },
      },
    });
    if (count === 0) {
      ctx.set.status = 404;
      return { error: "Achievement not found" };
    }
    return { success: true };
  })

  // === CUSTOM SECTIONS CRUD ===
  .post(
    "/custom-section",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const p = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
      });
      if (!p) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      let sectionType: string;
      let label: string;
      try {
        sectionType = normalizeRequiredLabel(
          ctx.body.sectionType,
          "Section type",
        );
        label = normalizeRequiredLabel(
          ctx.body.label,
          "Custom section label",
        );
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error ? error.message : "Invalid custom section",
        };
      }

      try {
        const rawItems = validateCustomSectionItems(
          ctx.body.items ?? [],
          "Custom section items",
        );
        const items = validateCustomSectionItems(
          normalizeStoredUrlsInJson(rawItems, "Custom section items"),
          "Custom section items",
        );
        return await withPortfolioWriteLock(p.id, async (tx) => {
          const existing = await tx.customSection.findUnique({
            where: {
              portfolioId_sectionType: {
                portfolioId: p.id,
                sectionType,
              },
            },
            select: { id: true },
          });
          const count = await tx.customSection.count({
            where: { portfolioId: p.id },
          });
          if (!existing && count >= MAX_CUSTOM_SECTIONS) {
            throw new ContentValidationError(
              `Custom sections must contain at most ${MAX_CUSTOM_SECTIONS} items`,
            );
          }
          return tx.customSection.upsert({
            where: {
              portfolioId_sectionType: {
                portfolioId: p.id,
                sectionType,
              },
            },
            update: {
              label,
            items: items as Prisma.InputJsonValue,
            },
            create: {
              portfolioId: p.id,
              sectionType,
              label,
            items: items as Prisma.InputJsonValue,
              sortOrder: count,
            },
          });
        });
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error ? error.message : "Invalid custom section URL",
        };
      }
    },
    {
      body: t.Object({
        sectionType: t.String({
          minLength: 1,
          maxLength: MAX_SHORT_LABEL_CHARS,
        }),
        label: t.String({
          minLength: 1,
          maxLength: MAX_SHORT_LABEL_CHARS,
        }),
        items: t.Optional(
          t.Array(t.Record(t.String(), t.Unknown()), {
            maxItems: MAX_CUSTOM_SECTION_ITEMS,
          }),
        ),
      }),
    },
  )
  .patch(
    "/custom-section/:id",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      const { items, ...rest } = ctx.body;
      let label = rest.label;
      let normalizedItems;
      try {
        if (label !== undefined) {
          label = normalizeRequiredLabel(label, "Custom section label");
        }
        normalizedItems =
          items === undefined
            ? undefined
            : validateCustomSectionItems(
                normalizeStoredUrlsInJson(
                  validateCustomSectionItems(items, "Custom section items"),
                  "Custom section items",
                ),
                "Custom section items",
              );
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof Error ? error.message : "Invalid custom section URL",
        };
      }
      const { count } = await prisma.customSection.updateMany({
        where: {
          id: ctx.params.id,
          portfolio: { userId: session.userId },
        },
        data: {
          ...rest,
          ...(label !== undefined ? { label } : {}),
          ...(normalizedItems !== undefined
            ? { items: normalizedItems as Prisma.InputJsonValue }
            : {}),
        },
      });
      if (count === 0) {
        ctx.set.status = 404;
        return { error: "Custom section not found" };
      }

      return prisma.customSection.findUniqueOrThrow({
        where: { id: ctx.params.id },
      });
    },
    {
      body: t.Partial(
        t.Object({
          label: t.String({
            minLength: 1,
            maxLength: MAX_SHORT_LABEL_CHARS,
          }),
          items: t.Array(t.Record(t.String(), t.Unknown()), {
            maxItems: MAX_CUSTOM_SECTION_ITEMS,
          }),
          sortOrder: t.Number(),
        }),
      ),
    },
  )
  .delete("/custom-section/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const { count } = await prisma.customSection.deleteMany({
      where: {
        id: ctx.params.id,
        portfolio: { userId: session.userId },
      },
    });
    if (count === 0) {
      ctx.set.status = 404;
      return { error: "Custom section not found" };
    }
    return { success: true };
  })

  // Bulk import generated portfolio data
  .post("/bulk-import", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    try {
      const result = await bulkImportPortfolioData(session.userId, ctx.body);
      return { success: true, portfolio: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bulk import failed";
      ctx.set.status = err instanceof ContentValidationError ? 400 : 500;
      return { error: message };
    }
  })
  .patch(
    "/live-preview",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const portfolio = await prisma.portfolio.findUnique({
        where: { userId: session.userId },
        include: {
          projects: {
            select: { id: true, liveUrl: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
      if (!portfolio) {
        ctx.set.status = 404;
        return { error: "Portfolio not found" };
      }

      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { subscriptionStatus: true },
      });
      if (!user) {
        ctx.set.status = 404;
        return { error: "User not found" };
      }

      const maxAllowed = getMaxLivePreviews(user.subscriptionStatus);
      const requestedIds = Array.isArray(ctx.body.projectIds)
        ? ctx.body.projectIds.filter((id): id is string => typeof id === "string")
        : [];

      const livePreviewProjectIds = sanitizeLivePreviewProjectIds(
        requestedIds,
        portfolio.projects,
        maxAllowed
      );

      const updated = await prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { livePreviewProjectIds },
        include: portfolioInclude,
      });

      return updated;
    },
    {
      body: t.Object({
        projectIds: t.Array(t.String()),
      }),
    },
  );
