import Elysia from "elysia";
import { getSession } from "@/lib/session";
import {
  extractTextAndQualityFromPdf,
  PdfLimitError,
} from "@/lib/pdf-extract";
import { structureResumeWithAi } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { getPlanLimitMessage, resolveAccessForUser } from "@/lib/entitlements";
import { enforceAiRateLimit } from "@/lib/ai-request-guard";
import { isR2Configured } from "@/lib/r2";
import { persistResumePdf, resumeDownloadUrl } from "@/features/uploads/server/stored-files";

const MAX_RESUME_FILE_BYTES = 10 * 1024 * 1024;

function timeoutFromEnv(name: string, fallbackMs: number) {
  const configured = Number(process.env[name]);
  return Number.isFinite(configured) && configured >= 1_000
    ? configured
    : fallbackMs;
}

const PDF_EXTRACTION_TIMEOUT_MS = timeoutFromEnv(
  "RESUME_PDF_EXTRACTION_TIMEOUT_MS",
  60_000,
);
const AI_PARSE_TIMEOUT_MS = timeoutFromEnv(
  "RESUME_AI_PARSE_TIMEOUT_MS",
  5 * 60_000,
);

class OperationTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperationTimeoutError";
  }
}

async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new OperationTimeoutError(message)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function hasPdfMagicBytes(buffer: Buffer) {
  return buffer.length >= 5
    && buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

export const resume = new Elysia({ prefix: "/resume" })
  .post("/parse", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user) {
      ctx.set.status = 404;
      return { error: "User not found" };
    }

    const access = resolveAccessForUser(user);
    if (!access.canUseImports) {
      ctx.set.status = 403;
      return {
        error: getPlanLimitMessage(access),
        code: "PLAN_LIMITED",
        access,
      };
    }

    // Elysia already parses multipart/form-data into ctx.body before the handler runs.
    // Reading ctx.request.formData() again throws in production (body stream is single-use).
    const fileEntry = (ctx.body as { file?: unknown } | null)?.file;
    const file = Array.isArray(fileEntry) ? fileEntry[0] : fileEntry;

    if (!file || !(file instanceof File)) {
      ctx.set.status = 400;
      return { error: "No PDF file provided" };
    }

    if (file.type !== "application/pdf") {
      ctx.set.status = 400;
      return { error: "File must be a PDF" };
    }

    if (file.size > MAX_RESUME_FILE_BYTES) {
      ctx.set.status = 413;
      return { error: "File size must be less than 10MB" };
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (!hasPdfMagicBytes(buffer)) {
        ctx.set.status = 400;
        return { error: "File content is not a valid PDF" };
      }

      const rateLimitResponse = await enforceAiRateLimit(
        ctx.request,
        session.userId,
      );
      if (rateLimitResponse) return rateLimitResponse;

      const { text: rawText, quality } = await withTimeout(
        extractTextAndQualityFromPdf(buffer),
        PDF_EXTRACTION_TIMEOUT_MS,
        "PDF extraction timed out",
      );

      if (!rawText.trim()) {
        ctx.set.status = 400;
        return { error: "Could not extract text from PDF. The file may be image-based or empty." };
      }

      const aiAbortController = new AbortController();
      const aiTimeout = setTimeout(
        () => aiAbortController.abort(),
        AI_PARSE_TIMEOUT_MS,
      );
      let parsed;
      try {
        parsed = await structureResumeWithAi(rawText, {
          quality,
          signal: aiAbortController.signal,
        });
      } finally {
        clearTimeout(aiTimeout);
      }

      let resumeUrl: string | undefined;
      if (isR2Configured()) {
        try {
          const stored = await persistResumePdf(session.userId, buffer);
          resumeUrl = resumeDownloadUrl(stored.id);
        } catch (persistError) {
          console.error("[POST /api/resume/parse] R2 persist failed", persistError);
        }
      }

      return { success: true, data: parsed, resumeUrl };
    } catch (error) {
      if (error instanceof PdfLimitError) {
        ctx.set.status = 400;
        return { error: error.message, code: error.code };
      }
      if (
        error instanceof OperationTimeoutError
        || (error instanceof Error && error.name === "AbortError")
      ) {
        ctx.set.status = 504;
        return { error: "Resume parsing timed out" };
      }

      console.error("[POST /api/resume/parse] Failed", error);
      ctx.set.status = 500;
      return { error: "Failed to parse resume" };
    }
  });
