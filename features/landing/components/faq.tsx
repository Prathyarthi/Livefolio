import type { ReactNode } from "react";
import Link from "next/link";
import { FAQ_ITEMS } from "@/lib/faq-content";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  StudioHeading,
  StudioSection,
} from "@/features/landing/components/studio-shell";

const FAQ_RICH_ANSWERS: Partial<
  Record<(typeof FAQ_ITEMS)[number]["question"], ReactNode>
> = {
  "How do billing, cancellations, and refunds work?": (
    <>
      Pro renews automatically. Cancellation takes effect at the end of the
      current paid cycle, and payments are non-refundable. See our{" "}
      <Link
        href="/refund-policy"
        className="font-medium text-brand-secondary underline-offset-4 hover:underline"
      >
        cancellation and no-refund policy
      </Link>{" "}
      or contact support for billing help.
    </>
  ),
  "How do I get help?": (
    <>
      Email us at{" "}
      <a
        href={`mailto:${siteConfig.supportEmail}`}
        className="font-medium text-brand-secondary underline-offset-4 hover:underline"
      >
        {siteConfig.supportEmail}
      </a>{" "}
      or visit our{" "}
      <Link
        href="/contact"
        className="font-medium text-brand-secondary underline-offset-4 hover:underline"
      >
        contact page
      </Link>
      . We typically respond within one business day.
    </>
  ),
};

export function FAQ() {
  return (
    <StudioSection id="faq">
      <StudioHeading
        eyebrow="FAQ"
        title="Frequently asked questions"
        description="Quick answers about building, publishing, and managing your portfolio."
      />

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.question}
            className="group rounded-[var(--radius-lg)] border border-border-default bg-surface-raised px-4 py-1 transition-colors open:border-border-strong"
          >
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center justify-between gap-3 py-3.5",
                "text-left text-sm font-semibold text-text-primary",
                "marker:content-none [&::-webkit-details-marker]:hidden",
              )}
            >
              {item.question}
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  "bg-brand-secondary/12 text-base font-light leading-none text-brand-secondary",
                  "transition-transform duration-200 group-open:rotate-45",
                )}
                aria-hidden
              >
                +
              </span>
            </summary>
            <div className="border-t border-dashed border-border-default/70 pb-4 pt-3 text-body-sm leading-relaxed text-text-secondary">
              {FAQ_RICH_ANSWERS[item.question] ?? item.answer}
            </div>
          </details>
        ))}
      </div>
    </StudioSection>
  );
}
