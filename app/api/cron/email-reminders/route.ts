import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, sendEmailBatch, type SendEmailInput } from "@/lib/email";
import {
  noPortfolioReminderEmailHtml,
  unpublishedReminderEmailHtml,
  welcomeEmailHtml,
} from "@/lib/email-templates";

export const maxDuration = 300;

const NO_PORTFOLIO_DAYS = 3;
const UNPUBLISHED_DAYS = 7;
const PAGE_SIZE = 100;

type ReminderUser = { id: string; email: string; name: string };
type ReminderType = "no_portfolio" | "unpublished";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function sendReminderPage(opts: {
  users: ReminderUser[];
  type: ReminderType;
  buildEmail: (name: string) => { subject: string; html: string };
  sentAtField: "noPortfolioReminderSentAt" | "unpublishedReminderSentAt";
}): Promise<{ sent: number; failed: number }> {
  if (opts.users.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const firstId = opts.users[0]?.id;
  const lastId = opts.users.at(-1)?.id;
  const inputs: SendEmailInput[] = opts.users.map((user) => {
    const { subject, html } = opts.buildEmail(user.name);
    return {
      to: user.email,
      subject,
      html,
      tags: [
        { name: "type", value: opts.type },
        { name: "user_id", value: user.id },
      ],
    };
  });

  const { results, error } = await sendEmailBatch(inputs, {
    idempotencyKey:
      firstId && lastId ? `${opts.type}-${firstId}-${lastId}` : undefined,
  });

  const logs = opts.users.map((user, index) => {
    const result = results[index] ?? {
      id: null,
      error: error ?? "Unknown send error",
    };
    return {
      userId: user.id,
      toEmail: user.email,
      type: opts.type,
      resendId: result.id,
      status: result.error ? "failed" : "sent",
      error: result.error,
    };
  });

  await prisma.emailSendLog.createMany({ data: logs });

  const succeededIds = opts.users
    .filter((_, index) => results[index] != null && !results[index].error)
    .map((user) => user.id);

  if (succeededIds.length > 0) {
    const now = new Date();
    await prisma.user.updateMany({
      where: { id: { in: succeededIds } },
      data:
        opts.sentAtField === "noPortfolioReminderSentAt"
          ? { noPortfolioReminderSentAt: now }
          : { unpublishedReminderSentAt: now },
    });
  }

  const failed = opts.users.length - succeededIds.length;
  if (error || failed > 0) {
    console.error(`[email.cron.${opts.type}] failed`, {
      count: failed,
      error,
    });
  }

  return { sent: succeededIds.length, failed };
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const noPortfolioCutoff = daysAgo(NO_PORTFOLIO_DAYS);
  const unpublishedCutoff = daysAgo(UNPUBLISHED_DAYS);

  let welcomeSent = 0;
  let welcomeFailed = 0;
  let noPortfolioSent = 0;
  let noPortfolioFailed = 0;
  let unpublishedSent = 0;
  let unpublishedFailed = 0;

  // Retry welcome emails that failed on a previous attempt.
  const welcomeRetryUsers = await prisma.user.findMany({
    where: {
      welcomeEmailSentAt: null,
      emailSendLogs: {
        some: { type: "welcome", status: "failed" },
      },
    },
    select: { id: true, email: true, name: true },
    take: PAGE_SIZE,
  });

  for (const user of welcomeRetryUsers) {
    const { subject, html } = welcomeEmailHtml(user.name);
    const result = await sendEmail({
      to: user.email,
      subject,
      html,
      tags: [
        { name: "type", value: "welcome" },
        { name: "user_id", value: user.id },
      ],
      idempotencyKey: `welcome-${user.id}`,
    });

    await prisma.emailSendLog.create({
      data: {
        userId: user.id,
        toEmail: user.email,
        type: "welcome",
        resendId: result.id,
        status: result.error ? "failed" : "sent",
        error: result.error,
      },
    });

    if (result.error) {
      welcomeFailed += 1;
      console.error("[email.cron.welcome] retry failed", {
        userId: user.id,
        error: result.error,
      });
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { welcomeEmailSentAt: new Date() },
    });
    welcomeSent += 1;
  }

  // --- No portfolio reminders ---
  let noPortfolioCursor: string | undefined;
  do {
    const users = await prisma.user.findMany({
      where: {
        portfolio: null,
        noPortfolioReminderSentAt: null,
        createdAt: { lte: noPortfolioCutoff },
      },
      select: { id: true, email: true, name: true },
      orderBy: { id: "asc" },
      take: PAGE_SIZE,
      ...(noPortfolioCursor && {
        cursor: { id: noPortfolioCursor },
        skip: 1,
      }),
    });

    const page = await sendReminderPage({
      users,
      type: "no_portfolio",
      buildEmail: noPortfolioReminderEmailHtml,
      sentAtField: "noPortfolioReminderSentAt",
    });
    noPortfolioSent += page.sent;
    noPortfolioFailed += page.failed;

    noPortfolioCursor =
      users.length === PAGE_SIZE ? users.at(-1)?.id : undefined;
  } while (noPortfolioCursor);

  // --- Unpublished portfolio reminders ---
  let unpublishedCursor: string | undefined;
  do {
    const users = await prisma.user.findMany({
      where: {
        unpublishedReminderSentAt: null,
        portfolio: {
          isPublished: false,
          createdAt: { lte: unpublishedCutoff },
        },
      },
      select: { id: true, email: true, name: true },
      orderBy: { id: "asc" },
      take: PAGE_SIZE,
      ...(unpublishedCursor && {
        cursor: { id: unpublishedCursor },
        skip: 1,
      }),
    });

    const page = await sendReminderPage({
      users,
      type: "unpublished",
      buildEmail: unpublishedReminderEmailHtml,
      sentAtField: "unpublishedReminderSentAt",
    });
    unpublishedSent += page.sent;
    unpublishedFailed += page.failed;

    unpublishedCursor =
      users.length === PAGE_SIZE ? users.at(-1)?.id : undefined;
  } while (unpublishedCursor);

  return NextResponse.json({
    ok: true,
    welcome: { sent: welcomeSent, failed: welcomeFailed },
    noPortfolio: { sent: noPortfolioSent, failed: noPortfolioFailed },
    unpublished: { sent: unpublishedSent, failed: unpublishedFailed },
  });
}
