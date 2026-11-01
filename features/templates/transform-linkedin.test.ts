import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { portfolioToTemplateData } from "./transform";
import {
  normalizeOrder,
  REORDERABLE_SECTIONS,
  renderSections,
  resolveSectionLayout,
} from "./section-order";
import { getTemplateSectionLayout } from "./section-layouts";

const base = {
  title: "Ada",
  customization: {},
  experiences: [],
  educations: [],
  skills: [],
  projects: [],
  socialProfiles: [],
  certifications: [],
  achievements: [],
  customSections: [],
  articles: [
    { id: "a1", title: "Blog", description: "", url: "https://dev.to/ada/x", tags: [], source: "devto" },
    { id: "a2", title: "Old LinkedIn mirror", description: "", url: "https://www.linkedin.com/posts/1", tags: [], source: "linkedin" },
  ],
};

describe("LinkedIn posts no longer in Articles", () => {
  it("filters legacy LinkedIn-sourced articles by source marker", () => {
    const data = portfolioToTemplateData(base);
    expect(data.articles.map((a) => a.id)).toEqual(["a1"]);
  });
});

describe("LinkedIn as its own reorderable section", () => {
  it("is a reorderable key placed right before profiles by default", () => {
    const keys = [...REORDERABLE_SECTIONS];
    expect(keys.indexOf("linkedin")).toBe(keys.indexOf("profiles") - 1);
  });

  it("inserts linkedin before profiles in legacy saved orders", () => {
    const legacy = ["profiles", "about", "projects", "experience", "education", "skills", "certifications", "achievements", "articles", "github"];
    const out = normalizeOrder(legacy);
    expect(out.slice(0, 3)).toEqual(["linkedin", "profiles", "about"]);
    expect(out).toHaveLength(REORDERABLE_SECTIONS.length);
  });

  it("keeps an explicitly saved linkedin position", () => {
    const out = normalizeOrder(["linkedin", "about", "profiles"]);
    expect(out.slice(0, 3)).toEqual(["linkedin", "about", "profiles"]);
  });

  it("moves and hides independently of profiles", () => {
    const layout = getTemplateSectionLayout("minimal");
    const blocks = {
      about: createElement("section", { id: "about" }),
      linkedin: createElement("section", { id: "linkedin" }),
      profiles: createElement("section", { id: "profiles" }),
    };
    const moved = resolveSectionLayout(layout, { sectionLayout: { order: ["linkedin", "about", "profiles"] } });
    expect(renderSections(moved, "full", blocks).map((n) => (n as { key: string }).key)).toEqual(["linkedin", "about", "profiles"]);

    const hidden = resolveSectionLayout(layout, { sectionLayout: { hidden: ["linkedin"] } });
    expect(renderSections(hidden, "full", blocks).map((n) => (n as { key: string }).key)).toEqual(["about", "profiles"]);

    const profilesHidden = resolveSectionLayout(layout, { sectionLayout: { hidden: ["profiles"] } });
    expect(renderSections(profilesHidden, "full", blocks).map((n) => (n as { key: string }).key)).toEqual(["about", "linkedin"]);
  });

  it("every template layout includes linkedin", () => {
    for (const id of ["minimal", "bento", "veil", "developer", "windows", "blueprint", "pulse", "ledger"]) {
      expect(getTemplateSectionLayout(id).groups[0]!.defaultOrder).toContain("linkedin");
    }
  });
});
