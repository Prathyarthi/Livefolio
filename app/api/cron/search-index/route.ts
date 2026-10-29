import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshJobSearchProfile } from "@/features/jobs/lib/extract-search-profile";
import { refreshStaleSearchIndex } from "@/features/applications/server/search-index";

export const maxDuration = 300;

const JOB_PAGE_SIZE = 50;
const PER_JOB_LIMIT = 2000;
/** Leave headroom under maxDuration so the last batch can commit. */
const TIME_BUDGET_MS = 240_000;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  let cursor: string | undefined;
  let jobs = 0;
  let pending = 0;
  let failed = 0;

  do {
    const page = await prisma.job.findMany({
      where: { applications: { some: {} } },
      select: {
        id: true,
        requirements: { orderBy: { sortOrder: "asc" as const } },
      },
      orderBy: { id: "asc" },
      take: JOB_PAGE_SIZE,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    for (const job of page) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) break;
      try {
        const profile = await refreshJobSearchProfile(job.id);
        const result = await refreshStaleSearchIndex(job, profile, PER_JOB_LIMIT);
        pending += result.pending;
        jobs += 1;
      } catch (error) {
        failed += 1;
        console.error("[search-index.cron] job failed", { jobId: job.id, error });
      }
    }

    cursor = page.length === JOB_PAGE_SIZE ? page.at(-1)?.id : undefined;
  } while (cursor && Date.now() - startedAt <= TIME_BUDGET_MS);

  return NextResponse.json({ jobs, pending, failed });
}
