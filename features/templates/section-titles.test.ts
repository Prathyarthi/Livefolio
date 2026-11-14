import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getCustomSectionLabel,
  getSectionLabels,
  getSectionTitle,
  isSectionKey,
  MAX_SECTION_TITLE_CHARS,
  normalizeSectionTitles,
} from "./section-labels";

describe("section title overrides", () => {
  it("falls back to the template default when not renamed", () => {
    expect(getSectionTitle({}, "projects", "Selected Work")).toBe("Selected Work");
    expect(getSectionTitle({ sectionLabels: { projects: "  " } }, "projects", "Work")).toBe("Work");
    expect(getCustomSectionLabel(null, "about")).toBeNull();
  });

  it("uses the user's heading when set, keyed by the internal section key", () => {
    const c = { sectionLabels: { linkedin: "Professional Feed", experience: "Where I've Worked" } };
    expect(getSectionTitle(c, "linkedin", "LinkedIn")).toBe("Professional Feed");
    expect(getSectionLabels(c).experience).toBe("Where I've Worked");
    expect(getSectionLabels(c).projects).toBe("Projects");
  });

  it("normalizes input: known keys, trimmed, capped, empties dropped", () => {
    const out = normalizeSectionTitles({
      about: "  Who   I am ",
      projects: "",
      bogus: "x",
      skills: 5,
      articles: "a".repeat(80),
    });
    expect(out).toEqual({ about: "Who I am", articles: "a".repeat(MAX_SECTION_TITLE_CHARS) });
    expect(normalizeSectionTitles(null)).toEqual({});
    expect(isSectionKey("linkedin")).toBe(true);
    expect(isSectionKey("nope")).toBe(false);
  });
});

describe("every template renders the LinkedIn heading from labels", () => {
  const dir = join(import.meta.dir);
  const templates = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(dir, d.name, `${d.name}-template.tsx`))
    .filter((p) => {
      try {
        readFileSync(p);
        return true;
      } catch {
        return false;
      }
    });

  it("found all 27 templates", () => {
    expect(templates.length).toBe(27);
  });

  for (const file of templates) {
    it(`${file.split("/").at(-2)} has no hard-coded LinkedIn heading`, () => {
      const src = readFileSync(file, "utf8");
      const usesLabel = src.includes("labels.linkedin") || src.includes('customTitle("linkedin")');
      expect(usesLabel).toBe(true);
    });
  }
});
