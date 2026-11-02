import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
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
      className="px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[720px]">
        <div className="text-center">
          <p className="eyebrow uppercase">FAQ</p>
          <h2
            id="recruiter-faq-heading"
            className="mt-2 text-h2 text-text-primary"
          >
            Common questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-left text-body text-text-primary">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-body-sm text-text-secondary">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
