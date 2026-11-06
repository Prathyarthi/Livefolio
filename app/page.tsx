import type { Metadata } from "next";
import { Hero } from "@/features/landing/components/hero";
import { DomainClaim } from "@/features/landing/components/domain-claim";
import { SupademoTour } from "@/features/landing/components/supademo-tour";
import { Features } from "@/features/landing/components/features";
import { PeopleBrands } from "@/features/landing/components/people-brands";
import { Integrations } from "@/features/landing/components/integrations";
import { TemplateShowcase } from "@/features/landing/components/template-showcase";
import { Pricing } from "@/features/landing/components/pricing";
import { FAQ } from "@/features/landing/components/faq";
import { ContactSection } from "@/features/landing/components/contact-section";
import { CTA } from "@/features/landing/components/cta";
import { LandingNav } from "@/features/landing/components/landing-nav";
import { StudioShell } from "@/features/landing/components/studio-shell";
import { JsonLd } from "@/components/json-ld";
import { createPageMetadata } from "@/lib/seo";
import { getLandingPageStructuredData } from "@/lib/structured-data";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Build & Publish Your Professional Portfolio",
  description: siteConfig.description,
  path: "/",
});

export default function LandingPage() {
  return (
    <>
      <JsonLd data={getLandingPageStructuredData()} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-[var(--radius-md)] focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>

      <StudioShell>
        <LandingNav layout="pill" />

        <main id="main">
          <Hero />
          <DomainClaim />
          <Features />
          <PeopleBrands />
          <SupademoTour />
          <Integrations />
          <TemplateShowcase />
          <Pricing />
          <FAQ />
          <ContactSection />
          <CTA />
        </main>
      </StudioShell>
    </>
  );
}