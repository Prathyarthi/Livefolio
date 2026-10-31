import { describe, expect, it } from "bun:test";
import {
  LINKEDIN_ARTICLE_SOURCE,
  linkedInPostTitle,
  linkedInPostToArticle,
  parseLinkedInPostDate,
} from "./linkedin-articles";
import { resolveArticleSource } from "./article-source";

const syncedAt = new Date("2026-10-31T00:00:00Z");
const post = {
  id: "p_1",
  text: "Shipped our new search engine today! It ranks candidates by proof, not keywords.\nMore below.",
  date: "2w",
  url: "https://www.linkedin.com/posts/ada_search-activity-1",
  reactions: 12,
  comments: 3,
  imageUrl: null,
};

describe("LinkedIn posts → articles", () => {
  it("derives a title from the first sentence and truncates long lines", () => {
    expect(linkedInPostTitle(post.text)).toBe("Shipped our new search engine today!");
    const long = linkedInPostTitle("word ".repeat(40));
    expect(long.length).toBeLessThanOrEqual(91);
    expect(long.endsWith("…")).toBe(true);
    expect(linkedInPostTitle("\n\n")).toBe("LinkedIn post");
  });

  it("parses relative and absolute dates", () => {
    expect(parseLinkedInPostDate("2w", syncedAt)?.toISOString()).toBe("2026-10-17T00:00:00.000Z");
    expect(parseLinkedInPostDate("3mo", syncedAt)?.toISOString()).toBe("2026-08-02T00:00:00.000Z");
    expect(parseLinkedInPostDate("2026-10-01", syncedAt)?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(parseLinkedInPostDate("sometime", syncedAt)).toBeNull();
    expect(parseLinkedInPostDate(null, syncedAt)).toBeNull();
  });

  it("maps a post to an article row with source linkedin", () => {
    const article = linkedInPostToArticle(post, syncedAt);
    expect(article).toMatchObject({
      title: "Shipped our new search engine today!",
      url: post.url,
      source: LINKEDIN_ARTICLE_SOURCE,
      tags: [],
    });
    expect(article?.description).toContain("More below.");
    expect(linkedInPostToArticle({ ...post, url: null }, syncedAt)).toBeNull();
  });

  it("labels linkedin articles (stored or inferred from URL)", () => {
    expect(resolveArticleSource("https://example.com", "linkedin")).toBe("linkedin");
    expect(resolveArticleSource("https://www.linkedin.com/pulse/x")).toBe("linkedin");
  });
});
