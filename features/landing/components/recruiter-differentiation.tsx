import { BadgeCheck, Lock, Snowflake } from "lucide-react";
import { RecruiterSection } from "@/features/landing/components/recruiter-section";

const POINTS = [
  {
    icon: Snowflake,
    title: "Frozen snapshots",
    body: "What you review is captured at apply time. Profiles can't quietly change afterwards.",
  },
  {
    icon: Lock,
    title: "Job-scoped pools",
    body: "Each job has its own applicant pool. Talent search only shows people who opted in.",
  },
  {
    icon: BadgeCheck,
    title: "Verified companies",
    body: "Hiring teams verify with a work email on their own domain, so candidates know you're real.",
  },
] as const;

export function RecruiterDifferentiation() {
  return (
    <RecruiterSection
      id="trust"
      index="4.0"
      label="Trust"
      title={
        <>
          Data both sides
          <br />
          can trust.
        </>
      }
    >
      <ul className="grid gap-px overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-border-default md:grid-cols-3">
        {POINTS.map((p) => (
          <li key={p.title} className="bg-surface-base p-6">
            <p.icon className="h-4 w-4 text-brand-secondary" aria-hidden />
            <h3 className="mt-4 text-body font-semibold text-text-primary">{p.title}</h3>
            <p className="mt-1 text-body-sm text-text-secondary">{p.body}</p>
          </li>
        ))}
      </ul>
    </RecruiterSection>
  );
}
