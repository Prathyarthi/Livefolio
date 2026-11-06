import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { IntegrationCycle } from "@/features/landing/components/integration-cycle";
import { siteConfig } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 md:pb-20 md:pt-20">
      {/*
        Desktop text measure ~700px (43.75rem) — not a tight ch column that
        forces a four-line headline and stacked CTAs. Mobile stays full width
        of the padded shell.
      */}
      <div className="mx-auto w-full max-w-[43.75rem] text-center">
        <p className="eyebrow uppercase">Resume → portfolio</p>

        <h1 className="mt-4 text-pretty text-[2rem] font-semibold leading-[1.2] tracking-[-0.03em] text-text-primary sm:text-[2.5rem] md:text-[2.75rem] md:leading-[1.18]">
          <span className="block md:inline">Your resume becomes</span>
          <span className="hidden md:inline"> </span>
          <span className="block md:inline">
            a <span className="text-brand-secondary">living portfolio</span>
            <span className="text-brand-secondary">.</span>
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-[36rem] text-body-lg text-text-secondary">
          {siteConfig.taglinePrefix}
          <IntegrationCycle />
        </p>

        <AuthAwareCtas
          variant="candidate"
          className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:flex-wrap"
        />
      </div>
    </section>
  );
}
