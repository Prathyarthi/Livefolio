import { Check } from "lucide-react";
import { RecruiterPricingCta } from "@/features/landing/components/recruiter-pricing-cta";
import { formatOrgProPriceLabel } from "@/lib/pricing";
import { RecruiterSection } from "@/features/landing/components/recruiter-section";

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    note: "Try hiring with Livefolio",
    features: [
      "1 organization · 1 workspace",
      "1 open job posting",
      "Unlimited drafts",
      "Applicant pool & shortlist",
      "Search talent who opted in",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Org Pro",
    price: formatOrgProPriceLabel("monthly"),
    note: "For growing hiring teams",
    features: [
      "Unlimited open jobs",
      "Unlimited workspaces",
      "Everything in Free",
      "Priority support",
    ],
    cta: "Start hiring",
    highlight: true,
  },
] as const;

export function RecruiterPricing() {
  return (
    <RecruiterSection
      id="pricing"
      index="5.0"
      label="Pricing"
      title={
        <>
          One price for the team.
          <br />
          Not per seat.
        </>
      }
      body="Many sourcing and ATS tools charge per recruiter seat each month. Org Pro covers your whole organization. Separate from personal Livefolio Pro."
    >
      <div className="grid gap-px overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-border-default md:grid-cols-2">
        {PLANS.map((plan) => (
          <div key={plan.name} className="flex flex-col bg-surface-base p-6 md:p-8">
            <p className="font-mono text-xs uppercase tracking-wider text-text-secondary">
              {plan.name}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-text-primary">
              {plan.price}
            </p>
            <p className="mt-1 text-body-sm text-text-secondary">{plan.note}</p>
            <ul className="mt-6 flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-body-sm text-text-secondary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
            <RecruiterPricingCta highlight={plan.highlight} label={plan.cta} />
          </div>
        ))}
      </div>
    </RecruiterSection>
  );
}
