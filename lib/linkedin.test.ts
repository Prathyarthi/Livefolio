import { afterEach, describe, expect, it } from "bun:test";
import {
  LinkedInScrapeError,
  buildLinkedInShowcase,
  linkedInDayWindow,
  linkedInMonthWindow,
  toLinkedInQuota,
  normalizeLinkedInProfileUrl,
  scrapeLinkedInProfile,
} from "./linkedin";

const sample = {
  profileAvailable: true,
  name: "Ada Lovelace",
  headline: "Engineer",
  location: "London",
  about: "About me",
  profileImageUrl: "https://media.licdn.com/a.jpg",
  currentPosition: "Engineer at Acme",
  experience: [{ title: "Engineer", company: "Acme", location: null, startDate: "2020", endDate: "Present", description: null }],
  education: [],
  skills: ["TS"],
  posts: [
    { text: "Hello", date: "1w", url: "https://www.linkedin.com/posts/1", reactions: 5, comments: 1, imageUrl: null },
    { text: "World", date: "2w", url: "javascript:alert(1)", reactions: null, comments: null, imageUrl: null },
  ],
};

const mockFetch = (status: number, body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

afterEach(() => {
  delete process.env.SGAI_API_KEY;
});

describe("normalizeLinkedInProfileUrl", () => {
  it("accepts /in/ URLs and canonicalizes", () => {
    expect(normalizeLinkedInProfileUrl("linkedin.com/in/ada-l/")).toBe("https://www.linkedin.com/in/ada-l");
    expect(normalizeLinkedInProfileUrl("https://in.linkedin.com/in/ada?x=1")).toBe("https://www.linkedin.com/in/ada");
  });
  it("rejects non-profile URLs", () => {
    expect(normalizeLinkedInProfileUrl("https://linkedin.com/company/x")).toBeNull();
    expect(normalizeLinkedInProfileUrl("https://evil.com/in/ada")).toBeNull();
    expect(normalizeLinkedInProfileUrl("https://linkedin.com.evil.com/in/ada")).toBeNull();
    expect(normalizeLinkedInProfileUrl("")).toBeNull();
  });
});

describe("scrapeLinkedInProfile (mocked ScrapeGraphAI)", () => {
  it("throws NOT_CONFIGURED without an API key", async () => {
    await expect(scrapeLinkedInProfile("https://www.linkedin.com/in/ada")).rejects.toMatchObject({ code: "NOT_CONFIGURED" });
  });
  it("parses a successful extract and drops unsafe URLs", async () => {
    process.env.SGAI_API_KEY = "test";
    const result = await scrapeLinkedInProfile("https://www.linkedin.com/in/ada", mockFetch(200, { json: sample }));
    expect(result.profile.name).toBe("Ada Lovelace");
    expect(result.posts).toHaveLength(2);
    expect(result.posts[1].url).toBeNull();
    expect(result.posts[0].id).toMatch(/^p_/);
  });
  it("maps login walls to PROFILE_UNAVAILABLE", async () => {
    process.env.SGAI_API_KEY = "test";
    await expect(
      scrapeLinkedInProfile("https://www.linkedin.com/in/ada", mockFetch(200, { json: { ...sample, profileAvailable: false } })),
    ).rejects.toMatchObject({ code: "PROFILE_UNAVAILABLE", status: 422 });
  });
  it("maps 429 to RATE_LIMITED and bad payloads to SCRAPE_FAILED", async () => {
    process.env.SGAI_API_KEY = "test";
    await expect(
      scrapeLinkedInProfile("https://www.linkedin.com/in/ada", mockFetch(429, { error: { type: "rate_limited" } })),
    ).rejects.toBeInstanceOf(LinkedInScrapeError);
    await expect(
      scrapeLinkedInProfile("https://www.linkedin.com/in/ada", mockFetch(200, { json: { foo: 1 } })),
    ).rejects.toMatchObject({ code: "SCRAPE_FAILED" });
  });
});

describe("fetch config fallback", () => {
  it("retries without stealth on fetch_provider_config and never sends mode js", async () => {
    process.env.SGAI_API_KEY = "test";
    const configs: unknown[] = [];
    let call = 0;
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      configs.push(JSON.parse(String(init.body)).fetchConfig);
      call++;
      return call === 1
        ? new Response(JSON.stringify({ error: { type: "fetch_provider_config", message: "no provider" } }), { status: 400 })
        : new Response(JSON.stringify({ json: sample }), { status: 200 });
    }) as unknown as typeof fetch;
    const result = await scrapeLinkedInProfile("https://www.linkedin.com/in/ada", fetchImpl);
    expect(result.profile.name).toBe("Ada Lovelace");
    expect(configs).toEqual([{ stealth: true }, {}]);
  });
});

describe("buildLinkedInShowcase", () => {
  it("only includes selected fields and posts", async () => {
    process.env.SGAI_API_KEY = "test";
    const { profile, posts } = await scrapeLinkedInProfile("https://www.linkedin.com/in/ada", mockFetch(200, { json: sample }));
    const showcase = buildLinkedInShowcase({
      profileUrl: "https://www.linkedin.com/in/ada",
      profileData: profile,
      posts,
      selection: { fields: ["headline", "education"], postIds: [posts[0].id] },
      showOnPortfolio: true,
    });
    expect(showcase?.profile).toEqual({ headline: "Engineer" });
    expect(showcase?.posts.map((p) => p.text)).toEqual(["Hello"]);
    expect(
      buildLinkedInShowcase({ profileUrl: "x", profileData: profile, posts, selection: {}, showOnPortfolio: false }),
    ).toBeNull();
  });
});

describe("sync quota", () => {
  const now = new Date("2026-12-31T23:30:00Z");
  it("uses UTC calendar month and day windows", () => {
    expect(linkedInMonthWindow(now)).toEqual({ key: "2026-12", resetsAt: new Date("2027-01-01T00:00:00Z") });
    expect(linkedInDayWindow(now)).toEqual({ key: "2026-12-31", resetsAt: new Date("2027-01-01T00:00:00Z") });
    expect(linkedInMonthWindow(new Date("2026-10-31T23:59:59Z")).key).toBe("2026-10");
  });
  it("is available with nothing used", () => {
    const q = toLinkedInQuota(0, 0, now);
    expect(q).toMatchObject({ limit: 3, remaining: 3, dailyLimit: 1, blockedBy: null, nextAvailableAt: null });
  });
  it("blocks until next UTC midnight after a sync today", () => {
    const q = toLinkedInQuota(1, 1, new Date("2026-10-15T10:00:00Z"));
    expect(q).toMatchObject({ remaining: 2, blockedBy: "daily", nextAvailableAt: "2026-10-16T00:00:00.000Z" });
  });
  it("blocks until next month once 3 are used (monthly wins over daily)", () => {
    const q = toLinkedInQuota(3, 1, new Date("2026-10-15T10:00:00Z"));
    expect(q).toMatchObject({ remaining: 0, blockedBy: "monthly", nextAvailableAt: "2026-11-01T00:00:00.000Z" });
    expect(toLinkedInQuota(5, 0, now).remaining).toBe(0);
  });
});
