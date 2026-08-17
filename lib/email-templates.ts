import { getPortfolioPublicUrl } from "@/lib/domain";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

/** Tokens aligned with the waitlist / early-access email. */
const brand = {
  coral: "#ed7a6d",
  page: "#f4f5f7",
  card: "#ffffff",
  footer: "#f9fafb",
  text: "#374151",
  heading: "#111827",
  muted: "#9ca3af",
  white: "#ffffff",
} as const;

const FOUNDER_NAME = "Prathyarthi Kashyap";
const FOUNDER_TITLE = `Co-founder, ${siteConfig.name}`;

type EmailRenderOptions = {
  /** Kept for callers; layout no longer depends on local image assets. */
  preview?: boolean;
};

type EmailShellParams = {
  title: string;
  preheader?: string;
  bodyHtml: string;
  footerHtml?: string;
};

function defaultFooterHtml(): string {
  const homeUrl = getSiteUrl();
  return `<p style="font-size:12px;color:${brand.muted};margin:0;">
    You're receiving this because you have a ${siteConfig.name} account.
    Questions? Reply to this email or write
    <a href="mailto:${siteConfig.supportEmail}" style="color:${brand.coral};text-decoration:none;">${siteConfig.supportEmail}</a>.
    <br />
    <a href="${homeUrl}" style="color:${brand.coral};text-decoration:none;">${siteConfig.name}</a>
  </p>`;
}

