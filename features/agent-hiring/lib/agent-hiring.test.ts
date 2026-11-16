import { describe, expect, test } from "bun:test";
import { draftJobFromBrief, draftToJobInput } from "./brief";
import { parseAgentSession } from "./session";
import { draftInvite, mergeShortlist, type PoolCandidate } from "./shortlist";

const good = {
  title: "Product Designer, Onboarding",
  summary: "Own our onboarding flow and reduce drop-off.",
  employmentType: "full_time",
  workplaceType: "remote",
  location: null,
  experienceMin: 3,
  responsibilities: ["Redesign onboarding"],
  requirements: [
    { type: "required", category: "skill", label: "Figma" },
    { type: "required", category: "skill", label: "figma" },
    { type: "preferred", category: "experience", label: "Activation experiments" },
  ],
};

describe("draftJobFromBrief", () => {
  test("parses fenced JSON, dedupes requirements and passes the brief to the model", async () => {
    let seenUser = "";
    const res = await draftJobFromBrief("need someone to fix our onboarding drop-off, remote, mid-level", async ({ user }) => {
      seenUser = user;
      return "```json\n" + JSON.stringify(good) + "\n```";
    });
    expect(seenUser).toContain("onboarding drop-off");
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.draft.title).toBe("Product Designer, Onboarding");
    expect(res.draft.workplaceType).toBe("remote");
    expect(res.draft.requirements.map((r) => r.label)).toEqual(["Figma", "Activation experiments"]);
    const input = draftToJobInput(res.draft);
    expect(input.description).toBe(good.summary);
    expect(input.requirements[1]).toMatchObject({ type: "preferred", sortOrder: 1 });
    expect(input.responsibilities).toBe("- Redesign onboarding");
  });

  test("coerces bad enums to null instead of failing", async () => {
    const res = await draftJobFromBrief("need a sales lead in Bangalore asap", async () =>
      JSON.stringify({ ...good, workplaceType: "wfh", employmentType: "gig", experienceMin: "x" }),
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.draft.workplaceType).toBeNull();
    expect(res.draft.employmentType).toBeNull();
    expect(res.draft.experienceMin).toBeNull();
  });

  test("rejects short briefs without calling the model", async () => {
    let called = false;
    const res = await draftJobFromBrief("dev", async () => {
      called = true;
      return "{}";
    });
    expect(res).toMatchObject({ ok: false, status: 400 });
    expect(called).toBe(false);
  });

  test("model errors and garbage become 502", async () => {
    const thrown = await draftJobFromBrief("need someone for onboarding", async () => {
      throw new Error("boom");
    });
    expect(thrown).toMatchObject({ ok: false, status: 502 });
    const garbage = await draftJobFromBrief("need someone for onboarding", async () => "sorry, no");
    expect(garbage).toMatchObject({ ok: false, status: 502 });
  });
});

function cand(userId: string, score: number, ref = userId): PoolCandidate {
  return { userId, name: userId, headline: "", avatarUrl: null, livefolioUrl: null, score, reasons: [], proof: [], ref };
}

describe("mergeShortlist", () => {
  test("dedupes people in both pools as Applicant, sorts by score, caps size", () => {
    const out = mergeShortlist(
      [cand("a", 60, "app-1"), cand("a", 70, "app-2"), cand("b", 40)],
      [cand("a", 95), cand("c", 80), cand("d", 10)],
      3,
    );
    expect(out.map((c) => [c.userId, c.label, c.score])).toEqual([
      ["c", "Sourced", 80],
      ["a", "Applicant", 70],
      ["b", "Applicant", 40],
    ]);
    expect(out[1].ref).toBe("app-2");
  });

  test("applicant wins a tie", () => {
    const out = mergeShortlist([cand("a", 50)], [cand("b", 50)]);
    expect(out.map((c) => c.source)).toEqual(["applicant", "sourced"]);
  });
});

describe("mergeShortlist ties", () => {
  const ordered = (
    id: string,
    over: Partial<NonNullable<PoolCandidate["order"]>>,
    score = 87,
  ): PoolCandidate => ({
    ...cand(id, score),
    order: {
      scoreFine: 87.2,
      proof: 0.5,
      skill: 0.5,
      at: new Date("2026-01-10T00:00:00Z"),
      id,
      ...over,
    },
  });

  test("equal scores order by proof of work, skill match, earliest applicant, then id", () => {
    const out = mergeShortlist(
      [],
      [
        ordered("e", { at: new Date("2026-02-01T00:00:00Z") }),
        ordered("d", { at: new Date("2026-01-01T00:00:00Z") }),
        ordered("c", { skill: 0.9 }),
        ordered("b", { proof: 0.8 }),
        ordered("a", { proof: 0.8, skill: 0.7 }),
        ordered("z", { scoreFine: 87.4 }),
      ],
    );
    expect(out.map((c) => c.userId)).toEqual(["z", "a", "b", "c", "d", "e"]);
  });

  test("the cut at the shortlist size is the same whatever the input order", () => {
    const pool = Array.from({ length: 13 }, (_, i) =>
      ordered(`p${String(i).padStart(2, "0")}`, {
        proof: (i % 3) / 3,
        at: new Date(Date.UTC(2026, 0, 1 + i)),
      }),
    );
    const forward = mergeShortlist([], pool).map((c) => c.userId);
    const backward = mergeShortlist([], [...pool].reverse()).map((c) => c.userId);
    expect(forward).toHaveLength(10);
    expect(backward).toEqual(forward);
  });

  test("an applicant still wins a full tie, and the better of two applications is kept", () => {
    const out = mergeShortlist(
      [
        { ...ordered("x", { id: "app-late", at: new Date("2026-03-01T00:00:00Z") }), ref: "app-late" },
        { ...ordered("x", { id: "app-early", at: new Date("2026-01-01T00:00:00Z") }), ref: "app-early" },
      ],
      [ordered("y", { id: "slug" })],
    );
    expect(out.map((c) => [c.userId, c.label])).toEqual([
      ["x", "Applicant"],
      ["y", "Sourced"],
    ]);
    expect(out[0]!.ref).toBe("app-early");
  });
});

test("parseAgentSession keeps a draft and ignores garbage", () => {
  const raw = JSON.stringify({
    brief: "Need a designer for onboarding",
    draft: {
      title: "Designer",
      summary: "Own onboarding.",
      requirements: [],
      responsibilities: [],
    },
    job: { id: "j1", title: "Designer", slug: "designer", status: "draft" },
    result: null,
    selected: {},
    invites: {},
  });
  const session = parseAgentSession(raw);
  expect(session?.brief).toBe("Need a designer for onboarding");
  expect(session?.job?.id).toBe("j1");
  expect(parseAgentSession("not json")).toBeNull();
  expect(parseAgentSession(null)).toBeNull();
});

test("draftInvite uses first name, reasons and job link", () => {
  const inv = draftInvite({
    candidateName: "Asha Rao",
    source: "sourced",
    jobTitle: "Designer",
    orgName: "Acme",
    jobUrl: "https://x/jobs/abc",
    reasons: ["Must-have: Figma", "Live project: Shop UI"],
    senderName: "P",
  });
  expect(inv.subject).toBe("Designer at Acme");
  expect(inv.body).toContain("Hi Asha");
  expect(inv.body).toContain("Figma; Shop UI");
  expect(inv.body).toContain("https://x/jobs/abc");
});
