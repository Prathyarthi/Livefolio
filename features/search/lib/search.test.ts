import { describe, expect, test } from "bun:test";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { buildSearchFacets } from "@/features/search/lib/facets";
import { matchesStructuredFilters } from "@/features/search/lib/filters";
import {
  blobHasTerm,
  matchesInterpretedQuery,
  snapshotSearchBlob,
} from "@/features/search/lib/match";
import { proofKindsOf } from "@/features/search/lib/proof";
import { interpretSearchQuery, termAsTyped } from "@/features/search/lib/query";
import {
  rankAgainstJob,
  rankAgainstQuery,
  rankCandidate,
} from "@/features/search/lib/rank";
import {
  detectRoleFamily,
  emptySearchProfile,
  gatesForRole,
  type JobSearchProfile,
  type RoleFamily,
} from "@/features/jobs/lib/search-profile";

function snapshot(
  overrides: Partial<Omit<ApplicationSnapshotData, "profile">> & {
    profile?: Partial<ApplicationSnapshotData["profile"]>;
  } = {},
): ApplicationSnapshotData {
  const { profile, ...rest } = overrides;
  return {
    version: 1,
    capturedAt: new Date().toISOString(),
    profile: {
      title: "Candidate",
      headline: "",
      summary: "",
      avatarUrl: null,
      location: null,
      contactEmail: null,
      websiteUrl: null,
      slug: null,
      ...profile,
    },
    experiences: [],
    educations: [],
    skills: [],
    projects: [],
    articles: [],
    certifications: [],
    achievements: [],
    socialProfiles: [],
    customSections: [],
    ...rest,
  };
}

