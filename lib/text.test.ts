import { describe, expect, test } from "bun:test";
import {
  groupDescriptionParts,
  parseDescriptionParts,
  stripBulletPrefix,
} from "./text";

describe("parseDescriptionParts", () => {
  test("treats a single line as a body item", () => {
    expect(parseDescriptionParts("Senior engineer focused on payments.")).toEqual([
      { type: "item", text: "Senior engineer focused on payments." },
    ]);
  });

  test("detects colon headings and following points", () => {
    const text = [
      "Key Achievements:",
      "• Shipped the billing rewrite",
      "• Cut checkout failures by 40%",
      "Responsibilities:",
      "- Owned the payments service",
    ].join("\n");

    expect(parseDescriptionParts(text)).toEqual([
      { type: "heading", text: "Key Achievements" },
      { type: "item", text: "Shipped the billing rewrite" },
      { type: "item", text: "Cut checkout failures by 40%" },
      { type: "heading", text: "Responsibilities" },
      { type: "item", text: "Owned the payments service" },
    ]);
  });

  test("detects markdown and bold headings", () => {
    expect(
      parseDescriptionParts("## Tech Stack\nReact, Node, PostgreSQL"),
    ).toEqual([
      { type: "heading", text: "Tech Stack" },
      { type: "item", text: "React, Node, PostgreSQL" },
    ]);

    expect(
      parseDescriptionParts("**Key Achievements:**\nShipped checkout v2"),
    ).toEqual([
      { type: "heading", text: "Key Achievements" },
      { type: "item", text: "Shipped checkout v2" },
    ]);
  });

  test("detects title-case and all-caps headings without a colon", () => {
    expect(parseDescriptionParts("Key Achievements\nShipped checkout v2")).toEqual([
      { type: "heading", text: "Key Achievements" },
      { type: "item", text: "Shipped checkout v2" },
    ]);

    expect(parseDescriptionParts("Responsibilities\nOwned the payments service")).toEqual([
      { type: "heading", text: "Responsibilities" },
      { type: "item", text: "Owned the payments service" },
    ]);

    expect(parseDescriptionParts("KEY ACHIEVEMENTS\nShipped checkout v2")).toEqual([
      { type: "heading", text: "KEY ACHIEVEMENTS" },
      { type: "item", text: "Shipped checkout v2" },
    ]);
  });

  test("does not treat action-verb bullets as headings", () => {
    const text = [
      "Led the billing rewrite across three squads",
      "Built a real-time payments dashboard",
      "Reduced checkout failures by 40%",
    ].join("\n");

    expect(parseDescriptionParts(text).every((part) => part.type === "item")).toBe(
      true,
    );
  });

  test("groups consecutive items under headings", () => {
    const groups = groupDescriptionParts(
      parseDescriptionParts(
        "Responsibilities:\nOwned payments\nKey Achievements:\nShipped v2",
      ),
    );

    expect(groups).toEqual([
      { type: "heading", text: "Responsibilities" },
      { type: "list", items: ["Owned payments"] },
      { type: "heading", text: "Key Achievements" },
      { type: "list", items: ["Shipped v2"] },
    ]);
  });

  test("strips en-dash and markdown bullets without touching bold headings", () => {
    expect(stripBulletPrefix("– Owned the API")).toBe("Owned the API");
    expect(stripBulletPrefix("* Owned the API")).toBe("Owned the API");
    expect(stripBulletPrefix("- Owned the API")).toBe("Owned the API");
    expect(stripBulletPrefix("**Key Achievements:**")).toBe("**Key Achievements:**");
  });
});
