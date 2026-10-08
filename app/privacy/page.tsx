import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell } from "@/features/landing/components/marketing-page-shell";
import { LegalDocument } from "@/features/landing/components/legal-document";
import { siteConfig } from "@/lib/site";
import { createPageMetadata } from "@/lib/seo";
import {
  marketingVariantFrom,
  withHiringFrom,
} from "@/lib/auth-callback";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses, stores, and protects your personal information and portfolio data.`,
  path: "/privacy",
  openGraphType: "article",
});

export default async function PrivacyPolicyPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const variant = marketingVariantFrom(from);

  return (
    <MarketingPageShell variant={variant}>
      <LegalDocument title="Privacy Policy" lastUpdated="June 22, 2026">
        <p>
          This Privacy Policy explains how {siteConfig.legalEntity} (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;) collects, uses, and shares information when
          you use {siteConfig.name} (the &quot;Service&quot;), including our website,
          dashboard, and published portfolio pages.
        </p>

        <h2>Information we collect</h2>
        <p>We collect information in the following ways:</p>
        <ul>
          <li>
            <strong>Account information</strong> — name,
            email address, and authentication details when you sign up or sign in.
          </li>
          <li>
            <strong>Portfolio content</strong> — text,
            images, project details, work history, and other information you add or
            import into your portfolio.
          </li>
          <li>
            <strong>Imported data</strong> — when you
            upload a resume or connect external sources (such as GitHub or LeetCode),
            we process the data you choose to import to help build your portfolio.
          </li>
          <li>
            <strong>Payment information</strong> — billing
            and subscription details are handled by our payment processor (Razorpay).
            We do not store full card or bank details on our servers.
          </li>
          <li>
            <strong>Usage data</strong> — device type,
            browser, pages visited, and interaction logs used to operate and improve
            the Service.
          </li>
        </ul>

        <h2>How we use your information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service</li>
          <li>Create, edit, preview, and publish your portfolio</li>
          <li>Process subscriptions and manage billing</li>
          <li>Send service-related communications and respond to support requests</li>
          <li>Monitor security, prevent abuse, and enforce our terms</li>
          <li>Analyze usage to improve product quality and reliability</li>
        </ul>

        <h2>How we share information</h2>
        <p>
          We do not sell your personal information. We may share information with:
        </p>
        <ul>
          <li>
            <strong>Service providers</strong> — hosting,
            analytics, email, AI processing, and payment partners who help us operate
            the Service
          </li>
          <li>
            <strong>The public</strong> — content you
            choose to publish on your portfolio is visible to anyone with your public
            link
          </li>
          <li>
            <strong>Legal requirements</strong> — when
            required by law or to protect rights, safety, and security
          </li>
        </ul>

        <h2>Data retention</h2>
        <p>
          We retain your account and portfolio data for as long as your account is
          active. If you delete your account or request deletion, we will remove or
          anonymize your data within a reasonable period, except where retention is
          required for legal, security, or billing purposes.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>You can update portfolio and account details in your dashboard</li>
          <li>You can unpublish or delete portfolio content at any time</li>
          <li>
            You can contact us to request access, correction, or deletion of personal
            data
          </li>
        </ul>

        <h2>Security</h2>
        <p>
          We use industry-standard safeguards to protect your information. No method
          of transmission or storage is completely secure, and we cannot guarantee
          absolute security.
        </p>

        <h2>Children</h2>
        <p>
          The Service is not directed to children under 13. We do not knowingly
          collect personal information from children.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the
          updated version on this page and revise the &quot;Last updated&quot; date.
        </p>

        <h2>Contact us</h2>
        <p>
          Questions about this policy? Email us at{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>{" "}
          or visit our{" "}
          <Link href={variant === "recruiter" ? withHiringFrom("/contact") : "/contact"}>
            Contact / Support
          </Link>{" "}
          page.
        </p>
      </LegalDocument>
    </MarketingPageShell>
  );
}
