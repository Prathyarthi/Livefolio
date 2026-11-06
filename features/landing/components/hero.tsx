import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { IntegrationCycle } from "@/features/landing/components/integration-cycle";
import { HeroPlatformStrip } from "@/features/landing/components/platform-proof";
import { siteConfig } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 md:pb-14 md:pt-10">
      {/*
        Decorative mountain photo (Unsplash / Daniel Seßler) — see
        public/landing/PROVENANCE.md. Fades into cream / charcoal via CSS.
      */}
      <div className="studio-hero-backdrop" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/landing/hero-mountains.jpg"
          alt=""
          width={1400}
          height={934}
          decoding="async"
          fetchPriority="high"
        />
      </div>

      <div className="relative z-[1] mx-auto w-full max-w-[40rem] text-center">
        <p className="eyebrow uppercase">Resume → portfolio</p>

        <h1 className="studio-hero-title mt-3 text-text-primary">
          <span className="block sm:inline">Your resume becomes</span>
          <span className="hidden sm:inline"> </span>
          <span className="block sm:inline">
            a{" "}
            <span className="text-brand-secondary">living portfolio</span>
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
