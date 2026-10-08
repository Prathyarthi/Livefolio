import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "@/features/landing/components/marketing-page-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";
import {
  marketingVariantFrom,
  withHiringFrom,
} from "@/lib/auth-callback";
import {
  ArrowRight,
  Mail,
  MessageCircle,
  BookOpen,
  CreditCard,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = createPageMetadata({
  title: "Contact & Support",
  description: `Get help with ${siteConfig.name} — billing, publishing, resume import, templates, and account support. Email ${siteConfig.supportEmail}.`,
  path: "/contact",
});

const CANDIDATE_TOPICS = [
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
    href: "/dashboard/billing",
    linkLabel: "Open billing",
  },
  {
    icon: MessageCircle,
    title: "Product questions",
    description:
      "Templates, imports, editor, preview, and publishing — we're happy to help.",
    href: `mailto:${siteConfig.supportEmail}`,
    linkLabel: "Email support",
  },
] as const;

const HIRING_TOPICS = [
  {
    icon: HelpCircle,
    title: "Hiring FAQ",
    description:
      "Job-scoped pools, Free vs Org Pro, and how Apply with Livefolio works.",
    href: "/recruiters#faq",
    linkLabel: "View hiring FAQ",
  },
  {
    icon: BookOpen,
    title: "Start hiring",
    description:
      "Create an organization, add a workspace, and publish your first role free.",
    href: "/sign-up?callbackUrl=%2Fcompany",
    linkLabel: "Create hiring account",
  },
  {
    icon: CreditCard,
    title: "Org billing",
    description:
      "Org Pro is billed on the organization. Manage it from the hiring workspace.",
    href: "/company",
    linkLabel: "Open hiring workspace",
  },
  {
    icon: MessageCircle,
    title: "Hiring questions",
    description:
      "Jobs, applicant pools, shortlists, and organization seats — email us.",
    href: `mailto:${siteConfig.supportEmail}`,
    linkLabel: "Email support",
  },
] as const;

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const hiring = marketingVariantFrom(from) === "recruiter";
  const topics = hiring ? HIRING_TOPICS : CANDIDATE_TOPICS;
  const legalHref = (href: string) => (hiring ? withHiringFrom(href) : href);

  return (
    <MarketingPageShell variant={hiring ? "recruiter" : "candidate"}>
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <p className="eyebrow uppercase">Support</p>
          <h1 className="mt-3 text-h1 text-text-primary">Contact / Support</h1>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            {hiring
              ? "Need help with jobs, applicant pools, or organization billing? Reach out — we typically respond within one business day."
              : "Need help with your portfolio, billing, or account? Reach out — we typically respond within one business day."}
          </p>
        </header>

        <Card className="relative mb-4 gap-0 overflow-hidden p-[var(--space-5)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-brand-fill" aria-hidden />
          <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-fill/12">
            <Mail className="h-6 w-6 text-brand-secondary" aria-hidden />
          </span>
          <h2 className="mt-5 text-h3 text-text-primary">Email support</h2>
          <p className="mt-2 text-body-sm text-text-secondary">
            Include your account email and a short description of the issue. For
            billing disputes, mention the charge date and amount.
          </p>
          <Button asChild className="mt-5 w-fit">
            <a href={`mailto:${siteConfig.supportEmail}`}>
              Email {siteConfig.supportEmail}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {topics.map((topic) => (
            <Card key={topic.title} className="gap-0 p-[var(--space-5)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-fill/12">
                <topic.icon className="h-6 w-6 text-brand-secondary" aria-hidden />
              </span>
              <h2 className="mt-5 text-h3 text-text-primary">{topic.title}</h2>
              <p className="mt-2 flex-1 text-body-sm text-text-secondary">
                {topic.description}
              </p>
              <Button asChild variant="outline" className="mt-5 w-fit">
                {topic.href.startsWith("mailto:") ? (
                  <a href={topic.href}>
                    {topic.linkLabel}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                ) : (
                  <Link href={topic.href}>
                    {topic.linkLabel}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
              </Button>
            </Card>
          ))}
        </div>

        <p className="mt-10 text-center text-body-sm text-text-muted">
          Legal:{" "}
          <Link
            href={legalHref("/privacy")}
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            Privacy Policy
          </Link>
          {" · "}
          <Link
            href={legalHref("/terms")}
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            Terms
          </Link>
          {" · "}
          <Link
            href={legalHref("/refund-policy")}
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            Cancellation and No-Refund Policy
          </Link>
        </p>
      </div>
    </MarketingPageShell>
  );
}
