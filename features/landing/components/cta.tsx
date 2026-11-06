import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";

export function CTA() {
  return (
    <section className="py-14 sm:py-16">
      <div className="mx-auto w-full max-w-none">
        <div className="rounded-[var(--radius-xl)] border border-border-default bg-surface-raised px-6 py-10 text-center sm:px-10 sm:py-12">
          <h2 className="text-h1 text-text-primary">
            Build your portfolio today
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body-lg text-text-secondary">
            Upload your resume, go live in minutes — then connect integrations to
            keep it current.
          </p>
          <AuthAwareCtas
            variant="candidate"
            size="default"
            studio
            className="studio-cta mt-7 flex flex-wrap items-center justify-center gap-3"
          />
        </div>
      </div>
    </section>
  );
}
