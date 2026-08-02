import Elysia from "elysia";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  extractTextAndQualityFromPdf,
  PdfLimitError,
} from "@/lib/pdf-extract";
import { structureResumeWithAi, type ParsedResume } from "@/lib/gemini";
import {
  detectProfilesFromParsed,
  enrichDetectedProfiles,
} from "@/lib/recruiter-enrich";
import { upsertDossierSignal, upsertLivefolioSignal, syncLivefolioSignalForPublishState } from "@/lib/recruiter-signals";
import { buildClaimsVsProof } from "@/lib/recruiter-claims-proof";
import {
  astToChips,
  compileRecruiterQuery,
} from "@/lib/recruiter-query-compile";
import {
  executeRecruiterSearch,
  type FilterAst,
} from "@/lib/recruiter-search";
import {
  assertCanAddCandidate,
  assertCanCreateOrg,
  assertEnrichmentQuota,
  assertSearchQuota,
  requireOrgMember,
  uniqueOrgSlug,
} from "@/features/recruiter/server/org";
import { trackRecruiterEvent } from "@/lib/recruiter-analytics";
import type { Prisma } from "@/db/generated/prisma/client";

const MAX_RESUME_FILE_BYTES = 10 * 1024 * 1024;

function hasPdfMagicBytes(buffer: Buffer) {
  return (
    buffer.length >= 5 && buffer.subarray(0, 5).toString("ascii") === "%PDF-"
  );
}

async function authUser(request: Request) {
  return getSession(request, { requireAccountType: "recruiter" });
}

