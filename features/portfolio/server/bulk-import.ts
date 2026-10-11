import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/db/generated/prisma/client";
import type { PortfolioData } from "@/features/templates/types";
import {
  ContentValidationError,
  MAX_CUSTOM_SECTIONS,
  MAX_SECTION_ROWS,
  MAX_SKILL_FIELD_CHARS,
  MAX_SKILLS,
  MAX_TECH_STACK_ITEM_CHARS,
  MAX_TECH_STACK_ITEMS,
  sanitizeImportedCustomSectionItems,
  sanitizeImportedEmail,
  sanitizeImportedLabel,
  sanitizeImportedLongText,
  sanitizeImportedPhone,
  sanitizeImportedStringList,
  sanitizeImportedStoredUrl,
} from "@/lib/content-policy";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parsePortfolioImportPayload(value: unknown): PortfolioData {
  if (!isRecord(value) || !isRecord(value.portfolio)) {
    throw new ContentValidationError("Invalid portfolio import payload");
  }

  const collectionNames = [
    "experiences",
    "educations",
    "skills",
    "projects",
    "articles",
    "socialProfiles",
    "certifications",
    "achievements",
    "customSections",
  ] as const;
  for (const name of collectionNames) {
    if (
      !Array.isArray(value[name])
      || !value[name].every((item) => isRecord(item))
    ) {
      throw new ContentValidationError(`Invalid portfolio import ${name}`);
    }
  }

  return {
    ...(value as unknown as PortfolioData),
    livePreviewProjectIds: Array.isArray(value.livePreviewProjectIds)
      ? value.livePreviewProjectIds.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  };
}

/**
 * Bulk imports generated portfolio data into the database.
 * Creates or updates all sections (experiences, skills, projects, etc.) in a single transaction.
 */
