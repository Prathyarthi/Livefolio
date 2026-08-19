import { FileText } from "lucide-react";
import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";
import { IntegrationCycle } from "@/features/landing/components/integration-cycle";
import { TransformRail } from "@/features/landing/components/transform-rail";
import { integrations, siteConfig } from "@/lib/site";

const PLATFORM_MARKS: Record<(typeof integrations)[number]["id"], string> = {
  github: "GH",
  medium: "M",
  leetcode: "LC",
};

function ResumeToPortfolio() {
  return (
    <div
      className="relative flex h-[240px] w-full max-w-md items-center justify-center max-[480px]:h-[200px]"
      aria-label="Animated preview: a resume transforming into a portfolio site, enriched with integrations"
      role="img"
    >
      <div className="folio-resume absolute left-2 top-1/2 w-[148px] -translate-y-1/2 rounded-[var(--radius-lg)] border border-border-default bg-surface-base p-3 shadow-[var(--shadow-card)]">
        <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
          <FileText className="h-3 w-3" aria-hidden />
          <span>resume.pdf</span>
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-3/4 rounded-full bg-surface-sunken" />
          <div className="h-1.5 w-full rounded-full bg-surface-sunken" />
          <div className="h-1.5 w-5/6 rounded-full bg-surface-sunken" />
          <div className="h-1.5 w-full rounded-full bg-surface-sunken" />
          <div className="h-1.5 w-2/3 rounded-full bg-surface-sunken" />
        </div>
      </div>

      <div className="folio-wand relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-brand-secondary font-mono text-xs font-bold text-white shadow-[var(--shadow-card)]">
        →
      </div>

      <div className="folio-portfolio absolute right-2 top-1/2 w-[168px] -translate-y-1/2 overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-base shadow-[var(--shadow-card)]">
        <div className="h-9 bg-brand-light" />
        <div className="-mt-4 px-3">
          <div className="h-8 w-8 rounded-full border-2 border-surface-base bg-brand-primary" />
          <div className="mt-2 space-y-1.5 pb-3">
            <div className="h-2 w-2/3 rounded-full bg-text-primary/80" />
            <div className="h-1.5 w-1/2 rounded-full bg-success" />
            <div className="mt-2 flex gap-1">
              {integrations.map((platform) => (
                <span
                  key={platform.id}
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-sunken font-mono text-[7px] font-bold text-text-muted"
                  title={platform.name}
                >
                  {PLATFORM_MARKS[platform.id]}
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex gap-1.5">
              <div className="h-4 w-10 rounded-[var(--radius-sm)] bg-brand-light" />
              <div className="h-4 w-8 rounded-[var(--radius-sm)] bg-surface-sunken" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-[var(--space-9)] pb-[var(--space-10)]">
      <div className="hero-blob" aria-hidden />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-3xl text-center">
          <TransformRail className="mx-auto mb-6 max-w-md justify-center" />

          <p className="eyebrow uppercase">Resume → portfolio</p>

          <h1 className="text-display mt-3 text-balance leading-none text-text-primary">
            <span className="block">Your resume<span className="text-brand-secondary">.</span></span>
            <span className="block -mt-1 md:-mt-2">Your portfolio<span className="text-brand-secondary">.</span> Done<span className="text-brand-secondary">.</span></span>
          </h1>

          <p className="prose-measure mx-auto mt-5 text-body-lg text-text-secondary">
            {siteConfig.taglinePrefix}
            <IntegrationCycle />
          </p>

          <AuthAwareCtas variant="candidate" className="mt-7 flex flex-wrap items-center justify-center gap-3" />
        </div>

        <div className="mx-auto mt-[var(--space-8)] flex max-w-md justify-center">
          <div className="w-full rounded-[var(--radius-xl)] border border-border-default bg-surface-raised p-2 shadow-[var(--shadow-card)]">
            <ResumeToPortfolio />
          </div>
        </div>
      </div>
    </section>
  );
}
