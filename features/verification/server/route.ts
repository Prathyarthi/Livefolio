import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  ContentValidationError,
  normalizeOptionalEmail,
} from "@/lib/content-policy";
import { stripRichTextToPlain } from "@/lib/rich-text";
import { requireOrgAdmin } from "@/features/organization/lib/org-access";
import { sendCompanyCodeEmail } from "@/features/verification/lib/email";
import {
  domainMatchesWebsite,
  maskWorkEmail,
  websiteHostname,
  workEmailDomain,
  workEmailRejection,
} from "@/features/verification/lib/work-email";

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function createCode() {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeSalt = randomBytes(16).toString("hex");
  return { code, codeSalt, codeHash: hashCode(code, codeSalt) };
}

function hashCode(code: string, salt: string) {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

function codesMatch(code: string, salt: string, expectedHash: string) {
  const actual = Buffer.from(hashCode(code.trim(), salt));
  const expected = Buffer.from(expectedHash);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

async function enforceSendLimit(organizationId: string) {
  const now = new Date();
  const windowMs = 60 * 60 * 1000;
  const windowStart = Math.floor(now.getTime() / windowMs) * windowMs;
  const expiresAt = new Date(windowStart + windowMs);
  const digest = createHash("sha256").update(organizationId).digest("hex");
  const key = `company:verify:org:${digest}:${windowStart}`;

  try {
    const bucket = await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: { increment: 1 }, expiresAt },
      select: { count: true },
    });
    if (bucket.count <= 5) return null;
    return "Too many verification emails. Try again in an hour.";
  } catch (error) {
    console.error("[company.rate-limit] failed", error);
    return "Company verification is temporarily unavailable.";
  }
}

async function loadManagedOrganization(slug: string, userId: string) {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      websiteUrl: true,
      verified: true,
    },
  });
  if (!organization) return { error: "Organization not found" as const, status: 404 };
  const admin = await requireOrgAdmin(organization.id, userId);
  if (!admin) return { error: "Forbidden" as const, status: 403 };
  return { organization };
}

