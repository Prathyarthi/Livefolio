import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { HeroFloatingIntegrations } from "@/features/landing/components/hero-floating-integrations";
import { IntegrationCycle } from "@/features/landing/components/integration-cycle";
import { HeroPlatformStrip } from "@/features/landing/components/platform-proof";
import { siteConfig } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative overflow-x-clip px-4 pb-10 pt-20 sm:px-6 sm:pb-12 sm:pt-40 md:pb-40 md:pt-40">
      {/*
        Wider stage so floating tiles sit beside copy without colliding.
        Inner measure keeps headline readable.
      */}
      <div className="relative z-[1] mx-auto w-full max-w-[70rem]">
        <HeroFloatingIntegrations />

        <div className="relative z-[1] mx-auto w-full max-w-[40rem] text-center">
          <p className="eyebrow uppercase">Resume → portfolio</p>

          <h1 className="text-7xl font-bold mt-4 text-text-primary">
            <span className="block">Your resume becomes</span>
            <span className="block">
              a{" "}
              <span className="font-bold studio-hero-highlight">living portfolio</span>
              <span className="text-brand-secondary">.</span>
            </span>
          </h1>

          <p className="studio-lead mx-auto mt-5 max-w-[36rem] text-text-secondary">
            {siteConfig.taglinePrefix}
            <IntegrationCycle />
          </p>

          <AuthAwareCtas
            variant="candidate"
            size="default"
            studio
            className="studio-cta mt-7 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center sm:flex-wrap"
          />
        </div>
      </div>

      <HeroPlatformStrip />
    </section>
  );
}
