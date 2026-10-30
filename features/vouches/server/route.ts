import { randomBytes } from "node:crypto";
import { createHash } from "node:crypto";
import Elysia, { t } from "elysia";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { resolveAccessForUser } from "@/lib/entitlements";
import { ContentValidationError } from "@/lib/content-policy";
import { normalizeOAuthEmail } from "@/lib/oauth-users";
import { VOUCH_RESEND_COOLDOWN_MS } from "@/features/vouches/lib/constants";
import {
  isAtVouchLimit,
  remainingVouchRequests,
  vouchLimitUpgradeMessage,
} from "@/features/vouches/lib/limits";
import {
  sendVouchReceivedEmail,
  sendVouchRequestEmail,
} from "@/features/vouches/lib/email";
import {
  canResendAt,
  serializeAskedVouch,
  serializeIncomingVouch,
  serializeTokenVouch,
} from "@/features/vouches/lib/serialize";
import {
  isInvitedReferee,
  normalizeInviteEmail,
  normalizeInviteName,
  normalizePersonalNote,
  normalizeVouchStory,
  parseRelationship,
} from "@/features/vouches/lib/validation";

const requesterSelect = {
  name: true,
  avatar: true,
  email: true,
  portfolio: {
    select: {
      id: true,
      title: true,
      headline: true,
      slug: true,
      isPublished: true,
      avatarUrl: true,
      profileImageUrl: true,
    },
  },
} as const;

const refereeSelect = {
  name: true,
  avatar: true,
  portfolio: {
    select: {
      slug: true,
      isPublished: true,
      avatarUrl: true,
      profileImageUrl: true,
    },
  },
} as const;

function createVouchToken() {
  return randomBytes(24).toString("base64url");
}

function validationStatus(error: unknown) {
  return error instanceof ContentValidationError ? 400 : 500;
}

async function loadBillingUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      subscriptionStatus: true,
      subscriptionCancelAtPeriodEnd: true,
      subscriptionCurrentPeriodEnd: true,
      portfolio: { select: { id: true, headline: true } },
    },
  });
}

async function countUsedRequests(userId: string) {
  return prisma.vouch.count({
    where: { requesterId: userId },
  });
}

async function enforceVouchEmailRateLimit(userId: string) {
  const now = new Date();
  const windowMs = 60 * 60 * 1000;
  const windowStart = Math.floor(now.getTime() / windowMs) * windowMs;
  const expiresAt = new Date(windowStart + windowMs);
  const digest = createHash("sha256").update(userId).digest("hex");
  const key = `vouch:request:user:${digest}:${windowStart}`;

  try {
    const bucket = await prisma.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 1, expiresAt },
      update: { count: { increment: 1 }, expiresAt },
      select: { count: true },
    });
    if (bucket.count <= 8) return null;
    return "Too many reference emails. Try again in an hour.";
  } catch (error) {
    console.error("[vouches.rate-limit] failed", error);
    return "Reference requests are temporarily unavailable.";
  }
}

