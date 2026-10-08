import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RecruiterPricingCta } from "@/features/landing/components/recruiter-pricing-cta";
import { formatOrgProPriceLabel } from "@/lib/pricing";

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
    <section
      id="pricing"
      aria-labelledby="recruiter-pricing-heading"
      className="scroll-mt-16 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">Pricing</p>
          <h2
            id="recruiter-pricing-heading"
            className="mt-3 text-h1 text-text-primary"
          >
            Simple freemium for companies
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            Separate from personal Livefolio Pro. Pay when you need more open
            roles.
          </p>
        </div>

        <div className="mx-auto mt-[var(--space-6)] grid max-w-3xl gap-5 md:grid-cols-2 md:gap-6">
          {PLANS.map((plan) => (
            <div key={plan.name} className="relative h-full">
              {plan.highlight ? (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0">
                  <Badge variant="brand">Most popular</Badge>
                </div>
              ) : null}
              <Card
                className={`relative h-full overflow-hidden ${
                  plan.highlight
                    ? "border-2 border-brand-secondary"
                    : "border-border-default"
                }`}
              >
                {plan.highlight ? (
                  <div className="absolute inset-x-0 top-0 h-1 bg-brand-fill" aria-hidden />
                ) : null}
                <CardContent className="flex h-full flex-col gap-6">
                  <div>
                    <p className="text-label uppercase text-text-secondary">
                      {plan.name}
                    </p>
                    <p className="mt-2 font-display text-h2 text-text-primary">
                      {plan.price}
                    </p>
                    <p className="mt-3 text-body-sm leading-relaxed text-text-secondary">
                      {plan.note}
                    </p>
                  </div>
                  <ul className="flex flex-1 flex-col gap-2.5">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-3 text-body-sm leading-snug text-text-primary"
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
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
