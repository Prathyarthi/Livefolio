import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { HeroFloatingIntegrations } from "@/features/landing/components/hero-floating-integrations";
import { IntegrationCycle } from "@/features/landing/components/integration-cycle";
import { HeroPlatformStrip } from "@/features/landing/components/platform-proof";
import { siteConfig } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative overflow-x-clip px-4 pb-10 pt-10 sm:px-6 sm:pb-12 sm:pt-12 md:pb-14 md:pt-14">
      {/*
        Wider stage so floating tiles sit beside copy without colliding.
        Inner measure keeps headline readable.
      */}
      <div className="relative z-[1] mx-auto w-full max-w-[52rem]">
        <HeroFloatingIntegrations />

        <div className="relative z-[1] mx-auto w-full max-w-[40rem] text-center">
          <p className="eyebrow uppercase">Resume → portfolio</p>

          <h1 className="studio-hero-title mt-4 text-text-primary">
            <span className="block">Your resume becomes</span>
            <span className="block">
              a{" "}
              <span className="studio-hero-highlight">living portfolio</span>
              <span className="studio-hero-highlight-dot">.</span>
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-[34rem] text-body text-text-secondary sm:text-body-lg">
            {siteConfig.taglinePrefix}
            <IntegrationCycle />
          </p>

          <AuthAwareCtas
            variant="candidate"
            size="default"
            studio
            className="studio-cta mt-7 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center sm:flex-wrap"
          />

          <HeroPlatformStrip />
        </div>
      </div>
    </section>
  );
}
