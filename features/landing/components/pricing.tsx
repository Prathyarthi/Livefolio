import { StudioSection } from "@/features/landing/components/studio-shell";
import { PricingPlansSection } from "@/features/subscriptions/components/pricing-plans-section";

export function Pricing() {
  return (
    <StudioSection id="pricing">
      {/* Full studio shell width — override shared max-w-4xl (896px) for landing only */}
      <PricingPlansSection className="max-w-none" />
    </StudioSection>
  );
}
