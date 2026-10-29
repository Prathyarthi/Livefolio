import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/db/generated/prisma/client";
import { buildSearchIndexFields, searchIndexKey } from "@/features/applications/lib/search-index";
import { buildCandidate, profileHash, qaJob, rng } from "./fixtures";
import { GITHUB_LOGINS, MIX, githubSnapshot } from "./ten-each";

const TITLE = "[search-qa] Browser 10 Backend";

const existing = await prisma.job.findMany({
  where: { title: TITLE, status: "draft" },
  select: { id: true },
});
if (existing.length) {
  await prisma.job.deleteMany({ where: { id: { in: existing.map((j) => j.id) } } });
  await prisma.user.deleteMany({
    where: { email: { in: ["prathyarthi@search-qa.livefolio.test", "kiran-busari@search-qa.livefolio.test"] } },
  });
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

const qa = qaJob("backend");
const created = await prisma.job.create({
  data: {
    organizationId: workspace.organizationId,
    workspaceId: workspace.id,
    createdById: workspace.organization.members[0]!.userId,
    title: TITLE,
    slug: `search-qa-browser-backend-${Date.now()}`,
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

const r = rng(21);
const people = [
  ...MIX.slice(0, 8).map((spec, i) => buildCandidate(r, { index: 21 + i, target: "backend", ...spec })),
  ...(await Promise.all(GITHUB_LOGINS.map(githubSnapshot))),
];

const key = searchIndexKey(profile, created.requirements);
for (const c of people) {
  const userId = randomUUID();
  const appId = randomUUID();
  const email = c.key.startsWith("github-")
    ? `${c.key.slice("github-".length).toLowerCase()}@search-qa.livefolio.test`
    : `browser-${c.email}`;
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
