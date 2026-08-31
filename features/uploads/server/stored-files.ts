import { prisma } from "@/lib/prisma";
import { getAppOrigin } from "@/lib/domain";
import { deleteObjectQuiet, putObject } from "@/lib/r2";
import { objectKey } from "@/lib/uploads";

export function resumeDownloadUrl(fileId: string): string {
  return `${getAppOrigin()}/api/uploads/${fileId}`;
}

export async function deleteStoredFileRows(
  files: Array<{ id: string; key: string }>,
) {
  for (const file of files) {
    await deleteObjectQuiet(file.key);
  }
  if (files.length === 0) return;
  await prisma.storedFile.deleteMany({
    where: { id: { in: files.map((file) => file.id) } },
  });
}

export async function replaceKindFiles(options: {
  kind: string;
  keepId: string;
  userId?: string;
  projectId?: string;
  jobId?: string;
}) {
  const old = await prisma.storedFile.findMany({
    where: {
      kind: options.kind,
      id: { not: options.keepId },
      ...(options.userId && !options.projectId && !options.jobId
        ? { userId: options.userId }
        : {}),
      ...(options.projectId ? { projectId: options.projectId } : {}),
      ...(options.jobId ? { jobId: options.jobId } : {}),
    },
    select: { id: true, key: true },
  });
  await deleteStoredFileRows(old);
}

export async function persistResumePdf(userId: string, buffer: Buffer) {
  const fileId = crypto.randomUUID();
  const key = objectKey({
    kind: "resume",
    fileId,
    userId,
    contentType: "application/pdf",
  });

  await putObject({
    key,
    contentType: "application/pdf",
    body: buffer,
  });

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });

  const created = await prisma.storedFile.create({
    data: {
      key,
      kind: "resume",
      contentType: "application/pdf",
      sizeBytes: buffer.length,
      userId,
      portfolioId: portfolio?.id ?? null,
    },
  });

  if (portfolio) {
    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: { resumeUrl: resumeDownloadUrl(created.id) },
    });
  }

  await replaceKindFiles({
    kind: "resume",
    keepId: created.id,
    userId,
  });

  return created;
}

export async function latestResumeIdsByUserId(userIds: string[]) {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return new Map<string, string>();

  const files = await prisma.storedFile.findMany({
    where: { kind: "resume", userId: { in: unique } },
    select: { id: true, userId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const byUser = new Map<string, string>();
  for (const file of files) {
    if (file.userId && !byUser.has(file.userId)) {
      byUser.set(file.userId, file.id);
    }
  }
  return byUser;
}

export async function attachLatestResumeToPortfolio(
  userId: string,
  portfolioId: string,
) {
  const file = await prisma.storedFile.findFirst({
    where: { userId, kind: "resume" },
    orderBy: { createdAt: "desc" },
  });
  if (!file) return;

  await prisma.storedFile.update({
    where: { id: file.id },
    data: { portfolioId },
  });
  await prisma.portfolio.update({
    where: { id: portfolioId },
    data: { resumeUrl: resumeDownloadUrl(file.id) },
  });
}
