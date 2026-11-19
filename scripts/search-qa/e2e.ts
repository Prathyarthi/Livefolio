import { Pool } from "pg";
import { prisma } from "@/lib/prisma";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import {
  applicantPoolWhere,
  filterApplicantsBySearch,
  mergeInterpretedFilters,
  type ApplicantSearchFilters,
} from "@/features/applications/lib/search";
import { buildSearchIndexFields, searchIndexKey } from "@/features/applications/lib/search-index";
import { buildApplicantEvidence } from "@/features/applications/lib/evidence";
import { buildPoolGapReportFromKeys, requirementKey } from "@/features/applications/lib/pool-gaps";
import { loadApplicantPoolPage, POOL_RECALL_CAP } from "@/features/applications/server/applicant-pool";
import { refreshStaleSearchIndex } from "@/features/applications/server/search-index";
import { refreshJobSearchProfile } from "@/features/jobs/lib/extract-search-profile";
import { buildFacetsFromFields, facetFieldsOf } from "@/features/search/lib/facets";
import { matchesStructuredFilters } from "@/features/search/lib/filters";
import { interpretSearchQuery, type SearchSort } from "@/features/search/lib/query";
import { rankAgainstJob, rankCandidate } from "@/features/search/lib/rank";
import { QA_PREFIX } from "./seed";

const failures: string[] = [];
const notes: string[] = [];
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
  return ok;
};
const secs = (ms: number) => `${(ms / 1000).toFixed(2)}s`;
async function timed<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const t = performance.now();
  const out = await fn();
  return [out, performance.now() - t];
}

const jobs = await prisma.job.findMany({
  where: { title: { startsWith: QA_PREFIX } },
  select: { id: true, title: true, requirements: { orderBy: { sortOrder: "asc" } }, _count: { select: { applications: true } } },
  orderBy: { createdAt: "asc" },
});
const main = jobs.find((j) => j.title.includes("Marketing"))!;
const small = jobs.find((j) => !j.title.includes("Marketing"))!;
console.log(`main job ${main.id.slice(0, 8)} with ${main._count.applications} applicants; small job ${small.id.slice(0, 8)} with ${small._count.applications}`);

// ---------- 0. latency to the database from this machine ----------
{
  const samples: number[] = [];
  for (let i = 0; i < 5; i++) samples.push((await timed(() => prisma.$queryRaw`SELECT 1`))[1]);
  const rtt = samples.sort((a, b) => a - b)[2]!;
  notes.push(`database round trip from this machine: ${rtt.toFixed(0)} ms (Vercel next to Neon is ~1-5 ms, so timings below are pessimistic)`);
  console.log(notes.at(-1));
}

// ---------- 1. job profile is reused, not re-extracted ----------
const [profile, profileMs] = await timed(() => refreshJobSearchProfile(main.id));
const stored = await prisma.job.findUnique({ where: { id: main.id }, select: { searchProfile: true } });
check(
  "refreshJobSearchProfile reuses the stored profile (no AI call) when the JD is unchanged",
  (stored?.searchProfile as { extractedAt?: string } | null)?.extractedAt === profile.extractedAt,
  `stored=${(stored?.searchProfile as { extractedAt?: string }).extractedAt} returned=${profile.extractedAt}`,
);
console.log(`1. job profile load ${secs(profileMs)} roleFamily=${profile.roleFamily} gates=${JSON.stringify(profile.gates)}`);

