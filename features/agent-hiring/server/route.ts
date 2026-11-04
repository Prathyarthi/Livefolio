import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateOpenRouterText } from "@/lib/openrouter";
import { canUseTalentSearch } from "@/lib/hiring-plans";
import { ORG_BILLING_SELECT, orgPlanTier } from "@/lib/org-entitlements";
import { getPortfolioPublicUrl } from "@/lib/domain";
import { sendEmail } from "@/lib/email";
import {
  requireWorkspaceAccess,
  requireWorkspaceJobManager,
} from "@/features/organization/lib/org-access";
import {
  applicationSnapshotInclude,
  portfolioToSnapshot,
} from "@/features/applications/lib/snapshot";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { proofKindsOf } from "@/features/search/lib/proof";
import { RANKING_VERSION, rankCandidate } from "@/features/search/lib/rank";
import { talentKeywordWhere } from "@/features/talent/lib/search";
import { refreshJobSearchProfile } from "@/features/jobs/lib/extract-search-profile";
import { BRIEF_MAX, draftJobFromBrief } from "@/features/agent-hiring/lib/brief";
import {
  mergeShortlist,
  type PoolCandidate,
} from "@/features/agent-hiring/lib/shortlist";

/** Applicants to this workspace's jobs within this window form the "recent applies" pool. */
const APPLICANT_WINDOW_DAYS = 180;
const APPLICANT_CAP = 500;
const TALENT_CAP = 300;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function agentLlmConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

async function loadOrgWorkspace(
  request: Request,
  orgSlug: string,
  workspaceSlug: string,
  mode: "view" | "manage",
) {
  const session = await getSession(request);
  if (!session) return { error: { status: 401, body: { error: "Unauthorized" } } } as const;
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { ...ORG_BILLING_SELECT, name: true },
  });
  if (!org) return { error: { status: 404, body: { error: "Organization not found" } } } as const;
  const access =
    mode === "manage"
      ? await requireWorkspaceJobManager(org.id, workspaceSlug, session.userId)
      : await requireWorkspaceAccess(org.id, workspaceSlug, session.userId);
  if (!access) return { error: { status: 403, body: { error: "Forbidden" } } } as const;
  return { session, org, workspace: access.workspace } as const;
}

