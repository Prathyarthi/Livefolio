import { createHash } from "node:crypto";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import type { JobRequirementInput } from "@/features/applications/lib/search";
import {
  jobJdSource,
  sanitizeExtractedProfile,
  type JobJdInput,
  type JobSearchProfile,
} from "@/features/jobs/lib/search-profile";

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rand = ReturnType<typeof rng>;
const pick = <T,>(r: Rand, list: readonly T[]): T => list[Math.floor(r() * list.length)]!;
const sample = <T,>(r: Rand, list: readonly T[], n: number): T[] =>
  [...list].sort(() => r() - 0.5).slice(0, Math.max(0, Math.min(n, list.length)));

export function yearsAgo(n: number): string {
  return new Date(Date.now() - n * 365.25 * 24 * 3600 * 1000).toISOString();
}

export type ProfessionId =
  | "backend"
  | "designer"
  | "marketer"
  | "sales"
  | "writer"
  | "hr"
  | "nurse"
  | "accountant"
  | "analyst";

type Profession = {
  id: ProfessionId;
  titles: string[];
  core: string[];
  extra: string[];
  companies: string[];
  domain: string;
  work: (skill: string) => string;
  customLabel: string;
  certs: string[];
  platforms?: "dev" | "design" | "writing";
};

export const PROFESSIONS: Record<ProfessionId, Profession> = {
  backend: {
    id: "backend",
    titles: ["Backend Engineer", "Software Engineer", "Platform Developer"],
    core: ["Node.js", "PostgreSQL", "TypeScript", "AWS", "Kafka"],
    extra: ["Docker", "Redis", "GraphQL", "Kubernetes"],
    companies: ["Razorpay", "Swiggy", "Freshworks", "Zerodha"],
    domain: "fintech",
    work: (s) => `Built payment services using ${s}, handling 2M requests a day`,
    customLabel: "Open Source",
    certs: ["AWS Certified Developer"],
    platforms: "dev",
  },
  designer: {
    id: "designer",
    titles: ["Product Designer", "UX Designer", "Senior Product Designer"],
    core: ["Figma", "User Research", "Prototyping", "Design Systems", "Interaction Design"],
    extra: ["Illustrator", "Usability Testing", "Accessibility"],
    companies: ["CRED", "Groww", "Meesho", "PhonePe"],
    domain: "fintech",
    work: (s) => `Led ${s} for the onboarding flow, cut drop-off by 22%`,
    customLabel: "Case Studies",
    certs: ["Google UX Design Certificate"],
    platforms: "design",
  },
  marketer: {
    id: "marketer",
    titles: ["B2B Marketing Manager", "Demand Generation Manager", "Growth Marketing Lead"],
    core: ["Demand Generation", "B2B Marketing", "HubSpot", "SEO", "Account Based Marketing"],
    extra: ["Content Strategy", "Google Analytics", "Email Marketing", "LinkedIn Ads"],
    companies: ["Freshworks", "Chargebee", "Zoho", "Postman"],
    domain: "b2b saas",
    work: (s) => `Owned ${s} programs that grew qualified pipeline 3x`,
    customLabel: "Campaigns",
    certs: ["HubSpot Inbound Marketing"],
  },
  sales: {
    id: "sales",
    titles: ["Account Executive", "Enterprise Account Executive", "Sales Manager"],
    core: ["Enterprise Sales", "Salesforce", "Negotiation", "Pipeline Management", "Solution Selling"],
    extra: ["Cold Calling", "Forecasting", "MEDDIC"],
    companies: ["Zoho", "LeadSquared", "Darwinbox", "Freshworks"],
    domain: "b2b saas",
    work: (s) => `Closed enterprise deals through ${s}, 140% of quota`,
    customLabel: "Deals Closed",
    certs: ["Challenger Sales Certification"],
  },
  writer: {
    id: "writer",
    titles: ["Content Writer", "Technical Writer", "Copywriter"],
    core: ["Copywriting", "Technical Writing", "Editing", "SEO", "Content Strategy"],
    extra: ["WordPress", "Research", "Storytelling"],
    companies: ["Hashnode", "YourStory", "Inc42", "Postman"],
    domain: "media",
    work: (s) => `Wrote and shipped ${s} for a 200k monthly reader blog`,
    customLabel: "Published Work",
    certs: ["Google Digital Garage"],
    platforms: "writing",
  },
  hr: {
    id: "hr",
    titles: ["HR Business Partner", "People Operations Manager", "Talent Acquisition Lead"],
    core: ["Recruiting", "Onboarding", "Employee Relations", "HRIS", "Payroll"],
    extra: ["Performance Management", "Compensation", "Labour Law"],
    companies: ["Infosys", "Flipkart", "Ola", "Myntra"],
    domain: "people",
    work: (s) => `Ran ${s} for a 900 person org across 4 offices`,
    customLabel: "Initiatives",
    certs: ["SHRM-CP"],
  },
  nurse: {
    id: "nurse",
    titles: ["Staff Nurse", "ICU Nurse", "Registered Nurse"],
    core: ["Patient Care", "ICU", "BLS", "ACLS", "Clinical Documentation"],
    extra: ["Wound Care", "Medication Administration", "Triage"],
    companies: ["Apollo Hospitals", "Fortis", "Manipal Hospitals", "AIIMS"],
    domain: "healthcare",
    work: (s) => `Delivered ${s} in a 30 bed critical care unit`,
    customLabel: "Clinical Rotations",
    certs: ["ACLS Provider", "BLS Provider"],
  },
  accountant: {
    id: "accountant",
    titles: ["Chartered Accountant", "Finance Manager", "Senior Accountant"],
    core: ["Financial Reporting", "GST", "Audit", "Tally", "IFRS"],
    extra: ["Taxation", "Budgeting", "Excel"],
    companies: ["Deloitte", "KPMG", "EY", "Grant Thornton"],
    domain: "finance",
    work: (s) => `Led ${s} for 12 mid-size clients, zero audit findings`,
    customLabel: "Engagements",
    certs: ["Chartered Accountant (ICAI)"],
  },
  analyst: {
    id: "analyst",
    titles: ["Data Analyst", "Business Analyst", "Analytics Engineer"],
    core: ["SQL", "Python", "Tableau", "Excel", "Statistics"],
    extra: ["Power BI", "A/B Testing", "dbt"],
    companies: ["Swiggy", "Zomato", "Dunzo", "Urban Company"],
    domain: "consumer",
    work: (s) => `Built ${s} dashboards used by 40 managers weekly`,
    customLabel: "Analyses",
    certs: ["Google Data Analytics"],
  },
};

