import { prisma } from "@/lib/prisma";

const jobs = await prisma.job.deleteMany({ where: { title: { startsWith: "[search-qa]" }, status: "draft" } });
const users = await prisma.user.deleteMany({ where: { email: { endsWith: "@search-qa.livefolio.test" } } });
console.log(`deleted ${jobs.count} qa jobs (applications, snapshots and requirements cascade) and ${users.count} qa users`);
console.log(
  "remaining qa rows:",
  await prisma.job.count({ where: { title: { startsWith: "[search-qa]" } } }),
  await prisma.user.count({ where: { email: { endsWith: "@search-qa.livefolio.test" } } }),
);
process.exit(0);
