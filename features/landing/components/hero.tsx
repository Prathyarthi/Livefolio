import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { IntegrationCycle } from "@/features/landing/components/integration-cycle";
import { HeroPlatformStrip } from "@/features/landing/components/platform-proof";
import { siteConfig } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative px-4 pb-10 pt-4 sm:px-6 sm:pb-12 sm:pt-6 md:pb-14 md:pt-8">
      <div className="relative z-[1] mx-auto w-full max-w-[40rem] text-center">
        <p className="eyebrow uppercase">Resume → portfolio</p>

        {/*
          Intentional two-line headline on all breakpoints (matches reference
          rhythm). Terracotta phrase always starts the second line.
        */}
        <h1 className="studio-hero-title mt-3 text-text-primary">
          <span className="block">Your resume becomes</span>
          <span className="block">
            a <span className="text-brand-secondary">living portfolio</span>
            <span className="text-brand-secondary">.</span>
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-[34rem] text-body text-text-secondary sm:text-body-lg">
          {siteConfig.taglinePrefix}
          <IntegrationCycle />
        </p>

        <AuthAwareCtas
          variant="candidate"
          className="mt-6 flex flex-col items-stretch justify-center gap-2.5 sm:flex-row sm:items-center sm:flex-wrap"
        />

        <HeroPlatformStrip />
      </div>
    </section>
  );
}
