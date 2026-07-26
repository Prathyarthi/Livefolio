import type { SectionKey } from "./section-labels";
import type { SectionLayoutCustomization } from "./section-order";

export type TemplateSectionId = "about" | "work" | "experience" | "profiles";

export interface TemplateNavbarCustomization {
  enabled?: boolean;
  sections?: Partial<Record<TemplateSectionId, boolean>>;
}

export interface PortfolioCustomization {
  navbar?: TemplateNavbarCustomization;
  /** User- or resume-derived section heading overrides. */
  sectionLabels?: Partial<Record<SectionKey, string>>;
  /** Shown by the Spotlight template as the large hero line under the headline. */
  heroTagline?: string;
  /** User-controlled body section order and visibility. */
  sectionLayout?: SectionLayoutCustomization;
  [key: string]: unknown;
}

export interface PortfolioData {
  portfolio: {
    title: string;
    headline: string;
    summary: string;
    avatarUrl: string | null;
    contactEmail: string | null;
    phone: string | null;
    location: string | null;
    websiteUrl: string | null;
    customization: PortfolioCustomization;
  };
  experiences: Array<{
    id: string;
    company: string;
    role: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
  }>;
  educations: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string | null;
    startDate: string | null;
    endDate: string | null;
    gpa: string | null;
  }>;
  skills: Array<{
    id: string;
    name: string;
    category: string;
    level: number | null;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    liveUrl: string | null;
    sourceUrl: string | null;
    techStack: string[];
    featured: boolean;
    githubStars: number | null;
    githubForks: number | null;
    language: string | null;
  }>;
  articles: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    tags: string[];
    publishedAt: string | null;
    readTime: number | null;
  }>;
  socialProfiles: Array<{
    platform: string;
    url: string;
    username: string | null;
    cachedStats: Record<string, unknown> | null;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate: string | null;
    url: string | null;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    date: string | null;
  }>;
  customSections: Array<{
    id: string;
    sectionType: string;
    label: string;
    items: Record<string, unknown>[];
  }>;
  /** Project IDs stored in DB for Microlink live previews. */
  livePreviewProjectIds: string[];
}

export interface TemplateComponent {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  category: string;
  component: React.ComponentType<{ data: PortfolioData }>;
}
