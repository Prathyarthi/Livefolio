import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { IntegrationCycle } from "@/features/landing/components/integration-cycle";
import { siteConfig } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative px-1 pb-12 pt-10 sm:pb-14 sm:pt-14 md:pb-16 md:pt-16">
      <div className="mx-auto w-full max-w-[765px] text-center">
        <p className="eyebrow uppercase">Resume → portfolio</p>

        <h1 className="mt-4 text-balance text-[2rem] font-semibold leading-[1.12] tracking-[-0.03em] text-text-primary sm:text-[2.5rem] md:text-[2.75rem]">
          Your resume becomes a{" "}
          <span className="text-brand-secondary">living portfolio</span>
          <span className="text-brand-secondary">.</span>
        </h1>

        <p className="prose-measure mx-auto mt-5 text-body-lg text-text-secondary">
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
