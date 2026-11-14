import { LogIn, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BentoCard, RecruiterSection } from "@/features/landing/components/recruiter-section";

const WEIGHTS = [
  ["Founder or manager", "1.00"],
  ["Collaborator", "0.80"],
  ["Peer", "0.75"],
  ["Direct report", "0.60"],
  ["Other", "0.30"],
] as const;

export function RecruiterReferences() {
  return (
    <RecruiterSection
      id="references"
      index="2.0"
      label="References"
      title={
        <>
          Hire people others
          <br />
          will vouch for.
        </>
      }
      body="Named references from people who actually worked with the candidate. You choose whether they count."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <BentoCard
          title="The candidate asks"
          body="A private link goes to a manager, peer, founder or collaborator."
        >
          <div className="rounded-[var(--radius-md)] border border-border-default bg-surface-base p-3 text-xs">
            <p className="text-text-secondary">To: demo.manager@example.com</p>
            <p className="mt-2 text-text-primary">
              Could you vouch for my work on the checkout rebuild?
            </p>
          </div>
        </BentoCard>
        <BentoCard
          title="The referee signs in"
          body="With GitHub or Google, then shares one real story. No anonymous praise, no self-vouching."
        >
          <div className="space-y-2 rounded-[var(--radius-md)] border border-border-default bg-surface-base p-3 text-xs">
            <div className="flex items-center gap-2 text-text-secondary">
              <LogIn className="h-3.5 w-3.5" aria-hidden /> Signed in · Demo manager
            </div>
            <Badge variant="brand" className="text-[11px]">Manager</Badge>
            <p className="flex gap-1.5 text-text-primary">
              <Quote className="h-3 w-3 shrink-0 text-brand-secondary" aria-hidden />
              Rebuilt our React checkout and cut load time in half.
            </p>
          </div>
        </BentoCard>
        <BentoCard
          title="You decide if it counts"
          body="Turn on Include references and they add up to 12 points, by relationship and whether the story matches your job."
        >
          <ul className="space-y-2">
            {WEIGHTS.map(([label, w]) => (
              <li key={label} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{label}</span>
                <span className="font-mono text-text-primary">{w}</span>
              </li>
            ))}
          </ul>
        </BentoCard>
      </div>
    </RecruiterSection>
  );
}
