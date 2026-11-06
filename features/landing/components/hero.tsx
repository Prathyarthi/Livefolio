import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { IntegrationCycle } from "@/features/landing/components/integration-cycle";
import { siteConfig } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative pb-14 pt-12 sm:pb-16 sm:pt-16 md:pb-20 md:pt-20">
      <div className="mx-auto w-full max-w-[45ch] text-center md:max-w-[48ch]">
        <p className="eyebrow uppercase">Resume → portfolio</p>

        <h1 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.15] tracking-[-0.03em] text-text-primary sm:text-[2.5rem] md:text-[2.75rem]">
          Your resume becomes a{" "}
          <span className="text-brand-secondary">living portfolio</span>
          <span className="text-brand-secondary">.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-[56ch] text-body-lg text-text-secondary">
          {siteConfig.taglinePrefix}
          <IntegrationCycle />
        </p>

        <AuthAwareCtas
          variant="candidate"
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        />
      </div>
    </section>
  );
}
