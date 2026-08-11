import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";

export function RecruiterCTA() {
  return (
    <section className="px-6 py-[var(--space-9)]">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[var(--radius-xl)] bg-brand-light px-6 py-[var(--space-8)] text-center">
        <div className="hero-blob" aria-hidden />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-h1 text-text-primary">
            Start hiring with Livefolio
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body-lg text-text-secondary">
            Create a workspace, publish your first role free, and receive Apply
            with Livefolio applications.
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