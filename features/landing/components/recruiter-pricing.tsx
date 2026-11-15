import { RecruiterPricingCards } from "@/features/landing/components/recruiter-pricing-cards";
import { RecruiterSection } from "@/features/landing/components/recruiter-section";

export function RecruiterPricing() {
  return (
    <RecruiterSection
      id="pricing"
      index="5.0"
      label="Pricing"
      title={
        <>
          Proof-based ranking and references
          <br />
          on every plan.
        </>
      }
      body="Priced per seat, well below typical sourcing and ATS tools. Separate from personal Livefolio Pro."
    >
      <RecruiterPricingCards />
    </RecruiterSection>
  );
}
