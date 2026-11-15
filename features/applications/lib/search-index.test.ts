import { describe, expect, test } from "bun:test";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import {
  applicantPoolWhere,
  filterApplicantsBySearch,
  type ApplicantSearchFilters,
} from "@/features/applications/lib/search";
import {
  buildPoolGapReport,
  buildPoolGapReportFromKeys,
} from "@/features/applications/lib/pool-gaps";
import { buildApplicantEvidence } from "@/features/applications/lib/evidence";
import {
  buildSearchIndexFields,
  searchIndexKey,
  type SearchIndexFields,
} from "@/features/applications/lib/search-index";
import {
  emptySearchProfile,
  gatesForRole,
} from "@/features/jobs/lib/search-profile";
import { rankAgainstJob } from "@/features/search/lib/rank";

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

const skill = (name: string) => ({ name, category: "", level: null });
const yearsAgo = (years: number) =>
  new Date(Date.now() - years * 365.25 * 864e5).toISOString();

const requirements = [
  { type: "required", category: "skill", label: "SEO" },
  { type: "preferred", category: "skill", label: "Figma" },
];
const profile = emptySearchProfile("hash-a", {
  roleFamily: "marketing",
  confidence: 0.8,
  gates: gatesForRole("marketing", 0.8),
  mustHaves: ["SEO", "content strategy"],
});

const people: Array<{ name: string; email: string; snapshot: ApplicationSnapshotData }> = [
  {
    name: "Priya",
    email: "priya@example.com",
    snapshot: snapshot({
      profile: { title: "Priya", location: "Bangalore, India" },
      skills: [skill("Search engine optimization"), skill("Content strategy")],
      experiences: [
        {
          company: "Acme",
          role: "Marketing Manager",
          description: "Owned organic growth",
          startDate: yearsAgo(5),
          endDate: null,
          location: "Bangalore",
        },
      ],
      articles: [
        { title: "SEO playbook", description: "", url: "https://a", tags: ["seo"], publishedAt: null },
      ],
    }),
  },
  {
    name: "Arjun",
    email: "arjun@example.com",
    snapshot: snapshot({
      profile: { title: "Arjun", location: "Pune" },
      skills: [skill("Figma"), skill("Next.js")],
      educations: [
        {
          institution: "NID",
          degree: "B.Des",
          field: "Interaction design",
          description: null,
          startDate: null,
          endDate: null,
        },
      ],
    }),
  },
  {
    name: "Meera",
    email: "meera@example.com",
    snapshot: snapshot({
      profile: { title: "Meera", location: "Remote" },
      skills: [skill("Java"), skill("Salesforce")],
      certifications: [{ name: "PMP", issuer: "PMI", issueDate: null, url: null }],
    }),
  },
];

function indexOf(person: (typeof people)[number]): SearchIndexFields {
  return buildSearchIndexFields(person.snapshot, {
    key: searchIndexKey(profile, requirements),
    profile,
    requirements,
    name: person.name,
    email: person.email,
  });
}

type Row = SearchIndexFields & { jobId: string; stage: string; submittedAt: Date };

/** Evaluates the subset of Prisma where-syntax `applicantPoolWhere` emits, like Postgres would. */
function evaluate(where: Record<string, unknown>, row: Row): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === "AND") return (value as Record<string, unknown>[]).every((w) => evaluate(w, row));
    if (key === "OR") return (value as Record<string, unknown>[]).some((w) => evaluate(w, row));
    const field = (row as unknown as Record<string, unknown>)[key];
    if (typeof value !== "object" || value === null || value instanceof Date) return field === value;
    const op = value as Record<string, unknown>;
    if ("contains" in op) {
      return String(field ?? "").toLowerCase().includes(String(op.contains).toLowerCase());
    }
    if ("has" in op) return (field as unknown[]).includes(op.has);
    if ("gte" in op) return field != null && (field as number | Date) >= (op.gte as number | Date);
    if ("lte" in op) return field != null && (field as number | Date) <= (op.lte as number | Date);
    throw new Error(`Unsupported operator in ${key}`);
  });
}