export const recruiter = new Elysia({ prefix: "/recruiter" })
  .get("/orgs/me", async (ctx) => {
    const session = await authUser(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const membership = await prisma.organizationMember.findFirst({
      where: { userId: session.userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    if (!membership) {
      return { org: null, role: null };
    }
    return {
      org: membership.organization,
      role: membership.role,
    };
  })
  .post("/orgs", async (ctx) => {
    const session = await authUser(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const body = (ctx.body ?? {}) as { name?: string };
    const name = (body.name ?? "").trim();
    if (name.length < 2) {
      ctx.set.status = 400;
      return { error: "Organization name is required" };
    }
    const can = await assertCanCreateOrg(session.userId);
    if (!can.ok) {
      ctx.set.status = 403;
      return { error: can.message, code: can.code };
    }
    const slug = await uniqueOrgSlug(name);
    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        members: {
          create: { userId: session.userId, role: "owner" },
        },
      },
    });
    trackRecruiterEvent({
      name: "org_created",
      orgId: org.id,
      userId: session.userId,
    });
    return { org, role: "owner" };
  })
  .get("/candidates", async (ctx) => {
    const session = await authUser(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const gated = await requireOrgMember(session.userId);
    if ("error" in gated) {
      ctx.set.status = gated.status;
      return { error: gated.error };
    }
    const status =
      typeof ctx.query.status === "string" ? ctx.query.status : "active";
    const candidates = await prisma.recruiterCandidate.findMany({
      where: {
        orgId: gated.org.id,
        ...(status === "all" ? {} : { status }),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        socialProfiles: {
          select: { platform: true, fetchStatus: true, lastFetched: true },
        },
        _count: { select: { notes: true } },
      },
    });
    return { candidates };
  })
  .get("/candidates/:id", async (ctx) => {
    const session = await authUser(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const gated = await requireOrgMember(session.userId);
    if ("error" in gated) {
      ctx.set.status = gated.status;
      return { error: gated.error };
    }
    const candidate = await prisma.recruiterCandidate.findFirst({
      where: { id: ctx.params.id, orgId: gated.org.id },
      include: {
        socialProfiles: true,
        projects: { orderBy: { sortOrder: "asc" } },
        notes: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
        },
        portfolio: { select: { id: true, slug: true, isPublished: true } },
      },
    });
    if (!candidate) {
      ctx.set.status = 404;
      return { error: "Candidate not found" };
    }

    const parsed = candidate.parsedJson as unknown as ParsedResume;
    const claimsVsProof = buildClaimsVsProof({
      parsed,
      platformStats: candidate.socialProfiles.map((p) => ({
        platform: p.platform,
        fetchStatus: p.fetchStatus,
        cachedStats:
          p.cachedStats && typeof p.cachedStats === "object"
            ? (p.cachedStats as Record<string, unknown>)
            : null,
      })),
      projectTitles: candidate.projects.map((p) => p.title),
      projectTech: candidate.projects.flatMap((p) => p.techStack),
      projectDescriptions: candidate.projects.map((p) => p.description),
    });

    return { candidate, claimsVsProof };
  })
  .patch("/candidates/:id", async (ctx) => {
    const session = await authUser(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const gated = await requireOrgMember(session.userId);
    if ("error" in gated) {
      ctx.set.status = gated.status;
      return { error: gated.error };
    }
    const body = (ctx.body ?? {}) as {
      overallScore?: number | null;
      recommendation?: string | null;
      status?: string;
    };
    const existing = await prisma.recruiterCandidate.findFirst({
      where: { id: ctx.params.id, orgId: gated.org.id },
    });
    if (!existing) {
      ctx.set.status = 404;
      return { error: "Candidate not found" };
    }
    const candidate = await prisma.recruiterCandidate.update({
      where: { id: existing.id },
      data: {
        ...(body.overallScore !== undefined
          ? { overallScore: body.overallScore }
          : {}),
        ...(body.recommendation !== undefined
          ? { recommendation: body.recommendation }
          : {}),
        ...(body.status ? { status: body.status } : {}),
      },
    });
    if (body.overallScore !== undefined) {
      trackRecruiterEvent({
        name: "dossier_scored",
        orgId: gated.org.id,
        candidateId: candidate.id,
        score: candidate.overallScore,
      });
    }
    return { candidate };
  })
  .post("/candidates/:id/notes", async (ctx) => {
    const session = await authUser(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const gated = await requireOrgMember(session.userId);
    if ("error" in gated) {
      ctx.set.status = gated.status;
      return { error: gated.error };
    }
    const body = (ctx.body ?? {}) as { body?: string };
    const text = (body.body ?? "").trim();
    if (!text) {
      ctx.set.status = 400;
      return { error: "Note body is required" };
    }
    const existing = await prisma.recruiterCandidate.findFirst({
      where: { id: ctx.params.id, orgId: gated.org.id },
    });
    if (!existing) {
      ctx.set.status = 404;
      return { error: "Candidate not found" };
    }
    const note = await prisma.evaluationNote.create({
      data: {
        candidateId: existing.id,
        authorId: session.userId,
        body: text,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });
    return { note };
  })
  .post("/candidates/from-resume", async (ctx) => {
    const session = await authUser(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const gated = await requireOrgMember(session.userId);
    if ("error" in gated) {
      ctx.set.status = gated.status;
      return { error: gated.error };
    }

    const canAdd = await assertCanAddCandidate(gated.org.id);
    if (!canAdd.ok) {
      ctx.set.status = 403;
      return { error: canAdd.message, code: canAdd.code };
    }
    const quota = await assertEnrichmentQuota(gated.org.id);
    if (!quota.ok) {
      ctx.set.status = 403;
      return { error: quota.message, code: quota.code };
    }

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
      ctx.set.status = 400;
      return { error: "PDF must be 10MB or smaller" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasPdfMagicBytes(buffer)) {
      ctx.set.status = 400;
      return { error: "Invalid PDF file" };
    }

    let rawText: string;
    try {
      const extracted = await extractTextAndQualityFromPdf(buffer);
      rawText = extracted.text;
    } catch (err) {
      if (err instanceof PdfLimitError) {
        ctx.set.status = 400;
        return { error: err.message, code: err.code };
      }
      ctx.set.status = 500;
      return { error: "Failed to extract PDF text" };
    }

    let parsed: ParsedResume;
    try {
      parsed = await structureResumeWithAi(rawText);
    } catch {
      ctx.set.status = 500;
      return { error: "Failed to parse resume" };
    }

    const candidate = await prisma.recruiterCandidate.create({
      data: {
        orgId: gated.org.id,
        source: "resume_upload",
        displayName: parsed.name || "Candidate",
        email: parsed.contact.email,
        headline: parsed.headline || "",
        summary: parsed.summary || "",
        parsedJson: parsed as unknown as Prisma.InputJsonValue,
        enrichmentStatus: "enriching",
      },
    });

    // Seed projects from resume
    if (parsed.projects.length) {
      await prisma.dossierProject.createMany({
        data: parsed.projects.map((p, i) => ({
          candidateId: candidate.id,
          title: p.title,
          description: p.description,
          techStack: p.techStack,
          liveUrl: p.liveUrl,
          sourceUrl: p.sourceUrl,
          sortOrder: i,
          origin: "resume",
        })),
      });
    }

    const detected = detectProfilesFromParsed(parsed);
    // Persist link rows first
    for (const profile of detected) {
      await prisma.dossierSocialProfile.create({
        data: {
          candidateId: candidate.id,
          platform: profile.platform,
          url: profile.url,
          username: profile.username,
          fetchStatus: "pending",
        },
      });
    }

    const enrichments = await enrichDetectedProfiles(detected);
    for (const result of enrichments) {
      await prisma.dossierSocialProfile.upsert({
        where: {
          candidateId_platform: {
            candidateId: candidate.id,
            platform: result.platform,
          },
        },
        create: {
          candidateId: candidate.id,
          platform: result.platform,
          url: result.url,
          username: result.username,
          cachedStats: (result.cachedStats ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          lastFetched:
            result.fetchStatus === "enriched" ? new Date() : undefined,
          fetchStatus: result.fetchStatus,
        },
        update: {
          url: result.url,
          username: result.username,
          cachedStats: (result.cachedStats ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          lastFetched:
            result.fetchStatus === "enriched" ? new Date() : undefined,
          fetchStatus: result.fetchStatus,
        },
      });

      if (result.projects?.length) {
        const start = parsed.projects.length;
        await prisma.dossierProject.createMany({
          data: result.projects.map((p, i) => ({
            candidateId: candidate.id,
            title: p.title,
            description: p.description,
            techStack: p.techStack,
            liveUrl: p.liveUrl,
            sourceUrl: p.sourceUrl,
            sortOrder: start + i,
            origin: p.origin,
            meta: (p.meta ?? undefined) as Prisma.InputJsonValue | undefined,
          })),
        });
      }
    }

    await prisma.recruiterCandidate.update({
      where: { id: candidate.id },
      data: { enrichmentStatus: "ready" },
    });

    await upsertDossierSignal(candidate.id);

    trackRecruiterEvent({
      name: "resume_enriched",
      orgId: gated.org.id,
      candidateId: candidate.id,
      platforms: enrichments.map((e) => e.platform),
    });

    return { candidateId: candidate.id, enrichmentStatus: "ready" };
  })
  .post("/candidates/from-livefolio", async (ctx) => {
    const session = await authUser(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const gated = await requireOrgMember(session.userId);
    if ("error" in gated) {
      ctx.set.status = gated.status;
      return { error: gated.error };
    }
    const canAdd = await assertCanAddCandidate(gated.org.id);
    if (!canAdd.ok) {
      ctx.set.status = 403;
      return { error: canAdd.message, code: canAdd.code };
    }

    const body = (ctx.body ?? {}) as { portfolioId?: string; slug?: string };
    let portfolio = null;
    if (body.portfolioId) {
      portfolio = await prisma.portfolio.findUnique({
        where: { id: body.portfolioId },
        include: {
          experiences: true,
          educations: true,
          skills: true,
          projects: true,
          socialProfiles: true,
          certifications: true,
          achievements: true,
        },
      });
    } else if (body.slug) {
      portfolio = await prisma.portfolio.findFirst({
        where: {
          slug: body.slug,
        },
        include: {
          experiences: true,
          educations: true,
          skills: true,
          projects: true,
          socialProfiles: true,
          certifications: true,
          achievements: true,
        },
      });
    }

    if (!portfolio) {
      ctx.set.status = 404;
      return { error: "Portfolio not found" };
    }

    const existing = await prisma.recruiterCandidate.findFirst({
      where: {
        orgId: gated.org.id,
        portfolioId: portfolio.id,
        status: "active",
      },
    });
    if (existing) {
      return { candidateId: existing.id, existing: true };
    }

    const parsed: ParsedResume = {
      name: portfolio.title,
      headline: portfolio.headline,
      summary: portfolio.summary,
      contact: {
        email: portfolio.contactEmail,
        phone: portfolio.phone,
        websiteUrl: portfolio.websiteUrl,
        location: portfolio.location,
      },
      socialProfiles: portfolio.socialProfiles.map((s) => ({
        platform: s.platform,
        url: s.url,
        username: s.username,
      })),
      experiences: portfolio.experiences.map((e) => ({
        company: e.company,
        role: e.role,
        description: e.description,
        startDate: e.startDate?.toISOString() ?? null,
        endDate: e.endDate?.toISOString() ?? null,
        location: e.location,
      })),
      education: portfolio.educations.map((e) => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        startDate: e.startDate?.toISOString() ?? null,
        endDate: e.endDate?.toISOString() ?? null,
        gpa: e.gpa,
      })),
      skills: portfolio.skills.map((s) => ({
        name: s.name,
        category: s.category,
      })),
      projects: portfolio.projects.map((p) => ({
        title: p.title,
        description: p.description,
        techStack: p.techStack,
        liveUrl: p.liveUrl,
        sourceUrl: p.sourceUrl,
      })),
      achievements: portfolio.achievements.map((a) => a.title),
      certifications: portfolio.certifications.map((c) => ({
        name: c.name,
        issuer: c.issuer,
        issueDate: c.issueDate?.toISOString() ?? null,
        url: c.url,
      })),
      customSections: [],
    };

    const candidate = await prisma.recruiterCandidate.create({
      data: {
        orgId: gated.org.id,
        source: "livefolio_profile",
        portfolioId: portfolio.id,
        displayName: portfolio.title || "Candidate",
        email: portfolio.contactEmail,
        headline: portfolio.headline,
        summary: portfolio.summary,
        parsedJson: parsed as unknown as Prisma.InputJsonValue,
        enrichmentStatus: "ready",
        socialProfiles: {
          create: portfolio.socialProfiles.map((s) => ({
            platform: s.platform,
            url: s.url,
            username: s.username,
            cachedStats: (s.cachedStats ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
            lastFetched: s.lastFetched,
            fetchStatus: s.cachedStats ? "enriched" : "link_only",
          })),
        },
        projects: {
          create: portfolio.projects.map((p, i) => ({
            title: p.title,
            description: p.description,
            techStack: p.techStack,
            liveUrl: p.liveUrl,
            sourceUrl: p.sourceUrl,
            sortOrder: i,
            origin: "livefolio",
          })),
        },
      },
    });

    await upsertDossierSignal(candidate.id);
    await upsertLivefolioSignal(portfolio.id);

    trackRecruiterEvent({
      name: "livefolio_shortlisted",
      orgId: gated.org.id,
      portfolioId: portfolio.id,
    });

    return { candidateId: candidate.id, existing: false };
  })
  .post("/search/compile", async (ctx) => {
    const session = await authUser(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const gated = await requireOrgMember(session.userId);
    if ("error" in gated) {
      ctx.set.status = gated.status;
      return { error: gated.error };
    }
    const body = (ctx.body ?? {}) as {
      text?: string;
      inputType?: "jd" | "nl";
    };
    const text = (body.text ?? "").trim();
    if (!text) {
      ctx.set.status = 400;
      return { error: "Query text is required" };
    }
    const { ast, source } = await compileRecruiterQuery({
      text,
      inputType: body.inputType === "jd" ? "jd" : "nl",
    });
    return { ast, chips: astToChips(ast), source };
  })
  .post("/search", async (ctx) => {
    const session = await authUser(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const gated = await requireOrgMember(session.userId);
    if ("error" in gated) {
      ctx.set.status = gated.status;
      return { error: gated.error };
    }
    const quota = await assertSearchQuota(gated.org.id);
    if (!quota.ok) {
      ctx.set.status = 403;
      return { error: quota.message, code: quota.code };
    }

    const body = (ctx.body ?? {}) as {
      text?: string;
      inputType?: "jd" | "nl" | "filters";
      ast?: FilterAst;
    };

    let ast: FilterAst = body.ast ?? {};
    let compileSource: "ai" | "heuristic" | "client" = "client";
    const text = (body.text ?? "").trim();

    if (text && (!body.ast || Object.keys(body.ast).length === 0)) {
      const compiled = await compileRecruiterQuery({
        text,
        inputType: body.inputType === "jd" ? "jd" : "nl",
      });
      ast = compiled.ast;
      compileSource = compiled.source;
    }

    const results = await executeRecruiterSearch({
      orgId: gated.org.id,
      ast,
    });

    await prisma.recruiterSearchQuery.create({
      data: {
        orgId: gated.org.id,
        userId: session.userId,
        inputType: body.inputType ?? "filters",
        rawInput: text || JSON.stringify(ast),
        compiledAst: ast as unknown as Prisma.InputJsonValue,
        resultCount: results.length,
      },
    });

    trackRecruiterEvent({
      name: "search_run",
      orgId: gated.org.id,
      resultCount: results.length,
      inputType: body.inputType ?? "filters",
    });

    return {
      ast,
      chips: astToChips(ast),
      results,
      compileSource,
    };
  })
  .post("/signals/reindex-livefolio", async (ctx) => {
    const session = await authUser(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    if (!portfolio) {
      ctx.set.status = 404;
      return { error: "Portfolio not found" };
    }
    await upsertLivefolioSignal(portfolio.id);
    return { indexed: true };
  });
