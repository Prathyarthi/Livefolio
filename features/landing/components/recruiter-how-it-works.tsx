import { Briefcase, ListChecks, MousePointerClick, Search } from "lucide-react";
import { Card } from "@/components/ui/card";

const STEPS = [
  {
    icon: Briefcase,
    title: "Create a job",
    body: "Add role details and structured requirements so matching stays clear.",
  },
  {
    icon: MousePointerClick,
    title: "Candidates apply with Livefolio",
    body: "One click shares a job-specific snapshot of their living professional profile.",
  },
  {
    icon: Search,
    title: "Search that job’s applicants",
    body: "Filter and search only people who applied — never the whole Livefolio network.",
  },
  {
    icon: ListChecks,
    title: "Shortlist with evidence",
    body: "See tenure, skills, and proof against your requirements, then move pipeline stages.",
  },
] as const;

export function RecruiterHowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="recruiter-how-heading"
      className="scroll-mt-16 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">How it works</p>
          <h2
            id="recruiter-how-heading"
            className="mt-3 text-h1 text-text-primary"
          >
            From job post to shortlist
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            A focused hiring loop built on Livefolio identity — not another
            generic ATS or talent marketplace.
          </p>
        </div>

        <ol className="mt-[var(--space-6)] grid list-none grid-cols-1 gap-[var(--space-5)] p-0 sm:grid-cols-2">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title}>
              <Card className="h-full gap-0 p-[var(--space-5)] transition-all duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-border-strong">
                <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-fill/12">
                  <Icon className="h-6 w-6 text-brand-secondary" aria-hidden />
                </span>
                <p className="mt-5 font-mono text-xs font-medium uppercase tracking-wide text-text-muted">
                  Step {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-h3 text-text-primary">{title}</h3>
                <p className="mt-2 text-body-sm text-text-secondary">{body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
