import { describe, expect, test } from "bun:test";
import {
  BUSINESS_MIN_SEATS,
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
  test("paid orgs without a stored plan are legacy Org Pro", () => {
    expect(resolvePlanTier({ paid: true, subscriptionPlan: null })).toBe("legacy_pro");
    expect(resolvePlanTier({ paid: true, subscriptionPlan: "org_pro" })).toBe("legacy_pro");
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
    expect(seatCap("legacy_pro", 1)).toBeNull();
    expect(seatCap("pro", 4)).toBe(4);
    expect(seatCap("pro", null)).toBe(1);
    expect(seatCap("business", 1)).toBe(BUSINESS_MIN_SEATS);
  });
  test("adding seat holders respects the cap", () => {
    expect(canAddSeatHolder(1, 1)).toBe(false);
    expect(canAddSeatHolder(2, 3)).toBe(true);
    expect(canAddSeatHolder(50, null)).toBe(true);
  });
  test("normalizeSeats enforces Business minimum", () => {
    expect(normalizeSeats("business", 1)).toBe(3);
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
  test("free: 1 job, 1 workspace; pro: 1 workspace; business and legacy unlimited", () => {
    expect(PLAN_LIMITS.free).toEqual({ maxOpenJobs: 1, maxWorkspaces: 1, includedSeats: 1 });
    expect(PLAN_LIMITS.pro.maxWorkspaces).toBe(1);
    expect(PLAN_LIMITS.pro.maxOpenJobs).toBeNull();
    expect(PLAN_LIMITS.business.maxWorkspaces).toBeNull();
    expect(PLAN_LIMITS.legacy_pro.maxWorkspaces).toBeNull();
  });
});
