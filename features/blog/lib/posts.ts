import fs from "node:fs";
import path from "node:path";
import { parseFrontMatter, type FrontMatterValue } from "@/features/blog/lib/frontmatter";
import { countWords } from "@/features/blog/lib/markdown";
import type { BlogPost } from "@/features/blog/types";

export const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog");
export const DEFAULT_AUTHOR = "Prathyarthi Kashyap, Founder";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function str(
  data: Record<string, FrontMatterValue>,
  key: string,
  file: string,
  required = true,
): string {
  const value = data[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (required) {
    throw new Error(`[blog] ${file}: front matter "${key}" is required.`);
  }
  return "";
}

function isoDate(value: string, key: string, file: string): string {
  if (!DATE_RE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`[blog] ${file}: "${key}" must be YYYY-MM-DD, got "${value}".`);
  }
  return value;
}

export function parsePost(
  raw: string,
  file: string,
  options: { checkCover?: boolean } = {},
): BlogPost | null {
  const { data, content } = parseFrontMatter(raw);
  if (data.draft === true) return null;

  const slug = str(data, "slug", file);
  if (!SLUG_RE.test(slug)) {
    throw new Error(`[blog] ${file}: slug "${slug}" must be lowercase letters, numbers and hyphens.`);
  }
  const title = str(data, "title", file);
  const date = isoDate(str(data, "date", file), "date", file);
  const updatedRaw = str(data, "updated", file, false);
  const updated = updatedRaw ? isoDate(updatedRaw, "updated", file) : undefined;
  const description = str(data, "description", file);
  const keyword = str(data, "keyword", file);
  const cover = str(data, "cover", file);
  if (!cover.startsWith("/")) {
    throw new Error(`[blog] ${file}: cover must be a path under /public (e.g. /blog/cover.png).`);
  }
  if (options.checkCover !== false) {
    const coverFile = path.join(process.cwd(), "public", cover);
    if (!fs.existsSync(coverFile)) {
      throw new Error(`[blog] ${file}: cover file not found at public${cover}.`);
    }
  }
  const author = str(data, "author", file, false) || DEFAULT_AUTHOR;
  const [authorName, ...roleParts] = author.split(",");
  const authorRole = roleParts.join(",").trim() || undefined;
  const tags = Array.isArray(data.tags) ? data.tags : [];

  return {
    slug,
    title,
    date,
    updated,
    description,
    keyword,
    cover,
    author,
    authorName: authorName.trim(),
    authorRole,
    tags,
    content,
    readingMinutes: Math.max(1, Math.ceil(countWords(content) / 220)),
  };
}

/** All published posts, newest first. Throws on invalid or duplicate posts. */
export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_CONTENT_DIR)) return [];

  const files = fs
    .readdirSync(BLOG_CONTENT_DIR)
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md" && !f.startsWith("_"));

  const posts: BlogPost[] = [];
  const seen = new Map<string, string>();
  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_CONTENT_DIR, file), "utf8");
    const post = parsePost(raw, file);
    if (!post) continue;
    const clash = seen.get(post.slug);
    if (clash) {
      throw new Error(`[blog] Duplicate slug "${post.slug}" in ${clash} and ${file}.`);
    }
    seen.set(post.slug, file);
    posts.push(post);
  }

  return posts.sort(
    (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

export function formatPostDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
