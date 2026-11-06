import { StudioSection } from "@/features/landing/components/studio-shell";
import { PricingPlansSection } from "@/features/subscriptions/components/pricing-plans-section";

export function Pricing() {
  return (
    <StudioSection id="pricing">
      <PricingPlansSection />
    </StudioSection>
  );
}
