const FAQS = [
  {
    q: "Can recruiters browse all Livefolio users?",
    a: "No. Hiring search is limited to applicants for each job. That keeps the product focused and respectful of candidate privacy.",
  },
  {
    q: "What’s free vs Org Pro?",
    a: "Free includes one company workspace and one open job at a time. Org Pro unlocks unlimited open jobs and workspaces.",
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

        <dl className="mt-10 space-y-6">
          {FAQS.map((item) => (
            <div key={item.q}>
              <dt className="text-h3 text-text-primary">{item.q}</dt>
              <dd className="mt-2 text-body-sm text-text-secondary">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}