export const vouches = new Elysia({ prefix: "/vouches" })
  .get("/", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const user = await loadBillingUser(session.userId);
    if (!user) {
      ctx.set.status = 404;
      return { error: "User not found" };
    }

    const access = resolveAccessForUser(user);
    const used = await countUsedRequests(session.userId);
    const email = session.email
      ? normalizeOAuthEmail(session.email)
      : user.email;

    const [asked, incoming, given] = await Promise.all([
      prisma.vouch.findMany({
        where: { requesterId: session.userId },
        orderBy: { createdAt: "desc" },
        include: { referee: { select: refereeSelect } },
      }),
      prisma.vouch.findMany({
        where: {
          status: "pending",
          requesterId: { not: session.userId },
          OR: [
            { refereeId: session.userId },
            ...(email ? [{ inviteEmail: email }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        include: { requester: { select: requesterSelect } },
      }),
      prisma.vouch.findMany({
        where: { refereeId: session.userId, status: "completed" },
        orderBy: { completedAt: "desc" },
        include: { requester: { select: requesterSelect } },
      }),
    ]);

    return {
      asked: asked.map(serializeAskedVouch),
      incoming: incoming.map(serializeIncomingVouch),
      given: given.map(serializeIncomingVouch),
      limits: {
        used,
        max: access.maxVouchRequests,
        remaining: remainingVouchRequests(used, access.maxVouchRequests),
        tier: access.tier,
      },
    };
  })

  .post(
    "/",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Unauthorized" };
      }

      try {
        const inviteEmail = normalizeInviteEmail(ctx.body.email);
        const inviteName = normalizeInviteName(ctx.body.name);
        const personalNote = normalizePersonalNote(ctx.body.note);

        const user = await loadBillingUser(session.userId);
        if (!user) {
          ctx.set.status = 404;
          return { error: "User not found" };
        }
        if (!user.portfolio) {
          ctx.set.status = 400;
          return { error: "Create your portfolio before asking for a reference." };
        }
        if (normalizeOAuthEmail(user.email) === inviteEmail) {
          ctx.set.status = 400;
          return { error: "You can't ask yourself for a reference." };
        }

        const rateLimitError = await enforceVouchEmailRateLimit(session.userId);
        if (rateLimitError) {
          ctx.set.status = 429;
          return { error: rateLimitError };
        }

        const created = await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`
            SELECT "id" FROM "users" WHERE "id" = ${session.userId} FOR UPDATE
          `;

          const access = resolveAccessForUser(user);
          const used = await tx.vouch.count({
            where: { requesterId: session.userId },
          });
          if (isAtVouchLimit(used, access.maxVouchRequests)) {
            const error = new Error(vouchLimitUpgradeMessage(access));
            (error as Error & { status: number }).status = 403;
            throw error;
          }

          const existing = await tx.vouch.findFirst({
            where: {
              requesterId: session.userId,
              inviteEmail,
            },
            select: { id: true, status: true },
          });
          if (existing) {
            const error = new Error(
              existing.status === "completed"
                ? "That person already vouched for you."
                : existing.status === "cancelled"
                  ? "You already used an ask for this email. Cancelled asks still count toward your limit."
                  : "You already asked that person. You can resend the email from your references list.",
            );
            (error as Error & { status: number }).status = 409;
            throw error;
          }

          return tx.vouch.create({
            data: {
              token: createVouchToken(),
              requesterId: session.userId,
              portfolioId: user.portfolio!.id,
              inviteEmail,
              inviteName,
              personalNote,
            },
            include: { referee: { select: refereeSelect } },
          });
        });

        const emailResult = await sendVouchRequestEmail({
          vouchId: created.id,
          toEmail: inviteEmail,
          refereeName: inviteName,
          requesterName: user.name,
          personalNote,
          token: created.token,
        });

        const fresh = await prisma.vouch.findUniqueOrThrow({
          where: { id: created.id },
          include: { referee: { select: refereeSelect } },
        });

        return {
          vouch: serializeAskedVouch(fresh),
          emailSent: emailResult.sent,
          emailError: emailResult.error,
        };
      } catch (error) {
        const status =
          typeof (error as { status?: number }).status === "number"
            ? (error as { status: number }).status
            : validationStatus(error);
        ctx.set.status = status;
        return {
          error:
            error instanceof Error ? error.message : "Failed to ask for a reference",
        };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        name: t.Optional(t.String()),
        note: t.Optional(t.String()),
      }),
    },
  )

  .get("/token/:token", async (ctx) => {
    const session = await getSession(ctx.request);
    const [row, viewer] = await Promise.all([
      prisma.vouch.findUnique({
        where: { token: ctx.params.token },
        include: {
          requester: { select: requesterSelect },
          referee: { select: refereeSelect },
        },
      }),
      session
        ? prisma.user.findUnique({
            where: { id: session.userId },
            select: { email: true },
          })
        : Promise.resolve(null),
    ]);

    if (!row) {
      ctx.set.status = 404;
      return { error: "This reference request was not found." };
    }

    return serializeTokenVouch(row, {
      userId: session?.userId,
      email: viewer?.email ?? session?.email,
    });
  })

  .post(
    "/token/:token/submit",
    async (ctx) => {
      const session = await getSession(ctx.request);
      if (!session) {
        ctx.set.status = 401;
        return { error: "Sign in to Livefolio to vouch." };
      }

      try {
        const relationship = parseRelationship(ctx.body.relationship);
        const story = normalizeVouchStory(ctx.body.story);

        const referee = await prisma.user.findUnique({
          where: { id: session.userId },
          select: { id: true, name: true, email: true },
        });
        if (!referee) {
          ctx.set.status = 404;
          return { error: "User not found" };
        }

        const updated = await prisma.$transaction(async (tx) => {
          const row = await tx.vouch.findUnique({
            where: { token: ctx.params.token },
            include: { requester: { select: { id: true, name: true, email: true } } },
          });
          if (!row) {
            const error = new Error("This reference request was not found.");
            (error as Error & { status: number }).status = 404;
            throw error;
          }
          if (row.status === "cancelled") {
            const error = new Error("This request was withdrawn.");
            (error as Error & { status: number }).status = 410;
            throw error;
          }
          if (row.status === "completed") {
            const error = new Error("Someone already vouched with this link.");
            (error as Error & { status: number }).status = 409;
            throw error;
          }
          if (row.requesterId === session.userId) {
            const error = new Error("You can't vouch for yourself.");
            (error as Error & { status: number }).status = 400;
            throw error;
          }
          if (!isInvitedReferee(row.inviteEmail, referee.email)) {
            const error = new Error(
              "This invite was sent to a different email. Sign in with that account to vouch.",
            );
            (error as Error & { status: number }).status = 403;
            throw error;
          }

          const already = await tx.vouch.findFirst({
            where: {
              requesterId: row.requesterId,
              refereeId: session.userId,
              status: "completed",
            },
            select: { id: true },
          });
          if (already) {
            const error = new Error("You already vouched for this person.");
            (error as Error & { status: number }).status = 409;
            throw error;
          }

          return tx.vouch.update({
            where: { id: row.id },
            data: {
              status: "completed",
              refereeId: session.userId,
              relationship,
              story,
              completedAt: new Date(),
            },
            include: {
              requester: { select: requesterSelect },
              referee: { select: refereeSelect },
            },
          });
        });

        await sendVouchReceivedEmail({
          vouchId: updated.id,
          toEmail: updated.requester.email,
          toUserId: updated.requesterId,
          requesterName: updated.requester.name,
          refereeName: referee.name,
          story,
        });

        return serializeTokenVouch(updated, {
          userId: session.userId,
          email: referee.email,
        });
      } catch (error) {
        const status =
          typeof (error as { status?: number }).status === "number"
            ? (error as { status: number }).status
            : validationStatus(error);
        ctx.set.status = status;
        return {
          error: error instanceof Error ? error.message : "Failed to submit vouch",
        };
      }
    },
    {
      body: t.Object({
        relationship: t.String(),
        story: t.String(),
      }),
    },
  )

  .post("/:id/cancel", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const row = await prisma.vouch.findFirst({
      where: { id: ctx.params.id, requesterId: session.userId },
    });
    if (!row) {
      ctx.set.status = 404;
      return { error: "Reference request not found" };
    }
    if (row.status !== "pending") {
      ctx.set.status = 400;
      return { error: "Only pending requests can be cancelled." };
    }

    const updated = await prisma.vouch.update({
      where: { id: row.id },
      data: { status: "cancelled", cancelledAt: new Date() },
      include: { referee: { select: refereeSelect } },
    });

    return { vouch: serializeAskedVouch(updated) };
  })

  .post("/:id/resend", async (ctx) => {
    const session = await getSession(ctx.request);
    if (!session) {
      ctx.set.status = 401;
      return { error: "Unauthorized" };
    }

    const row = await prisma.vouch.findFirst({
      where: { id: ctx.params.id, requesterId: session.userId },
      include: {
        requester: { select: { name: true } },
      },
    });
    if (!row) {
      ctx.set.status = 404;
      return { error: "Reference request not found" };
    }
    if (row.status !== "pending") {
      ctx.set.status = 400;
      return { error: "Only pending requests can be resent." };
    }
    if (!canResendAt(row.lastEmailedAt)) {
      const waitHours = Math.ceil(VOUCH_RESEND_COOLDOWN_MS / (60 * 60 * 1000));
      ctx.set.status = 429;
      return { error: `You can resend once every ${waitHours} hours.` };
    }

    const rateLimitError = await enforceVouchEmailRateLimit(session.userId);
    if (rateLimitError) {
      ctx.set.status = 429;
      return { error: rateLimitError };
    }

    const emailResult = await sendVouchRequestEmail({
      vouchId: row.id,
      toEmail: row.inviteEmail,
      refereeName: row.inviteName,
      requesterName: row.requester.name,
      personalNote: row.personalNote,
      token: row.token,
    });

    const fresh = await prisma.vouch.findUniqueOrThrow({
      where: { id: row.id },
      include: { referee: { select: refereeSelect } },
    });

    return {
      vouch: serializeAskedVouch(fresh),
      emailSent: emailResult.sent,
      emailError: emailResult.error,
    };
  });