// ---------- 2. backfill: what the first recruiter to open a stale 10k pool triggers ----------
{
  const key0 = searchIndexKey(profile, main.requirements);
  const before = await prisma.application.count({
    where: { jobId: main.id, OR: [{ searchKey: null }, { searchKey: { not: key0 } }] },
  });
  const [first, ms] = await timed(() => refreshStaleSearchIndex(main, profile, 100));
  console.log(`2. pool request indexed 100 in ${secs(ms)}; pending ${before} -> ${first.pending}`);
  check("a pool request indexes exactly its limit", before - first.pending === Math.min(100, before), `${before} -> ${first.pending}`);
  const perRow = ms / 100;
  const remainingEstimate = first.pending * perRow;
  notes.push(
    `indexing speed from this machine: ${perRow.toFixed(1)} ms per applicant -> ${Math.ceil(first.pending / 300)} more pool polls (~${secs(remainingEstimate)}) to finish ${first.pending}`,
  );
  console.log("   " + notes.at(-1));

  if (remainingEstimate > 180_000) {
    // Same builder as the indexer, written in bulk so the test finishes in minutes from a far-away laptop.
    console.log("   finishing the rest with a bulk write of the same builder output…");
    const pg = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
    const key = searchIndexKey(profile, main.requirements);
    for (;;) {
      const rows = await prisma.application.findMany({
        where: { jobId: main.id, OR: [{ searchKey: null }, { searchKey: { not: key } }] },
        select: { id: true, coverNote: true, user: { select: { name: true, email: true } }, snapshot: { select: { data: true } } },
        take: 1000,
      });
      if (rows.length === 0) break;
      const payload = rows.map((row) => ({
        id: row.id,
        ...buildSearchIndexFields((row.snapshot?.data as ApplicationSnapshotData) ?? null, {
          key,
          profile,
          requirements: main.requirements,
          name: row.user.name,
          email: row.user.email,
          coverNote: row.coverNote,
        }),
      }));
      await pg.query(
        `UPDATE applications a SET "searchKey"=x."searchKey","rankScore"=x."rankScore","rankReasons"=x."rankReasons","searchText"=x."searchText","searchSummary"=x."searchSummary","searchEvidence"=x."searchEvidence","matchedRequirements"=x."matchedRequirements","yearsExperience"=x."yearsExperience","proofKinds"=x."proofKinds","skillNames"=x."skillNames","locationLabel"=x."locationLabel"
         FROM jsonb_to_recordset($1::jsonb) AS x(id text,"searchKey" text,"rankScore" int,"rankReasons" text[],"searchText" text,"searchSummary" jsonb,"searchEvidence" jsonb,"matchedRequirements" text[],"yearsExperience" int,"proofKinds" text[],"skillNames" text[],"locationLabel" text)
         WHERE a.id = x.id`,
        [JSON.stringify(payload)],
      );
    }
    await pg.end();
  } else {
    let pending = first.pending;
    while (pending > 0) pending = (await refreshStaleSearchIndex(main, profile, 300)).pending;
  }
  const final = await refreshStaleSearchIndex(main, profile, 300);
  check("everything indexed", final.pending === 0, `pending=${final.pending}`);
}

// ---------- reference data: every applicant, scored fully in memory ----------
const all = (
  await prisma.application.findMany({
    where: { jobId: main.id },
    select: {
      id: true, stage: true, submittedAt: true, coverNote: true, rankScore: true,
      skillNames: true, locationLabel: true, yearsExperience: true, proofKinds: true, matchedRequirements: true,
      user: { select: { name: true, email: true } },
      snapshot: { select: { data: true } },
    },
  })
).map((row) => ({ ...row, snapshot: (row.snapshot?.data as ApplicationSnapshotData) ?? null }));

// ---------- 3. stored index matches a fresh computation ----------
{
  let scoreMismatch = 0;
  let facetMismatch = 0;
  let reqMismatch = 0;
  for (const row of all) {
    const fresh = rankAgainstJob(row.snapshot, profile, { name: row.user.name, email: row.user.email, coverNote: row.coverNote });
    if (fresh.score !== row.rankScore) scoreMismatch += 1;
    const f = facetFieldsOf(row.snapshot);
    if (
      f.yearsExperience !== row.yearsExperience ||
      f.locationLabel !== row.locationLabel ||
      f.proofKinds.join() !== row.proofKinds.join()
    ) facetMismatch += 1;
    const keys = buildApplicantEvidence(row.snapshot, main.requirements).requirementMatches.filter((m) => m.matched).map(requirementKey);
    if (keys.join() !== row.matchedRequirements.join()) reqMismatch += 1;
  }
  console.log(`3. stored vs recomputed over ${all.length}: score mismatches=${scoreMismatch} facet mismatches=${facetMismatch} requirement mismatches=${reqMismatch}`);
  check("stored rankScore equals recomputed score for every applicant", scoreMismatch === 0, `${scoreMismatch}`);
  check("stored facet columns equal snapshot-derived values", facetMismatch === 0, `${facetMismatch}`);
  check("stored matchedRequirements equal evidence", reqMismatch === 0, `${reqMismatch}`);
}

// ---------- 4. pool queries vs reference ----------
type Case = { name: string; stage?: string; filters: ApplicantSearchFilters; sort?: SearchSort };
const dayAgo = new Date(Date.now() - 864e5).toISOString();
const cases: Case[] = [
  { name: "everyone, best match", filters: {} },
  { name: "everyone, most recent", filters: {}, sort: "recent" },
  { name: "stage = shortlisted", stage: "shortlisted", filters: {} },
  { name: "proof = live work", filters: { proof: "live" } },
  { name: "5+ years", filters: { minExperience: 5 } },
  { name: "3-6 years + certified", filters: { minExperience: 3, maxExperience: 6, proof: "certified" } },
  { name: "applied in last 24h", filters: { appliedAfter: dayAgo } },
  { name: 'q "hubspot"', filters: { q: "hubspot" } },
  { name: 'q quoted "account based marketing"', filters: { q: '"account based marketing"' } },
  { name: 'q "seo OR copywriting"', filters: { q: "seo OR copywriting" } },
  { name: 'q "hubspot -seo"', filters: { q: "hubspot -seo" } },
  { name: 'q "b2b marketing 5 years in Bangalore"', filters: { q: "b2b marketing 5 years in Bangalore" } },
  { name: "role filter = Account Executive", filters: { role: "Account Executive" } },
  { name: "education filter = nursing", filters: { education: "nursing" } },
  { name: 'q "zzqx" (no matches)', filters: { q: "zzqx" } },
  { name: 'q "patient care" + stage new', stage: "new", filters: { q: "patient care" } },
];