export const organizationVerification = new Elysia({ prefix: "/organizations" })
  .get("/:slug/verification", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const loaded = await loadManagedOrganization(ctx.params.slug, session.userId);
    if ("error" in loaded) {
      ctx.set.status = loaded.status;
      return { error: loaded.error };
    }

    const proof = await prisma.organizationVerification.findUnique({
      where: { organizationId: loaded.organization.id },
    });

    return {
      verified: loaded.organization.verified,
      status: proof?.status ?? null,
      emailMasked: proof ? maskWorkEmail(proof.email) : null,
    };
  })
  .post(
    "/:slug/verification",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const loaded = await loadManagedOrganization(ctx.params.slug, session.userId);
      if ("error" in loaded) {
        ctx.set.status = loaded.status;
        return { error: loaded.error };
      }
      const { organization } = loaded;

      const host = websiteHostname(organization.websiteUrl);
      if (!host) {
        ctx.set.status = 400;
        return {
          error:
            "Add your company website and save it first. The email has to be on that domain.",
        };
      }
      if (organization.verified) {
        ctx.set.status = 400;
        return {
          error:
            "This company is already verified. Remove it before using a different email.",
        };
      }

      let email: string;
      try {
        const normalized = normalizeOptionalEmail(ctx.body.email, "Work email");
        if (!normalized) {
          ctx.set.status = 400;
          return { error: "Enter a company email." };
        }
        email = normalized.toLowerCase();
      } catch (error) {
        ctx.set.status = 400;
        return {
          error:
            error instanceof ContentValidationError
              ? error.message
              : "Enter a valid company email.",
        };
      }

      const rejection = workEmailRejection(email);
      if (rejection) {
        ctx.set.status = 400;
        return { error: rejection };
      }

      const domain = workEmailDomain(email);
      if (!domainMatchesWebsite(domain, organization.websiteUrl)) {
        ctx.set.status = 400;
        return { error: `Use an email at ${host}.` };
      }

      const existingProof = await prisma.organizationVerification.findUnique({
        where: { organizationId: organization.id },
      });
      const taken = await prisma.organizationVerification.findFirst({
        where: {
          email,
          status: "verified",
          organizationId: { not: organization.id },
        },
        select: { id: true },
      });
      if (taken) {
        ctx.set.status = 409;
        return {
          error: "That email is already used to verify another company.",
        };
      }

      const correctingAddress = existingProof != null && existingProof.email !== email;
      const lastSentAt = existingProof?.lastSentAt;
      if (
        !correctingAddress &&
        lastSentAt &&
        Date.now() - lastSentAt.getTime() < RESEND_COOLDOWN_MS
      ) {
        ctx.set.status = 429;
        return { error: "Wait a minute before sending another code." };
      }

      const limited = await enforceSendLimit(organization.id);
      if (limited) {
        ctx.set.status = 429;
        return { error: limited };
      }

      const { code, codeSalt, codeHash } = createCode();
      const sent = await sendCompanyCodeEmail({
        organizationId: organization.id,
        userId: session.userId,
        toEmail: email,
        company: stripRichTextToPlain(organization.name) || "your company",
        code,
      });
      if (!sent.sent) {
        ctx.set.status = 502;
        return { error: sent.error ?? "Could not send the verification email." };
      }

      const codeExpiresAt = new Date(Date.now() + CODE_TTL_MS);
      await prisma.organizationVerification.upsert({
        where: { organizationId: organization.id },
        create: {
          organizationId: organization.id,
          email,
          domain,
          status: "pending",
          codeHash,
          codeSalt,
          codeExpiresAt,
          attempts: 0,
          lastSentAt: new Date(),
        },
        update: {
          email,
          domain,
          status: "pending",
          codeHash,
          codeSalt,
          codeExpiresAt,
          attempts: 0,
          lastSentAt: new Date(),
          verifiedAt: null,
        },
      });

      return { sent: true, emailMasked: maskWorkEmail(email) };
    },
    {
      body: t.Object({
        email: t.String({ minLength: 3, maxLength: 254 }),
      }),
    },
  )
  .post(
    "/:slug/verification/confirm",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      const loaded = await loadManagedOrganization(ctx.params.slug, session.userId);
      if ("error" in loaded) {
        ctx.set.status = loaded.status;
        return { error: loaded.error };
      }
      const { organization } = loaded;
      const verification = await prisma.organizationVerification.findUnique({
        where: { organizationId: organization.id },
      });
      if (!verification) {
        ctx.set.status = 400;
        return { error: "Request a verification code first." };
      }
      if (verification.status === "verified" && organization.verified) {
        return {
          verified: true,
          emailMasked: maskWorkEmail(verification.email),
        };
      }
      if (
        !domainMatchesWebsite(verification.domain, organization.websiteUrl)
      ) {
        ctx.set.status = 400;
        return {
          error:
            "That email no longer matches the company website. Request a new code.",
        };
      }
      if (
        !verification.codeHash ||
        !verification.codeSalt ||
        !verification.codeExpiresAt ||
        verification.codeExpiresAt.getTime() < Date.now()
      ) {
        ctx.set.status = 400;
        return { error: "That code expired. Request a new one." };
      }
      if (verification.attempts >= MAX_ATTEMPTS) {
        ctx.set.status = 400;
        return { error: "Too many attempts. Request a new code." };
      }

      const matches = codesMatch(
        ctx.body.code,
        verification.codeSalt,
        verification.codeHash,
      );
      if (!matches) {
        await prisma.organizationVerification.update({
          where: { id: verification.id },
          data: { attempts: { increment: 1 } },
        });
        ctx.set.status = 400;
        return { error: "That code doesn't match." };
      }

      const taken = await prisma.organizationVerification.findFirst({
        where: {
          email: verification.email,
          status: "verified",
          organizationId: { not: organization.id },
        },
        select: { id: true },
      });
      if (taken) {
        ctx.set.status = 409;
        return {
          error: "That email is already used to verify another company.",
        };
      }

      await prisma.$transaction([
        prisma.organizationVerification.update({
          where: { id: verification.id },
          data: {
            status: "verified",
            verifiedAt: new Date(),
            codeHash: null,
            codeSalt: null,
            codeExpiresAt: null,
            attempts: 0,
          },
        }),
        prisma.organization.update({
          where: { id: organization.id },
          data: { verified: true },
        }),
      ]);

      return {
        verified: true,
        emailMasked: maskWorkEmail(verification.email),
      };
    },
    {
      body: t.Object({
        code: t.String({ minLength: 6, maxLength: 6 }),
      }),
    },
  )
  .delete("/:slug/verification", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const loaded = await loadManagedOrganization(ctx.params.slug, session.userId);
    if ("error" in loaded) {
      ctx.set.status = loaded.status;
      return { error: loaded.error };
    }

    await prisma.$transaction([
      prisma.organizationVerification.deleteMany({
        where: { organizationId: loaded.organization.id },
      }),
      prisma.organization.update({
        where: { id: loaded.organization.id },
        data: { verified: false },
      }),
    ]);

    return { verified: false };
  });
