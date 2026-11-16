function csvCell(value: unknown): string {
  if (value == null) return "";
  const text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const HEADERS = [
  "ownerId",
  "ownerName",
  "ownerEmail",
  "ownerAvatar",
  "portfolioId",
  "slug",
  "title",
  "headline",
  "summary",
  "avatarUrl",
  "profileImageUrl",
  "resumeUrl",
  "templateId",
  "isPublished",
  "openToWork",
  "metaTitle",
  "metaDescription",
  "contactEmail",
  "phone",
  "location",
  "websiteUrl",
  "customization",
  "livePreviewProjectIds",
  "createdAt",
  "updatedAt",
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

type ExportPortfolio = {
  owner: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  profile: {
    id: string;
    slug: string | null;
    title: string;
    headline: string;
    summary: string;
    avatarUrl: string | null;
    profileImageUrl: string | null;
    resumeUrl: string | null;
    templateId: string;
    isPublished: boolean;
    openToWork: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    contactEmail: string | null;
    phone: string | null;
    location: string | null;
    websiteUrl: string | null;
    customization: unknown;
    livePreviewProjectIds: string[];
    createdAt: Date;
    updatedAt: Date;
  };
  experiences: unknown[];
  educations: unknown[];
  skills: unknown[];
  projects: unknown[];
  articles: unknown[];
  socialProfiles: unknown[];
  certifications: unknown[];
  achievements: unknown[];
  customSections: unknown[];
};

export function portfoliosToCsv(portfolios: ExportPortfolio[]): string {
  const rows = portfolios.map((item) =>
    [
      item.owner.id,
      item.owner.name,
      item.owner.email,
      item.owner.avatar,
      item.profile.id,
      item.profile.slug,
      item.profile.title,
      item.profile.headline,
      item.profile.summary,
      item.profile.avatarUrl,
      item.profile.profileImageUrl,
      item.profile.resumeUrl,
      item.profile.templateId,
      item.profile.isPublished,
      item.profile.openToWork,
      item.profile.metaTitle,
      item.profile.metaDescription,
      item.profile.contactEmail,
      item.profile.phone,
      item.profile.location,
      item.profile.websiteUrl,
      item.profile.customization,
      item.profile.livePreviewProjectIds,
      item.profile.createdAt,
      item.profile.updatedAt,
      item.experiences,
      item.educations,
      item.skills,
      item.projects,
      item.articles,
      item.socialProfiles,
      item.certifications,
      item.achievements,
      item.customSections,
    ]
      .map(csvCell)
      .join(","),
  );

  return `\uFEFF${[HEADERS.join(","), ...rows].join("\n")}\n`;
}

export function csvFilename(filter: "all" | "true" | "false"): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const suffix =
    filter === "true" ? "published" : filter === "false" ? "draft" : "all";
  return `livefolio-portfolios-${suffix}-${stamp}.csv`;
}
