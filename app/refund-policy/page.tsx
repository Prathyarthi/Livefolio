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
  title: "Cancellation and No-Refund Policy",
  description: `Cancellation and no-refund terms for ${siteConfig.name} Pro subscriptions.`,
  path: "/refund-policy",
  openGraphType: "article",
});

export default async function RefundPolicyPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const variant = marketingVariantFrom(from);

  return (
    <MarketingPageShell variant={variant}>
      <LegalDocument
        title="Cancellation and No-Refund Policy"
        lastUpdated="July 18, 2026"
      >
        <p>
          This policy explains how cancellations and payments work for paid
          subscriptions to {siteConfig.name}. By subscribing to Pro, you agree
          to these terms in addition to our{" "}
          <Link href="/terms">Terms &amp; Conditions</Link>.
        </p>

        <h2>Free trial and Starter plan</h2>
        <p>
          New accounts receive a one-month trial of core workflows on the Starter plan
          at no charge. No payment is collected during the trial unless you
          separately subscribe to Pro. After the trial, you may continue on free
          essentials or upgrade to Pro.
        </p>

        <h2>Pro subscriptions</h2>
        <p>
          Pro is a recurring subscription billed monthly, quarterly, or yearly through Razorpay.
          Your subscription renews automatically at the end of each billing period
          unless you cancel before renewal.
        </p>

        <h2>Cancellation</h2>
        <ul>
          <li>
            You can cancel your subscription at any time from{" "}
            <Link href="/dashboard/settings">Dashboard → Settings</Link> or the
            billing page
          </li>
          <li>
            Cancellation stops future charges; you keep Pro access until the end of
            the current paid period
          </li>
          <li>
            After the paid period ends, your account moves to the applicable free
            tier and premium features may be limited
          </li>
        </ul>

        <h2>No refunds</h2>
        <p>
          All subscription payments are final and non-refundable once charged,
          except where a refund is required by applicable law. We do not provide
          full or partial refunds or credits for:
        </p>
        <ul>
          <li>Unused time in a monthly, quarterly, or yearly billing period</li>
          <li>Cancelling after a subscription payment has been charged</li>
          <li>Forgetting to cancel before an automatic renewal</li>
          <li>Not using, or only partially using, Pro features</li>
          <li>Account suspension or termination for violating our Terms</li>
        </ul>

        <h2>Billing errors</h2>
        <p>
          If you believe a charge is unauthorized, duplicated, or incorrect,
          contact{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>
            {siteConfig.supportEmail}
          </a>{" "}
          promptly from the email associated with your account. We will
          investigate and correct verified billing errors as required by
          applicable law and payment-network rules.
        </p>

        <h2>Chargebacks</h2>
        <p>
          If you have a billing concern, please contact us before initiating a
          chargeback. Unauthorized chargebacks may result in account suspension while
          the dispute is resolved.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. The version posted on
          this page applies to purchases made after its updated date.
        </p>

        <h2>Contact</h2>
        <p>
          Billing questions? Visit{" "}
          <Link href={variant === "recruiter" ? withHiringFrom("/contact") : "/contact"}>
            Contact / Support
          </Link>{" "}
          or
          email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.
        </p>
      </LegalDocument>
    </MarketingPageShell>
  );
}
