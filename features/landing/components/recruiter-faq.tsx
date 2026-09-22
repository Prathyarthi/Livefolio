import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Can recruiters browse all Livefolio users?",
    a: "No. They can search people who opted in, plus applicants for each job. Opting in is not shown on anyone’s public Livefolio.",
  },
  {
    q: "What’s free vs Org Pro?",
    a: "Free includes one organization, one workspace, and one open job at a time. Org Pro unlocks unlimited open jobs and workspaces on that organization.",
  },
  {
    q: "Is this the same as personal Livefolio Pro?",
    a: "No. Personal Pro is for individual portfolios. Org Pro is company billing for hiring capacity.",
  },
  {
    q: "Do candidates need a Livefolio?",
    a: "Yes — Apply with Livefolio uses their professional identity. If they don’t have one yet, they can create it when they apply.",
  },
] as const;

export function RecruiterFAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="recruiter-faq-heading"
      className="scroll-mt-16 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">FAQ</p>
          <h2
            id="recruiter-faq-heading"
            className="mt-3 text-h1 text-text-primary"
          >
            Common questions
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            How hiring on Livefolio stays scoped, free to try, and separate from
            personal Pro.
          </p>
        </div>

        <div
          className={cn(
            "mx-auto mt-[var(--space-6)] max-w-3xl overflow-hidden",
            "rounded-[var(--radius-lg)] border border-border-default bg-surface-raised",
            "shadow-[var(--shadow-card)]",
          )}
        >
          <div className="h-1 bg-brand-fill" aria-hidden />

          <div className="divide-y divide-border-default">
            {FAQS.map((item) => (
              <details
                key={item.q}
                className="group px-[var(--space-5)] py-1 transition-colors open:bg-brand-secondary/[0.05]"
              >
                <summary
                  className={cn(
                    "flex cursor-pointer list-none items-center justify-between gap-4 py-4",
                    "text-left text-h4 text-text-primary",
                    "marker:content-none [&::-webkit-details-marker]:hidden",
                  )}
                >
                  {item.q}
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      "bg-brand-secondary/12 text-lg font-light leading-none text-brand-secondary",
                      "transition-all duration-200",
                      "group-open:rotate-45 group-open:bg-brand-fill group-open:text-brand-on-fill",
                    )}
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <div className="border-l-2 border-brand-secondary/35 pb-4 pl-4 text-body-sm leading-relaxed text-text-secondary">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