function emailShell(params: EmailShellParams): string {
  const { title, bodyHtml } = params;
  const preheader = params.preheader ?? "";
  const footerHtml = params.footerHtml ?? defaultFooterHtml();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${brand.page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${brand.page};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:${brand.card};border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:${brand.coral};padding:32px 40px;text-align:center;">
              <span style="color:${brand.white};font-size:22px;font-weight:700;letter-spacing:0.5px;">${siteConfig.name}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color:${brand.footer};padding:24px 40px;text-align:center;">
              ${footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function paragraph(html: string, last = false): string {
  const margin = last ? "0 0 28px" : "0 0 16px";
  return `<p style="font-size:15px;color:${brand.text};line-height:1.6;margin:${margin};">${html}</p>`;
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
  <tr>
    <td align="center" style="border-radius:8px;background-color:${brand.coral};">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:${brand.white};text-decoration:none;border-radius:8px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

function founderSignOff(): string {
  return `<p style="font-size:15px;color:${brand.text};line-height:1.6;margin:0 0 4px;">Cheers,</p>
<p style="font-size:15px;color:${brand.heading};font-weight:600;margin:0;">${escapeHtml(FOUNDER_NAME)}</p>
<p style="font-size:13px;color:${brand.muted};margin:2px 0 0;">${escapeHtml(FOUNDER_TITLE)}</p>`;
}

function greeting(firstName: string): string {
  return [
    paragraph(`Hey ${escapeHtml(firstName)},`),
    paragraph(`I'm Prathyarthi, one of the co-founders of ${siteConfig.name}.`),
  ].join("\n");
}

function isFullHtmlDocument(html: string): boolean {
  return /<html[\s>]/i.test(html) || /<!DOCTYPE/i.test(html);
}

/** Wrap fragment HTML in the branded shell. Full documents are left unchanged. */
export function wrapEmailHtmlIfNeeded(
  html: string,
  options: { title?: string; preheader?: string } = {},
): string {
  if (isFullHtmlDocument(html)) return html;
  return emailShell({
    title: options.title ?? siteConfig.name,
    preheader: options.preheader,
    bodyHtml: html,
  });
}

/** Starter body for admin compose — wrapped in the branded shell on send/preview. */
export function defaultComposeBodyHtml(): string {
  const dashboardUrl = absoluteUrl("/dashboard");
  return `${paragraph("Hey {{name}},")}
${paragraph(`I'm Prathyarthi, one of the co-founders of ${siteConfig.name}.`)}
${paragraph("Your message here.")}
${paragraph("If you'd like a product demo from the founding team, simply reply to this email. We'd be happy to walk you through Livefolio and answer any questions.", true)}
${ctaButton(dashboardUrl, `Access ${siteConfig.name}`)}
${founderSignOff()}`;
}

export function welcomeEmailHtml(
  name: string,
  _options: EmailRenderOptions = {},
): {
  subject: string;
  html: string;
} {
  const dashboardUrl = absoluteUrl("/dashboard");
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return {
    subject: `Welcome to ${siteConfig.name}`,
    html: emailShell({
      title: `Welcome to ${siteConfig.name}`,
      preheader: "Your portfolio builder is ready — publish in minutes.",
      bodyHtml: `
        ${greeting(firstName)}
        ${paragraph(`Welcome to ${siteConfig.name}. Upload your resume, pick a template, and publish a live portfolio on your own link.`)}
        ${paragraph("We'd love to hear what you think. Your feedback will help us improve Livefolio as we continue building.")}
        ${paragraph("If you'd like a product demo from the founding team, simply reply to this email. We'd be happy to walk you through Livefolio and answer any questions.", true)}
        ${ctaButton(dashboardUrl, "Open your dashboard")}
        ${founderSignOff()}
      `,
    }),
  };
}

export function noPortfolioReminderEmailHtml(
  name: string,
  _options: EmailRenderOptions = {},
): {
  subject: string;
  html: string;
} {
  const dashboardUrl = absoluteUrl("/dashboard");
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return {
    subject: `Create your ${siteConfig.name} portfolio`,
    html: emailShell({
      title: `Create your ${siteConfig.name} portfolio`,
      preheader: "You're a few clicks away from a live portfolio.",
      bodyHtml: `
        ${greeting(firstName)}
        ${paragraph(`You signed up for ${siteConfig.name} but haven't created a portfolio yet. Import your resume and we'll structure your experience, projects, and skills for you.`)}
        ${paragraph("If you get stuck, just reply to this email — we'd be happy to walk you through it.", true)}
        ${ctaButton(dashboardUrl, "Create your portfolio")}
        ${founderSignOff()}
      `,
    }),
  };
}

export function unpublishedReminderEmailHtml(
  name: string,
  _options: EmailRenderOptions = {},
): {
  subject: string;
  html: string;
} {
  const previewUrl = absoluteUrl("/dashboard/preview");
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return {
    subject: `Publish your ${siteConfig.name} portfolio`,
    html: emailShell({
      title: `Publish your ${siteConfig.name} portfolio`,
      preheader: "Your draft is ready — go live with one click.",
      bodyHtml: `
        ${greeting(firstName)}
        ${paragraph(`Your ${siteConfig.name} portfolio is drafted but not published yet. Choose your domain, preview it, and share your live link.`)}
        ${paragraph("If you'd like a hand going live, reply to this email and we'll walk you through it.", true)}
        ${ctaButton(previewUrl, "Preview and publish")}
        ${founderSignOff()}
      `,
    }),
  };
}

export function publishedPortfolioEmailHtml(
  name: string,
  slug?: string | null,
  _options: EmailRenderOptions = {},
): {
  subject: string;
  html: string;
} {
  const liveUrl = slug ? getPortfolioPublicUrl(slug) : absoluteUrl("/dashboard");
  const firstName = name.trim().split(/\s+/)[0] || "there";
  const liveLink = slug
    ? `<a href="${escapeHtml(liveUrl)}" style="color:${brand.coral};text-decoration:none;">${escapeHtml(liveUrl.replace(/^https?:\/\//, ""))}</a>`
    : "your Livefolio dashboard";

  return {
    subject: `Your ${siteConfig.name} portfolio is live`,
    html: emailShell({
      title: `Your ${siteConfig.name} portfolio is live`,
      preheader: "Share your live link — we'd love to hear how it went.",
      bodyHtml: `
        ${greeting(firstName)}
        ${paragraph(`Your ${siteConfig.name} portfolio is live. Congratulations — share ${liveLink} with recruiters, teammates, and anyone you want to show your work to.`)}
        ${paragraph("We'd love to hear how publishing went. Reply to this email with feedback, or if you'd like a product demo from the founding team.", true)}
        ${ctaButton(liveUrl, slug ? "View your live portfolio" : "Open your dashboard")}
        ${founderSignOff()}
      `,
    }),
  };
}

export type AutomatedEmailDemo = {
  id: "welcome" | "no_portfolio" | "unpublished" | "published";
  label: string;
  description: string;
  subject: string;
  html: string;
};

export function getAutomatedEmailDemos(
  name = "Alex",
  options: EmailRenderOptions = { preview: true },
): AutomatedEmailDemo[] {
  const welcome = welcomeEmailHtml(name, options);
  const noPortfolio = noPortfolioReminderEmailHtml(name, options);
  const unpublished = unpublishedReminderEmailHtml(name, options);
  const published = publishedPortfolioEmailHtml(name, "alex", options);

  return [
    {
      id: "welcome",
      label: "Welcome (on signup)",
      description: "Sent once when a new user account is created via OAuth.",
      subject: welcome.subject,
      html: welcome.html,
    },
    {
      id: "no_portfolio",
      label: "No portfolio reminder",
      description: "Sent once if the user still has no portfolio after 3 days.",
      subject: noPortfolio.subject,
      html: noPortfolio.html,
    },
    {
      id: "unpublished",
      label: "Unpublished reminder",
      description:
        "Sent once if a portfolio exists but is still unpublished after 7 days.",
      subject: unpublished.subject,
      html: unpublished.html,
    },
    {
      id: "published",
      label: "Portfolio published",
      description:
        "Sent once when the user first publishes a live portfolio.",
      subject: published.subject,
      html: published.html,
    },
  ];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
