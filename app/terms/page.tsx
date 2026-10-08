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
  title: "Terms & Conditions",
  description: `Terms governing your use of ${siteConfig.name}, including accounts, subscriptions, published portfolios, and acceptable use.`,
  path: "/terms",
  openGraphType: "article",
});

export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const variant = marketingVariantFrom(from);

  return (
    <MarketingPageShell variant={variant}>
      <LegalDocument title="Terms & Conditions" lastUpdated="June 22, 2026">
        <p>
          These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and
          use of {siteConfig.name}, operated by {siteConfig.legalEntity}. By creating
          an account or using the Service, you agree to these Terms.
        </p>

        <h2>Eligibility</h2>
        <p>
          You must be at least 13 years old and able to form a binding contract to
          use the Service. If you use the Service on behalf of an organization, you
          represent that you have authority to bind that organization.
        </p>

        <h2>Your account</h2>
        <ul>
          <li>You are responsible for maintaining the security of your account</li>
          <li>You must provide accurate account information</li>
          <li>
            You are responsible for activity that occurs under your account unless
            you notify us promptly of unauthorized use
          </li>
        </ul>

        <h2>Portfolio content</h2>
        <p>
          You retain ownership of content you submit to the Service. By publishing
          a portfolio, you grant us a limited license to host, display, and
          distribute that content solely to operate the Service.
        </p>
        <p>You agree not to upload or publish content that:</p>
        <ul>
          <li>Violates any law or third-party rights</li>
          <li>Is fraudulent, misleading, or harmful</li>
          <li>Contains malware or attempts to disrupt the Service</li>
          <li>Infringes intellectual property or privacy rights of others</li>
        </ul>

        <h2>Subscriptions and billing</h2>
        <p>
          {siteConfig.name} offers free and paid plans. Paid Pro subscriptions are
          billed monthly, quarterly, or yearly through Razorpay. Prices at checkout
          reflect your chosen billing period. Prices may change with notice;
          changes apply to future billing periods.
        </p>
        <ul>
          <li>
            Starter includes a one-month trial of core workflows; after the trial,
            certain features may require a Pro subscription
          </li>
          <li>Subscriptions renew automatically unless cancelled before renewal</li>
          <li>
            You can manage or cancel billing from your dashboard settings
          </li>
        </ul>
        <p>
          Cancellations and non-refundable payments are governed by our{" "}
          <Link href="/refund-policy">Cancellation and No-Refund Policy</Link>.
        </p>

        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Reverse engineer, scrape, or abuse the Service or its APIs</li>
          <li>Interfere with other users or the integrity of the platform</li>
          <li>Use the Service for spam, harassment, or illegal activity</li>
          <li>Circumvent plan limits, access controls, or payment requirements</li>
        </ul>

        <h2>AI-assisted features</h2>
        <p>
          Some features use automated processing to help generate or improve
          portfolio content. You are responsible for reviewing output before
          publishing. We do not guarantee that AI-generated content is accurate,
          complete, or suitable for every purpose.
        </p>

        <h2>Third-party services</h2>
        <p>
          The Service may integrate with third-party platforms (such as GitHub,
          LeetCode, or payment providers). Your use of those services is subject to
          their own terms and policies.
        </p>

        <h2>Disclaimer</h2>
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, express or implied, including fitness for a
          particular purpose or uninterrupted availability.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, {siteConfig.legalEntity} will not
          be liable for indirect, incidental, special, consequential, or punitive
          damages, or for loss of profits, data, or goodwill arising from your use of
          the Service.
        </p>

        <h2>Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate
          access if you violate these Terms or if required for security or legal
          reasons. Upon termination, your right to use the Service ends, but sections
          that should survive (such as liability limits) will remain in effect.
        </p>

        <h2>Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Service
          after changes become effective constitutes acceptance of the updated Terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these Terms? Email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>{" "}
          or visit{" "}
          <Link href={variant === "recruiter" ? withHiringFrom("/contact") : "/contact"}>
            Contact / Support
          </Link>
          .
        </p>
      </LegalDocument>
    </MarketingPageShell>
  );
}
