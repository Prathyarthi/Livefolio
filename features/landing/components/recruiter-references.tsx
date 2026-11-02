"use client";

import { useId, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DEMO_APPLICANTS,
  DEMO_TERMS,
} from "@/features/landing/components/recruiter-demo-data";
import { RecruiterRankedCard } from "@/features/landing/components/recruiter-ranked-card";
import {
  REFERENCE_SCORE_POINTS,
  referenceScore,
} from "@/features/search/lib/references";

const STEPS = [
  {
    title: "The candidate asks",
    body: "They send a private link to a manager, peer, founder or collaborator.",
  },
  {
    title: "The referee signs in",
    body: "With GitHub or Google. No anonymous praise, and nobody can vouch for themselves.",
  },
  {
    title: "One real story",
    body: "They pick how they know the candidate and share one specific story. It takes under a minute.",
  },
  {
    title: "You decide if it counts",
    body: "References always show on the applicant. Turn on Include references and they can add up to 12 points.",
  },
] as const;

export function RecruiterReferences() {
  const [include, setInclude] = useState(false);
  const switchId = useId();

  const ranked = useMemo(() => {
    return DEMO_APPLICANTS.map((applicant) => {
      const { score } = referenceScore(applicant.references, DEMO_TERMS);
      const added = include ? Math.round(score * REFERENCE_SCORE_POINTS) : 0;
      return {
        ...applicant,
        added,
        total: Math.min(100, applicant.livefolio + added),
      };
    }).sort((a, b) => b.total - a.total);
  }, [include]);

  return (
    <section
      id="ranked-shortlist"
      aria-labelledby="recruiter-references-heading"
      className="scroll-mt-20 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">References you can trust</p>
          <h2
            id="recruiter-references-heading"
            className="mt-2 text-h2 text-text-primary"
          >
            Hire people others will vouch for
          </h2>
          <p className="mt-3 text-body text-text-secondary">
            Named references from people who actually worked with the
            candidate, built into every application.
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

        <div className="mt-12 rounded-[var(--radius-xl)] border border-border-default bg-surface-raised p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-h3 text-text-primary">
                Demo shortlist: React + Node engineer
              </p>
              <p className="text-body-sm text-text-secondary">
                Fake applicants. Flip the switch to see references re-rank them.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={switchId}
                checked={include}
                onCheckedChange={setInclude}
              />
              <Label htmlFor={switchId}>Include references</Label>
            </div>
          </div>

          <ol className="mt-6 grid gap-4 lg:grid-cols-3">
            {ranked.map((applicant, index) => (
              <li key={applicant.id}>
                <RecruiterRankedCard
                  rank={index + 1}
                  name={applicant.name}
                  headline={applicant.headline}
                  score={applicant.total}
                  addedPoints={applicant.added}
                  reasons={
                    applicant.added > 0
                      ? [
                          `Reference: ${applicant.references.length > 1 ? "two working references" : "a manager"} vouched (+${applicant.added})`,
                          ...applicant.reasons,
                        ].slice(0, 4)
                      : applicant.reasons
                  }
                  proof={applicant.proof}
                  referenceCount={applicant.references.length}
                  className="h-full"
                />
              </li>
            ))}
          </ol>

          <p className="mt-4 text-xs text-text-secondary">
            Off: the card shows the Livefolio score only. On: references add 0–12
            points on top, by relationship and by whether the story mentions
            what you&apos;re hiring for. Scores never go down and cap at 100.
          </p>
        </div>
      </div>
    </section>
  );
}