function yearsAgo(years: number): string {
  return new Date(Date.now() - years * 365.25 * 24 * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function jobProfile(
  roleFamily: RoleFamily,
  overrides: Partial<JobSearchProfile> = {},
): JobSearchProfile {
  return emptySearchProfile("test", {
    roleFamily,
    confidence: 0.8,
    gates: gatesForRole(roleFamily, 0.8),
    ...overrides,
  });
}

const skill = (name: string, category = "") => ({ name, category, level: null });

describe("interpretSearchQuery", () => {
  test("pulls years, location, phrases, OR and exclusions out of recruiter text", () => {
    const parsed = interpretSearchQuery(
      '5 years "content strategy" OR seo in Bangalore NOT agency -fmcg',
    );
    expect(parsed.minExperience).toBe(5);
    expect(parsed.location?.toLowerCase()).toBe("bangalore");
    expect(parsed.phrases).toEqual(["content strategy"]);
    expect(parsed.matchAny).toBe(true);
    expect(parsed.exclude).toEqual(["agency", "fmcg"]);
    expect(parsed.keywords).toContain("content strategy");
    expect(parsed.keywords).toContain("seo");
    expect(parsed.keywords).not.toContain("agency");
  });

  test("reasons show search terms as the recruiter typed them", () => {
    expect(termAsTyped("B2B Marketing in Pune", "b2b")).toBe("B2B");
    expect(termAsTyped("Node.js and SQL", "sql")).toBe("SQL");
    expect(termAsTyped("hubspot", "hubspot")).toBe("hubspot");
  });

  test("excludes quoted phrases and keeps quoted words out of location parsing", () => {
    const parsed = interpretSearchQuery('"in house" designer NOT "print design"');
    expect(parsed.location).toBeUndefined();
    expect(parsed.phrases).toEqual(["in house"]);
    expect(parsed.exclude).toEqual(["print design"]);
  });

  test("expands skills through synonym families", () => {
    const parsed = interpretSearchQuery("seo");
    expect(parsed.skills).toContain("search engine optimization");
  });
});

describe("term matching", () => {
  test("does not let short tokens match inside other words", () => {
    expect(blobHasTerm("java spring developer", "js")).toBe(false);
    expect(blobHasTerm("built with js and css", "javascript")).toBe(true);
  });

  test("treats Next.js and nextjs as the same skill", () => {
    const blob = snapshotSearchBlob(
      snapshot({ skills: [skill("Next.js")] }),
    );
    expect(blobHasTerm(blob, "nextjs")).toBe(true);
    expect(blobHasTerm(blob, "next.js")).toBe(true);
  });

  test("matches non-engineering synonyms", () => {
    expect(blobHasTerm("search engine optimization lead", "seo")).toBe(true);
    expect(blobHasTerm("talent acquisition partner", "recruiting")).toBe(true);
    expect(blobHasTerm("ran key account management", "account management")).toBe(true);
  });

  test("AND, OR and NOT behave like recruiter Boolean search", () => {
    const blob = snapshotSearchBlob(
      snapshot({ skills: [skill("SEO"), skill("Copywriting")] }),
    );
    expect(matchesInterpretedQuery(blob, interpretSearchQuery("seo copywriting"))).toBe(true);
    expect(matchesInterpretedQuery(blob, interpretSearchQuery("seo figma"))).toBe(false);
    expect(matchesInterpretedQuery(blob, interpretSearchQuery("seo OR figma"))).toBe(true);
    expect(matchesInterpretedQuery(blob, interpretSearchQuery("seo NOT copywriting"))).toBe(false);
  });
});

describe("role detection", () => {
  test("does not mistake non-engineering titles for engineering", () => {
    expect(detectRoleFamily("Content Platform Manager").roleFamily).not.toBe("engineering");
    expect(detectRoleFamily("Senior Product Designer").roleFamily).toBe("design");
    expect(detectRoleFamily("Account Executive, Mid-Market").roleFamily).toBe("sales");
    expect(detectRoleFamily("Mobile Marketing Manager").roleFamily).toBe("marketing");
    expect(detectRoleFamily("Platform Engineer").roleFamily).toBe("engineering");
    expect(detectRoleFamily("iOS Developer").roleFamily).toBe("engineering");
  });
});

describe("ranking works for every kind of Livefolio", () => {
  test("a strong marketer can score as high as a strong engineer", () => {
    const marketer = snapshot({
      profile: { title: "Priya", headline: "Growth marketer" },
      skills: [skill("SEO"), skill("Content strategy"), skill("Google Analytics")],
      experiences: [
        {
          company: "Acme",
          role: "Marketing Manager",
          description: "Owned SEO and content strategy",
          startDate: yearsAgo(5),
          endDate: null,
          location: null,
        },
      ],
      articles: [
        {
          title: "How we grew organic traffic 4x with SEO",
          description: "Content strategy playbook",
          url: "https://example.com/seo",
          tags: ["seo", "content strategy"],
          publishedAt: daysAgo(30),
        },
      ],
      certifications: [
        { name: "Google Analytics", issuer: "Google", issueDate: null, url: "https://example.com/cert" },
      ],
    });
    const marketing = jobProfile("marketing", {
      mustHaves: ["SEO", "content strategy", "Google Analytics"],
      minYears: 3,
    });
    const rank = rankAgainstJob(marketer, marketing, {
      freshnessAt: daysAgo(2),
    });
    // Platform activity does not apply to marketing roles, so its weight is redistributed.
    expect(rank.platform).toBe(0);
    expect(rank.proven).toBeGreaterThan(0.5);
    expect(rank.score).toBeGreaterThanOrEqual(85);
    expect(rank.reasons.some((r) => r.startsWith("Must-have"))).toBe(true);
  });

  test("published writing counts as proof and platform activity for writing roles", () => {
    const writer = snapshot({
      skills: [skill("Technical writing")],
      articles: Array.from({ length: 8 }, (_, i) => ({
        title: `API documentation guide ${i}`,
        description: "Technical writing for developers",
        url: `https://example.com/${i}`,
        tags: ["documentation"],
        publishedAt: daysAgo(20 * (i + 1)),
      })),
    });
    const writing = jobProfile("writing", { mustHaves: ["technical writing"] });
    const rank = rankAgainstJob(writer, writing);
    expect(rank.platform).toBeGreaterThan(0.3);
    expect(rank.proven).toBeGreaterThan(0);
    expect(rank.reasons.some((r) => r.includes("published pieces"))).toBe(true);
  });

  test("a designer's case studies in custom sections count as live proof", () => {
    const designer = snapshot({
      skills: [skill("Figma"), skill("User research")],
      customSections: [
        {
          sectionType: "case_studies",
          label: "Case studies",
          items: [
            {
              title: "Checkout redesign",
              summary: "Figma prototypes and user research that lifted conversion",
              link: "https://example.com/checkout",
            },
          ],
        },
      ],
    });
    const design = jobProfile("design", { mustHaves: ["figma", "user research"] });
    const rank = rankAgainstJob(designer, design);
    expect(rank.proven).toBeGreaterThan(0);
    expect(rank.reasons.some((r) => r.startsWith("Case studies"))).toBe(true);
    expect(proofKindsOf(designer)).toContain("live");
  });

  test("certifications are proof for sales and ops candidates", () => {
    const seller = snapshot({
      skills: [skill("Salesforce"), skill("B2B sales")],
      certifications: [
        { name: "Salesforce Certified Administrator", issuer: "Salesforce", issueDate: null, url: "https://example.com/c" },
      ],
    });
    const sales = jobProfile("sales", { mustHaves: ["salesforce"] });
    expect(rankAgainstJob(seller, sales).proven).toBeGreaterThan(0);
    expect(proofKindsOf(seller)).toContain("certified");
  });

  test("work experience and unlinked credentials count as proof", () => {
    const nurse = snapshot({
      skills: [skill("Patient Care"), skill("ICU")],
      experiences: [
        {
          company: "Apollo",
          role: "ICU Nurse",
          description: "Patient care in a 30-bed ICU, BLS and ACLS daily",
          startDate: yearsAgo(6),
          endDate: null,
          location: null,
        },
      ],
      certifications: [
        { name: "BLS Provider", issuer: "AHA", issueDate: null, url: null },
      ],
      achievements: [{ title: "Nurse of the year", date: null }],
    });
    const job = jobProfile("general", { mustHaves: ["patient care", "ICU"] });
    const rank = rankAgainstJob(nurse, job);
    expect(rank.proven).toBeGreaterThanOrEqual(0.7);
    expect(rank.reasons.some((r) => r.includes("ICU Nurse"))).toBe(true);
  });

  test("an engineer with GitHub and experience is not crushed by someone who only linked a project", () => {
    const listed = snapshot({
      skills: [skill("Node.js"), skill("PostgreSQL"), skill("TypeScript")],
      experiences: [
        {
          company: "Swiggy",
          role: "Backend Engineer",
          description: "Built Node.js and PostgreSQL services in TypeScript",
          startDate: yearsAgo(8),
          endDate: null,
          location: null,
        },
      ],
      socialProfiles: [
        {
          platform: "github",
          url: "https://github.com/x",
          username: "x",
          cachedStats: { totalContributions: 68 },
        },
      ],
    });
    const linked = snapshot({
      skills: [skill("Node.js")],
      projects: [
        {
          title: "API",
          description: "Node.js PostgreSQL TypeScript",
          liveUrl: "https://example.com",
          sourceUrl: null,
          techStack: ["Node.js"],
          featured: true,
        },
      ],
    });
    const eng = jobProfile("engineering", {
      mustHaves: ["Node.js", "PostgreSQL", "TypeScript"],
      minYears: 4,
    });
    const listedRank = rankAgainstJob(listed, eng);
    const linkedRank = rankAgainstJob(linked, eng);
    expect(listedRank.proven).toBeGreaterThan(0.6);
    expect(listedRank.score).toBeGreaterThan(linkedRank.score - 8);
  });

  test("engineers still get credit for GitHub activity", () => {
    const engineer = snapshot({
      skills: [skill("React")],
      projects: [
        {
          title: "Dashboard",
          description: "React app",
          liveUrl: "https://example.com",
          sourceUrl: "https://github.com/x/y",
          techStack: ["React"],
          featured: true,
        },
      ],
      socialProfiles: [
        {
          platform: "github",
          url: "https://github.com/x",
          username: "x",
          cachedStats: { totalContributions: 120 },
        },
      ],
    });
    const eng = jobProfile("engineering", { mustHaves: ["react"] });
    const rank = rankAgainstJob(engineer, eng);
    expect(rank.platform).toBeGreaterThan(0.5);
    expect(rank.reasons.some((r) => r.startsWith("GitHub"))).toBe(true);
  });

  test("extra years do not outrank someone who already meets the JD", () => {
    const four = snapshot({
      skills: [skill("Excel")],
      experiences: [
        {
          company: "A",
          role: "Analyst",
          description: "Excel models",
          startDate: yearsAgo(4),
          endDate: null,
          location: null,
        },
      ],
    });
    const twelve = snapshot({
      skills: [skill("Excel")],
      experiences: [
        {
          company: "B",
          role: "Analyst",
          description: "Excel models",
          startDate: yearsAgo(12),
          endDate: null,
          location: null,
        },
      ],
    });
    const job = jobProfile("general", { mustHaves: ["excel"], minYears: 4 });
    expect(rankAgainstJob(twelve, job).score).toBe(rankAgainstJob(four, job).score);
    expect(rankAgainstJob(four, job).fit).toBe(rankAgainstJob(twelve, job).fit);
  });

  test("education and a matching role beat a skills-only profile when the JD asks for them", () => {
    const skilledOnly = snapshot({ skills: [skill("Audit"), skill("GST")] });
    const withContext = snapshot({
      skills: [skill("Audit"), skill("GST")],
      experiences: [
        {
          company: "KPMG",
          role: "Chartered Accountant",
          description: "Audit and GST for mid-size clients",
          startDate: yearsAgo(5),
          endDate: null,
          location: null,
        },
      ],
      educations: [
        {
          institution: "ICAI",
          degree: "CA",
          field: "Chartered Accountancy",
          description: null,
          startDate: null,
          endDate: null,
        },
      ],
    });
    const job = jobProfile("general", {
      mustHaves: ["audit", "GST"],
      education: "CA",
      digest: "Chartered Accountant for a finance team in audit and GST",
      domains: ["finance"],
    });
    expect(rankAgainstJob(withContext, job).fit).toBeGreaterThan(
      rankAgainstJob(skilledOnly, job).fit,
    );
    expect(rankAgainstJob(withContext, job).score).toBeGreaterThan(
      rankAgainstJob(skilledOnly, job).score,
    );
  });

  test("a listed skill outranks a passing mention", () => {
    const listed = snapshot({ skills: [skill("Excel")] });
    const mentioned = snapshot({ profile: { summary: "I once opened Excel" } });
    const query = interpretSearchQuery("excel");
    expect(rankAgainstQuery(listed, query).overlap).toBeGreaterThan(
      rankAgainstQuery(mentioned, query).overlap,
    );
  });

  test("an OR query is satisfied by the strongest term", () => {
    const designer = snapshot({ skills: [skill("Figma")] });
    const rank = rankAgainstQuery(designer, interpretSearchQuery("figma OR sketch OR photoshop"));
    expect(rank.overlap).toBeGreaterThan(0.8);
  });

  test("recent activity breaks ties", () => {
    const person = snapshot({ skills: [skill("Excel")] });
    const query = interpretSearchQuery("excel");
    const fresh = rankCandidate(person, { query, extras: { freshnessAt: daysAgo(1) } });
    const stale = rankCandidate(person, { query, extras: { freshnessAt: daysAgo(400) } });
    expect(fresh.score).toBeGreaterThan(stale.score);
  });
});

describe("facets and proof filters", () => {
  test("counts skills, locations, experience bands and proof across roles", () => {
    const people = [
      snapshot({
        profile: { location: "Bangalore, India" },
        skills: [skill("SEO")],
        articles: [{ title: "a", description: "", url: "https://a", tags: [], publishedAt: null }],
        experiences: [
          { company: "A", role: "Marketer", description: "", startDate: yearsAgo(4), endDate: null, location: null },
        ],
      }),
      snapshot({
        profile: { location: "Bangalore" },
        skills: [skill("seo"), skill("Figma")],
        achievements: [{ title: "Best campaign award", date: null }],
      }),
    ];
    const facets = buildSearchFacets(people);
    expect(facets.skills.find((b) => b.id === "seo")?.count).toBe(2);
    expect(facets.locations.find((b) => b.id === "bangalore")?.count).toBe(2);
    expect(facets.experience).toEqual([{ id: "3-5", label: "3–5 years", count: 1 }]);
    expect(facets.proof.map((b) => b.id)).toEqual(["writing", "awards"]);
  });

  test("proof and synonym-aware skill filters", () => {
    const person = snapshot({
      skills: [skill("Search engine optimization")],
      certifications: [{ name: "PMP", issuer: "PMI", issueDate: null, url: null }],
    });
    const now = new Date();
    expect(matchesStructuredFilters(person, { skill: "seo" }, now)).toBe(true);
    expect(matchesStructuredFilters(person, { skill: "project management professional" }, now)).toBe(true);
    expect(matchesStructuredFilters(person, { proof: "certified" }, now)).toBe(true);
    expect(matchesStructuredFilters(person, { proof: "writing" }, now)).toBe(false);
  });
});