/** Professions that share skills, so a "partially related" candidate exists for each job. */
export const ADJACENT: Record<ProfessionId, ProfessionId> = {
  backend: "analyst",
  designer: "writer",
  marketer: "writer",
  sales: "marketer",
  writer: "marketer",
  hr: "sales",
  nurse: "hr",
  accountant: "analyst",
  analyst: "backend",
};

export type Fit = "strong" | "partial" | "adjacent" | "unrelated";
export const FIT_LABEL: Record<Fit, number> = { strong: 3, partial: 2, adjacent: 1, unrelated: 0 };

/** Where a candidate puts their skills. Real Livefolios vary a lot here. */
export type Style = "listed" | "projects" | "custom" | "experience" | "sparse";
export const STYLES: Style[] = ["listed", "projects", "custom", "experience", "sparse"];

const CITIES = ["Bangalore", "Mumbai", "Hyderabad", "Pune", "Delhi", "Chennai", "Remote"];
const FIRST = ["Aarav", "Diya", "Kabir", "Meera", "Rohan", "Isha", "Vikram", "Anika", "Arjun", "Sara", "Neel", "Tara"];
const LAST = ["Sharma", "Iyer", "Khan", "Reddy", "Patel", "Das", "Menon", "Gupta", "Singh", "Nair"];

export type GeneratedCandidate = {
  key: string;
  name: string;
  email: string;
  profession: ProfessionId;
  fit: Fit;
  style: Style;
  years: number;
  city: string;
  snapshot: ApplicationSnapshotData;
};

