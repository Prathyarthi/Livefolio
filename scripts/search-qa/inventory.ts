import { prisma } from "@/lib/prisma";

const workspaces = await prisma.workspace.findMany({
  select: {
    id: true,
    name: true,
    organizationId: true,
    organization: { select: { name: true, members: { select: { userId: true, role: true }, take: 3 } } },
    _count: { select: { jobs: true } },
  },
});
for (const w of workspaces) {
  console.log(`${w.id.slice(0, 8)} "${w.name}" org="${w.organization.name}" jobs=${w._count.jobs} members=${JSON.stringify(w.organization.members.map((m) => m.role))}`);
}
const leftovers = await prisma.job.count({ where: { title: { startsWith: "[search-qa]" } } });
console.log("existing qa jobs:", leftovers);
console.log("existing qa users:", await prisma.user.count({ where: { email: { endsWith: "@search-qa.livefolio.test" } } }));
process.exit(0);
