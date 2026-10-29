import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/db/generated/prisma/client";
import { buildSearchIndexFields, searchIndexKey } from "@/features/applications/lib/search-index";
import { buildCandidate, profileHash, qaJob, rng } from "./fixtures";
import { MIX } from "./ten-each";

const TITLE = "[search-qa] Browser 10 Marketing";

const existing = await prisma.job.findMany({
  where: { title: TITLE, status: "draft" },
  select: { id: true },
});
if (existing.length) {
  await prisma.job.deleteMany({ where: { id: { in: existing.map((j) => j.id) } } });
}

const workspace = await prisma.workspace.findFirstOrThrow({
  where: { name: "marketing", organization: { name: "Livefolio" } },
  select: {
    id: true,
    organizationId: true,
    organization: {
      select: { members: { where: { role: "owner" }, select: { userId: true }, take: 1 } },
    },
  },
});

const qa = qaJob("marketer");
const created = await prisma.job.create({
  data: {
    organizationId: workspace.organizationId,
    workspaceId: workspace.id,
    createdById: workspace.organization.members[0]!.userId,
    title: TITLE,
    slug: `search-qa-browser-marketing-${Date.now()}`,
    description: qa.input.description,
    qualifications: qa.input.qualifications,
    location: qa.input.location,
    experienceMin: qa.input.experienceMin,
    status: "draft",
    requirements: { create: qa.requirements.map((r, i) => ({ ...r, sortOrder: i })) },
  },
  select: { id: true, title: true, requirements: true },
});
qa.input.title = created.title;
const profile = { ...qa.profile, sourceHash: profileHash(qa.input) };
await prisma.job.update({
  where: { id: created.id },
  data: { searchProfile: profile as unknown as Prisma.InputJsonValue },
});

const r = rng(22);
const people = MIX.map((spec, i) =>
  buildCandidate(r, { index: 22 + i, target: "marketer", ...spec }),
);

const key = searchIndexKey(profile, created.requirements);
for (const c of people) {
  const userId = randomUUID();
  const appId = randomUUID();
  const email = `browser-mkt-${c.email}`;
  await prisma.user.create({
    data: { id: userId, name: c.name, email, password: "seed-no-login" },
  });
  const fields = buildSearchIndexFields(c.snapshot, {
    key,
    profile,
    requirements: created.requirements,
    name: c.name,
    email,
  });
  await prisma.application.create({
    data: {
      id: appId,
      jobId: created.id,
      userId,
      status: "applied",
      stage: "new",
      snapshot: { create: { data: c.snapshot as unknown as Prisma.InputJsonValue } },
      ...fields,
    },
  });
}

console.log(`http://localhost:3000/company/livefolio/marketing/jobs/${created.id}/applicants`);
process.exit(0);
