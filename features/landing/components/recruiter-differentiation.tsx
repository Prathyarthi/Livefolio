const POINTS = [
  {
    title: "Job-scoped pools",
    body: "Recruiters search applicants for a specific role — not every Livefolio user by default.",
  },
  {
    title: "Frozen application snapshots",
    body: "What you evaluate is captured at apply time, even if the candidate updates their profile later.",
  },
  {
    title: "Evidence over keywords",
    body: "Requirements map to experience, skills, and projects so shortlists are grounded in proof.",
  },
] as const;

export function RecruiterDifferentiation() {
  return (
    <section
      id="why-livefolio"
      aria-labelledby="recruiter-why-heading"
      className="border-y border-border-default bg-surface-sunken/40 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">Why Livefolio</p>
          <h2
            id="recruiter-why-heading"
            className="mt-2 text-h2 text-text-primary"
          >
            Built for evidence-based hiring
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