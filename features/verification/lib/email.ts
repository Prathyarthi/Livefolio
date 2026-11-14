import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { companyVerificationEmailHtml } from "@/lib/email-templates";

export async function sendCompanyCodeEmail(input: {
  organizationId: string;
  userId: string;
  toEmail: string;
  company: string;
  code: string;
}): Promise<{ sent: boolean; error: string | null }> {
  const { subject, html } = companyVerificationEmailHtml({
    company: input.company,
    code: input.code,
  });

  const result = await sendEmail({
    to: input.toEmail,
    subject,
    html,
    tags: [
      { name: "type", value: "company_verification" },
      { name: "organization_id", value: input.organizationId },
    ],
    idempotencyKey: `company-code-${input.organizationId}-${Date.now()}`,
  });

  await prisma.emailSendLog.create({
    data: {
      userId: input.userId,
      toEmail: input.toEmail,
      type: "company_verification",
      resendId: result.id,
      status: result.error ? "failed" : "sent",
      error: result.error,
    },
  });

  if (result.error) {
    console.error("[email.company_verification] send failed", {
      organizationId: input.organizationId,
      error: result.error,
    });
    return { sent: false, error: result.error };
  }

  return { sent: true, error: null };
}