export const agentHiring = new Elysia({ prefix: "/agent-hiring" })
  .get("/config", () => ({ llmConfigured: agentLlmConfigured() }))

  // 1. Brief → draft job (nothing is saved; approval goes through POST /api/jobs/org/:orgSlug).
  .post(
    "/org/:orgSlug/workspace/:workspaceSlug/draft",
    async (ctx) => {
      const ctxData = await loadOrgWorkspace(
        ctx.request,
        ctx.params.orgSlug,
        ctx.params.workspaceSlug,
        "manage",
      );
      if ("error" in ctxData && ctxData.error) {
        ctx.set.status = ctxData.error.status;
        return ctxData.error.body;
      }
      if (!agentLlmConfigured()) {
        ctx.set.status = 503;
        return { error: "The hiring agent is not configured.", notConfigured: true };
      }
      const result = await draftJobFromBrief(ctx.body.brief, ({ system, user }) =>
        generateOpenRouterText({
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.2,
        }),
      );
      if (!result.ok) {
        ctx.set.status = result.status;
        return { error: result.error };
      }
      return { draft: result.draft };
    },
    { body: t.Object({ brief: t.String({ maxLength: BRIEF_MAX }) }) },
  )

  // 2. Rank recent applicants + opted-in talent against the approved job.
  .post(
    "/org/:orgSlug/workspace/:workspaceSlug/shortlist",
    async (ctx) => {
      const ctxData = await loadOrgWorkspace(
        ctx.request,
        ctx.params.orgSlug,
        ctx.params.workspaceSlug,
        "view",
      );
      if ("error" in ctxData && ctxData.error) {
        ctx.set.status = ctxData.error.status;
        return ctxData.error.body;
      }
      const { org, workspace } = ctxData;
      const job = await prisma.job.findFirst({
        where: { id: ctx.body.jobId, organizationId: org.id, workspaceId: workspace.id },
        select: { id: true, title: true },
      });
      if (!job) {
        ctx.set.status = 404;
        return { error: "Job not found in this workspace" };
      }
      const jobProfile = await refreshJobSearchProfile(job.id);

      const since = new Date(Date.now() - APPLICANT_WINDOW_DAYS * 86_400_000);
      const applications = await prisma.application.findMany({
        where: {
          job: { organizationId: org.id, workspaceId: workspace.id },
          submittedAt: { gte: since },
        },
        orderBy: { submittedAt: "desc" },
        take: APPLICANT_CAP,
        select: {
          id: true,
          userId: true,
          submittedAt: true,
          job: { select: { title: true } },
          user: { select: { name: true, avatar: true } },
          snapshot: { select: { data: true } },
          portfolioId: true,
        },
      });
      const applicants: PoolCandidate[] = applications.map((a) => {
        const snapshot = (a.snapshot?.data ?? null) as ApplicationSnapshotData | null;
        const rank = rankCandidate(snapshot, {
          jobProfile,
          extras: { name: a.user.name, freshnessAt: a.submittedAt },
        });
        return {
          userId: a.userId,
          name: a.user.name,
          headline: snapshot?.profile.headline || snapshot?.profile.title || "",
          avatarUrl: a.user.avatar ?? null,
          livefolioUrl: null,
          score: rank.score,
          reasons: rank.reasons,
          proof: snapshot ? proofKindsOf(snapshot) : [],
          ref: a.id,
          appliedTo: a.job.title,
        };
      });

      const talentAllowed = canUseTalentSearch(orgPlanTier(org));
      let sourced: PoolCandidate[] = [];
      if (talentAllowed) {
        const terms = jobProfile ? [...jobProfile.mustHaves, ...jobProfile.niceToHaves] : [];
        const keywordWhere = await talentKeywordWhere(terms, true);
        const rows = await prisma.portfolio.findMany({
          where: {
            AND: [
              { openToWork: true, isPublished: true, slug: { not: null } },
              ...(keywordWhere ? [keywordWhere] : []),
            ],
          },
          include: { ...applicationSnapshotInclude, user: { select: { name: true } } },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          take: TALENT_CAP,
        });
        sourced = rows.map((row) => {
          const snapshot = portfolioToSnapshot(row);
          const rank = rankCandidate(snapshot, {
            jobProfile,
            extras: { name: row.user.name, freshnessAt: row.updatedAt },
          });
          return {
            userId: row.userId,
            name: row.user.name,
            headline: row.headline || row.title,
            avatarUrl: row.avatarUrl,
            livefolioUrl: getPortfolioPublicUrl(row.slug!),
            score: rank.score,
            reasons: rank.reasons,
            proof: proofKindsOf(snapshot),
            ref: row.slug!,
          };
        });
      }

      return {
        job,
        rankingVersion: RANKING_VERSION,
        talentSearch: talentAllowed,
        pools: { applicants: applicants.length, sourced: sourced.length },
        candidates: mergeShortlist(applicants, sourced),
      };
    },
    { body: t.Object({ jobId: t.String({ minLength: 1, maxLength: 64 }) }) },
  )

  // 3. Manager-approved send. One candidate per call; nothing is sent automatically.
  .post(
    "/org/:orgSlug/workspace/:workspaceSlug/send",
    async (ctx) => {
      const ctxData = await loadOrgWorkspace(
        ctx.request,
        ctx.params.orgSlug,
        ctx.params.workspaceSlug,
        "manage",
      );
      if ("error" in ctxData && ctxData.error) {
        ctx.set.status = ctxData.error.status;
        return ctxData.error.body;
      }
      const { org, workspace, session } = ctxData;
      const job = await prisma.job.findFirst({
        where: { id: ctx.body.jobId, organizationId: org.id, workspaceId: workspace.id },
        select: { id: true, status: true },
      });
      if (!job) {
        ctx.set.status = 404;
        return { error: "Job not found in this workspace" };
      }
      if (job.status !== "published") {
        ctx.set.status = 400;
        return { error: "Publish the job before inviting candidates, so the link works." };
      }

      let to: string | null = null;
      if (ctx.body.source === "applicant") {
        const app = await prisma.application.findFirst({
          where: { id: ctx.body.ref, job: { organizationId: org.id, workspaceId: workspace.id } },
          select: { user: { select: { email: true } } },
        });
        to = app?.user.email ?? null;
      } else {
        if (!canUseTalentSearch(orgPlanTier(org))) {
          ctx.set.status = 403;
          return { error: "Sourcing is on Pro and above." };
        }
        const portfolio = await prisma.portfolio.findFirst({
          where: { slug: ctx.body.ref, openToWork: true, isPublished: true },
          select: { contactEmail: true, user: { select: { email: true } } },
        });
        to = portfolio ? portfolio.contactEmail || portfolio.user.email : null;
      }
      if (!to) {
        ctx.set.status = 404;
        return { error: "Candidate not found" };
      }

      const sender = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { name: true },
      });
      const html = `<div style="font-family:sans-serif;white-space:pre-wrap;line-height:1.5">${escapeHtml(ctx.body.body)}</div><p style="color:#888;font-size:12px">Sent by ${escapeHtml(sender?.name ?? "a recruiter")} at ${escapeHtml(org.name)} via Livefolio.</p>`;
      const result = await sendEmail({
        to,
        subject: ctx.body.subject,
        html,
        tags: [{ name: "type", value: "agent_invite" }],
        idempotencyKey: `agent-invite:${job.id}:${ctx.body.source}:${ctx.body.ref}`,
      });
      if (result.error) {
        ctx.set.status = 502;
        return { error: "Could not send the email. Copy the draft and send it yourself." };
      }
      return { ok: true };
    },
    {
      body: t.Object({
        jobId: t.String({ minLength: 1, maxLength: 64 }),
        source: t.Union([t.Literal("applicant"), t.Literal("sourced")]),
        ref: t.String({ minLength: 1, maxLength: 200 }),
        subject: t.String({ minLength: 1, maxLength: 200 }),
        body: t.String({ minLength: 1, maxLength: 5000 }),
      }),
    },
  );

