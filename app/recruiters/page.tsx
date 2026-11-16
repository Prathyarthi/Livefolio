import type { Metadata } from "next";
import { LandingNav } from "@/features/landing/components/landing-nav";
import { PeopleBrands } from "@/features/landing/components/people-brands";
import { RecruiterHero } from "@/features/landing/components/recruiter-hero";
import { RecruiterHowWeRank } from "@/features/landing/components/recruiter-how-we-rank";
import { RecruiterReferences } from "@/features/landing/components/recruiter-references";
import { RecruiterHowItWorks } from "@/features/landing/components/recruiter-how-it-works";
import { RecruiterDifferentiation } from "@/features/landing/components/recruiter-differentiation";
import { RecruiterPricing } from "@/features/landing/components/recruiter-pricing";
import { RECRUITER_FAQS, RecruiterFAQ } from "@/features/landing/components/recruiter-faq";
import { RecruiterCTA } from "@/features/landing/components/recruiter-cta";
import { StudioShell } from "@/features/landing/components/studio-shell";
import { JsonLd } from "@/components/json-ld";
import { createPageMetadata } from "@/lib/seo";
import {
  getBreadcrumbSchema,
  getOrganizationSchema,
  getRecruiterFaqPageSchema,
  getRecruiterSoftwareApplicationSchema,
} from "@/lib/structured-data";

export const metadata: Metadata = createPageMetadata({
  title: "Hire on Proof: Ranked Shortlists for Any Role",
  description:
    "Rank applicants for any role on proof and named references, not resume keywords. Post a role free and get a ranked shortlist that explains itself.",
  path: "/recruiters",
});

export default function RecruitersLandingPage() {
  return (
    <>
      <JsonLd
        data={[
          getOrganizationSchema(),
          getRecruiterSoftwareApplicationSchema(),
          getRecruiterFaqPageSchema(RECRUITER_FAQS),
          getBreadcrumbSchema([{ name: "For recruiters", path: "/recruiters" }]),
        ]}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-[var(--radius-md)] focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>

      <StudioShell>
        <LandingNav variant="recruiter" layout="pill" />

        <main id="main">
          <RecruiterHero />
          <PeopleBrands />
          <RecruiterHowWeRank />
          <RecruiterReferences />
          <RecruiterHowItWorks />
          <RecruiterDifferentiation />
          <RecruiterPricing />
          <RecruiterFAQ />
          <RecruiterCTA />
        </main>
      </StudioShell>
    </>
  );
}
