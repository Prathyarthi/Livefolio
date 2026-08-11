import { Logo } from "@/components/logo";
import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";

export function RecruiterHero() {
  return (
    <section className="relative overflow-hidden px-6 pt-[var(--space-9)] pb-[var(--space-10)]">
      <div className="hero-blob" aria-hidden />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <Logo className="scale-110" />
          </div>

          <p className="eyebrow uppercase">Hiring with Livefolio</p>

          <h1 className="text-display mt-3 text-balance leading-none text-text-primary">
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
      </div>
    </section>
  );
}
