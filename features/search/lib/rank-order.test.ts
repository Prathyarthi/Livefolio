import { describe, expect, test } from "bun:test";
import {
  compareRankKeys,
  displayScore,
  roundFine,
  tiedCounts,
  toFineScore,
  type RankOrderKey,
} from "@/features/search/lib/rank-order";
import { applyReferenceRank } from "@/features/search/lib/references";

const key = (overrides: Partial<RankOrderKey> = {}): RankOrderKey => ({
  scoreFine: 80,
  proof: 0.5,
  skill: 0.5,
  at: new Date("2026-01-10T00:00:00Z"),
  id: "m",
  ...overrides,
});

const order = (rows: RankOrderKey[]) => [...rows].sort(compareRankKeys).map((r) => r.id);

describe("compareRankKeys", () => {
  test("fine score decides first, even over better subscores", () => {
    const high = key({ id: "high", scoreFine: 80.2, proof: 0, skill: 0 });
    const low = key({ id: "low", scoreFine: 79.9, proof: 1, skill: 1 });
    expect(order([low, high])).toEqual(["high", "low"]);
  });

  test("equal scores fall to proof of work, then skill match", () => {
    const rows = [
      key({ id: "a", proof: 0.4, skill: 0.9 }),
      key({ id: "b", proof: 0.8, skill: 0.1 }),
      key({ id: "c", proof: 0.8, skill: 0.6 }),
    ];
    expect(order(rows)).toEqual(["c", "b", "a"]);
  });

  test("then the earliest applicant, then id", () => {
    const rows = [
      key({ id: "late", at: new Date("2026-03-01T00:00:00Z") }),
      key({ id: "early", at: new Date("2026-01-01T00:00:00Z") }),
      key({ id: "b-tie", at: new Date("2026-02-01T00:00:00Z") }),
      key({ id: "a-tie", at: new Date("2026-02-01T00:00:00Z") }),
    ];
    expect(order(rows)).toEqual(["early", "a-tie", "b-tie", "late"]);
  });

  test("a missing time sorts after a known one; ISO strings and dates compare the same", () => {
    const rows = [
      key({ id: "unknown", at: null }),
      key({ id: "string", at: "2026-02-01T00:00:00Z" }),
      key({ id: "date", at: new Date("2026-01-01T00:00:00Z") }),
    ];
    expect(order(rows)).toEqual(["date", "string", "unknown"]);
  });

  test("the result does not depend on input order", () => {
    const rows = Array.from({ length: 40 }, (_, i) =>
      key({
        id: `id-${String(i).padStart(2, "0")}`,
        scoreFine: 70 + (i % 3),
        proof: (i % 4) / 4,
        skill: (i % 5) / 5,
        at: new Date(Date.UTC(2026, 0, 1 + (i % 7))),
      }),
    );
    const forward = order(rows);
    expect(order([...rows].reverse())).toEqual(forward);
    expect(order([...rows].sort(() => 0.5 - Math.sin(rows.length)))).toEqual(forward);
  });

  test("values equal after rounding to three decimals count as tied", () => {
    const a = key({ id: "a", scoreFine: 80.1 + 0.2 });
    const b = key({ id: "b", scoreFine: 80.3 });
    expect(compareRankKeys(a, b)).toBeLessThan(0); // tied on score, so id decides
    expect(compareRankKeys(b, a)).toBeGreaterThan(0);
  });
});

describe("fine and displayed scores", () => {
  test("the displayed integer is round(fine), clamped to 0-100", () => {
    expect(displayScore(84.49)).toBe(84);
    expect(displayScore(84.5)).toBe(85);
    expect(displayScore(-3)).toBe(0);
    expect(displayScore(130)).toBe(100);
    expect(toFineScore(130)).toBe(100);
    expect(toFineScore(Number.NaN)).toBe(0);
    expect(roundFine(12.34567)).toBe(12.346);
  });

  test("a higher displayed integer always means a higher fine score", () => {
    const fines = Array.from({ length: 2000 }, (_, i) => toFineScore((i * 37.123) % 101));
    for (const a of fines.slice(0, 200)) {
      for (const b of fines) {
        if (displayScore(a) > displayScore(b)) expect(a).toBeGreaterThan(b);
      }
    }
  });

  test("the reference bonus is added to the fine score unrounded", () => {
    const refs = [{ relationship: "manager" as const, story: "Grew organic traffic 3x" }];
    const a = applyReferenceRank(80.2, ["x"], refs, ["seo"]);
    const b = applyReferenceRank(80.4, ["x"], refs, ["seo"]);
    expect(a.scoreFine).toBeGreaterThan(80.2);
    expect(b.scoreFine - a.scoreFine).toBeCloseTo(0.2, 3);
    expect(a.score).toBe(Math.round(a.scoreFine));
    expect(a.reasons[0]).toMatch(/reference/i);
  });

  test("without references the fine score passes through", () => {
    expect(applyReferenceRank(80.4, ["x"], [], [])).toEqual({
      score: 80,
      scoreFine: 80.4,
      reasons: ["x"],
    });
    expect(applyReferenceRank(99.9, [], [{ relationship: "founder", story: "seo" }], ["seo"]).scoreFine).toBe(100);
  });
});

describe("tiedCounts", () => {
  test("counts people per displayed score", () => {
    const counts = tiedCounts([90, 87, 87, 87, 60]);
    expect(counts.get(87)).toBe(3);
    expect(counts.get(90)).toBe(1);
    expect(counts.get(10)).toBeUndefined();
  });
});
