import { z } from "zod";

/**
 * LinkedIn import via ScrapeGraphAI v2 Extract (server-side only).
 * Docs: https://docs.scrapegraphai.com/api-reference/endpoint/extract
 */

const SGAI_EXTRACT_URL = "https://v2-api.scrapegraphai.com/api/extract";
const SCRAPE_TIMEOUT_MS = 90_000;
export const MAX_LINKEDIN_POSTS = 10;

// ── URL validation ─────────────────────────────────────────

/** Returns a canonical https://www.linkedin.com/in/<handle> URL, or null. */
export function normalizeLinkedInProfileUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0]?.toLowerCase() !== "in" || !parts[1]) return null;
  let handle: string;
  try {
    handle = decodeURIComponent(parts[1]);
  } catch {
    return null;
  }
  if (!/^[\p{L}\p{N}_-]{3,100}$/u.test(handle)) return null;
  return `https://www.linkedin.com/in/${encodeURIComponent(handle)}`;
}

// ── Output schema (also sent to ScrapeGraphAI as JSON Schema) ──

const nullableString = z.string().nullable();

export const linkedInExperienceSchema = z.object({
  title: z.string().describe("Job title"),
  company: z.string().describe("Company name"),
  location: nullableString.describe("Job location, if shown"),
  startDate: nullableString.describe("Start date as shown, e.g. 'Jan 2022'"),
  endDate: nullableString.describe("End date as shown, or 'Present'"),
  description: nullableString.describe("Role description, if shown"),
});

export const linkedInEducationSchema = z.object({
  school: z.string().describe("School or university name"),
  degree: nullableString.describe("Degree"),
  field: nullableString.describe("Field of study"),
  startDate: nullableString,
  endDate: nullableString,
});

export const linkedInPostSchema = z.object({
  text: z.string().describe("Full post text"),
  date: nullableString.describe("Post date or relative age as shown, e.g. '2w' or '2026-10-01'"),
  url: nullableString.describe("Absolute link to the post, if available"),
  reactions: z.number().int().nullable().describe("Number of reactions/likes, if shown"),
  comments: z.number().int().nullable().describe("Number of comments, if shown"),
  imageUrl: nullableString.describe("Image attached to the post, if any"),
});

export const linkedInScrapeSchema = z.object({
  profileAvailable: z
    .boolean()
    .describe("false if the page is a login wall, private, or not a LinkedIn profile"),
  name: nullableString.describe("Full name"),
  headline: nullableString.describe("Profile headline"),
  location: nullableString.describe("Location"),
  about: nullableString.describe("About / summary section"),
  profileImageUrl: nullableString.describe("Profile photo URL"),
  currentPosition: nullableString.describe("Current position, e.g. 'Engineer at Acme'"),
  experience: z.array(linkedInExperienceSchema),
  education: z.array(linkedInEducationSchema),
  skills: z.array(z.string()),
  posts: z.array(linkedInPostSchema).describe("Most recent posts/activity, newest first"),
});

export type LinkedInScrapeResult = z.infer<typeof linkedInScrapeSchema>;
export type LinkedInPost = z.infer<typeof linkedInPostSchema> & { id: string };
export type LinkedInProfileData = Omit<LinkedInScrapeResult, "posts" | "profileAvailable">;

// ── Selection ──────────────────────────────────────────────

export const LINKEDIN_FIELDS = [
  "name",
  "headline",
  "location",
  "about",
  "profileImageUrl",
  "currentPosition",
  "experience",
  "education",
  "skills",
] as const;
export type LinkedInField = (typeof LINKEDIN_FIELDS)[number];

export const linkedInSelectionSchema = z.object({
  fields: z.array(z.enum(LINKEDIN_FIELDS)).max(LINKEDIN_FIELDS.length),
  postIds: z.array(z.string().max(64)).max(MAX_LINKEDIN_POSTS),
});
export type LinkedInSelection = z.infer<typeof linkedInSelectionSchema>;

export const DEFAULT_LINKEDIN_SELECTION: LinkedInSelection = {
  fields: ["headline", "about", "currentPosition", "experience", "skills"],
  postIds: [],
};

export function parseLinkedInSelection(value: unknown): LinkedInSelection {
  const parsed = linkedInSelectionSchema.safeParse(value);
  if (!parsed.success) return DEFAULT_LINKEDIN_SELECTION;
  return {
    fields: [...new Set(parsed.data.fields)],
    postIds: [...new Set(parsed.data.postIds)],
  };
}

