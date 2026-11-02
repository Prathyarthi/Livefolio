const POINTS = [
  {
    title: "Frozen application snapshots",
    body: "What you evaluate is captured at apply time, so a profile can't quietly change after someone applies.",
  },
  {
    title: "Job-scoped pools",
    body: "Each job has its own applicant pool. Talent search only shows people who chose to be found.",
  },
  {
    title: "Verified companies",
    body: "Hiring teams verify their company with a work email on their own domain, so candidates know the employer is real.",
  },
] as const;

export function RecruiterDifferentiation() {
  return (
    <section
      id="trust"
      aria-labelledby="recruiter-why-heading"
      className="border-y border-border-default bg-surface-sunken/40 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">Trust</p>
          <h2
            id="recruiter-why-heading"
            className="mt-2 text-h2 text-text-primary"
          >
            Data both sides can trust
          </h2>
        </div>

        <ul className="mx-auto mt-10 grid max-w-4xl gap-8 md:grid-cols-3">
          {POINTS.map((point) => (
            <li key={point.title} className="space-y-2 text-center md:text-left">
              <h3 className="text-h3 text-text-primary">{point.title}</h3>
              <p className="text-body-sm text-text-secondary">{point.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}