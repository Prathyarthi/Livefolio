import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { RecruiterAppMockup } from "@/features/landing/components/recruiter-app-mockup";

export function RecruiterHero() {
  return (
    <section className="relative overflow-x-clip px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-12 md:pb-14 md:pt-14">
      <div className="relative z-[1] mx-auto w-full max-w-[40rem] text-center">
        <p className="eyebrow uppercase">Hire with Livefolio</p>

        <h1 className="studio-hero-title mt-4 text-text-primary">
          <span className="block">
            Hire on{" "}
            <span className="studio-hero-highlight">proof and references</span>,
          </span>
          <span className="block">not resume keywords</span>
        </h1>

        <p className="mx-auto mt-5 max-w-[34rem] text-body text-text-secondary sm:text-body-lg">
          Post a role free. Candidates apply in one click with a live portfolio.
          You get a ranked shortlist that explains itself.
        </p>

        <AuthAwareCtas
          variant="recruiter"
          size="default"
          studio
          className="studio-cta mt-7 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center sm:flex-wrap"
        />
      </div>

      <div
        id="ranked-shortlist"
        className="relative z-[1] mx-auto mt-12 w-full max-w-[1040px] scroll-mt-24 px-0 sm:mt-14 md:mt-16 [perspective:2000px]"
      >
        <div
          className="pointer-events-none absolute -inset-x-6 -top-8 bottom-0 rounded-full bg-brand-secondary/12 blur-3xl"
          aria-hidden
        />
        <div className="relative md:origin-top md:[transform:rotateX(8deg)]">
          <RecruiterAppMockup />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface-base to-transparent"
          aria-hidden
        />
      </div>
    </section>
  );
}
