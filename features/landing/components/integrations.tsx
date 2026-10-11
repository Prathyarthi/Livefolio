import { Plug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { IntegrationIcon } from "@/features/landing/components/integration-icons";
import { integrations } from "@/lib/site";

export function Integrations() {
  return (
    <section
      id="integrations"
      className="scroll-mt-16 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">Integrations</p>
          <h2 className="mt-3 text-h1 text-text-primary">
            Enrich your portfolio beyond the resume
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            Your resume gets you live fast. Then connect GitHub, Medium, and
            LeetCode to pull in repos, articles, and coding stats — so your
            portfolio stays current without starting over.
          </p>
        </div>

        <div
          className="mt-[var(--space-6)] grid gap-[var(--space-5)]"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {integrations.map((platform) => (
            <Card
              key={platform.id}
              className="gap-0 p-[var(--space-5)] transition-all duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-border-strong"
            >
              <IntegrationIcon id={platform.id} />
              <h3 className="mt-5 text-h3 text-text-primary">
                {platform.name}
              </h3>
              <p className="mt-2 text-body-sm text-text-secondary">
                {platform.description}
              </p>
            </Card>
          ))}
        </div>

        <p className="mx-auto mt-[var(--space-6)] flex max-w-xl items-center justify-center gap-2 text-center text-body-sm text-text-muted">
          <Plug className="h-4 w-4 shrink-0" aria-hidden />
          More integrations on the roadmap — we ship what helps you get hired faster.
        </p>
      </div>
    </section>
  );
}
