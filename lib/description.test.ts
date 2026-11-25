import { describe, expect, test } from "bun:test";
import {
  isHeadingLine,
  normalizeDescription,
  parseDescription,
  serializeDescription,
} from "@/lib/description";
import { normalizeParsedResume } from "@/lib/gemini";

describe("isHeadingLine", () => {
  test("accepts short resume labels", () => {
    expect(isHeadingLine("Achievements:")).toBe(true);
    expect(isHeadingLine("Key Responsibilities:")).toBe(true);
  });

  test("rejects sentences and long lines", () => {
    expect(isHeadingLine("Built APIs for payments across 12 services.")).toBe(
      false,
    );
    expect(isHeadingLine("https://example.com:")).toBe(false);
  });
});

describe("parseDescription", () => {
  test("keeps a single line as a paragraph", () => {
    expect(parseDescription("Worked on backend systems")).toEqual([
      { type: "paragraph", text: "Worked on backend systems" },
    ]);
  });

  test("treats consecutive lines as a list", () => {
    expect(parseDescription("Built the platform\nCut latency 40%")).toEqual([
      { type: "list", items: ["Built the platform", "Cut latency 40%"] },
    ]);
  });

  test("treats label lines as headings", () => {
    expect(
      parseDescription("Impact:\nCut p95 latency 40%\nShipped billing rewrite"),
    ).toEqual([
      { type: "heading", text: "Impact" },
      {
        type: "list",
        items: ["Cut p95 latency 40%", "Shipped billing rewrite"],
      },
    ]);
  });

  test("treats blank-separated paragraphs as a list", () => {
    expect(parseDescription("Did X.\n\nDid Y.")).toEqual([
      { type: "list", items: ["Did X.", "Did Y."] },
    ]);
  });

  test("keeps a prose block separate from a following list", () => {
    expect(
      parseDescription(
        "Led the platform team for 3 years.\n\nCut p95 latency 40%\nShipped billing rewrite",
      ),
    ).toEqual([
      { type: "paragraph", text: "Led the platform team for 3 years." },
      {
        type: "list",
        items: ["Cut p95 latency 40%", "Shipped billing rewrite"],
      },
    ]);
  });

  test("strips source bullet markers", () => {
    expect(parseDescription("• Did X\n- Did Y")).toEqual([
      { type: "list", items: ["Did X", "Did Y"] },
    ]);
  });

  test("turns HTML list items into a list", () => {
    expect(
      parseDescription("<ul><li>Did X</li><li>Did Y</li></ul>"),
    ).toEqual([{ type: "list", items: ["Did X", "Did Y"] }]);
  });

  test("turns HTML paragraphs into a list", () => {
    expect(parseDescription("<p>Did X</p><p>Did Y</p>")).toEqual([
      { type: "list", items: ["Did X", "Did Y"] },
    ]);
  });

  test("turns HTML line breaks into a list", () => {
    expect(parseDescription("<p>Did X<br>Did Y</p>")).toEqual([
      { type: "list", items: ["Did X", "Did Y"] },
    ]);
  });

  test("strips stranded markdown hard-break backslashes", () => {
    expect(
      parseDescription(
        "testing I am a good engineer\\\ntesting I am a good engineer\\",
      ),
    ).toEqual([
      {
        type: "list",
        items: [
          "testing I am a good engineer",
          "testing I am a good engineer",
        ],
      },
    ]);
  });
});

describe("normalizeDescription", () => {
  test("serializes structured blocks from the parser", () => {
    expect(
      normalizeDescription([
        { type: "heading", text: "Impact" },
        { type: "list", items: ["Cut p95 latency 40%", "Shipped billing rewrite"] },
      ]),
    ).toBe("Impact:\nCut p95 latency 40%\nShipped billing rewrite");
  });

  test("turns a string array into a list", () => {
    expect(normalizeDescription(["Did X", "Did Y"])).toBe("Did X\nDid Y");
  });

  test("round-trips heading plus list", () => {
    const stored = "Impact:\nCut p95 latency 40%\nShipped billing rewrite";
    expect(serializeDescription(parseDescription(stored))).toBe(stored);
  });
});

describe("normalizeParsedResume descriptions", () => {
  test("does not put company or role into description", () => {
    const parsed = normalizeParsedResume({
      name: "Ada",
      headline: "Engineer",
      summary: "",
      experiences: [
        {
          company: "Acme",
          role: "Engineer",
          description: [
            { type: "heading", text: "Impact" },
            { type: "list", items: ["Shipped the rewrite"] },
          ],
        },
      ],
    });

    expect(parsed.experiences[0]).toMatchObject({
      company: "Acme",
      role: "Engineer",
      description: "Impact:\nShipped the rewrite",
    });
  });

  test("leaves missing dates and location empty", () => {
    const parsed = normalizeParsedResume({
      name: "Ada",
      experiences: [{ company: "Acme", role: "Engineer", description: "Did X" }],
    });

    expect(parsed.experiences[0]?.startDate).toBeNull();
    expect(parsed.experiences[0]?.endDate).toBeNull();
    expect(parsed.experiences[0]?.location).toBeNull();
  });
});