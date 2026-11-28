import { describe, expect, test } from "bun:test";
import {
  inlineRichTextToSafeHtml,
  repairStrandedEmphasis,
} from "@/lib/rich-text";

describe("repairStrandedEmphasis", () => {
  test("reattaches opening *** dropped by the markdown serializer", () => {
    expect(repairStrandedEmphasis("Co-founder*** and ***CTO***")).toBe(
      "***Co-founder*** and ***CTO***",
    );
  });

  test("leaves already-balanced bold+italic alone", () => {
    expect(repairStrandedEmphasis("***Co-founder*** and ***CTO***")).toBe(
      "***Co-founder*** and ***CTO***",
    );
  });

  test("leaves underscore/asterisk nested forms alone", () => {
    expect(repairStrandedEmphasis("**_Co-founder_** and _**CTO**_")).toBe(
      "**_Co-founder_** and _**CTO**_",
    );
  });
});

describe("inlineRichTextToSafeHtml", () => {
  test("renders repaired bold+italic on the first word", () => {
    const html = inlineRichTextToSafeHtml("Co-founder*** and ***CTO***");
    expect(html).toContain("<em><strong>Co-founder</strong></em>");
    expect(html).toContain("<em><strong>CTO</strong></em>");
    expect(html).not.toContain("Co-founder***");
  });

  test("renders underscore-nested bold+italic from the editor", () => {
    const html = inlineRichTextToSafeHtml("**_Co-founder_** and **_CTO_**");
    expect(html).toContain("<strong><em>Co-founder</em></strong>");
    expect(html).toContain("<strong><em>CTO</em></strong>");
  });
});
