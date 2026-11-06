import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";

export function RecruiterCTA() {
  return (
    <section className="studio-dot-divider px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-none text-center">
        <div className="rounded-[var(--radius-xl)] border border-border-default bg-surface-raised px-6 py-10 sm:px-10 sm:py-12">
          <h2 className="text-h1 font-semibold tracking-[-0.03em] text-text-primary">
            Start hiring on proof
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            Post a role free. Ranked shortlists and reference-backed profiles —
            no keyword theatre.
          </p>
          <AuthAwareCtas
            variant="recruiter"
            size="default"
            studio
            className="studio-cta mt-7 flex flex-wrap items-center justify-center gap-3"
          />
        </div>
      </div>
    </section>
  );
}
