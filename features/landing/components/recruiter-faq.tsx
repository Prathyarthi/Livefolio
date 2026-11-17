import { cn } from "@/lib/utils";
import { RecruiterSection } from "@/features/landing/components/recruiter-section";

/** Visible /recruiters FAQ. Also the source for the FAQPage JSON-LD, so the markup always matches the page. */
export const RECRUITER_FAQS = [
  {
    q: "How is the 0–100 score worked out?",
    a: "It mixes skill match, proof of work, coding activity (only for roles that need it), context fit and recency. Each card shows up to four plain reasons, so you can always see why someone ranks where they do.",
  },
  {
    q: "Do references change the ranking?",
    a: "Only if you want them to. References always show on the applicant. Turn on Include references and they can add up to 12 points, weighted by the referee's relationship and whether their story matches your job. Turn it off and they're ignored.",
  },
  {
    q: "Can recruiters browse all Livefolio users?",
    a: "No. You search the applicants for each job, plus people who opted in to Talent search. Opting in is not shown on anyone’s public Livefolio.",
  },
  {
    q: "What’s on Free, Pro and Business?",
    a: "Every plan has proof-based ranking with reasons, references you can switch on, compare, the pool gap report, pipeline and shortlist. Free is 1 seat, 1 open job and 1 workspace. Pro and Business are priced per seat and start from 1 seat. Pro adds Talent search (candidates who opted in), up to 5 workspaces with up to 5 open jobs per workspace (drafts are unlimited), teammate invites and priority support. Business adds unlimited workspaces and open jobs, priority verified-company review, onboarding help and invoice billing on request."
  },
  {
    q: "Is this the same as personal Livefolio Pro?",
    a: "No. Personal Pro is for individual portfolios. Hiring Pro and Business are company plans, billed per seat.",
  },
  {
    q: "Do you offer Enterprise plans?",
    a: "Yes. Enterprise is custom-priced for larger teams: custom seat volume, contract and invoicing, a dedicated support contact, guided onboarding, and SSO or a security review on request. Email team@livefolio.me and we’ll scope it with you.",
  },
  {
    q: "What counts as a seat?",
    a: "Each teammate in your organization, plus anyone with a pending invite. Add or remove seats from Billing; removed seats stop renewing at the end of the billing period.",
  },
  {
    q: "Do candidates need a Livefolio?",
    a: "Yes. Apply with Livefolio uses their professional identity. If they don’t have one yet, they can create it when they apply.",
  },
] as const;

function splitColumns<T>(items: readonly T[]): [T[], T[]] {
  const columns: [T[], T[]] = [[], []];
  items.forEach((item, index) => {
    columns[index % 2].push(item);
  });
  return columns;
}

function RecruiterFaqCard({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-[var(--radius-lg)] border border-border-default bg-surface-raised px-4 py-1 transition-colors open:border-border-strong">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 py-3.5",
          "text-left text-sm font-semibold text-text-primary",
          "marker:content-none [&::-webkit-details-marker]:hidden",
        )}
      >
        {question}
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
        {answer}
      </div>
    </details>
  );
}

export function RecruiterFAQ() {
  const columns = splitColumns(RECRUITER_FAQS);

  return (
    <RecruiterSection
      id="faq"
      label="FAQ"
      title="Questions, answered"
      body="How ranking, references, and hiring plans work."
    >
      <div className="flex flex-col gap-3 sm:hidden">
        {RECRUITER_FAQS.map((item) => (
          <RecruiterFaqCard key={item.q} question={item.q} answer={item.a} />
        ))}
      </div>

      <div className="hidden items-start gap-3 sm:grid sm:grid-cols-2">
        {columns.map((column, index) => (
          <div key={index} className="flex flex-col gap-3">
            {column.map((item) => (
              <RecruiterFaqCard key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        ))}
      </div>
    </RecruiterSection>
  );
}