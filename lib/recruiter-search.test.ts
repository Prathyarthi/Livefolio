import { describe, expect, test } from "bun:test";
import {
  heuristicCompileQuery,
  scoreSignalAgainstAst,
} from "@/lib/recruiter-search";

describe("recruiter search", () => {
  test("heuristic compile extracts skills and years", () => {
    const ast = heuristicCompileQuery(
      "Looking for 3+ years React TypeScript engineer active on GitHub"
    );
    expect(ast.minYears).toBe(3);
    expect(ast.skills).toContain("react");
    expect(ast.skills).toContain("typescript");
    expect(ast.activeOnPlatformWithinDays?.platform).toBe("github");
  });

  test("baseline skill match works without integrations", () => {
    const hit = scoreSignalAgainstAst(
      {
        id: "1",
        corpusType: "dossier",
        candidateId: "c1",
        portfolioId: null,
        displayName: "Ada",
        headline: "Product designer",
        skills: ["Figma", "Design systems"],
        titles: ["Product Designer"],
        companies: ["Acme"],
        projectTech: ["Figma"],
        minYearsEstimate: 5,
        searchText: "product designer figma design systems",
        platformSignals: {},
        hasLiveDemo: false,
        hasPublishedContent: false,
      },
      { skills: ["figma"], minYears: 3 }
    );
    expect(hit).not.toBeNull();
    expect(hit!.score).toBeGreaterThan(0);
    expect(hit!.reasons.some((r) => r.type === "baseline")).toBe(true);
  });

  test("must activity filter excludes inactive profiles", () => {
    const hit = scoreSignalAgainstAst(
      {
        id: "2",
        corpusType: "dossier",
        candidateId: "c2",
        portfolioId: null,
        displayName: "Bob",
        headline: "Engineer",
        skills: ["react"],
        titles: ["Engineer"],
        companies: [],
        projectTech: ["react"],
        minYearsEstimate: 4,
        searchText: "react engineer",
        platformSignals: {
          github: { lastActiveAt: "2020-01-01" },
        },
        hasLiveDemo: false,
        hasPublishedContent: false,
      },
      {
        skills: ["react"],
        activeOnPlatformWithinDays: {
          platform: "github",
          days: 90,
          must: true,
        },
      }
    );
    expect(hit).toBeNull();
  });
});
