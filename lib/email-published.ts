import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { publishedPortfolioEmailHtml } from "@/lib/email-templates";

/** Fire-and-forget first-publish email. Never throws to the publish path. */
export async function sendPublishedPortfolioEmailSafe(user: {
  id: string;
  email: string;
  name: string;
  slug?: string | null;
}): Promise<void> {
  try {
    const { subject, html } = publishedPortfolioEmailHtml(user.name, user.slug);
    const result = await sendEmail({
      to: user.email,
      subject,
      html,
      tags: [
        { name: "type", value: "published" },
        { name: "user_id", value: user.id },
      ],
      idempotencyKey: `published-${user.id}`,
    });

    await prisma.emailSendLog.create({
      data: {
        userId: user.id,
        toEmail: user.email,
        type: "published",
        resendId: result.id,
        status: result.error ? "failed" : "sent",
        error: result.error,
      },
    });

    if (!result.error) {
      await prisma.user.update({
        where: { id: user.id },
        data: { publishedCongratsSentAt: new Date() },
      });
    } else {
      console.error("[email.published] send failed", {
        userId: user.id,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[email.published] unexpected failure", {
      userId: user.id,
      error,
    });
  }
}
