import { getAppOrigin } from "@/lib/domain";

export type ExtensionSocial = {
  platform: string;
  url: string;
  username: string | null;
};

export type ExtensionExperience = {
  company: string;
  role: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
};

export type ExtensionEducation = {
  institution: string;
  degree: string;
  field: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  gpa: string | null;
};

export type ExtensionProfile = {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  websiteUrl: string | null;
  portfolioUrl: string | null;
  resumeUrl: string | null;
  linkedin: string | null;
  github: string | null;
  twitter: string | null;
  socials: ExtensionSocial[];
  experiences: ExtensionExperience[];
  educations: ExtensionEducation[];
  skills: { name: string; category: string | null }[];
  projects: {
    title: string;
    description: string | null;
    liveUrl: string | null;
    sourceUrl: string | null;
    techStack: string[];
  }[];
  certifications: {
    name: string;
    issuer: string;
    issueDate: string | null;
    url: string | null;
  }[];
};

type DateLike = Date | string | null | undefined;

export type ExtensionProfileSource = {
  user: { name: string; email: string };
  portfolioUrl: string | null;
  origin?: string;
  portfolio: {
    contactEmail: string | null;
    phone: string | null;
    location: string | null;
    headline: string | null;
    summary: string | null;
    websiteUrl: string | null;
    resumeUrl: string | null;
    experiences: Array<{
      company: string;
      role: string;
      description: string;
      startDate: DateLike;
      endDate: DateLike;
      location: string | null;
    }>;
    educations: Array<{
      institution: string;
      degree: string;
      field: string | null;
      description: string | null;
      startDate: DateLike;
      endDate: DateLike;
      gpa: string | null;
    }>;
    skills: Array<{ name: string; category: string | null }>;
    projects: Array<{
      title: string;
      description: string;
      liveUrl: string | null;
      sourceUrl: string | null;
      techStack: string[];
    }>;
    socialProfiles: Array<{
      platform: string;
      url: string;
      username: string | null;
    }>;
    certifications: Array<{
      name: string;
      issuer: string;
      issueDate: DateLike;
      url: string | null;
    }>;
  };
};

export function splitName(name: string): {
  fullName: string;
  firstName: string;
  lastName: string;
} {
  const fullName = name.trim().replace(/\s+/g, " ");
  const parts = fullName.split(" ").filter(Boolean);
  if (parts.length === 0) {
    return { fullName: "", firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { fullName, firstName: parts[0] ?? "", lastName: "" };
  }
  return {
    fullName,
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function plainText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function blankToNull(value: string | null | undefined): string | null {
  const text = plainText(value ?? "");
  return text.length > 0 ? text : null;
}

function isoDate(value: DateLike): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 10);
}

function absoluteUrl(origin: string, value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${origin.replace(/\/$/, "")}${trimmed}`;
  return trimmed;
}

function socialUrl(
  socials: ExtensionSocial[],
  platform: string,
): string | null {
  const match = socials.find((social) => social.platform === platform);
  return match?.url ?? null;
}

export function toExtensionProfile(source: ExtensionProfileSource): ExtensionProfile {
  const origin = source.origin ?? getAppOrigin();
  const name = splitName(source.user.name);
  const socials = source.portfolio.socialProfiles
    .map((social) => ({
      platform: social.platform.trim().toLowerCase(),
      url: social.url.trim(),
      username: blankToNull(social.username),
    }))
    .filter((social) => social.platform.length > 0 && social.url.length > 0);

  return {
    fullName: name.fullName,
    firstName: name.firstName,
    lastName: name.lastName,
    email: blankToNull(source.portfolio.contactEmail) ?? blankToNull(source.user.email),
    phone: blankToNull(source.portfolio.phone),
    location: blankToNull(source.portfolio.location),
    headline: blankToNull(source.portfolio.headline),
    summary: blankToNull(source.portfolio.summary),
    websiteUrl: absoluteUrl(origin, source.portfolio.websiteUrl),
    portfolioUrl: absoluteUrl(origin, source.portfolioUrl),
    resumeUrl: absoluteUrl(origin, source.portfolio.resumeUrl),
    linkedin: socialUrl(socials, "linkedin"),
    github: socialUrl(socials, "github"),
    twitter: socialUrl(socials, "twitter"),
    socials,
    experiences: source.portfolio.experiences
      .map((experience) => ({
        company: plainText(experience.company),
        role: plainText(experience.role),
        description: blankToNull(experience.description),
        startDate: isoDate(experience.startDate),
        endDate: isoDate(experience.endDate),
        location: blankToNull(experience.location),
      }))
      .filter((experience) => experience.company.length > 0 || experience.role.length > 0),
    educations: source.portfolio.educations
      .map((education) => ({
        institution: plainText(education.institution),
        degree: plainText(education.degree),
        field: blankToNull(education.field),
        description: blankToNull(education.description),
        startDate: isoDate(education.startDate),
        endDate: isoDate(education.endDate),
        gpa: blankToNull(education.gpa),
      }))
      .filter(
        (education) =>
          education.institution.length > 0 || education.degree.length > 0,
      ),
    skills: source.portfolio.skills
      .map((skill) => ({
        name: plainText(skill.name),
        category: blankToNull(skill.category),
      }))
      .filter((skill) => skill.name.length > 0),
    projects: source.portfolio.projects
      .map((project) => ({
        title: plainText(project.title),
        description: blankToNull(project.description),
        liveUrl: absoluteUrl(origin, project.liveUrl),
        sourceUrl: absoluteUrl(origin, project.sourceUrl),
        techStack: project.techStack.map((item) => item.trim()).filter(Boolean),
      }))
      .filter((project) => project.title.length > 0),
    certifications: source.portfolio.certifications
      .map((certification) => ({
        name: plainText(certification.name),
        issuer: plainText(certification.issuer),
        issueDate: isoDate(certification.issueDate),
        url: absoluteUrl(origin, certification.url),
      }))
      .filter(
        (certification) =>
          certification.name.length > 0 || certification.issuer.length > 0,
      ),
  };
}
