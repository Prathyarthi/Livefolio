import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { RecruiterAppMockup } from "@/features/landing/components/recruiter-app-mockup";

export function RecruiterHero() {
  return (
    <section className="relative overflow-hidden px-6 pt-20 md:pt-28">
      <div className="hero-blob" aria-hidden />
      <div className="relative mx-auto max-w-[1120px]">
        <div className="mx-auto max-w-4xl text-center">
          <a
            href="#references"
            className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-raised px-3 py-1 text-xs text-text-secondary transition-colors hover:text-text-primary"
          >
            <span className="font-medium text-brand-secondary">New</span>
            Reference-based hiring →
          </a>
          <h1 className="mt-6 bg-gradient-to-b from-text-primary to-text-secondary bg-clip-text text-balance text-5xl font-semibold leading-[1.02] tracking-tighter text-transparent sm:text-6xl md:text-7xl">
            Hire on proof and references, not resume keywords
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-text-secondary">
            Post a role free. Candidates apply in one click with a live
            portfolio. You get a ranked shortlist that explains itself.
          </p>
          <AuthAwareCtas
            variant="recruiter"
            size="default"
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          />
        </div>

        <div
          id="ranked-shortlist"
          className="relative mx-auto mt-16 max-w-[1040px] scroll-mt-20 [perspective:2000px] md:mt-20"
        >
          <div
            className="pointer-events-none absolute -inset-x-10 -top-10 bottom-0 rounded-full bg-brand-secondary/15 blur-3xl"
            aria-hidden
          />
          <div className="relative md:[transform:rotateX(8deg)] md:origin-top">
            <RecruiterAppMockup />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-base to-transparent"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
