import { Badge } from "@/components/ui/badge";
import { BentoCard, RecruiterSection } from "@/features/landing/components/recruiter-section";

const FIELDS = [
  ["Skills list", "1.00"],
  ["Projects, articles", "0.85"],
  ["Work experience", "0.70"],
  ["Headline", "0.55"],
  ["Passing mention", "0.25"],
] as const;

const PROOF = [
  ["Live project link", "1.00"],
  ["Source code", "0.90"],
  ["Article with URL", "0.85"],
  ["GitHub / LeetCode profile", "0.75"],
] as const;

const BARS = [3, 6, 2, 8, 5, 9, 4, 7, 6, 10, 8, 5, 7, 9];

export function RecruiterHowWeRank() {
  return (
    <RecruiterSection
      id="how-we-rank"
      index="1.0"
      label="Ranking"
      title={
        <>
          A score you can read.
          <br />
          Not a black box.
        </>
      }
      body="Every applicant gets a score from 0 to 100 against your job, with up to four plain reasons."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <BentoCard
          title="Skill match"
          body="A skill in the skills list counts more than one mentioned in passing."
        >
          <ul className="space-y-2">
            {FIELDS.map(([label, w]) => (
              <li key={label} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{label}</span>
                <span className="font-mono text-text-primary">{w}</span>
              </li>
            ))}
          </ul>
        </BentoCard>
        <BentoCard
          title="Proof of work"
          body="Shipped links count most. Years of experience are a filter, not a bonus."
        >
          <ul className="space-y-2">
            {PROOF.map(([label, w]) => (
              <li key={label} className="flex items-center justify-between gap-2 text-xs">
                <Badge variant="secondary" className="text-[11px]">{label}</Badge>
                <span className="font-mono text-text-primary">{w}</span>
              </li>
            ))}
          </ul>
        </BentoCard>
        <BentoCard
          title="Coding activity, when it matters"
          body="GitHub and LeetCode count for engineering roles only. Sales or design roles aren't penalised."
        >
          <p className="text-xs text-text-secondary">GitHub · last 90 days (demo)</p>
          <div className="mt-3 flex h-20 items-end gap-1">
            {BARS.map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm bg-brand-secondary/70"
                style={{ height: `${h * 10}%` }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-text-secondary">LeetCode · 45 hard / 120 medium (demo)</p>
        </BentoCard>
      </div>
    </RecruiterSection>
  );
}
