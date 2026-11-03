import { describe, expect, test } from "bun:test";
import {
  openJobBlockReason,
  PRO_MAX_WORKSPACES,
  PRO_OPEN_JOBS_PER_WORKSPACE,
  canAddSeatHolder,
  monthlyEquivalent,
  normalizeSeats,
  periodTotal,
  PLAN_LIMITS,
  resolvePlanTier,
  savingsPercent,
  seatCap,
  seatsUsed,
} from "@/lib/hiring-plans";

describe("hiring plan tiers", () => {
  test("unpaid orgs are free", () => {
    expect(resolvePlanTier({ paid: false, subscriptionPlan: "business" })).toBe("free");
  });
  test("paid orgs with a missing or unknown plan fall back to Pro", () => {
    expect(resolvePlanTier({ paid: true, subscriptionPlan: null })).toBe("pro");
    expect(resolvePlanTier({ paid: true, subscriptionPlan: "org_pro" })).toBe("pro");
  });
  test("paid orgs keep their per-seat plan", () => {
    expect(resolvePlanTier({ paid: true, subscriptionPlan: "pro" })).toBe("pro");
    expect(resolvePlanTier({ paid: true, subscriptionPlan: "business" })).toBe("business");
  });
});

describe("seat math", () => {
  test("seats used counts members and pending invites", () => {
    expect(seatsUsed(2, 1)).toBe(3);
    expect(seatsUsed(-1, 0)).toBe(0);
  });
  test("caps per tier", () => {
    expect(seatCap("free")).toBe(1);
    expect(seatCap("pro", 4)).toBe(4);
    expect(seatCap("pro", null)).toBe(1);
    expect(seatCap("business", 1)).toBe(1);
    expect(seatCap("business", null)).toBe(1);
  });
  test("adding seat holders respects the cap", () => {
    expect(canAddSeatHolder(1, 1)).toBe(false);
    expect(canAddSeatHolder(2, 3)).toBe(true);
    expect(canAddSeatHolder(50, null)).toBe(true);
  });
  test("normalizeSeats: both paid plans start from 1 seat", () => {
    expect(normalizeSeats("business", 1)).toBe(1);
    expect(normalizeSeats("business", 0)).toBe(1);
    expect(normalizeSeats("pro", 0)).toBe(1);
    expect(normalizeSeats("pro", "5")).toBe(5);
    expect(normalizeSeats("pro", "abc")).toBe(1);
    expect(normalizeSeats("pro", 10_000)).toBe(200);
  });
});

describe("prices", () => {
  test("yearly shows as monthly equivalent", () => {
    expect(monthlyEquivalent("pro", "yearly", "inr")).toBe(2499);
    expect(monthlyEquivalent("business", "yearly", "inr")).toBe(4199);
    expect(monthlyEquivalent("pro", "yearly", "usd")).toBe(35);
  });
  test("period total multiplies by seats", () => {
    expect(periodTotal("business", "monthly", 3, "inr")).toBe(14997);
  });
  test("yearly savings", () => {
    expect(savingsPercent("pro", "yearly", "inr")).toBe(17);
    expect(savingsPercent("pro", "monthly", "inr")).toBeNull();
  });
});

describe("limits", () => {
  test("free: 1 job, 1 workspace; pro: 5 workspaces, per-workspace jobs; business unlimited", () => {
    expect(PLAN_LIMITS.free).toEqual({ maxOpenJobs: 1, maxOpenJobsPerWorkspace: null, maxWorkspaces: 1, includedSeats: 1 });
    expect(PRO_MAX_WORKSPACES).toBe(5);
    expect(PLAN_LIMITS.pro.maxWorkspaces).toBe(PRO_MAX_WORKSPACES);
    expect(PLAN_LIMITS.pro.maxOpenJobs).toBeNull();
    expect(PLAN_LIMITS.pro.maxOpenJobsPerWorkspace).toBe(PRO_OPEN_JOBS_PER_WORKSPACE);
    expect(PLAN_LIMITS.business.maxWorkspaces).toBeNull();
    expect(PLAN_LIMITS.business.maxOpenJobsPerWorkspace).toBeNull();
    expect(Object.keys(PLAN_LIMITS).sort()).toEqual(["business", "free", "pro"]);
  });
});