export function buildCandidate(
  r: Rand,
  opts: {
    index: number;
    target: ProfessionId;
    fit: Fit;
    style: Style;
    minYears: number;
    emailDomain?: string;
    withProof?: boolean;
  },
): GeneratedCandidate {
  const { target, fit, style } = opts;
  const professionId: ProfessionId =
    fit === "strong" || fit === "partial"
      ? target
      : fit === "adjacent"
        ? ADJACENT[target]
        : pick(
            r,
            (Object.keys(PROFESSIONS) as ProfessionId[]).filter(
              (id) => id !== target && id !== ADJACENT[target],
            ),
          );
  const p = PROFESSIONS[professionId];
  const skills =
    fit === "strong"
      ? [...p.core, ...sample(r, p.extra, 2)]
      : fit === "partial"
        ? [...sample(r, p.core, 2), ...sample(r, p.extra, 1)]
        : [...sample(r, p.core, 4), ...sample(r, p.extra, 1)];
  const years =
    fit === "strong"
      ? opts.minYears + 1 + Math.floor(r() * 5)
      : fit === "partial"
        ? Math.max(0, opts.minYears - 2 + Math.floor(r() * 2))
        : 1 + Math.floor(r() * 9);
  const city = pick(r, CITIES);
  const name = `${pick(r, FIRST)} ${pick(r, LAST)}`;
  const title = pick(r, p.titles);
  const withProof = opts.withProof ?? r() < 0.7;

  const firstSpan = Math.max(1, Math.ceil(years / 2));
  const experiences: ApplicationSnapshotData["experiences"] =
    style === "sparse"
      ? []
      : [
          {
            company: pick(r, p.companies),
            role: title,
            description:
              style === "experience"
                ? skills.map(p.work).join(". ")
                : `${title} in ${p.domain}.`,
            startDate: yearsAgo(firstSpan),
            endDate: null,
            location: city,
          },
          ...(years - firstSpan > 0
            ? [
                {
                  company: pick(r, p.companies),
                  role: p.titles[0]!,
                  description:
                    style === "experience" ? p.work(skills[0]!) : `Early career in ${p.domain}.`,
                  startDate: yearsAgo(years),
                  endDate: yearsAgo(firstSpan),
                  location: city,
                },
              ]
            : []),
        ];

  const projects: ApplicationSnapshotData["projects"] =
    style === "projects"
      ? skills.slice(0, 4).map((skill, i) => ({
          title: `${p.domain} ${skill} project ${i + 1}`,
          description: p.work(skill),
          liveUrl: withProof ? `https://work.example.com/${opts.index}/${i}` : null,
          sourceUrl: null,
          techStack: [skill],
          featured: i === 0,
        }))
      : style === "listed" && withProof
        ? [
            {
              title: `${p.domain} launch`,
              description: p.work(skills[0]!),
              liveUrl: `https://work.example.com/${opts.index}/0`,
              sourceUrl: p.platforms === "dev" ? `https://github.com/x${opts.index}/svc` : null,
              techStack: skills.slice(0, 3),
              featured: true,
            },
          ]
        : [];

  const customSections: ApplicationSnapshotData["customSections"] =
    style === "custom"
      ? [
          {
            sectionType: "custom",
            label: p.customLabel,
            items: skills.slice(0, 5).map((skill, i) => ({
              title: `${skill} ${p.customLabel.toLowerCase()} ${i + 1}`,
              description: p.work(skill),
              link: withProof ? `https://work.example.com/${opts.index}/c${i}` : "",
            })),
          },
        ]
      : [];

  const snapshot: ApplicationSnapshotData = {
    version: 1,
    capturedAt: new Date().toISOString(),
    profile: {
      title: name,
      headline: style === "sparse" ? "" : title,
      summary:
        style === "sparse"
          ? `Hi, I am ${name.split(" ")[0]}.`
          : `${title} with ${years} years in ${p.domain}.`,
      avatarUrl: null,
      location: `${city}, India`,
      contactEmail: null,
      websiteUrl: null,
      slug: `qa-${opts.index}`,
    },
    experiences,
    educations: [
      {
        institution: "State University",
        degree: professionId === "nurse" ? "BSc Nursing" : professionId === "accountant" ? "B.Com" : "Bachelor's",
        field: p.domain,
        description: null,
        startDate: yearsAgo(years + 4),
        endDate: yearsAgo(years),
      },
    ],
    skills:
      style === "listed" || style === "sparse"
        ? skills.map((name) => ({ name, category: professionId, level: 4 }))
        : [],
    projects,
    articles:
      professionId === "writer" && style !== "sparse"
        ? [0, 1, 2].map((i) => ({
            title: `${skills[i % skills.length]} lessons ${i}`,
            description: p.work(skills[i % skills.length]!),
            url: `https://blog.example.com/${opts.index}/${i}`,
            tags: [skills[i % skills.length]!],
            publishedAt: yearsAgo(i * 0.3),
          }))
        : [],
    certifications:
      fit === "strong" && style !== "sparse"
        ? [{ name: p.certs[0]!, issuer: "Issuer", issueDate: yearsAgo(1), url: null }]
        : [],
    achievements: [],
    socialProfiles:
      p.platforms === "dev" && fit === "strong"
        ? [
            {
              platform: "github",
              url: `https://github.com/x${opts.index}`,
              username: `x${opts.index}`,
              cachedStats: { totalContributions: 40 + Math.floor(r() * 80) },
            },
          ]
        : p.platforms === "design" && fit === "strong"
          ? [{ platform: "behance", url: `https://behance.net/x${opts.index}`, username: null }]
          : [],
    customSections,
  };

  const domain = opts.emailDomain ?? "search-qa.livefolio.test";
  return {
    key: `${professionId}-${fit}-${style}-${opts.index}`,
    name,
    email: `qa-${opts.index}@${domain}`,
    profession: professionId,
    fit,
    style,
    years,
    city,
    snapshot,
  };
}