export async function bulkImportPortfolioData(
  userId: string,
  payload: unknown,
) {
  const data = parsePortfolioImportPayload(payload);
  const portfolioId = (
    await prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    })
  )?.id;

  if (!portfolioId) {
    throw new Error("Portfolio not found. Create a portfolio first.");
  }

  // Validate all URLs before the destructive replacement begins.
  const websiteUrl = sanitizeImportedStoredUrl(
    data.portfolio.websiteUrl,
    "Portfolio website URL",
  );
  const avatarUrl = sanitizeImportedStoredUrl(
    data.portfolio.avatarUrl,
    "Portfolio avatar URL",
  );
  const rawCustomization = isRecord(data.portfolio.customization)
    ? data.portfolio.customization
    : {};
  const rawSectionLabels = isRecord(rawCustomization.sectionLabels)
    ? rawCustomization.sectionLabels
    : {};
  const normalizedCustomization = {
    ...rawCustomization,
    sectionLabels: Object.fromEntries(
      Object.entries(rawSectionLabels).flatMap(([key, value]) => {
        const label = sanitizeImportedLabel(value);
        return label ? [[key, label]] : [];
      }),
    ),
    ...(rawCustomization.heroTagline !== undefined
      ? {
          heroTagline: sanitizeImportedLabel(
            rawCustomization.heroTagline,
          ),
        }
      : {}),
  };
  const customization =
    sanitizeImportedCustomSectionItems([normalizedCustomization])[0] ?? {};
  const experiences = data.experiences
    .slice(0, MAX_SECTION_ROWS)
    .map((experience) => ({
      ...experience,
      company: sanitizeImportedLabel(experience.company),
      role: sanitizeImportedLabel(experience.role),
      description: sanitizeImportedLongText(experience.description),
      location: sanitizeImportedLabel(experience.location) || null,
    }))
    .filter((experience) => experience.company && experience.role);
  const educations = data.educations
    .slice(0, MAX_SECTION_ROWS)
    .map((education) => ({
      ...education,
      institution: sanitizeImportedLabel(education.institution),
      degree: sanitizeImportedLabel(education.degree),
      field: sanitizeImportedLabel(education.field) || null,
      gpa: sanitizeImportedLabel(education.gpa) || null,
    }))
    .filter((education) => education.institution && education.degree);
  const skills = data.skills
    .map((skill) => ({
      ...skill,
      name: sanitizeImportedLabel(skill.name, MAX_SKILL_FIELD_CHARS),
      category:
        sanitizeImportedLabel(skill.category, MAX_SKILL_FIELD_CHARS)
        || "General",
    }))
    .filter((skill, index, values) => {
      if (!skill.name) return false;
      const key = `${skill.name.toLowerCase()}:${skill.category.toLowerCase()}`;
      return values.findIndex((candidate) =>
        `${candidate.name.toLowerCase()}:${candidate.category.toLowerCase()}`
        === key
      ) === index;
    })
    .slice(0, MAX_SKILLS);
  const projects = data.projects
    .slice(0, MAX_SECTION_ROWS)
    .map((project, index) => ({
      ...project,
      title: sanitizeImportedLabel(project.title),
      description: sanitizeImportedLongText(project.description),
      imageUrl: sanitizeImportedStoredUrl(
        project.imageUrl,
        `Projects[${index}].imageUrl`,
      ),
      liveUrl: sanitizeImportedStoredUrl(
        project.liveUrl,
        `Projects[${index}].liveUrl`,
      ),
      sourceUrl: sanitizeImportedStoredUrl(
        project.sourceUrl,
        `Projects[${index}].sourceUrl`,
      ),
      techStack: sanitizeImportedStringList(
        project.techStack ?? [],
        MAX_TECH_STACK_ITEMS,
        MAX_TECH_STACK_ITEM_CHARS,
      ),
      language: sanitizeImportedLabel(project.language) || null,
    }))
    .filter((project) => project.title);
  const seenSocialPlatforms = new Set<string>();
  const socialProfiles = data.socialProfiles.flatMap((social, index) => {
    const url = sanitizeImportedStoredUrl(
      social.url,
      `Social profiles[${index}].url`,
    );
    const platform = sanitizeImportedLabel(social.platform);
    const key = platform.toLowerCase();
    if (!url || !platform || seenSocialPlatforms.has(key)) return [];
    seenSocialPlatforms.add(key);
    return [{
      ...social,
      platform,
      username: sanitizeImportedLabel(social.username) || null,
      url,
    }];
  });
  const articles = data.articles
    .slice(0, MAX_SECTION_ROWS)
    .flatMap((article, index) => {
      const title = sanitizeImportedLabel(article.title);
      const url = sanitizeImportedStoredUrl(
        article.url,
        `Articles[${index}].url`,
      );
      if (!title || !url) return [];
      return [{
        ...article,
        title,
        description: sanitizeImportedLongText(article.description),
        url,
        tags: sanitizeImportedStringList(
          article.tags ?? [],
          MAX_TECH_STACK_ITEMS,
          MAX_TECH_STACK_ITEM_CHARS,
        ),
      }];
    });
  const certifications = data.certifications
    .slice(0, MAX_SECTION_ROWS)
    .map((certification, index) => ({
      ...certification,
      name: sanitizeImportedLabel(certification.name),
      issuer: sanitizeImportedLabel(certification.issuer),
      url: sanitizeImportedStoredUrl(
        certification.url,
        `Certifications[${index}].url`,
      ),
    }))
    .filter((certification) => certification.name && certification.issuer);
  const achievements = data.achievements
    .slice(0, MAX_SECTION_ROWS)
    .map((achievement) => ({
      ...achievement,
      title: sanitizeImportedLabel(achievement.title),
    }))
    .filter((achievement) => achievement.title);
  const seenSectionTypes = new Set<string>();
  const customSections = data.customSections
    .flatMap((section) => {
      const sectionType = sanitizeImportedLabel(section.sectionType);
      const label = sanitizeImportedLabel(section.label);
      const key = sectionType.toLowerCase();
      if (!sectionType || !label || seenSectionTypes.has(key)) return [];
      seenSectionTypes.add(key);
      return [{
        ...section,
        sectionType,
        label,
        items: sanitizeImportedCustomSectionItems(section.items),
      }];
    })
    .slice(0, MAX_CUSTOM_SECTIONS);

  // Helper to parse dates
  function toDateOrNull(value?: string | null): Date | null {
    if (!value) return null;
    try {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  // Replace all imported content atomically.
  await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`
        SELECT "id"
        FROM "portfolios"
        WHERE "id" = ${portfolioId}
        FOR UPDATE
      `;
      await Promise.all([
        tx.experience.deleteMany({ where: { portfolioId } }),
        tx.education.deleteMany({ where: { portfolioId } }),
        tx.skill.deleteMany({ where: { portfolioId } }),
        tx.project.deleteMany({ where: { portfolioId } }),
        tx.article.deleteMany({ where: { portfolioId } }),
        tx.socialProfile.deleteMany({ where: { portfolioId } }),
        tx.certification.deleteMany({ where: { portfolioId } }),
        tx.achievement.deleteMany({ where: { portfolioId } }),
        tx.customSection.deleteMany({ where: { portfolioId } }),
      ]);
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: {
          title: sanitizeImportedLabel(data.portfolio.title),
          headline: sanitizeImportedLabel(data.portfolio.headline),
          summary: sanitizeImportedLongText(data.portfolio.summary),
          contactEmail: sanitizeImportedEmail(data.portfolio.contactEmail),
          phone: sanitizeImportedPhone(data.portfolio.phone),
          location: sanitizeImportedLabel(data.portfolio.location) || null,
          websiteUrl,
          avatarUrl,
          customization: customization as Prisma.InputJsonValue,
          livePreviewProjectIds: [],
        },
      });

      // Experiences
      await Promise.all(
        experiences.map((exp, idx) =>
          tx.experience.create({
            data: {
              portfolioId,
              company: exp.company,
              role: exp.role,
              description: exp.description || "",
              startDate: toDateOrNull(exp.startDate),
              endDate: toDateOrNull(exp.endDate),
              location: exp.location,
              sortOrder: idx,
            },
          })
        )
      );

      // Education
      await Promise.all(
        educations.map((edu, idx) =>
          tx.education.create({
            data: {
              portfolioId,
              institution: edu.institution,
              degree: edu.degree,
              field: edu.field,
              startDate: toDateOrNull(edu.startDate),
              endDate: toDateOrNull(edu.endDate),
              gpa: edu.gpa,
              sortOrder: idx,
            },
          })
        )
      );

      // Skills
      await Promise.all(
        skills.map((skill, idx) =>
          tx.skill.create({
            data: {
              portfolioId,
              name: skill.name,
              category: skill.category || "General",
              level: skill.level,
              sortOrder: idx,
            },
          })
        )
      );

      // Projects
      await Promise.all(
        projects.map((proj, idx) =>
          tx.project.create({
            data: {
              portfolioId,
              title: proj.title,
              description: proj.description || "",
              imageUrl: proj.imageUrl,
              liveUrl: proj.liveUrl,
              sourceUrl: proj.sourceUrl,
              techStack: proj.techStack || [],
              featured: proj.featured ?? false,
              githubStars: proj.githubStars,
              githubForks: proj.githubForks,
              language: proj.language,
              sortOrder: idx,
            },
          })
        )
      );

      // Social profiles
      await Promise.all(
        socialProfiles.map((social) =>
          tx.socialProfile.create({
            data: {
              portfolioId,
              platform: social.platform,
              url: social.url,
              username: social.username,
              cachedStats: social.cachedStats as Prisma.InputJsonValue,
            },
          })
        )
      );

      // Articles
      await Promise.all(
        articles.map((article, idx) =>
          tx.article.create({
            data: {
              portfolioId,
              title: article.title,
              description: article.description,
              url: article.url,
              tags: article.tags,
              publishedAt: toDateOrNull(article.publishedAt),
              readTime: article.readTime,
              sortOrder: idx,
            },
          })
        )
      );

      // Certifications
      await Promise.all(
        certifications.map((cert, idx) =>
          tx.certification.create({
            data: {
              portfolioId,
              name: cert.name,
              issuer: cert.issuer || "",
              issueDate: toDateOrNull(cert.issueDate),
              url: cert.url,
              sortOrder: idx,
            },
          })
        )
      );

      // Achievements
      await Promise.all(
        achievements.map((ach, idx) =>
          tx.achievement.create({
            data: {
              portfolioId,
              title: ach.title,
              date: toDateOrNull(ach.date),
              sortOrder: idx,
            },
          })
        )
      );

      // Custom sections
      await Promise.all(
        customSections.map((section, idx) =>
          tx.customSection.create({
            data: {
              portfolioId,
              sectionType: section.sectionType,
              label: section.label,
              items: section.items as Prisma.InputJsonValue,
              sortOrder: idx,
            },
          })
        )
      );
    },
    {
      timeout: 30000, // 30 second timeout for large imports
    }
  );

  // Return updated portfolio
  return prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
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
}
