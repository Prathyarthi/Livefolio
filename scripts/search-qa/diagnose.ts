import { rankAgainstJob } from "@/features/search/lib/rank";
import { STYLES, buildCandidate, buildPool, qaJob, rng, type ProfessionId } from "./fixtures";

const id = (process.argv[2] ?? "marketer") as ProfessionId;
const job = qaJob(id);
console.log(`job: ${id}  must=${job.profile.mustHaves.join(", ")}  nice=${job.profile.niceToHaves.join(", ")}  gates=${JSON.stringify(job.profile.gates)}`);
for (const style of STYLES) {
  const c = buildCandidate(rng(50), { index: 1, target: id, fit: "strong", style, minYears: 4, withProof: true });
  const r = rankAgainstJob(c.snapshot, job.profile);
  console.log(
    `${style.padEnd(11)} score=${r.score} overlap=${r.overlap.toFixed(2)} proven=${r.proven.toFixed(2)} platform=${r.platform.toFixed(2)} fit=${r.fit.toFixed(2)} | ${r.reasons.join(" · ")}`,
  );
}

console.log("\nstrong candidates scoring below the best partial candidate:");
const pool = buildPool(1002, id, 600);
const scored = pool.map((c) => ({ c, r: rankAgainstJob(c.snapshot, job.profile) }));
const bestPartial = Math.max(...scored.filter((x) => x.c.fit === "partial").map((x) => x.r.score));
const losers = scored.filter((x) => x.c.fit === "strong" && x.r.score < bestPartial);
const byStyle: Record<string, number> = {};
for (const x of losers) byStyle[x.c.style] = (byStyle[x.c.style] ?? 0) + 1;
console.log(`best partial=${bestPartial}; strong below it by style:`, byStyle);
const topPartial = scored.filter((x) => x.c.fit === "partial").sort((a, b) => b.r.score - a.r.score)[0]!;
console.log(
  `top partial: style=${topPartial.c.style} years=${topPartial.c.years} skills=${topPartial.c.snapshot.skills.map((s) => s.name).join("/")} overlap=${topPartial.r.overlap.toFixed(2)} proven=${topPartial.r.proven.toFixed(2)} fit=${topPartial.r.fit.toFixed(2)}`,
);
