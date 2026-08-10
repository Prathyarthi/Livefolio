export type ApplicationSnapshotData = {
  version: 1;
  capturedAt: string;
  profile: {
    title: string;
    headline: string;
    summary: string;
    avatarUrl: string | null;
    location: string | null;
    contactEmail: string | null;
    websiteUrl: string | null;
    slug: string | null;
  };
  experiences: Array<{
    company: string;
    role: string;
    description: string;
    startDate: string | null;
    endDate: string | null;
    location: string | null;
  }>;
  educations: Array<{
    institution: string;
    degree: string;
    field: string | null;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
  }>;
  skills: Array<{
    name: string;
    category: string;
    level: number | null;
  }>;
  projects: Array<{
    title: string;
    description: string;
    liveUrl: string | null;
    sourceUrl: string | null;
    techStack: string[];
    featured: boolean;
  }>;
  articles: Array<{
    title: string;
    description: string;
    url: string;
    tags: string[];
    publishedAt: string | null;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: string | null;
    url: string | null;
  }>;
  achievements: Array<{
    title: string;
    date: string | null;
  }>;
  socialProfiles: Array<{
    platform: string;
    url: string;
    username: string | null;
  }>;
  customSections: Array<{
    sectionType: string;
    label: string;
    items: unknown;
  }>;
};
