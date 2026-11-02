const STEPS = [
  {
    title: "Create a job",
    body: "Add role details, required and preferred skills, and screening questions. We turn the description into a clear checklist for matching.",
  },
  {
    title: "Candidates apply with Livefolio",
    body: "One click shares a snapshot of their live portfolio: projects, code, writing and references.",
  },
  {
    title: "Search and compare",
    body: "Search in plain words, filter by skills, city, experience or proof, and compare candidates side by side. A pool gap report shows which requirements your applicants are missing.",
  },
  {
    title: "Shortlist and move them forward",
    body: "Shortlist, then move each person through New, Reviewing, Shortlisted, Interview, Offer, Hired or Rejected. Candidates see their status update.",
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
            Everything a small team needs to go from a job post to a hire, in one place.
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
