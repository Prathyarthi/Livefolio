import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "@/features/landing/components/marketing-page-shell";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";
import { Mail, MessageCircle, BookOpen, CreditCard, HelpCircle } from "lucide-react";

export const metadata: Metadata = createPageMetadata({
  title: "Contact and Support",
  description: `Get help with billing, publishing, resume import, templates and your account. Email ${siteConfig.supportEmail}. We typically respond within one business day.`,
  path: "/contact",
});

const supportTopics = [
  {
    icon: HelpCircle,
    title: "FAQ",
    description:
      "Common questions about templates, publishing, imports, and billing.",
    href: "/#faq",
    linkLabel: "View FAQ",
  },
  {
    icon: BookOpen,
    title: "Getting started",
    description:
      "Sign up, pick a template, import your resume or GitHub, and publish your first portfolio.",
    href: "/sign-up",
    linkLabel: "Create account",
  },
  {
    icon: CreditCard,
    title: "Billing & subscriptions",
    description:
      "Upgrade to Pro, manage renewal, or cancel from your dashboard settings.",
    href: "/dashboard/settings",
    linkLabel: "Open settings",
  },
  {
    icon: MessageCircle,
    title: "Product questions",
    description:
      "Templates, imports, editor, preview, and publishing — we're happy to help.",
    href: `mailto:${siteConfig.supportEmail}`,
    linkLabel: "Email support",
  },
];

export default function ContactPage() {
  return (
    <MarketingPageShell>
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <p className="eyebrow uppercase">Support</p>
          <h1 className="mt-3 text-h1 text-text-primary">Contact / Support</h1>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            Need help with your portfolio, billing, or account? Reach out — we
            typically respond within one business day.
          </p>
        </header>

        <Card className="mb-4 gap-0 px-6 py-10 text-center md:px-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-primary/20 bg-brand-light">
            <Mail className="h-5 w-5 text-brand-primary" aria-hidden />
          </span>
          <div className="mt-4">
            <p className="text-body-sm text-text-secondary">Email us at</p>
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="mt-1 inline-block text-lg font-semibold text-brand-primary transition-colors hover:text-brand-dark"
            >
              {siteConfig.supportEmail}
            </a>
          </div>
          <p className="mx-auto mt-4 max-w-md text-body-sm leading-relaxed text-text-secondary">
            Include your account email and a short description of the issue. For
            billing disputes, mention the charge date and amount.
          </p>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {supportTopics.map((topic) => (
            <Card key={topic.title} className="gap-0 p-5">
              <topic.icon className="h-5 w-5 text-brand-primary" aria-hidden />
              <h2 className="mt-4 text-h4 text-text-primary">{topic.title}</h2>
              <p className="mt-2 flex-1 text-body-sm leading-relaxed text-text-secondary">
                {topic.description}
              </p>
              <Link
                href={topic.href}
                className="mt-4 text-body-sm font-medium text-brand-primary transition-colors hover:text-brand-dark"
              >
                {topic.linkLabel} →
              </Link>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-center text-body-sm text-text-muted">
          Legal:{" "}
          <Link
            href="/privacy"
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            Privacy Policy
          </Link>
          {" · "}
          <Link
            href="/terms"
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            Terms
          </Link>
          {" · "}
          <Link
            href="/refund-policy"
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            Cancellation and No-Refund Policy
          </Link>
        </p>
      </div>
    </MarketingPageShell>
  );
}
