import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { orgInviteEmailHtml } from "@/lib/email-templates";
import { absoluteUrl } from "@/lib/seo";

const ROLE_LABELS: Record<string, string> = {
  admin: "an admin",
  recruiter: "a recruiter",
  hiring_manager: "a hiring manager",
};

export function orgInviteUrl(token: string) {
  return absoluteUrl(`/invite/${token}`);
}

export async function sendOrgInviteEmail(input: {
  inviteId: string;
  userId: string;
  toEmail: string;
  inviterName: string;
  organizationName: string;
  role: string;
  token: string;
}): Promise<{ sent: boolean; error: string | null }> {
  const { subject, html } = orgInviteEmailHtml({
    inviterName: input.inviterName,
    organizationName: input.organizationName,
    roleLabel: ROLE_LABELS[input.role] ?? "a teammate",
    inviteUrl: orgInviteUrl(input.token),
  });

  const result = await sendEmail({
    to: input.toEmail,
    subject,
    html,
    tags: [
      { name: "type", value: "org_invite" },
      { name: "invite_id", value: input.inviteId },
    ],
    idempotencyKey: `org-invite-${input.inviteId}-${Date.now()}`,
  });

  await prisma.emailSendLog.create({
    data: {
      userId: input.userId,
      toEmail: input.toEmail,
      type: "org_invite",
      resendId: result.id,
      status: result.error ? "failed" : "sent",
      error: result.error,
    },
  });

  if (result.error) {
    console.error("[email.org_invite] send failed", {
      inviteId: input.inviteId,
      error: result.error,
    });
    return { sent: false, error: result.error };
  }

  return { sent: true, error: null };
}