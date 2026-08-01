import { describe, expect, test } from "bun:test";
import { buildClaimsVsProof } from "@/lib/recruiter-claims-proof";
import type { ParsedResume } from "@/lib/gemini";

const baseParsed: ParsedResume = {
  name: "Casey",
  headline: "Designer",
  summary: "Design systems and Figma",
  contact: {
    email: null,
    phone: null,
    websiteUrl: null,
    location: null,
  },
  socialProfiles: [],
  experiences: [
    {
      company: "Acme",
      role: "Product Designer",
      description: "Led design systems",
      startDate: "2020-01-01",
      endDate: null,
      location: null,
    },
  ],
  education: [],
  skills: [{ name: "Figma", category: "design" }],
  projects: [
    {
      title: "Design kit",
      description: "Figma library",
      techStack: ["Figma"],
      liveUrl: null,
      sourceUrl: null,
    },
  ],
  achievements: [],
  certifications: [],
  customSections: [],
};

describe("claims vs proof", () => {
  test("marks skill as supported when present in work samples", () => {
    const items = buildClaimsVsProof({
      parsed: baseParsed,
      platformStats: [],
      projectTitles: ["Design kit"],
      projectTech: ["Figma"],
      projectDescriptions: ["Figma library"],
    });
    const figma = items.find((i) => i.claim === "Figma");
    expect(figma?.status).toBe("supported");
  });
});
