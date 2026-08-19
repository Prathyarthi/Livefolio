const STEPS = [
  {
    title: "Create a job",
    body: "Add role details and structured requirements so matching stays clear.",
  },
  {
    title: "Candidates apply with Livefolio",
    body: "One click shares a job-specific snapshot of their living professional profile.",
  },
  {
    title: "Search that job’s applicants",
    body: "Filter and search only people who applied — never the whole Livefolio network.",
  },
  {
    title: "Shortlist with evidence",
    body: "See tenure, skills, and proof against your requirements, then move pipeline stages.",
  },
] as const;

export function RecruiterHowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="recruiter-how-heading"
      className="px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">How it works</p>
          <h2
            id="recruiter-how-heading"
            className="mt-2 text-h2 text-text-primary"
          >
            From job post to shortlist
          </h2>
          <p className="mt-3 text-body text-text-secondary">
            A focused hiring loop built on Livefolio identity — not another
            generic ATS or talent marketplace.
          </p>
        </div>

        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="space-y-2">
              <p className="font-mono text-sm font-semibold text-brand-secondary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="text-h3 text-text-primary">{step.title}</h3>
              <p className="text-body-sm text-text-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