describe("enterprise (display only)", () => {
  test("is not a purchasable tier", async () => {
    const mod = await import("@/lib/hiring-plans");
    expect(Object.keys(mod.HIRING_SEAT_PRICING)).toEqual(["pro", "business"]);
    expect(Object.keys(mod.PLAN_LIMITS)).not.toContain("enterprise");
    expect(mod.parsePaidHiringPlan("enterprise")).toBeNull();
    expect(mod.ENTERPRISE_PLAN.priceLabel).toBe("Custom");
  });
  test("contact link is a mailto with a subject", async () => {
    const { enterpriseContactHref } = await import("@/lib/hiring-plans");
    const href = enterpriseContactHref("team@livefolio.me");
    expect(href.startsWith("mailto:team@livefolio.me?subject=")).toBe(true);
  });
});

describe("plan display copy", () => {
  test("limit lines match enforced PLAN_LIMITS", async () => {
    const { planLimitLines } = await import("@/lib/hiring-plans");
    expect(planLimitLines("free")).toEqual(["1 seat", "1 open job (unlimited drafts)", "1 workspace"]);
    expect(planLimitLines("pro")).toEqual([
      "Per seat, from 1 seat",
      `Up to ${PRO_OPEN_JOBS_PER_WORKSPACE} open jobs per workspace`,
      "Up to 5 workspaces",
    ]);
    expect(planLimitLines("business")).toEqual(["Per seat, from 1 seat", "Unlimited open jobs", "Unlimited workspaces"]);
  });
  test("plans are ordered and each paid tier builds on the previous one", async () => {
    const { HIRING_DISPLAY_PLANS, HIRING_PLAN_DISPLAY, HIRING_CORE_FEATURES } = await import("@/lib/hiring-plans");
    expect(HIRING_DISPLAY_PLANS).toEqual(["free", "pro", "business", "enterprise"]);
    expect(HIRING_PLAN_DISPLAY.free.features).toBe(HIRING_CORE_FEATURES);
    expect(HIRING_PLAN_DISPLAY.pro.featuresHeading).toBe("Everything in Free, plus");
    expect(HIRING_PLAN_DISPLAY.business.featuresHeading).toBe("Everything in Pro, plus");
    expect(HIRING_PLAN_DISPLAY.enterprise.featuresHeading).toBe("Everything in Business, plus");
  });
  test("no feature label is repeated across plans or core", async () => {
    const { HIRING_PLAN_DISPLAY } = await import("@/lib/hiring-plans");
    const all = Object.values(HIRING_PLAN_DISPLAY).flatMap((p) => p.features.map((f) => f.label));
    expect(new Set(all).size).toBe(all.length);
  });
});

describe("opening jobs", () => {
  const n = PRO_OPEN_JOBS_PER_WORKSPACE;
  test("free: 1 open job across the org", () => {
    expect(openJobBlockReason("free", { orgOpen: 0, workspaceOpen: 0 })).toBeNull();
    expect(openJobBlockReason("free", { orgOpen: 1, workspaceOpen: 0 })).toBe("job");
  });
  test("pro: limit is per workspace, not per org", () => {
    expect(openJobBlockReason("pro", { orgOpen: 40, workspaceOpen: n - 1 })).toBeNull();
    expect(openJobBlockReason("pro", { orgOpen: n, workspaceOpen: n })).toBe("workspace_job");
  });
  test("over-limit after downgrade only blocks new openings", () => {
    expect(openJobBlockReason("pro", { orgOpen: 30, workspaceOpen: n + 5 })).toBe("workspace_job");
  });
  test("business: unlimited", () => {
    expect(openJobBlockReason("business", { orgOpen: 500, workspaceOpen: 500 })).toBeNull();
  });
});
