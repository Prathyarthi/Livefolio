import type { ReactNode } from "react";
import Link from "next/link";
import { FAQ_ITEMS } from "@/lib/faq-content";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

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
    <section id="faq" className="scroll-mt-16 px-6 py-[var(--space-9)]">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">FAQ</p>
          <h2 className="mt-3 text-h1 text-text-primary">
            Frequently asked questions
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            Quick answers about building, publishing, and managing your
            portfolio.
          </p>
        </div>

        <div
          className={cn(
            "mx-auto mt-[var(--space-6)] max-w-3xl overflow-hidden",
            "rounded-[var(--radius-lg)] border border-border-default bg-surface-raised",
            "shadow-[var(--shadow-card)]"
          )}
        >
          <div className="h-1 bg-brand-secondary" aria-hidden />

          <div className="divide-y divide-border-default">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group px-[var(--space-5)] py-1 transition-colors open:bg-brand-secondary/[0.05]"
              >
                <summary
                  className={cn(
                    "flex cursor-pointer list-none items-center justify-between gap-4 py-4",
                    "text-left text-h4 text-text-primary",
                    "marker:content-none [&::-webkit-details-marker]:hidden"
                  )}
                >
                  {item.question}
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      "bg-brand-secondary/12 text-lg font-light leading-none text-brand-secondary",
                      "transition-all duration-200",
                      "group-open:rotate-45 group-open:bg-brand-fill group-open:text-brand-on-fill"
                    )}
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <div className="border-l-2 border-brand-secondary/35 pb-4 pl-4 text-body-sm leading-relaxed text-text-secondary">
                  {FAQ_RICH_ANSWERS[item.question] ?? item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
