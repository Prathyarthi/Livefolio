import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  vouchReceivedEmailHtml,
  vouchRequestEmailHtml,
} from "@/lib/email-templates";
import { absoluteUrl } from "@/lib/seo";
import { vouchSharePath } from "./constants";

export function vouchShareUrl(token: string) {
  return absoluteUrl(vouchSharePath(token));
}

export async function sendVouchRequestEmail(input: {
  vouchId: string;
  toEmail: string;
  refereeName?: string | null;
  requesterName: string;
  personalNote?: string | null;
  token: string;
}): Promise<{ sent: boolean; error: string | null }> {
  const { subject, html } = vouchRequestEmailHtml({
    refereeName: input.refereeName,
    requesterName: input.requesterName,
    personalNote: input.personalNote,
    vouchUrl: vouchShareUrl(input.token),
  });

  const result = await sendEmail({
    to: input.toEmail,
    subject,
    html,
    tags: [
      { name: "type", value: "vouch_request" },
      { name: "vouch_id", value: input.vouchId },
    ],
    idempotencyKey: `vouch-request-${input.vouchId}-${Date.now()}`,
  });

  await prisma.emailSendLog.create({
    data: {
      toEmail: input.toEmail,
      type: "vouch_request",
      resendId: result.id,
      status: result.error ? "failed" : "sent",
      error: result.error,
    },
  });

  if (result.error) {
    console.error("[email.vouch_request] send failed", {
      vouchId: input.vouchId,
      error: result.error,
    });
    return { sent: false, error: result.error };
  }

  await prisma.vouch.update({
    where: { id: input.vouchId },
    data: {
      lastEmailedAt: new Date(),
      emailCount: { increment: 1 },
    },
  });

  return { sent: true, error: null };
}

export async function sendVouchReceivedEmail(input: {
  vouchId: string;
  toEmail: string;
  toUserId: string;
  requesterName: string;
  refereeName: string;
  story: string;
}): Promise<void> {
  const { subject, html } = vouchReceivedEmailHtml({
    requesterName: input.requesterName,
    refereeName: input.refereeName,
    story: input.story,
    dashboardUrl: absoluteUrl("/dashboard/references"),
  });

  const result = await sendEmail({
    to: input.toEmail,
    subject,
    html,
    tags: [
      { name: "type", value: "vouch_received" },
      { name: "vouch_id", value: input.vouchId },
    ],
    idempotencyKey: `vouch-received-${input.vouchId}`,
  });

  await prisma.emailSendLog.create({
    data: {
      userId: input.toUserId,
      toEmail: input.toEmail,
      type: "vouch_received",
      resendId: result.id,
      status: result.error ? "failed" : "sent",
      error: result.error,
    },
  });

  if (result.error) {
    console.error("[email.vouch_received] send failed", {
      vouchId: input.vouchId,
      error: result.error,
    });
  }
}