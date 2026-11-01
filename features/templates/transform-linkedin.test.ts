import { describe, expect, it } from "bun:test";
import { createElement, Fragment, isValidElement } from "react";
import { portfolioToTemplateData } from "./transform";
import { withLinkedInBeforeProfiles } from "./section-order";

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

describe("withLinkedInBeforeProfiles", () => {
  it("places LinkedIn in the profiles slot, before profiles", () => {
    const profiles = createElement("section", { id: "profiles" });
    const linkedin = createElement("section", { id: "linkedin" });
    const out = withLinkedInBeforeProfiles({ profiles }, linkedin).profiles;
    expect(isValidElement(out)).toBe(true);
    const el = out as React.ReactElement<{ children: unknown[] }>;
    expect(el.type).toBe(Fragment);
    expect(el.props.children).toEqual([linkedin, profiles]);
  });

  it("renders LinkedIn even without profiles, and is a no-op without LinkedIn", () => {
    const linkedin = createElement("section", { id: "linkedin" });
    const out = withLinkedInBeforeProfiles({ profiles: null }, linkedin).profiles as React.ReactElement<{ children: unknown[] }>;
    expect(out.props.children).toEqual([linkedin, null]);
    const blocks = { profiles: false };
    expect(withLinkedInBeforeProfiles(blocks, null)).toBe(blocks);
  });
});
