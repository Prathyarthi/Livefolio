import type { Metadata } from "next";
import { Hero } from "@/features/landing/components/hero";
import { SupademoTour } from "@/features/landing/components/supademo-tour";
import { CompanyShowcase } from "@/features/landing/components/company-showcase";
import { Features } from "@/features/landing/components/features";
import { Integrations } from "@/features/landing/components/integrations";
import { TemplateShowcase } from "@/features/landing/components/template-showcase";
import { Pricing } from "@/features/landing/components/pricing";
import { FAQ } from "@/features/landing/components/faq";
import { ContactSection } from "@/features/landing/components/contact-section";
import { CTA } from "@/features/landing/components/cta";
import { LandingNav } from "@/features/landing/components/landing-nav";
import { JsonLd } from "@/components/json-ld";
import { createPageMetadata } from "@/lib/seo";
import { getLandingPageStructuredData } from "@/lib/structured-data";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = createPageMetadata({
  title: "Build & Publish Your Developer Portfolio",
  description: siteConfig.description,
  path: "/",
});

export default function LandingPage() {
  return (
    <>
      <JsonLd data={getLandingPageStructuredData()} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-[var(--radius-md)] focus:bg-text-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-surface-base"
      >
        Skip to main content
      </a>

      <div className="min-h-screen overflow-x-hidden bg-surface-base relative">
        <div className="glass-ambient" aria-hidden />
        <div className="relative z-[1]">
        <LandingNav />

        <main id="main">
          <Hero />
          <SupademoTour />
          <CompanyShowcase />
          <Features />
          <Integrations />
          <TemplateShowcase />
          <Pricing />
          <FAQ />
          <ContactSection />
          <CTA />
        </main>
        </div>
      </div>
    </>
  );
}