export type QaJob = {
  id: ProfessionId;
  input: JobJdInput;
  requirements: JobRequirementInput[];
  profile: JobSearchProfile;
};

export function profileHash(input: JobJdInput): string {
  return createHash("sha256").update(jobJdSource(input)).digest("hex").slice(0, 32);
}

/** What the AI extractor would plausibly return for each job, run through the real sanitizer. */
export function qaJob(id: ProfessionId, minYears = 4): QaJob {
  const p = PROFESSIONS[id];
  const families: Record<ProfessionId, string> = {
    backend: "engineering",
    designer: "design",
    marketer: "marketing",
    sales: "sales",
    writer: "writing",
    hr: "ops",
    nurse: "general",
    accountant: "general",
    analyst: "engineering",
  };
  const input: JobJdInput = {
    title: p.titles[0]!,
    description: `We are hiring a ${p.titles[0]} to join our ${p.domain} team. You will own ${p.core
      .slice(0, 3)
      .join(", ")} end to end.`,
    qualifications: `${minYears}+ years. Must know ${p.core.slice(0, 3).join(", ")}.`,
    location: "Bangalore",
    experienceMin: minYears,
  };
  const ai = {
    roleFamily: families[id],
    confidence: 0.85,
    seniority: "senior",
    minYears,
    location: "Bangalore",
    workplaceType: "hybrid",
    education: null,
    mustHaves: p.core.slice(0, 3),
    niceToHaves: p.core.slice(3),
    domains: [p.domain],
    responsibilities: [],
    digest: `A strong ${p.titles[0]} with hands-on ${p.core.slice(0, 2).join(" and ")} experience in ${p.domain}.`,
    gates: { github: id === "backend", leetcode: id === "backend", medium: id === "writer", liveUrl: true },
  };
  const hash = profileHash(input);
  return {
    id,
    input,
    requirements: [
      ...p.core.slice(0, 3).map((label) => ({ type: "required", category: "skill", label })),
      ...p.core.slice(3).map((label) => ({ type: "preferred", category: "skill", label })),
      { type: "required", category: "experience", label: `${minYears}+ years experience` },
    ],
    profile: sanitizeExtractedProfile(ai, hash, input),
  };
}

export function buildPool(
  seed: number,
  target: ProfessionId,
  size: number,
  mix: Record<Fit, number> = { strong: 0.1, partial: 0.2, adjacent: 0.2, unrelated: 0.5 },
  minYears = 4,
  emailDomain?: string,
): GeneratedCandidate[] {
  const r = rng(seed);
  const fits = Object.entries(mix) as Array<[Fit, number]>;
  const out: GeneratedCandidate[] = [];
  for (let i = 0; i < size; i++) {
    let roll = r();
    let fit: Fit = "unrelated";
    for (const [f, share] of fits) {
      if (roll < share) {
        fit = f;
        break;
      }
      roll -= share;
    }
    out.push(
      buildCandidate(r, {
        index: i,
        target,
        fit,
        style: STYLES[i % STYLES.length]!,
        minYears,
        emailDomain,
      }),
    );
  }
  return out;
}
