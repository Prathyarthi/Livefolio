import { Logo } from "@/components/logo";
import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { DEMO_APPLICANTS } from "@/features/landing/components/recruiter-demo-data";
import { RecruiterRankedCard } from "@/features/landing/components/recruiter-ranked-card";

const heroApplicant = DEMO_APPLICANTS[1]!;

export function RecruiterHero() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden px-6 py-[var(--space-9)]">
      <div className="hero-blob" aria-hidden />

      <div className="relative mx-auto grid w-full max-w-[1200px] items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div className="min-w-0 text-center lg:text-left">
          <div className="mb-6 flex justify-center lg:justify-start">
            <Logo className="scale-110" />
          </div>

          <p className="eyebrow uppercase">Hiring with Livefolio</p>

          <h1 className="text-display mt-3 text-balance leading-none text-text-primary">
            Hire on proof and references
            <span className="text-brand-secondary">,</span> not resume keywords
            <span className="text-brand-secondary">.</span>
          </h1>

          <p className="prose-measure mx-auto mt-5 text-body-lg text-text-secondary lg:mx-0">
            Post a role free. Candidates apply in one click with a live
            portfolio. You get a ranked shortlist that explains itself: a score
            from 0 to 100, the reasons behind it, and named references from
            people who worked with them.
          </p>

          <AuthAwareCtas
            variant="recruiter"
            className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          />
        </div>

        <div className="relative mx-auto w-full min-w-0 max-w-md">
          <p className="mb-2 text-center text-xs text-text-secondary lg:text-left">
            Example applicant card · demo data
          </p>
          <RecruiterRankedCard
            name={heroApplicant.name}
            headline={heroApplicant.headline}
            score={89}
            addedPoints={9}
            reasons={[
              "Reference: a manager vouched for React work",
              ...heroApplicant.reasons,
            ]}
            proof={heroApplicant.proof}
            referenceCount={heroApplicant.references.length}
            className="shadow-lg"
          />
        </div>
      </div>
    </section>
  );
}
