import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { parseFrontMatter } from "@/features/blog/lib/frontmatter";
import { extractFaq, renderMarkdown } from "@/features/blog/lib/markdown";
import { BLOG_CONTENT_DIR, getAllPosts, parsePost } from "@/features/blog/lib/posts";
import { buildRssFeed } from "@/features/blog/lib/rss";

describe("parseFrontMatter", () => {
  test("parses strings, quotes, lists and booleans", () => {
    const { data, content } = parseFrontMatter(
      `---\ntitle: "A: B"\nslug: a-b\ntags: [one, "two, three"]\nauthors:\n  - x\n  - y\ndraft: true\n---\nBody\n`,
    );
    expect(data.title).toBe("A: B");
    expect(data.tags).toEqual(["one", "two, three"]);
    expect(data.authors).toEqual(["x", "y"]);
    expect(data.draft).toBe(true);
    expect(content).toBe("Body\n");
  });

  test("returns the whole text when there is no front matter", () => {
    expect(parseFrontMatter("Hello").content).toBe("Hello");
  });
});

describe("extractFaq", () => {
  test("reads only the FAQ section", () => {
    const md = `## Intro\n\n### Not a question\n\ntext\n\n## FAQ\n\n### Q1?\n\nAnswer **one**.\n\n### Q2?\n\nAnswer two.\n\n## After\n\n### Also not\n\nx`;
    expect(extractFaq(md)).toEqual([
      { question: "Q1?", answer: "Answer one." },
      { question: "Q2?", answer: "Answer two." },
    ]);
  });

  test("returns [] without an FAQ section", () => {
    expect(extractFaq("## Hello\n\ntext")).toEqual([]);
  });
});

describe("renderMarkdown", () => {
  test("adds heading ids, demotes h1 and escapes raw html", () => {
    const html = renderMarkdown("# Title\n\n## Part One\n\n<script>alert(1)</script>");
    expect(html).toContain('<h2 id="title">');
    expect(html).toContain('id="part-one"');
    expect(html).not.toContain("<script>");
  });

  test("external links open safely", () => {
    const html = renderMarkdown("[x](https://example.com)");
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });
});

describe("parsePost", () => {
  const base = `---\ntitle: T\nslug: t\ndate: 2026-01-02\ndescription: D\nkeyword: k\ncover: /blog/placeholder-cover.jpg\n---\nbody`;

  test("applies the default author", () => {
    const post = parsePost(base, "t.md");
    expect(post?.author).toBe("Prathyarthi Kashyap, Founder");
    expect(post?.authorName).toBe("Prathyarthi Kashyap");
    expect(post?.authorRole).toBe("Founder");
  });

  test("rejects missing fields, bad slugs and bad dates", () => {
    expect(() => parsePost(base.replace("keyword: k\n", ""), "t.md")).toThrow(/keyword/);
    expect(() => parsePost(base.replace("slug: t", "slug: Bad Slug"), "t.md")).toThrow(/slug/);
    expect(() => parsePost(base.replace("2026-01-02", "02/01/2026"), "t.md")).toThrow(/date/);
  });

  test("drafts are skipped", () => {
    expect(parsePost(base.replace("keyword: k", "keyword: k\ndraft: true"), "t.md")).toBeNull();
  });
});

describe("content/blog", () => {
  test("all posts are valid, newest first, with unique slugs", async () => {
    const posts = await getAllPosts();
    const dates = posts.map((p) => p.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
  });

  test("no em dashes in post files or the generated feed", async () => {
    const files = fs.readdirSync(BLOG_CONTENT_DIR).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      expect(fs.readFileSync(path.join(BLOG_CONTENT_DIR, file), "utf8")).not.toContain("\u2014");
    }
    expect(buildRssFeed(await getAllPosts())).not.toContain("\u2014");
  });
});

describe("buildRssFeed", () => {
  test("emits item links on the canonical /blog/<slug> path", async () => {
    const posts = await getAllPosts();
    const xml = buildRssFeed(posts);
    expect(xml).toContain("<rss version=\"2.0\"");
    for (const post of posts) {
      expect(xml).toContain(`/blog/${post.slug}</link>`);
    }
  });
});
