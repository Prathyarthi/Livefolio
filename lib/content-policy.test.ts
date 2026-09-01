import { afterEach, describe, expect, test } from "bun:test";
import {
  ContentValidationError,
  MAX_STORED_URL_CHARS,
  normalizeOptionalStoredUrl,
  normalizeRequiredStoredUrl,
  normalizeStoredUrlsInJson,
} from "./content-policy";

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  Reflect.set(process.env, "NODE_ENV", originalNodeEnv);
});

describe("stored URL policy", () => {
  test("normalizes an HTTPS URL", () => {
    expect(
      normalizeRequiredStoredUrl("  https://example.com/work?q=1  ", "Website"),
    ).toBe("https://example.com/work?q=1");
  });

  test("accepts null and blank optional URLs", () => {
    expect(normalizeOptionalStoredUrl(null)).toBeNull();
    expect(normalizeOptionalStoredUrl("   ")).toBeNull();
  });

  test.each(["javascript:alert(1)", "data:text/html,test", "file:///tmp/a"])(
    "rejects the %s protocol",
    (value) => {
      expect(() => normalizeRequiredStoredUrl(value)).toThrow(
        ContentValidationError,
      );
    },
  );

  test("rejects malformed URLs, credentials, and control characters", () => {
    expect(() => normalizeRequiredStoredUrl("not a url")).toThrow(
      "must be a valid URL",
    );
    expect(() =>
      normalizeRequiredStoredUrl("https://user:secret@example.com"),
    ).toThrow("must not contain credentials");
    expect(() =>
      normalizeRequiredStoredUrl("https://example.com/\nnext"),
    ).toThrow("contains control characters");
  });

  test("enforces the 2,048 character limit", () => {
    const prefix = "https://example.com/";
    const atLimit = `${prefix}${"a".repeat(MAX_STORED_URL_CHARS - prefix.length)}`;
    const overLimit = `${atLimit}a`;

    expect(normalizeRequiredStoredUrl(atLimit)).toHaveLength(
      MAX_STORED_URL_CHARS,
    );
    expect(() => normalizeRequiredStoredUrl(overLimit)).toThrow(
      `at most ${MAX_STORED_URL_CHARS} characters`,
    );
  });

  test("allows HTTP only for local development hosts", () => {
    Reflect.set(process.env, "NODE_ENV", "development");
    expect(normalizeRequiredStoredUrl("http://localhost:3000/demo")).toBe(
      "http://localhost:3000/demo",
    );
    expect(() =>
      normalizeRequiredStoredUrl("http://example.com/demo"),
    ).toThrow("HTTP is allowed only for local development");

    Reflect.set(process.env, "NODE_ENV", "production");
    expect(() =>
      normalizeRequiredStoredUrl("http://localhost:3000/demo"),
    ).toThrow("must use HTTPS");
  });

  test("recursively validates URL-like custom-section fields", () => {
    expect(
      normalizeStoredUrlsInJson([
        {
          title: "Project",
          link: " https://example.com/project ",
          nested: { imageUrl: "" },
        },
      ]),
    ).toEqual([
      {
        title: "Project",
        link: "https://example.com/project",
        nested: { imageUrl: "" },
      },
    ]);

    expect(() =>
      normalizeStoredUrlsInJson([{ href: "javascript:alert(1)" }]),
    ).toThrow(ContentValidationError);
  });
});