console.log("\n4. pool queries (page size 50)");
console.log("case                                         path    matched  expected  trunc  page1   facets  allpages  latency");
for (const c of cases) {
  const sort = c.sort ?? "relevance";
  const { where, exact } = applicantPoolWhere(main.id, c.stage, c.filters);
  const resolved = mergeInterpretedFilters(c.filters);
  const interpreted = interpretSearchQuery(c.filters.q);
  const scoped = all.filter((r) => !c.stage || r.stage === c.stage);

  const expected = (exact
    ? scoped.filter((r) => matchesStructuredFilters(r.snapshot, resolved, r.submittedAt)).map((r) => ({ r, score: r.rankScore }))
    : filterApplicantsBySearch(scoped, c.filters).map((r) => ({
        r,
        score: rankCandidate(r.snapshot, { jobProfile: profile, query: interpreted, extras: { name: r.user.name, email: r.user.email, coverNote: r.coverNote } }).score,
      }))
  ).sort((a, b) =>
    sort === "recent"
      ? b.r.submittedAt.getTime() - a.r.submittedAt.getTime() || a.r.id.localeCompare(b.r.id)
      : b.score - a.score || b.r.submittedAt.getTime() - a.r.submittedAt.getTime() || b.r.rankScore - a.r.rankScore || a.r.id.localeCompare(b.r.id),
  );

  const [page1, ms] = await timed(() =>
    loadApplicantPoolPage({ job: main, profile, stage: c.stage, filters: c.filters, sort, page: 1, pageSize: 50 }),
  );

  // recall must never drop a true match
  if (!exact) {
    const recalled = new Set((await prisma.application.findMany({ where, select: { id: true } })).map((r) => r.id));
    const missed = expected.filter((e) => !recalled.has(e.r.id)).length;
    check(`[${c.name}] SQL recall contains every true match`, missed === 0, `${missed} missed`);
  }

  const ids = page1.applicants.map((a) => a.id);
  let pageOk: boolean;
  let facetsOk = true;
  let allPagesOk: string = "-";
  if (page1.truncated) {
    const topExpected = new Set(expected.slice(0, 50).map((e) => e.r.id));
    const overlap = ids.filter((id) => topExpected.has(id)).length;
    pageOk = overlap >= 45;
    notes.push(`[${c.name}] ${expected.length} true matches > recall cap ${POOL_RECALL_CAP}: page 1 shares ${overlap}/50 with the full-pool best 50`);
    check(`[${c.name}] truncated page 1 close to true top 50`, pageOk, `${overlap}/50`);
  } else {
    check(`[${c.name}] matchedCount`, page1.matchedCount === expected.length, `${page1.matchedCount} vs ${expected.length}`);
    const exp1 = expected.slice(0, 50).map((e) => e.r.id);
    pageOk = check(`[${c.name}] page 1 order`, ids.join() === exp1.join(), `first diff at ${ids.findIndex((id, i) => id !== exp1[i])}`);
    const expFacets = buildFacetsFromFields(expected.map((e) => e.r));
    facetsOk = check(`[${c.name}] facets`, JSON.stringify(page1.facets) === JSON.stringify(expFacets));
    if (exact && page1.pageCount > 1) {
      const last = await loadApplicantPoolPage({ job: main, profile, stage: c.stage, filters: c.filters, sort, page: page1.pageCount, pageSize: 50 });
      const expLast = expected.slice((page1.pageCount - 1) * 50).map((e) => e.r.id);
      allPagesOk = check(`[${c.name}] last page`, last.applicants.map((a) => a.id).join() === expLast.join()) ? "last ok" : "FAIL";
    }
  }
  console.log(
    `${c.name.padEnd(44)} ${(exact ? "exact" : "recall").padEnd(7)} ${String(page1.matchedCount).padStart(7)}  ${String(expected.length).padStart(8)}  ${String(page1.truncated).padEnd(5)}  ${(pageOk ? "ok" : "FAIL").padEnd(6)}  ${(facetsOk ? "ok" : "FAIL").padEnd(6)}  ${allPagesOk.padEnd(8)}  ${secs(ms)}`,
  );
}