describe("search index fields", () => {
  test("store the job score, facets and matched requirements computed from the snapshot", () => {
    const fields = indexOf(people[0]!);
    expect(fields.rankScore).toBe(
      rankAgainstJob(people[0]!.snapshot, profile, { name: "Priya", email: "priya@example.com" }).score,
    );
    expect(fields.skillNames).toEqual(["Search engine optimization", "Content strategy"]);
    expect(fields.locationLabel).toBe("Bangalore");
    expect(fields.yearsExperience).toBe(5);
    expect(fields.proofKinds).toEqual(["writing"]);
    expect(fields.matchedRequirements).toContain("required|SEO");
    expect(fields.searchText).toContain("priya");
  });

  test("the key changes when anything that affects stored scores changes", () => {
    const base = searchIndexKey(profile, requirements);
    expect(searchIndexKey(profile, requirements)).toBe(base);
    expect(searchIndexKey({ ...profile, sourceHash: "hash-b" }, requirements)).not.toBe(base);
    expect(searchIndexKey(profile, [...requirements, { type: "required", category: "skill", label: "Excel" }])).not.toBe(base);
  });

  test("custom-section work counts toward requirements and is labelled by its title", () => {
    // Key order as Postgres jsonb returns it: shorter keys first, so the link precedes the title.
    const campaigns = snapshot({
      customSections: [
        {
          sectionType: "custom",
          label: "Campaigns",
          items: [
            {
              link: "https://work.example.com/c0",
              title: "SEO relaunch",
              description: "Rebuilt organic search for a B2B SaaS site",
            },
          ],
        },
      ],
    });
    const fields = buildSearchIndexFields(campaigns, {
      key: searchIndexKey(profile, requirements),
      profile,
      requirements,
    });
    expect(fields.matchedRequirements).toContain("required|SEO");
    const seo = buildApplicantEvidence(campaigns, requirements).requirementMatches[0]!;
    expect(seo.evidence[0]).toMatchObject({ kind: "project", label: "Campaigns: SEO relaunch" });
    expect(fields.rankReasons).toContain("Campaigns: SEO relaunch");
    expect(fields.rankReasons.join(" ")).not.toContain("https://");
  });

  test("gap report from stored keys matches the snapshot-based report", () => {
    const evidence = people.map((p) => ({
      evidence: buildApplicantEvidence(p.snapshot, requirements),
    }));
    expect(buildPoolGapReportFromKeys(people.map((p) => indexOf(p).matchedRequirements), requirements)).toEqual(
      buildPoolGapReport(evidence, requirements),
    );
  });
});

describe("applicant pool SQL", () => {
  const submittedAt = new Date("2026-10-20T10:00:00Z");
  const rows: Row[] = people.map((p) => ({
    ...indexOf(p),
    jobId: "job-1",
    stage: "new",
    submittedAt,
  }));
  const items = people.map((p) => ({
    snapshot: p.snapshot,
    submittedAt,
    user: { name: p.name, email: p.email },
    coverNote: null,
  }));

  test("column-only filters are answered exactly in SQL", () => {
    expect(applicantPoolWhere("job-1", undefined, { proof: "writing" }).exact).toBe(true);
    expect(applicantPoolWhere("job-1", "new", { minExperience: 3, maxExperience: 6 }).exact).toBe(true);
    expect(applicantPoolWhere("job-1", undefined, { q: "seo" }).exact).toBe(false);
    expect(applicantPoolWhere("job-1", undefined, { q: "designer -print" }).exact).toBe(false);
  });

  const cases: ApplicantSearchFilters[] = [
    {},
    { q: "seo" },
    { q: "nextjs" },
    { q: "next.js" },
    { q: "figma OR salesforce" },
    { q: '"content strategy" in Bangalore' },
    { q: "java" },
    { q: "js" },
    { q: "seo -java" },
    { q: "project management professional" },
    { skill: "seo" },
    { location: "bangalore" },
    { role: "marketing manager" },
    { education: "nid" },
    { proof: "certified" },
    { minExperience: 3 },
    { q: "5 years seo" },
  ];

  for (const filters of cases) {
    test(`never drops a candidate the exact matcher keeps: ${JSON.stringify(filters)}`, () => {
      const exact = filterApplicantsBySearch(items, filters).map((i) => i.user.name);
      const { where, exact: isExact } = applicantPoolWhere("job-1", undefined, filters);
      const recalled = people
        .filter((_, index) => evaluate(where as Record<string, unknown>, rows[index]!))
        .map((p) => p.name);
      for (const name of exact) expect(recalled).toContain(name);
      if (isExact) expect(recalled.sort()).toEqual([...exact].sort());
    });
  }
});
