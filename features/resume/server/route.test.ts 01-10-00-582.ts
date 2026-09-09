import { beforeEach, describe, expect, mock, test } from "bun:test";

let authenticated = true;
let rateLimitResponse: Response | null = null;

const findUnique = mock(async () => ({
  id: "user-a",
  email: "user@example.com",
  createdAt: new Date(),
  subscriptionStatus: "active",
}));
const enforceAiRateLimit = mock(async () => rateLimitResponse);

class PdfLimitError extends Error {
  constructor(
    message: string,
    readonly code: "PAGE_LIMIT" | "TEXT_LIMIT",
  ) {
    super(message);
    this.name = "PdfLimitError";
  }
}

const extractTextAndQualityFromPdf = mock(async () => ({
  text: "Jane Doe\njane@example.com\nExperience\nEducation",
  quality: {
    charCount: 48,
    pageCount: 1,
    isLikelyIncomplete: false,
    hints: [],
  },
}));
const structureResumeWithAi = mock(async (
  ...args: [rawText: string, options?: { quality?: unknown; signal?: AbortSignal }]
) => {
  void args;
  return {
    name: "Jane Doe",
    headline: "Engineer",
    summary: "Summary",
    contact: {},
    socialProfiles: [],
    experiences: [],
    education: [],
    skills: [],
    projects: [],
    achievements: [],
    certifications: [],
    customSections: [],
  };
});

mock.module("@/lib/session", () => ({
  getSession: async () => (authenticated ? { userId: "user-a" } : null),
}));

mock.module("@/lib/prisma", () => ({
  prisma: { user: { findUnique } },
}));

mock.module("@/lib/entitlements", () => ({
  canUseTemplate: () => true,
  getPlanLimitMessage: () => "Upgrade required",
  resolveAccessForUser: () => ({ canUseImports: true }),
}));

mock.module("@/lib/ai-request-guard", () => ({
  enforceAiRateLimit,
}));

mock.module("@/lib/pdf-extract", () => ({
  extractTextAndQualityFromPdf,
  PdfLimitError,
}));

mock.module("@/lib/gemini", () => ({
  structureResumeWithAi,
}));

mock.module("@/lib/r2", () => ({
  isR2Configured: () => false,
  putObject: async () => {},
  deleteObjectQuiet: async () => {},
  deleteObject: async () => {},
}));

mock.module("@/features/uploads/server/stored-files", () => ({
  persistResumePdf: async () => ({ id: "file-1" }),
  resumeDownloadUrl: (id: string) => `http://localhost/api/uploads/${id}`,
  attachLatestResumeToPortfolio: async () => {},
}));

const { resume } = await import("./route");

function parseRequest(
  content: string,
  type = "application/pdf",
) {
  const formData = new FormData();
  formData.append(
    "file",
    new File([content], "resume.pdf", { type }),
  );
  return new Request("http://localhost/resume/parse", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  authenticated = true;
  rateLimitResponse = null;
  findUnique.mockClear();
  enforceAiRateLimit.mockClear();
  extractTextAndQualityFromPdf.mockClear();
  structureResumeWithAi.mockClear();
  extractTextAndQualityFromPdf.mockImplementation(async () => ({
    text: "Jane Doe\njane@example.com\nExperience\nEducation",
    quality: {
      charCount: 48,
      pageCount: 1,
      isLikelyIncomplete: false,
      hints: [],
    },
  }));
});

describe("resume parsing security", () => {
  test("requires authentication", async () => {
    authenticated = false;

    const response = await resume.handle(parseRequest("%PDF-1.7"));

    expect(response.status).toBe(401);
    expect(enforceAiRateLimit).not.toHaveBeenCalled();
  });

  test("rejects a spoofed PDF MIME type without PDF magic bytes", async () => {
    const response = await resume.handle(parseRequest("not a pdf"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "File content is not a valid PDF",
    });
    expect(enforceAiRateLimit).not.toHaveBeenCalled();
    expect(extractTextAndQualityFromPdf).not.toHaveBeenCalled();
  });

  test("stops before extraction when the shared AI quota rejects", async () => {
    rateLimitResponse = Response.json(
      { error: "Too many AI requests" },
      { status: 429 },
    );

    const response = await resume.handle(parseRequest("%PDF-1.7"));

    expect(response.status).toBe(429);
    expect(extractTextAndQualityFromPdf).not.toHaveBeenCalled();
  });

  test("returns a bounded PDF error without invoking AI", async () => {
    extractTextAndQualityFromPdf.mockRejectedValueOnce(
      new PdfLimitError("PDF must contain at most 20 pages", "PAGE_LIMIT"),
    );

    const response = await resume.handle(parseRequest("%PDF-1.7"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "PDF must contain at most 20 pages",
      code: "PAGE_LIMIT",
    });
    expect(structureResumeWithAi).not.toHaveBeenCalled();
  });

  test("passes an abort signal to AI for an accepted PDF", async () => {
    const response = await resume.handle(parseRequest("%PDF-1.7"));

    expect(response.status).toBe(200);
    expect(structureResumeWithAi).toHaveBeenCalledTimes(1);
    expect(structureResumeWithAi.mock.calls[0]?.[1]).toMatchObject({
      signal: expect.any(AbortSignal),
    });
  });
});