// ---------- 5. requirement gaps ----------
{
  const page = await loadApplicantPoolPage({ job: main, profile, stage: undefined, filters: {}, sort: "relevance", page: 1, pageSize: 10 });
  const expected = buildPoolGapReportFromKeys(
    all.map((r) => buildApplicantEvidence(r.snapshot, main.requirements).requirementMatches.filter((m) => m.matched).map(requirementKey)),
    main.requirements,
  );
  check("pool gap report matches recomputed evidence", JSON.stringify(page.gaps) === JSON.stringify(expected));
  console.log(`\n5. gap report: ${JSON.stringify(page.gaps).slice(0, 220)}…`);
}

// ---------- 6. job edit + concurrent recruiters (small job) ----------
{
  const sp = await refreshJobSearchProfile(small.id);
  const [results, ms] = await timed(() =>
    Promise.allSettled([refreshStaleSearchIndex(small, sp, 300), refreshStaleSearchIndex(small, sp, 300)]),
  );
  const errors = results.filter((r) => r.status === "rejected");
  check("two recruiters opening the same stale pool at once: no errors", errors.length === 0, String((errors[0] as PromiseRejectedResult | undefined)?.reason).slice(0, 200));
  const pendingAfter = await refreshStaleSearchIndex(small, sp, 300);
  check("concurrent refresh leaves nothing pending", pendingAfter.pending === 0, String(pendingAfter.pending));
  console.log(`6. concurrent indexing of ${small._count.applications}: ${secs(ms)}, errors=${errors.length}`);

  const before = await prisma.application.findMany({ where: { jobId: small.id }, select: { id: true, rankScore: true, searchKey: true } });
  await prisma.jobRequirement.create({ data: { jobId: small.id, type: "preferred", category: "skill", label: "Redis", sortOrder: 99 } });
  const edited = await prisma.job.findUniqueOrThrow({ where: { id: small.id }, select: { id: true, requirements: { orderBy: { sortOrder: "asc" } } } });
  const stale = await refreshStaleSearchIndex(edited, sp, 0);
  check("editing requirements marks the whole pool stale", stale.pending === before.length, `${stale.pending}/${before.length}`);
  let pending = stale.pending;
  while (pending > 0) pending = (await refreshStaleSearchIndex(edited, sp, 300)).pending;
  const after = await prisma.application.findMany({ where: { jobId: small.id }, select: { id: true, searchKey: true, matchedRequirements: true } });
  check("after edit every row has the new key", after.every((r) => r.searchKey === stale.key));
  const withRedis = after.filter((r) => r.matchedRequirements.includes("preferred|Redis")).length;
  console.log(`   requirement edit re-indexed ${after.length}; ${withRedis} applicants now match "Redis"`);
  check("new requirement is reflected in matched requirements", withRedis > 0);

  const leak = await loadApplicantPoolPage({ job: main, profile, stage: undefined, filters: { q: "kafka" }, sort: "relevance", page: 1, pageSize: 50 });
  const smallIds = new Set(after.map((r) => r.id));
  check("a job's pool never shows another job's applicants", leak.applicants.every((a) => !smallIds.has(a.id)));
}

// ---------- 7. nightly cron handler ----------
{
  process.env.CRON_SECRET = "search-qa-secret";
  const { GET } = await import("@/app/api/cron/search-index/route");
  const denied = await GET(new Request("http://x/api/cron/search-index"));
  check("cron rejects requests without the secret", denied.status === 401, String(denied.status));
  const staleIds = (await prisma.application.findMany({ where: { jobId: main.id }, select: { id: true }, take: 100 })).map((r) => r.id);
  await prisma.application.updateMany({ where: { id: { in: staleIds } }, data: { searchKey: null } });
  const [res, ms] = await timed(() => GET(new Request("http://x/api/cron/search-index", { headers: { authorization: "Bearer search-qa-secret" } })));
  const body = (await res.json()) as { jobs: number; pending: number; failed: number };
  console.log(`7. cron: ${JSON.stringify(body)} in ${secs(ms)}`);
  check("cron finishes with nothing pending and no failures", res.status === 200 && body.failed === 0 && body.pending === 0, JSON.stringify(body));
}

console.log("\nnotes:");
for (const n of notes) console.log(" - " + n);
console.log(`\n=== RESULT: ${failures.length === 0 ? "all end-to-end checks passed" : `${failures.length} failure(s)`} ===`);
for (const f of failures) console.log(" - " + f);
process.exit(0);
