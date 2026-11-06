import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import {
  StudioHeading,
  StudioSection,
} from "@/features/landing/components/studio-shell";

export function ContactSection() {
  return (
    <StudioSection id="contact">
      <StudioHeading
        eyebrow="Contact"
        title={<>We&apos;re here to help</>}
        description="Questions about templates, imports, billing, or publishing? Reach out and we will get back to you as soon as we can."
      />

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <article className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border-default bg-surface-sunken text-brand-secondary">
            <Mail className="h-4 w-4" aria-hidden />
          </span>
          <h3 className="mt-4 text-h4 text-text-primary">Email support</h3>
          <p className="mt-1.5 text-body-sm text-text-secondary">
            For account, billing, and product questions — include your account
            email and a short description of the issue.
          </p>
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="mt-4 inline-block text-body-sm font-medium text-brand-secondary underline-offset-4 hover:underline"
          >
            {siteConfig.supportEmail}
          </a>
        </article>

        <article className="rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-border-default bg-surface-sunken text-brand-secondary">
            <MessageCircle className="h-4 w-4" aria-hidden />
          </span>
          <h3 className="mt-4 text-h4 text-text-primary">Support center</h3>
          <p className="mt-1.5 text-body-sm text-text-secondary">
            Browse common topics, billing guidance, and ways to get started on
            our dedicated contact page.
          </p>
          <Button asChild variant="outline" className="mt-4 w-fit rounded-full">
            <Link href="/contact">
              Visit contact page
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </article>
      </div>
    </StudioSection>
  );
}
