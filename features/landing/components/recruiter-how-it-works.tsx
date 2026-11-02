import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BentoCard, RecruiterSection } from "@/features/landing/components/recruiter-section";

const GAPS = [
  ["React", 82],
  ["Node", 64],
  ["Kubernetes", 18],
] as const;

const STAGES = [
  ["New", 12],
  ["Reviewing", 6],
  ["Shortlisted", 3],
  ["Interview", 2],
  ["Offer", 1],
] as const;

export function RecruiterHowItWorks() {
  return (
    <RecruiterSection
      id="how-it-works"
      index="3.0"
      label="Workflow"
      title={
        <>
          From job post
          <br />
          to hire.
        </>
      }
      body="Post a role with screening questions. Candidates apply in one click. Search, compare and move them forward."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <BentoCard
          title="Compare side by side"
          body="Put shortlisted candidates next to each other, requirement by requirement."
        >
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-border-default text-xs">
            {["", "Asha (demo)", "Meera (demo)", "React", "✓", "✓", "Node", "✓", "✓", "References", "—", "2"].map(
              (cell, i) => (
                <span key={i} className="truncate bg-surface-base px-2 py-1.5 text-text-secondary">
                  {cell}
                </span>
              ),
            )}
          </div>
        </BentoCard>
        <BentoCard
          title="Pool gap report"
          body="See which requirements your applicant pool is missing."
        >
          <ul className="space-y-3">
            {GAPS.map(([label, value]) => (
              <li key={label} className="text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>{label}</span>
                  <span className="font-mono">{value}%</span>
                </div>
                <Progress value={value} className="mt-1 h-1.5" />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-text-secondary">Demo data</p>
        </BentoCard>
        <BentoCard
          title="Pipeline"
          body="New, Reviewing, Shortlisted, Interview, Offer, Hired or Rejected. Candidates see their status."
        >
          <div className="flex flex-wrap gap-2">
            {STAGES.map(([label, n]) => (
              <Badge key={label} variant="outline" className="gap-1.5 text-[11px]">
                {label}
                <span className="font-mono text-text-secondary">{n}</span>
              </Badge>
            ))}
          </div>
        </BentoCard>
        <BentoCard
          title="Talent search"
          body="Find people who opted in to be found, ranked the same way. Opting in is never shown publicly."
        >
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border-default bg-surface-base px-3 py-2 text-xs text-text-secondary">
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">react engineer in Bangalore, 3 years</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["React", "Bangalore", "3–5 years", "Live work"].map((c) => (
              <Badge key={c} variant="secondary" className="text-[11px]">{c}</Badge>
            ))}
          </div>
        </BentoCard>
      </div>
    </RecruiterSection>
  );
}
