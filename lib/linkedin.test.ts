import { afterEach, describe, expect, it } from "bun:test";
import {
  LinkedInScrapeError,
  buildLinkedInShowcase,
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
