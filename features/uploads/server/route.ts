import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getAppOrigin } from "@/lib/domain";
import {
  PRO_PROJECT_THUMBNAILS,
  resolveAccessForUser,
} from "@/lib/entitlements";
import { requireJobManager, requireOrgMember, requireApplicantViewer } from "@/features/organization/lib/org-access";
import {
  extractTextAndQualityFromPdf,
  PdfLimitError,
} from "@/lib/pdf-extract";
import {
  headObject,
  isR2Configured,
  getR2PublicBaseUrl,
  presignGetObject,
  presignPutObject,
  publicObjectUrl,
} from "@/lib/r2";
import {
  isAllowedContentType,
  isUploadKind,
  maxBytesForKind,
  normalizeUploadContentType,
  objectKey,
  type UploadKind,
} from "@/lib/uploads";
import { deleteStoredFileRows, replaceKindFiles } from "./stored-files";

async function recruiterCanOpenApplicantResume(
  applicantUserId: string | null,
  viewerId: string,
) {
  if (!applicantUserId) return false;
  const application = await prisma.application.findFirst({
    where: {
      userId: applicantUserId,
      job: {
        organization: {
          members: { some: { userId: viewerId } },
        },
      },
    },
    select: { job: { select: { organizationId: true } } },
  });
  if (!application) return false;
  return Boolean(
    await requireApplicantViewer(application.job.organizationId, viewerId),
  );
}

const KIND_SCHEMA = t.Union([
  t.Literal("resume"),
  t.Literal("project_thumb"),
  t.Literal("job_source"),
]);

function thumbnailCapMessage(max: number, tier: string) {
  if (tier === "free") {
    return `You've used all ${max} free project thumbnails. Upgrade to Pro for ${PRO_PROJECT_THUMBNAILS}.`;
  }
  return `You've used all ${max} project thumbnails on your plan.`;
}

async function thumbnailUsage(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const access = resolveAccessForUser(user);
  const used = await prisma.storedFile.count({
    where: { userId, kind: "project_thumb" },
  });
  return { used, max: access.maxProjectThumbnails, access };
}

async function assertThumbnailCapacity(
  userId: string,
  projectId: string,
): Promise<{ ok: true } | { ok: false; status: 402 | 404; body: Record<string, unknown> }> {
  const usage = await thumbnailUsage(userId);
  if (!usage) {
    return { ok: false, status: 404, body: { error: "User not found" } };
  }
  const existing = await prisma.storedFile.findFirst({
    where: { userId, projectId, kind: "project_thumb" },
    select: { id: true },
  });
  if (existing) return { ok: true };
  if (usage.used >= usage.max) {
    return {
      ok: false,
      status: 402,
      body: {
        error: thumbnailCapMessage(usage.max, usage.access.tier),
        code: "PLAN_LIMITED",
        access: usage.access,
        usage: { used: usage.used, max: usage.max },
      },
    };
  }
  return { ok: true };
}

