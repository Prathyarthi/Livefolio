import { describe, expect, it } from "bun:test";
import {
  BADGES,
  INTEGRATION_BADGE_SOURCES,
  buildBadgeShelf,
  canShowOnPortfolio,
  createBadgeAwarder,
  getBadge,
  integrationBadgeKey,
  publicBadges,
  qualifiedBadgeKeys,
  toPublicBadges,
  type BadgeKey,
} from "./badges-catalog";
import { NOTIFICATION_TYPES } from "./notifications-core";

describe("catalog", () => {
  it("has unique keys and complete fields", () => {
    const keys = BADGES.map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const badge of BADGES) {
      expect(badge.name.length).toBeGreaterThan(0);
      expect(badge.description.length).toBeGreaterThan(0);
      expect(badge.unlockHint).toMatch(/unlock/i);
    }
  });

  it("has one integration badge per source", () => {
    for (const source of INTEGRATION_BADGE_SOURCES) {
      const badge = getBadge(integrationBadgeKey(source));
      expect(badge?.category).toBe("integration");
      expect(badge?.publicEligible).toBe(true);
    }
  });

  it("registers the badge_earned notification type", () => {
    expect(NOTIFICATION_TYPES).toContain("badge_earned");
  });
});

describe("eligibility", () => {
  it("never allows Welcome on the portfolio", () => {
    expect(canShowOnPortfolio("welcome")).toBe(false);
    expect(canShowOnPortfolio("integration.github")).toBe(true);
    expect(canShowOnPortfolio("portfolio_published")).toBe(true);
    expect(canShowOnPortfolio("nope")).toBe(false);
  });

  it("shows every earned public-eligible badge, never Welcome", () => {
    const at = new Date();
    const shown = publicBadges([
      { badgeKey: "welcome", awardedAt: at },
      { badgeKey: "integration.medium", awardedAt: at },
      { badgeKey: "integration.github", awardedAt: at },
    ]);
    expect(shown.map((b) => b.key)).toEqual(["integration.github", "integration.medium"]);
  });

  it("builds a shelf with locked badges and a next hint", () => {
    const shelf = buildBadgeShelf([
      { badgeKey: "welcome", awardedAt: new Date() },
    ]);
    expect(shelf.badges).toHaveLength(BADGES.length);
    const welcome = shelf.badges.find((b) => b.key === "welcome");
    expect(welcome?.earned).toBe(true);
    expect(shelf.nextBadgeKey).toBe("portfolio_published");
  });
});

describe("qualifiedBadgeKeys", () => {
  it("maps existing data to badges", () => {
    expect(
      qualifiedBadgeKeys({ isPublished: true, platforms: ["github", "twitter", "devto"], hasLinkedInImport: true }),
    ).toEqual(["welcome", "portfolio_published", "integration.github", "integration.linkedin", "integration.devto"]);
    expect(qualifiedBadgeKeys({ isPublished: false, platforms: [], hasLinkedInImport: false })).toEqual(["welcome"]);
  });
});

describe("createBadgeAwarder", () => {
  function setup(opts: { failStore?: boolean; failHook?: boolean } = {}) {
    const rows = new Set<string>();
    const notified: string[] = [];
    const errors: string[] = [];
    const award = createBadgeAwarder({
      async createIfAbsent(userId, key) {
        if (opts.failStore) throw new Error("db down");
        const id = `${userId}:${key}`;
        if (rows.has(id)) return false;
        rows.add(id);
        return true;
      },
      async onFirstAward(_userId, badge) {
        if (opts.failHook) throw new Error("notify down");
        notified.push(badge.key);
      },
      logError: (message) => errors.push(message),
    });
    return { award, rows, notified, errors };
  }

  it("is idempotent and notifies only on first award", async () => {
    const { award, notified } = setup();
    expect(await award("u1", "integration.github")).toBe(true);
    expect(await award("u1", "integration.github")).toBe(false);
    expect(await award("u2", "integration.github")).toBe(true);
    expect(notified).toEqual(["integration.github", "integration.github"]);
  });

  it("supports silent awards", async () => {
    const { award, notified, rows } = setup();
    expect(await award("u1", "welcome", { silent: true })).toBe(true);
    expect(rows.size).toBe(1);
    expect(notified).toEqual([]);
  });

  it("never throws", async () => {
    const failing = setup({ failStore: true });
    expect(await failing.award("u1", "welcome")).toBe(false);
    const hookFail = setup({ failHook: true });
    expect(await hookFail.award("u1", "welcome")).toBe(true);
    expect(hookFail.errors).toHaveLength(1);
    const invalid = setup();
    expect(await invalid.award("u1", "bogus" as BadgeKey)).toBe(false);
    expect(await invalid.award("", "welcome")).toBe(false);
  });
});

describe("toPublicBadges", () => {
  it("keeps earned eligible badges in catalog order with ISO dates", () => {
    const out = toPublicBadges([
      { badgeKey: "integration.medium", showOnPortfolio: true, awardedAt: "2026-10-01T00:00:00.000Z" },
      { badgeKey: "welcome", showOnPortfolio: true, awardedAt: new Date() },
      { badgeKey: "integration.github", showOnPortfolio: true, awardedAt: new Date("2026-09-01T00:00:00Z") },
      { badgeKey: "integration.devto", showOnPortfolio: false, awardedAt: new Date() },
    ]);
    // showOnPortfolio is ignored: every earned eligible badge is public.
    expect(out.map((b) => b.key)).toEqual(["integration.github", "integration.medium", "integration.devto"]);
    expect(out[0].awardedAt).toBe("2026-09-01T00:00:00.000Z");
  });

  it("tolerates junk", () => {
    expect(toPublicBadges(undefined)).toEqual([]);
    expect(toPublicBadges([null, { badgeKey: 1 }, { badgeKey: "integration.github", showOnPortfolio: true, awardedAt: "bad" }])).toEqual([
      expect.objectContaining({ key: "integration.github", awardedAt: null }),
    ]);
  });
});
