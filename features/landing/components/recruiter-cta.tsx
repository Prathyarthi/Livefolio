import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";

export function RecruiterCTA() {
  return (
    <section className="px-6 py-[var(--space-9)]">
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-surface-raised px-6 py-[var(--space-8)] text-center shadow-[var(--shadow-card)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-fill" aria-hidden />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-h1 text-text-primary">
            Start hiring with Livefolio
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body-lg text-text-secondary">
            Create an organization, add workspaces for each hiring team, and
            publish your first role free.
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
