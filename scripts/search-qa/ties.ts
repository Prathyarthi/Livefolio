/**
 * Tie distribution for a synthetic applicant pool (no database).
 * Run: bun scripts/search-qa/ties.ts [profession] [size]
 * "before" mimics the old index: no freshness input, integer score only.
 * "after" mimics the new index: profile age at apply time, fine score.
 */
import { rankAgainstJob } from "@/features/search/lib/rank";
import { buildPool, qaJob, rng, type ProfessionId } from "./fixtures";

const MAIN_MIX = { strong: 0.08, partial: 0.15, adjacent: 0.17, unrelated: 0.6 };

const id = (process.argv[2] ?? "marketer") as ProfessionId;
const size = Number(process.argv[3] ?? 5000);
const job = qaJob(id);
const pool = buildPool(777, id, size, MAIN_MIX);
const r = rng(4242);

// Profile age when applying: most people edited recently, a long tail did not.
function profileAgeDays(): number {
  const roll = r();
  if (roll < 0.3) return r() * 7;
  if (roll < 0.55) return 7 + r() * 23;
  if (roll < 0.8) return 30 + r() * 60;
  if (roll < 0.95) return 90 + r() * 275;
  return 365 + r() * 400;
}

const submittedAt = Date.now();
const rows = pool.map((c) => {
  const before = rankAgainstJob(c.snapshot, job.profile, { name: c.name, email: c.email });
  const ageMs = profileAgeDays() * 864e5;
  const after = rankAgainstJob(c.snapshot, job.profile, {
    name: c.name,
    email: c.email,
    freshnessAt: new Date(submittedAt - ageMs),
    freshnessAsOf: new Date(submittedAt),
  });
  return { before, after };
});

function report(label: string, keys: string[], cutKeys: string[]) {
  const top = new Set(cutKeys.slice(0, 100));
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  const sizes = [...counts.values()];
  const tiedPeople = sizes.filter((n) => n > 1).reduce((s, n) => s + n, 0);
  const cutKey = cutKeys[9]!;
  console.log(
    `${label.padEnd(34)} distinct=${String(counts.size).padStart(4)}  largest group=${String(Math.max(...sizes)).padStart(3)}  people in a tie=${String(tiedPeople).padStart(4)} (${((tiedPeople / keys.length) * 100).toFixed(0)}%)  tied at rank-10 cut=${String(counts.get(cutKey)).padStart(2)}  distinct in top 100=${top.size}`,
  );
}

type Rank = (typeof rows)[number]["before"];
const intKey = (x: Rank) => String(x.score);
const fineKey = (x: Rank) => String(x.scoreFine ?? x.score);
const chainKey = (x: Rank) => `${fineKey(x)}|${x.proven}|${x.overlap}`;
const sorted = (side: "before" | "after", key: (x: Rank) => string) =>
  rows
    .map((row) => row[side])
    .sort((a, b) => (b.scoreFine ?? b.score) - (a.scoreFine ?? a.score) || b.proven - a.proven || b.overlap - a.overlap)
    .map(key);

console.log(`${id}, ${size} synthetic applicants`);
report("before: displayed integer", rows.map((x) => intKey(x.before)), sorted("before", intKey));
report("after:  displayed integer", rows.map((x) => intKey(x.after)), sorted("after", intKey));
report("after:  fine score", rows.map((x) => fineKey(x.after)), sorted("after", fineKey));
report("after:  fine + proof + skill", rows.map((x) => chainKey(x.after)), sorted("after", chainKey));
console.log("(any group left after fine + proof + skill falls through to earliest applicant, then id: always a total order)");
