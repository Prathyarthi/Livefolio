import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { RecruiterShortlistDemo } from "@/features/landing/components/recruiter-shortlist-demo";

export function RecruiterHero() {
  return (
    <section className="relative overflow-x-clip px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-12 md:pb-14 md:pt-14">
      <div className="relative z-[1] mx-auto w-full max-w-[40rem] text-center">
        <p className="eyebrow uppercase">Hire with Livefolio</p>

        <h1 className="studio-hero-title mt-4 text-text-primary">
          <span className="block">
            Hire on{" "}
            <span className="studio-hero-highlight">proven impact</span>,
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

      <figure
        id="ranked-shortlist"
        className="relative z-[1] mx-auto mt-8 w-full max-w-[1040px] scroll-mt-24 sm:mt-10 md:mt-12"
      >
        <RecruiterShortlistDemo />
        <figcaption className="mt-1 text-center text-xs text-text-secondary">
          Sample applicants. Turning on references re-ranks the shortlist.
        </figcaption>
      </figure>
    </section>
  );
}
