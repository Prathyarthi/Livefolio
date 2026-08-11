import type { Metadata } from "next";
import { LandingNav } from "@/features/landing/components/landing-nav";
import { CompanyShowcase } from "@/features/landing/components/company-showcase";
import { RecruiterHero } from "@/features/landing/components/recruiter-hero";
import { RecruiterHowItWorks } from "@/features/landing/components/recruiter-how-it-works";
import { RecruiterDifferentiation } from "@/features/landing/components/recruiter-differentiation";
import { RecruiterPricing } from "@/features/landing/components/recruiter-pricing";
import { RecruiterFAQ } from "@/features/landing/components/recruiter-faq";
import { RecruiterCTA } from "@/features/landing/components/recruiter-cta";
import { Footer } from "@/features/landing/components/footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Hire with Livefolio",
  description:
    "Post jobs, receive Apply with Livefolio applications, and shortlist candidates from real professional evidence — free for one open role.",
  path: "/recruiters",
});

export default function RecruitersLandingPage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-[var(--radius-md)] focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>

      <div className="relative min-h-screen overflow-x-hidden bg-surface-base">
        <div className="glass-ambient" aria-hidden />
        <div className="relative z-[1]">
          <LandingNav variant="recruiter" />

          <main id="main">
            <RecruiterHero />
            <CompanyShowcase
              eyebrow="Talent already on Livefolio"
              title="Professionals from Accenture, Deloitte, Infosys, and more are already here"
              description="Hire people who are building in public across global enterprises, technology leaders, and growing startups."
            />
            <RecruiterHowItWorks />
            <RecruiterDifferentiation />
            <RecruiterPricing />
            <RecruiterFAQ />
            <RecruiterCTA />
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
}