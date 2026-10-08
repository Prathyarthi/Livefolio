import { Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";

const POINTS = [
  {
    icon: ShieldCheck,
    title: "Job-scoped pools",
    body: "Recruiters search applicants for a specific role — not every Livefolio user by default.",
  },
  {
    icon: Lock,
    title: "Frozen application snapshots",
    body: "What you evaluate is captured at apply time, even if the candidate updates their profile later.",
  },
  {
    icon: Fingerprint,
    title: "Evidence over keywords",
    body: "Requirements map to experience, skills, and projects so shortlists are grounded in proof.",
  },
] as const;

export function RecruiterDifferentiation() {
  return (
    <section
      id="why-livefolio"
      aria-labelledby="recruiter-why-heading"
      className="scroll-mt-16 border-y border-border-default bg-surface-sunken/55 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">Why Livefolio</p>
          <h2
            id="recruiter-why-heading"
            className="mt-3 text-h1 text-text-primary"
          >
            Built for evidence-based hiring
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            Identity, proof, and a scoped applicant pool — not another resume
            inbox.
          </p>
        </div>

        <ul
          className="mt-[var(--space-6)] grid gap-[var(--space-5)]"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <Card className="h-full gap-0 p-[var(--space-5)] transition-all duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-border-strong">
                <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-fill/12">
                  <Icon className="h-6 w-6 text-brand-secondary" aria-hidden />
                </span>
                <h3 className="mt-5 text-h3 text-text-primary">{title}</h3>
                <p className="mt-2 text-body-sm text-text-secondary">{body}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
