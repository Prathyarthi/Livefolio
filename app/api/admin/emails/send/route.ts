import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import {
  renderTemplatePlaceholders,
  sendEmailBatch,
  type SendEmailInput,
} from "@/lib/email";
import { wrapEmailHtmlIfNeeded } from "@/lib/email-templates";

const MAX_RECIPIENTS = 200;

const sendSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  bodyHtml: z.string().trim().min(1).max(200_000),
  templateId: z.string().uuid().optional().nullable(),
  emails: z.array(z.string().email()).max(MAX_RECIPIENTS).optional(),
  userIds: z.array(z.string().uuid()).max(MAX_RECIPIENTS).optional(),
});

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { subject, bodyHtml, templateId, emails = [], userIds = [] } =
    parsed.data;

  const usersFromIds =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, name: true },
        })
      : [];

  const recipientMap = new Map<
    string,
    { email: string; name: string; userId: string | null }
  >();

  for (const user of usersFromIds) {
    recipientMap.set(normalizeEmail(user.email), {
      email: user.email,
      name: user.name,
      userId: user.id,
    });
  }

  for (const raw of emails) {
    const email = normalizeEmail(raw);
    if (!recipientMap.has(email)) {
      recipientMap.set(email, { email, name: email.split("@")[0] ?? "there", userId: null });
    }
  }

  // Resolve names for CSV-only emails that already exist as users.
  const unresolvedEmails = [...recipientMap.values()]
    .filter((r) => !r.userId)
    .map((r) => r.email);

  if (unresolvedEmails.length > 0) {
    const matched = await prisma.user.findMany({
      where: { email: { in: unresolvedEmails } },
      select: { id: true, email: true, name: true },
    });
    for (const user of matched) {
      recipientMap.set(normalizeEmail(user.email), {
        email: user.email,
        name: user.name,
        userId: user.id,
      });
    }
  }

  const recipients = [...recipientMap.values()];
  if (recipients.length === 0) {
    return NextResponse.json(
      { error: "Add at least one recipient." },
      { status: 400 },
    );
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `Max ${MAX_RECIPIENTS} recipients per request.` },
      { status: 400 },
    );
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      templateId: templateId || null,
      subject,
      bodyHtml,
      status: "sending",
      createdByEmail: admin.email,
    },
  });

  const inputs: SendEmailInput[] = recipients.map((recipient) => ({
    to: recipient.email,
    subject: renderTemplatePlaceholders(subject, {
      name: recipient.name,
      email: recipient.email,
    }),
    html: wrapEmailHtmlIfNeeded(
      renderTemplatePlaceholders(bodyHtml, {
        name: recipient.name,
        email: recipient.email,
      }),
      { title: subject },
    ),
    tags: [
      { name: "type", value: "blast" },
      { name: "campaign_id", value: campaign.id },
    ],
  }));

  const { results } = await sendEmailBatch(inputs, {
    idempotencyKey: `blast-${campaign.id}`,
  });

  await prisma.emailSendLog.createMany({
    data: recipients.map((recipient, index) => {
      const result = results[index] ?? {
        id: null,
        error: "Unknown send error",
      };
      return {
        userId: recipient.userId,
        toEmail: recipient.email,
        type: "blast",
        campaignId: campaign.id,
        resendId: result.id,
        status: result.error ? "failed" : "sent",
        error: result.error,
      };
    }),
  });

  const sent = results.filter((result) => !result.error).length;
  const failed = recipients.length - sent;

  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: { status: failed > 0 && sent === 0 ? "failed" : "sent" },
  });

  return NextResponse.json({
    ok: true,
    campaignId: campaign.id,
    sent,
    failed,
    total: recipients.length,
  });
}