export function parseStoredProfile(value: unknown): LinkedInProfileData | null {
  const parsed = linkedInScrapeSchema
    .omit({ posts: true, profileAvailable: true })
    .safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseStoredPosts(value: unknown): LinkedInPost[] {
  const parsed = z
    .array(linkedInPostSchema.extend({ id: z.string() }))
    .safeParse(value);
  return parsed.success ? parsed.data : [];
}

/** What a public portfolio renders: only the selected fields and posts. */
export interface LinkedInShowcase {
  profileUrl: string;
  profile: Partial<LinkedInProfileData>;
  posts: LinkedInPost[];
}

export function buildLinkedInShowcase(
  row:
    | {
        profileUrl: string;
        profileData: unknown;
        posts: unknown;
        selection: unknown;
        showOnPortfolio: boolean;
      }
    | null
    | undefined,
): LinkedInShowcase | null {
  if (!row || !row.showOnPortfolio) return null;
  const profile = parseStoredProfile(row.profileData);
  if (!profile) return null;
  const selection = parseLinkedInSelection(row.selection);
  const picked: Partial<LinkedInProfileData> = {};
  for (const field of selection.fields) {
    const value = profile[field];
    if (Array.isArray(value) ? value.length > 0 : Boolean(value)) {
      (picked as Record<string, unknown>)[field] = value;
    }
  }
  const selectedIds = new Set(selection.postIds);
  const posts = parseStoredPosts(row.posts).filter((post) => selectedIds.has(post.id));
  if (Object.keys(picked).length === 0 && posts.length === 0) return null;
  return { profileUrl: row.profileUrl, profile: picked, posts };
}

// ── Scraping ───────────────────────────────────────────────

export type LinkedInScrapeErrorCode =
  | "NOT_CONFIGURED"
  | "PROFILE_UNAVAILABLE"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "SCRAPE_FAILED";

export class LinkedInScrapeError extends Error {
  constructor(
    public code: LinkedInScrapeErrorCode,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "LinkedInScrapeError";
  }
}

const PROMPT = `Extract this public LinkedIn profile. Return name, headline, location, about/summary, profile photo URL, current position, experience, education, skills, and up to ${MAX_LINKEDIN_POSTS} most recent posts (text, date, link, reaction and comment counts). Use null for anything not visible. Do not invent data. If the page is a sign-in/auth wall, an error page, or not a person's profile, set profileAvailable to false.`;

function cleanUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function postId(post: z.infer<typeof linkedInPostSchema>, index: number): string {
  const basis = post.url ?? `${post.date ?? ""}:${post.text.slice(0, 120)}:${index}`;
  let hash = 0;
  for (let i = 0; i < basis.length; i++) hash = (hash * 31 + basis.charCodeAt(i)) | 0;
  return `p_${(hash >>> 0).toString(36)}`;
}

export function normalizeScrapeResult(json: unknown): {
  profile: LinkedInProfileData;
  posts: LinkedInPost[];
} {
  const parsed = linkedInScrapeSchema.safeParse(json);
  if (!parsed.success) {
    throw new LinkedInScrapeError(
      "SCRAPE_FAILED",
      "LinkedIn returned data we couldn't read. Please try again later.",
      502,
    );
  }
  const { posts, profileAvailable, ...profile } = parsed.data;
  if (!profileAvailable || !profile.name) {
    throw new LinkedInScrapeError(
      "PROFILE_UNAVAILABLE",
      "This LinkedIn profile is private or not publicly visible. Make your profile public and try again.",
      422,
    );
  }
  const seen = new Set<string>();
  const normalizedPosts = posts
    .filter((post) => post.text.trim())
    .slice(0, MAX_LINKEDIN_POSTS)
    .map((post, index) => ({
      ...post,
      url: cleanUrl(post.url),
      imageUrl: cleanUrl(post.imageUrl),
      id: postId(post, index),
    }))
    .filter((post) => (seen.has(post.id) ? false : (seen.add(post.id), true)));
  return {
    profile: { ...profile, profileImageUrl: cleanUrl(profile.profileImageUrl) },
    posts: normalizedPosts,
  };
}

export function isLinkedInScrapingConfigured() {
  return Boolean(process.env.SGAI_API_KEY?.trim());
}

export async function scrapeLinkedInProfile(profileUrl: string, fetchImpl: typeof fetch = fetch) {
  const apiKey = process.env.SGAI_API_KEY?.trim();
  if (!apiKey) {
    throw new LinkedInScrapeError(
      "NOT_CONFIGURED",
      "LinkedIn import isn't configured yet. Please try again later.",
      503,
    );
  }

  let res: Response;
  try {
    res = await fetchImpl(SGAI_EXTRACT_URL, {
      method: "POST",
      headers: { "SGAI-APIKEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: profileUrl,
        prompt: PROMPT,
        schema: z.toJSONSchema(linkedInScrapeSchema),
        fetchConfig: { mode: "js", stealth: true, timeout: 60_000 },
      }),
      signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new LinkedInScrapeError("TIMEOUT", "LinkedIn took too long to respond. Please try again.", 504);
    }
    throw new LinkedInScrapeError("SCRAPE_FAILED", "Couldn't reach the LinkedIn import service.", 502);
  }

  const body = (await res.json().catch(() => null)) as
    | { json?: unknown; error?: { type?: string; message?: string } }
    | null;

  if (!res.ok) {
    const type = body?.error?.type;
    console.error("[linkedin.scrape] ScrapeGraphAI error", res.status, type);
    if (res.status === 429 || type === "rate_limited") {
      throw new LinkedInScrapeError("RATE_LIMITED", "LinkedIn import is busy right now. Try again in a few minutes.", 429);
    }
    if (res.status === 401 || res.status === 402 || res.status === 403) {
      throw new LinkedInScrapeError("NOT_CONFIGURED", "LinkedIn import is temporarily unavailable.", 503);
    }
    if (res.status === 504 || res.status === 408) {
      throw new LinkedInScrapeError("TIMEOUT", "LinkedIn took too long to respond. Please try again.", 504);
    }
    throw new LinkedInScrapeError("SCRAPE_FAILED", "We couldn't read that LinkedIn profile. Please try again later.", 502);
  }

  return normalizeScrapeResult(body?.json);
}
