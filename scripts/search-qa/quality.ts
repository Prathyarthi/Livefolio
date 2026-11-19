import { rankAgainstJob, rankCandidate } from "@/features/search/lib/rank";
import { interpretSearchQuery } from "@/features/search/lib/query";
import {
  FIT_LABEL,
  PROFESSIONS,
  STYLES,
  buildCandidate,
  buildPool,
  qaJob,
  rng,
  type Fit,
  type GeneratedCandidate,
  type ProfessionId,
} from "./fixtures";

const JOBS = Object.keys(PROFESSIONS) as ProfessionId[];
const FITS: Fit[] = ["strong", "partial", "adjacent", "unrelated"];

function ndcg(labels: number[], k: number): number {
  const dcg = (xs: number[]) =>
    xs.slice(0, k).reduce((s, rel, i) => s + (2 ** rel - 1) / Math.log2(i + 2), 0);
  const ideal = dcg([...labels].sort((a, b) => b - a));
  return ideal === 0 ? 1 : dcg(labels) / ideal;
}

function pairwise(a: number[], b: number[]): number {
  let wins = 0;
  for (const x of a) for (const y of b) wins += x > y ? 1 : x === y ? 0.5 : 0;
  return a.length && b.length ? wins / (a.length * b.length) : NaN;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
const f1 = (x: number) => (Number.isNaN(x) ? "  -  " : x.toFixed(1).padStart(5));
const f2 = (x: number) => (Number.isNaN(x) ? " -  " : x.toFixed(2));

type Row = { c: GeneratedCandidate; score: number; reasons: string[] };

console.log("\n=== 1. Job ranking quality (600 candidates per job, 10% strong / 20% partial / 20% adjacent / 50% unrelated) ===");
console.log(
  "job         nDCG@20  P@10strong  P@20(strong|partial)  mean score strong/partial/adjacent/unrelated   pairwise S>P  P>A  A>U",
);
const styleGaps: Record<string, number[]> = {};
const failures: string[] = [];
for (const [i, id] of JOBS.entries()) {
  const job = qaJob(id);
  const pool = buildPool(1000 + i, id, 600);
  const rows: Row[] = pool
    .map((c) => {
      const rank = rankAgainstJob(c.snapshot, job.profile, { name: c.name, email: c.email });
      return { c, score: rank.score, reasons: rank.reasons };
    })
    .sort((a, b) => b.score - a.score);
  const labels = rows.map((r) => FIT_LABEL[r.c.fit]);
  const byFit = (f: Fit) => rows.filter((r) => r.c.fit === f).map((r) => r.score);
  const p10 = rows.slice(0, 10).filter((r) => r.c.fit === "strong").length / 10;
  const p20 = rows.slice(0, 20).filter((r) => r.c.fit === "strong" || r.c.fit === "partial").length / 20;
  const sp = pairwise(byFit("strong"), byFit("partial"));
  const pa = pairwise(byFit("partial"), byFit("adjacent"));
  const au = pairwise(byFit("adjacent"), byFit("unrelated"));
  console.log(
    `${id.padEnd(11)} ${ndcg(labels, 20).toFixed(3)}    ${p10.toFixed(2)}        ${p20.toFixed(2)}                  ${FITS.map((f) => f1(mean(byFit(f)))).join(" ")}                  ${f2(sp)} ${f2(pa)} ${f2(au)}`,
  );
  if (sp < 0.9) failures.push(`${id}: strong beats partial only ${f2(sp)} of the time`);
  if (pa < 0.75) failures.push(`${id}: partial beats adjacent only ${f2(pa)} of the time`);
  if (au < 0.75) failures.push(`${id}: adjacent beats unrelated only ${f2(au)} of the time`);

  for (const style of STYLES) {
    const strong = rows.filter((r) => r.c.fit === "strong" && r.c.style === style).map((r) => r.score);
    (styleGaps[style] ??= []).push(mean(strong));
  }
}

console.log("\n=== 2. Fairness by where skills live (mean score of STRONG candidates, per job) ===");
console.log(`style        ${JOBS.map((j) => j.slice(0, 7).padStart(8)).join("")}`);
for (const style of STYLES) {
  console.log(`${style.padEnd(12)} ${styleGaps[style]!.map((x) => f1(x).padStart(8)).join("")}`);
}

console.log("\n=== 3. Controlled pairs: same person, skills placed differently (marketer job) ===");
{
  const job = qaJob("marketer");
  const r = rng(7);
  for (const style of STYLES) {
    const scores = [0, 1, 2, 3, 4].map((k) =>
      rankAgainstJob(
        buildCandidate(rng(50 + k), {
          index: k,
          target: "marketer",
          fit: "strong",
          style,
          minYears: 4,
          withProof: true,
        }).snapshot,
        job.profile,
      ).score,
    );
    void r;
    console.log(`${style.padEnd(12)} scores ${scores.join(", ")}`);
  }
}

console.log("\n=== 4. Recruiter text queries over a mixed pool (no job, talent-search style) ===");
const queries: Array<{ q: string; expect: ProfessionId }> = [
  { q: "figma prototyping", expect: "designer" },
  { q: "demand generation hubspot 5 years", expect: "marketer" },
  { q: "ICU nurse ACLS", expect: "nurse" },
  { q: "GST audit tally", expect: "accountant" },
  { q: "node.js postgres kafka", expect: "backend" },
  { q: "salesforce OR negotiation", expect: "sales" },
  { q: "recruiting onboarding -nurse", expect: "hr" },
  { q: "\"technical writing\" editing", expect: "writer" },
];
const everyone = JOBS.flatMap((id, i) =>
  buildPool(5000 + i, id, 80, { strong: 0.4, partial: 0.3, adjacent: 0.15, unrelated: 0.15 }),
);
console.log("query                                   matched  top10 right profession  precision");
for (const { q, expect } of queries) {
  const interpreted = interpretSearchQuery(q);
  const ranked = everyone
    .map((c) => ({ c, rank: rankCandidate(c.snapshot, { query: interpreted }) }))
    .filter((x) => x.rank.overlap > 0)
    .sort((a, b) => b.rank.score - a.rank.score);
  const top = ranked.slice(0, 10);
  const right = top.filter((x) => x.c.profession === expect).length;
  console.log(`${q.padEnd(40)} ${String(ranked.length).padStart(6)}  ${String(right).padStart(5)}/10                ${(right / 10).toFixed(1)}`);
  if (right < 8) failures.push(`query "${q}": only ${right}/10 of top results are ${expect}s`);
}

console.log("\n=== 5. Properties ===");
let checked = 0;
const prop = (name: string, ok: boolean, detail = "") => {
  checked += 1;
  if (!ok) failures.push(`property "${name}" failed ${detail}`);
};
for (const [i, id] of JOBS.entries()) {
  const job = qaJob(id);
  const pool = buildPool(9000 + i, id, 200);
  for (const c of pool) {
    const a = rankAgainstJob(c.snapshot, job.profile);
    const b = rankAgainstJob(structuredClone(c.snapshot), job.profile);
    prop("deterministic", a.score === b.score, c.key);
    prop("score in 0..100", a.score >= 0 && a.score <= 100 && Number.isInteger(a.score), c.key);

    const plusSkill = structuredClone(c.snapshot);
    plusSkill.skills.push({ name: job.profile.mustHaves[0]!, category: "x", level: 3 });
    prop(
      "adding a must-have never lowers score",
      rankAgainstJob(plusSkill, job.profile).score >= a.score,
      `${c.key} ${a.score}→${rankAgainstJob(plusSkill, job.profile).score}`,
    );

    const plusProof = structuredClone(c.snapshot);
    plusProof.projects.push({
      title: `${job.profile.mustHaves[0]} launch`,
      description: "shipped",
      liveUrl: "https://example.com/x",
      sourceUrl: null,
      techStack: [job.profile.mustHaves[0]!],
      featured: false,
    });
    prop(
      "adding linked proof never lowers score",
      rankAgainstJob(plusProof, job.profile).score >= a.score,
      c.key,
    );
  }
  const best = Math.max(
    ...pool.map((c) => rankAgainstJob(c.snapshot, job.profile).score),
  );
  prop(`${id}: best candidate can score 80+`, best >= 80, `best=${best}`);
  console.log(`${id.padEnd(11)} best score in pool: ${best}`);
}
{
  const job = qaJob("marketer");
  const now = rankCandidate(buildPool(1, "marketer", 1)[0]!.snapshot, {
    jobProfile: job.profile,
    extras: { freshnessAt: new Date() },
  }).score;
  const old = rankCandidate(buildPool(1, "marketer", 1)[0]!.snapshot, {
    jobProfile: job.profile,
    extras: { freshnessAt: new Date(Date.now() - 400 * 864e5) },
  }).score;
  prop("fresher application never ranks lower", now >= old, `${now} vs ${old}`);
}
console.log(`${checked} property checks run`);

console.log("\n=== 6. Speed: rank 10,000 applicants in memory ===");
{
  const job = qaJob("marketer");
  const pool = buildPool(42, "marketer", 10_000);
  const t = performance.now();
  for (const c of pool) rankAgainstJob(c.snapshot, job.profile);
  const ms = performance.now() - t;
  console.log(`${ms.toFixed(0)} ms total, ${(ms / pool.length).toFixed(3)} ms per applicant`);
}

console.log(`\n=== RESULT: ${failures.length === 0 ? "all checks passed" : `${failures.length} issue(s)`} ===`);
for (const f of failures.slice(0, 40)) console.log(" - " + f);
if (failures.length > 40) console.log(` … and ${failures.length - 40} more`);