export const uploads = new Elysia({ prefix: "/uploads" })
  .get("/usage", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const usage = await thumbnailUsage(session.userId);
    if (!usage) {
      ctx.set.status = 404;
      return { error: "User not found" };
    }
    return {
      configured: isR2Configured(),
      projectThumbnails: { used: usage.used, max: usage.max },
    };
  })

  .post(
    "/sign",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      if (!isR2Configured()) {
        ctx.set.status = 503;
        return { error: "File storage is not configured" };
      }

      const kind = ctx.body.kind as UploadKind;
      const contentType = normalizeUploadContentType(ctx.body.contentType);
      if (!isAllowedContentType(kind, contentType)) {
        ctx.set.status = 400;
        return { error: "Unsupported file type" };
      }
      if (ctx.body.sizeBytes > maxBytesForKind(kind)) {
        ctx.set.status = 413;
        return { error: "File is too large" };
      }

      const fileId = crypto.randomUUID();
      let key: string;
      let publicUrl: string | null = null;

      if (kind === "resume") {
        key = objectKey({
          kind,
          fileId,
          userId: session.userId,
          contentType,
        });
      } else if (kind === "project_thumb") {
        const projectId = ctx.body.projectId?.trim();
        if (!projectId) {
          ctx.set.status = 400;
          return { error: "projectId is required" };
        }
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            portfolio: { userId: session.userId },
          },
          select: { id: true },
        });
        if (!project) {
          ctx.set.status = 404;
          return { error: "Project not found" };
        }
        const cap = await assertThumbnailCapacity(session.userId, projectId);
        if (!cap.ok) {
          ctx.set.status = cap.status;
          return cap.body;
        }
        if (!getR2PublicBaseUrl()) {
          ctx.set.status = 503;
          return { error: "Public file URLs are not configured" };
        }
        key = objectKey({
          kind,
          fileId,
          userId: session.userId,
          projectId,
          contentType,
        });
        publicUrl = publicObjectUrl(key);
      } else {
        const jobId = ctx.body.jobId?.trim();
        if (!jobId) {
          ctx.set.status = 400;
          return { error: "jobId is required" };
        }
        const job = await prisma.job.findUnique({
          where: { id: jobId },
          select: { id: true, organizationId: true },
        });
        if (!job) {
          ctx.set.status = 404;
          return { error: "Job not found" };
        }
        const membership = await requireJobManager(job.organizationId, session.userId);
        if (!membership) {
          ctx.set.status = 403;
          return { error: "Forbidden" };
        }
        key = objectKey({
          kind,
          fileId,
          orgId: job.organizationId,
          jobId: job.id,
          contentType,
        });
      }

      const uploadUrl = await presignPutObject({ key, contentType });
      const usage = await thumbnailUsage(session.userId);

      return {
        key,
        uploadUrl,
        publicUrl,
        usage: usage
          ? { used: usage.used, max: usage.max }
          : undefined,
      };
    },
    {
      body: t.Object({
        kind: KIND_SCHEMA,
        contentType: t.String({ minLength: 1, maxLength: 120 }),
        sizeBytes: t.Number({ minimum: 1 }),
        projectId: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
        jobId: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
      }),
    },
  )

  .post(
    "/complete",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }
      if (!isR2Configured()) {
        ctx.set.status = 503;
        return { error: "File storage is not configured" };
      }

      const kind = ctx.body.kind as UploadKind;
      if (!isUploadKind(kind)) {
        ctx.set.status = 400;
        return { error: "Invalid kind" };
      }

      const key = ctx.body.key.trim();
      const head = await headObject(key);
      if (!head) {
        ctx.set.status = 400;
        return { error: "Upload was not found. Try again." };
      }
      const sizeBytes = head.contentLength ?? 0;
      if (sizeBytes <= 0 || sizeBytes > maxBytesForKind(kind)) {
        ctx.set.status = 413;
        return { error: "File is too large" };
      }
      const contentType = normalizeUploadContentType(
        head.contentType ?? ctx.body.contentType ?? "",
      );
      if (!isAllowedContentType(kind, contentType)) {
        ctx.set.status = 400;
        return { error: "Unsupported file type" };
      }

      if (kind === "resume") {
        const expectedPrefix = `users/${session.userId}/resumes/`;
        if (!key.startsWith(expectedPrefix) || !key.endsWith(".pdf")) {
          ctx.set.status = 400;
          return { error: "Invalid object key" };
        }
        const portfolio = await prisma.portfolio.findUnique({
          where: { userId: session.userId },
          select: { id: true },
        });
        const created = await prisma.storedFile.create({
          data: {
            key,
            kind,
            contentType,
            sizeBytes,
            userId: session.userId,
            portfolioId: portfolio?.id ?? null,
          },
        });
        if (portfolio) {
          await prisma.portfolio.update({
            where: { id: portfolio.id },
            data: { resumeUrl: `${getAppOrigin()}/api/uploads/${created.id}` },
          });
        }
        await replaceKindFiles({
          kind: "resume",
          keepId: created.id,
          userId: session.userId,
        });
        return {
          id: created.id,
          kind,
          downloadUrl: `${getAppOrigin()}/api/uploads/${created.id}`,
        };
      }

      if (kind === "project_thumb") {
        const projectId = ctx.body.projectId?.trim();
        if (!projectId) {
          ctx.set.status = 400;
          return { error: "projectId is required" };
        }
        const expectedPrefix = `users/${session.userId}/projects/${projectId}/`;
        if (!key.startsWith(expectedPrefix)) {
          ctx.set.status = 400;
          return { error: "Invalid object key" };
        }
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            portfolio: { userId: session.userId },
          },
          select: { id: true, portfolioId: true },
        });
        if (!project) {
          ctx.set.status = 404;
          return { error: "Project not found" };
        }
        const cap = await assertThumbnailCapacity(session.userId, projectId);
        if (!cap.ok) {
          ctx.set.status = cap.status;
          return cap.body;
        }
        const publicUrl = publicObjectUrl(key);
        if (!publicUrl) {
          ctx.set.status = 503;
          return { error: "Public file URLs are not configured" };
        }
        const created = await prisma.storedFile.create({
          data: {
            key,
            kind,
            contentType,
            sizeBytes,
            userId: session.userId,
            portfolioId: project.portfolioId,
            projectId,
          },
        });
        await prisma.project.update({
          where: { id: projectId },
          data: { imageUrl: publicUrl },
        });
        await replaceKindFiles({
          kind: "project_thumb",
          keepId: created.id,
          projectId,
        });
        const usage = await thumbnailUsage(session.userId);
        return {
          id: created.id,
          kind,
          publicUrl,
          usage: usage
            ? { used: usage.used, max: usage.max }
            : undefined,
        };
      }

      const jobId = ctx.body.jobId?.trim();
      if (!jobId) {
        ctx.set.status = 400;
        return { error: "jobId is required" };
      }
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, organizationId: true },
      });
      if (!job) {
        ctx.set.status = 404;
        return { error: "Job not found" };
      }
      const membership = await requireJobManager(job.organizationId, session.userId);
      if (!membership) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }
      const expectedPrefix = `orgs/${job.organizationId}/jobs/${job.id}/`;
      if (!key.startsWith(expectedPrefix) || !key.endsWith(".pdf")) {
        ctx.set.status = 400;
        return { error: "Invalid object key" };
      }
      const created = await prisma.storedFile.create({
        data: {
          key,
          kind,
          contentType,
          sizeBytes,
          userId: session.userId,
          organizationId: job.organizationId,
          jobId: job.id,
        },
      });
      await replaceKindFiles({
        kind: "job_source",
        keepId: created.id,
        jobId: job.id,
      });
      return {
        id: created.id,
        kind,
        downloadUrl: `${getAppOrigin()}/api/uploads/${created.id}`,
      };
    },
    {
      body: t.Object({
        kind: KIND_SCHEMA,
        key: t.String({ minLength: 1, maxLength: 500 }),
        contentType: t.Optional(t.String({ maxLength: 120 })),
        projectId: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
        jobId: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
      }),
    },
  )

  .post("/extract-pdf", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const fileEntry = (ctx.body as { file?: unknown } | null)?.file;
    const file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry;
    if (!file || !(file instanceof File)) {
      ctx.set.status = 400;
      return { error: "No PDF file provided" };
    }
    if (file.type && file.type !== "application/pdf") {
      ctx.set.status = 400;
      return { error: "File must be a PDF" };
    }
    if (file.size > maxBytesForKind("job_source")) {
      ctx.set.status = 413;
      return { error: "File size must be less than 10MB" };
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (
        buffer.length < 5 ||
        buffer.subarray(0, 5).toString("ascii") !== "%PDF-"
      ) {
        ctx.set.status = 400;
        return { error: "File content is not a valid PDF" };
      }
      const { text } = await extractTextAndQualityFromPdf(buffer);
      const cleaned = text
        .replace(/^--- Page \d+ of \d+ ---\n/gm, "")
        .trim();
      if (!cleaned) {
        ctx.set.status = 400;
        return {
          error:
            "Could not extract text from PDF. The file may be image-based or empty.",
        };
      }
      return { text: cleaned.slice(0, 50_000) };
    } catch (error) {
      if (error instanceof PdfLimitError) {
        ctx.set.status = 400;
        return { error: error.message, code: error.code };
      }
      console.error("[POST /api/uploads/extract-pdf] Failed", error);
      ctx.set.status = 500;
      return { error: "Failed to extract PDF text" };
    }
  })

  .get("/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    if (!isR2Configured()) {
      ctx.set.status = 503;
      return { error: "File storage is not configured" };
    }

    const file = await prisma.storedFile.findUnique({
      where: { id: ctx.params.id },
    });
    if (!file) {
      ctx.set.status = 404;
      return { error: "File not found" };
    }

    if (file.kind === "job_source") {
      if (!file.organizationId) {
        ctx.set.status = 404;
        return { error: "File not found" };
      }
      const membership = await requireOrgMember(
        file.organizationId,
        session.userId,
      );
      if (!membership) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }
    } else if (file.kind === "resume") {
      const isOwner = file.userId === session.userId;
      if (!isOwner) {
        const canOpen = await recruiterCanOpenApplicantResume(
          file.userId,
          session.userId,
        );
        if (!canOpen) {
          ctx.set.status = 403;
          return { error: "Forbidden" };
        }
      }
    } else if (file.userId !== session.userId) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    const url = await presignGetObject(file.key);
    return new Response(null, {
      status: 302,
      headers: { Location: url },
    });
  })

  .delete("/:id", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const file = await prisma.storedFile.findUnique({
      where: { id: ctx.params.id },
    });
    if (!file) {
      ctx.set.status = 404;
      return { error: "File not found" };
    }

    if (file.kind === "job_source") {
      if (!file.organizationId) {
        ctx.set.status = 404;
        return { error: "File not found" };
      }
      const membership = await requireJobManager(
        file.organizationId,
        session.userId,
      );
      if (!membership) {
        ctx.set.status = 403;
        return { error: "Forbidden" };
      }
    } else if (file.userId !== session.userId) {
      ctx.set.status = 403;
      return { error: "Forbidden" };
    }

    if (file.kind === "project_thumb" && file.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: file.projectId },
        select: { imageUrl: true },
      });
      const publicUrl = publicObjectUrl(file.key);
      if (project && publicUrl && project.imageUrl === publicUrl) {
        await prisma.project.update({
          where: { id: file.projectId },
          data: { imageUrl: null },
        });
      }
    }
    if (file.kind === "resume" && file.portfolioId) {
      await prisma.portfolio.update({
        where: { id: file.portfolioId },
        data: { resumeUrl: null },
      });
    }

    await deleteStoredFileRows([file]);
    return { ok: true };
  });