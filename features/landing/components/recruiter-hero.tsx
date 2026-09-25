import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";

function HiringLoopPreview() {
  return (
    <div
      className="mx-auto mt-[var(--space-8)] w-full max-w-3xl"
      aria-label="Hiring loop: post a job, collect Livefolio applications, shortlist with evidence"
      role="img"
    >
      <div className="rounded-[var(--radius-xl)] border border-border-default bg-surface-raised p-3 shadow-[var(--shadow-card)] sm:p-4">
        <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-base p-4 text-left">
            <p className="text-label uppercase text-text-muted">Open role</p>
            <p className="mt-2 font-medium text-text-primary">Senior Engineer</p>
            <p className="mt-1 text-body-sm text-text-secondary">
              Remote · Full-time
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["React", "Node", "5+ yrs"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-brand-fill/12 px-2 py-0.5 text-[11px] font-medium text-brand-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <span
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-fill font-mono text-xs font-bold text-brand-on-fill"
            aria-hidden
          >
            →
          </span>

          <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-base p-4 text-left">
            <p className="text-label uppercase text-text-muted">Application</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-brand-primary" aria-hidden />
              <div>
                <p className="text-body-sm font-medium text-text-primary">
                  Livefolio snapshot
                </p>
                <p className="text-xs text-text-muted">Frozen at apply time</p>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-surface-sunken" />
              <div className="h-1.5 w-4/5 rounded-full bg-surface-sunken" />
            </div>
          </div>

          <span
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-brand-fill font-mono text-xs font-bold text-brand-on-fill"
            aria-hidden
          >
            →
          </span>

          <div className="rounded-[var(--radius-lg)] border border-border-default bg-surface-base p-4 text-left">
            <p className="text-label uppercase text-text-muted">Shortlist</p>
            <p className="mt-2 font-medium text-text-primary">Evidence match</p>
            <ul className="mt-3 space-y-1.5 text-body-sm text-text-secondary">
              <li className="flex items-center gap-2">
                <span className="text-brand-secondary" aria-hidden>
                  ✓
                </span>
                React production tenure
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-secondary" aria-hidden>
                  ✓
                </span>
                Shipped systems proof
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecruiterHero() {
  return (
    <section className="relative overflow-hidden px-6 pt-[var(--space-9)] pb-[var(--space-10)]">
      <div className="hero-blob" aria-hidden />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow uppercase">Hiring with Livefolio</p>

          <h1 className="mt-3 text-display text-balance leading-none text-text-primary">
            <span className="block">
              Hire from real work
              <span className="text-brand-secondary">.</span>
            </span>
            <span className="block -mt-1 md:-mt-2">
              Not just resumes
              <span className="text-brand-secondary">.</span>
            </span>
          </h1>

          <p className="prose-measure mx-auto mt-5 text-body-lg text-text-secondary">
            Post a role, collect Apply with Livefolio applications, and shortlist
            candidates from evidence in their professional identity — scoped to
            that job&apos;s applicant pool.
          </p>

          <AuthAwareCtas
            variant="recruiter"
            className="mt-7 flex flex-wrap items-center justify-center gap-3"
          />
        </div>

        <HiringLoopPreview />
      </div>
    </section>
  );
}
