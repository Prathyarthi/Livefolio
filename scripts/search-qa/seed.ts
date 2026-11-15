import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/db/generated/prisma/client";
import { buildPool, qaJob, type ProfessionId } from "./fixtures";

export const QA_DOMAIN = "search-qa.livefolio.test";
export const QA_PREFIX = "[search-qa]";
export const MAIN = { target: "marketer" as ProfessionId, seed: 777, size: Number(process.env.QA_SIZE ?? 10_000) };
export const SMALL = { target: "backend" as ProfessionId, seed: 888, size: 300 };
export const MAIN_MIX = { strong: 0.08, partial: 0.15, adjacent: 0.17, unrelated: 0.6 };
const STAGES = ["new", "new", "new", "new", "new", "new", "new", "new", "reviewing", "shortlisted", "rejected"];

async function insertRows(pool: Pool, table: string, columns: string[], rows: unknown[][]) {
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const values = chunk
      .map((row, r) => `(${row.map((_, c) => `$${r * columns.length + c + 1}`).join(",")})`)
      .join(",");
    await pool.query(
      `INSERT INTO ${table} (${columns.map((c) => `"${c}"`).join(",")}) VALUES ${values}`,
      chunk.flat(),
    );
  }
}

async function seedJob(
  pool: Pool,
  ctx: { organizationId: string; workspaceId: string; createdById: string },
  spec: { target: ProfessionId; seed: number; size: number },
  mix?: typeof MAIN_MIX,
) {
  const job = qaJob(spec.target);
  const created = await prisma.job.create({
    data: {
      ...ctx,
      title: `${QA_PREFIX} ${job.input.title}`,
      slug: `search-qa-${spec.target}-${Date.now()}`,
      description: job.input.description,
      qualifications: job.input.qualifications,
      location: job.input.location,
      experienceMin: job.input.experienceMin,
      status: "draft",
      requirements: {
        create: job.requirements.map((r, i) => ({ ...r, sortOrder: i })),
      },
    },
    select: { id: true, title: true },
  });
  // Profile hash must match what refreshJobSearchProfile computes from the stored row, so no AI call happens.
  const qa = qaJob(spec.target);
  qa.input.title = created.title;
  const { profileHash } = await import("./fixtures");
  const profile = { ...qa.profile, sourceHash: profileHash(qa.input) };
  await prisma.job.update({
    where: { id: created.id },
    data: { searchProfile: profile as unknown as Prisma.InputJsonValue },
  });

  const candidates = buildPool(spec.seed, spec.target, spec.size, mix);
  const now = Date.now();
  const users: unknown[][] = [];
  const apps: unknown[][] = [];
  const snaps: unknown[][] = [];
  for (const [i, c] of candidates.entries()) {
    const userId = randomUUID();
    const appId = randomUUID();
    const stage = STAGES[i % STAGES.length]!;
    const submittedAt = new Date(now - Math.floor((i / candidates.length) * 2 * 864e5) - (i % 997) * 1000);
    users.push([userId, c.name, `${spec.target}-${c.email}`, "seed-no-login", new Date(), new Date()]);
    apps.push([appId, created.id, userId, stage === "new" ? "applied" : stage, stage, stage === "shortlisted", submittedAt, new Date()]);
    snaps.push([randomUUID(), appId, JSON.stringify(c.snapshot), new Date()]);
  }
  await insertRows(pool, "users", ["id", "name", "email", "password", "createdAt", "updatedAt"], users);
  await insertRows(pool, "applications", ["id", "jobId", "userId", "status", "stage", "shortlisted", "submittedAt", "updatedAt"], apps);
  await insertRows(pool, "application_snapshots", ["id", "applicationId", "data", "createdAt"], snaps);
  return created.id;
}

if (import.meta.main) {
  const workspace = await prisma.workspace.findFirstOrThrow({
    where: { name: "marketing", organization: { name: "Livefolio" } },
    select: { id: true, organizationId: true, organization: { select: { members: { where: { role: "owner" }, select: { userId: true }, take: 1 } } } },
  });
  const ctx = {
    organizationId: workspace.organizationId,
    workspaceId: workspace.id,
    createdById: workspace.organization.members[0]!.userId,
  };
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
  const t = performance.now();
  const mainId = await seedJob(pool, ctx, MAIN, MAIN_MIX);
  const smallId = await seedJob(pool, ctx, SMALL);
  console.log(`seeded main=${mainId} (${MAIN.size}) small=${smallId} (${SMALL.size}) in ${((performance.now() - t) / 1000).toFixed(1)}s`);
  await pool.end();
  process.exit(0);
}
