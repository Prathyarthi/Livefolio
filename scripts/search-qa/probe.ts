import { prisma } from "@/lib/prisma";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { buildSearchIndexFields, searchIndexKey } from "@/features/applications/lib/search-index";
import { refreshJobSearchProfile } from "@/features/jobs/lib/extract-search-profile";

const t = () => performance.now();
const job = await prisma.job.findFirstOrThrow({
  where: { title: { startsWith: "[search-qa] B2B" } },
  select: { id: true, requirements: { orderBy: { sortOrder: "asc" } } },
});
const profile = await refreshJobSearchProfile(job.id);
const key = searchIndexKey(profile, job.requirements);
console.log("indexed:", await prisma.application.count({ where: { jobId: job.id, searchKey: key } }), "of 10000");

let s = t();
const rows = await prisma.application.findMany({
  where: { jobId: job.id, OR: [{ searchKey: null }, { searchKey: { not: key } }] },
  select: { id: true, coverNote: true, user: { select: { name: true, email: true } }, snapshot: { select: { data: true } } },
  orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
  take: 100,
});
console.log(`select 100 stale rows: ${(t() - s).toFixed(0)} ms (got ${rows.length})`);

s = t();
const batch = rows.map((row) => ({
  id: row.id,
  ...buildSearchIndexFields((row.snapshot?.data as ApplicationSnapshotData) ?? null, {
    key: "probe-only",
    profile,
    requirements: job.requirements,
    name: row.user.name,
    email: row.user.email,
    coverNote: row.coverNote,
  }),
}));
const payload = JSON.stringify(batch);
console.log(`build fields in memory: ${(t() - s).toFixed(0)} ms, payload ${(payload.length / 1024).toFixed(0)} KB`);

const plan = await prisma.$queryRawUnsafe<{ "QUERY PLAN": string }[]>(
  `EXPLAIN (ANALYZE, BUFFERS) SELECT count(*) FROM applications a JOIN jsonb_to_recordset($1::jsonb) AS x(id text) ON a.id = x.id`,
  payload,
);
console.log(plan.map((p) => p["QUERY PLAN"]).join("\n"));

s = t();
await prisma.$queryRaw`SELECT length(${payload}::text)`;
console.log(`upload payload only: ${(t() - s).toFixed(0)} ms`);
process.exit(0);
