import { Check } from "lucide-react";
import { RecruiterPricingCta } from "@/features/landing/components/recruiter-pricing-cta";
import { formatOrgProPriceLabel } from "@/lib/pricing";

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    note: "Try hiring with Livefolio",
    features: [
      "1 company workspace",
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
    <section
      id="pricing"
      aria-labelledby="recruiter-pricing-heading"
      className="px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">Pricing</p>
          <h2
            id="recruiter-pricing-heading"
            className="mt-2 text-h2 text-text-primary"
          >
            Simple freemium for companies
          </h2>
          <p className="mt-3 text-body text-text-secondary">
            Separate from personal Livefolio Pro. Pay when you need more open
            roles.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-[var(--radius-xl)] border p-6 ${
                plan.highlight
                  ? "border-brand-secondary/40 bg-brand-light/40"
                  : "border-border-default bg-surface-raised"
              }`}
            >
              <p className="eyebrow uppercase">{plan.name}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-text-primary">
                {plan.price}
              </p>
              <p className="mt-1 text-body-sm text-text-secondary">{plan.note}</p>
              <ul className="mt-6 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-body-sm text-text-secondary"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-secondary"
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <RecruiterPricingCta
                highlight={plan.highlight}
                label={plan.cta}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}