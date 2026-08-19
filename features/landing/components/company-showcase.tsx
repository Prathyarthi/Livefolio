const COMPANY_ROWS = [
  [
    "Accenture",
    "IBM",
    "SAP Labs",
    "Recruiterflow",
    "PwC",
    "Seeding Labs",
    "Autodesk",
    "Deloitte",
    "LeadSquared",
  ],
  [
    "Standard Chartered",
    "JFrog",
    "Wipro",
    "Infosys",
    "BridgeLabz",
    "Dynamix Studios",
    "NxtWave",
    "CGI",
  ],
] as const;

const ALL_COMPANIES = COMPANY_ROWS.flat();

function CompanyRow({
  companies,
  reverse = false,
}: {
  companies: readonly string[];
  reverse?: boolean;
}) {
  return (
    <div
      className="company-marquee overflow-hidden"
      aria-hidden="true"
    >
      <div
        className={`company-marquee__track ${
          reverse ? "company-marquee__track--reverse" : ""
        }`}
      >
        {[...companies, ...companies].map((company, index) => (
          <div
            key={`${company}-${index}`}
            className="flex shrink-0 items-center gap-3 rounded-full border border-border-default bg-surface-raised/80 px-5 py-3 shadow-[0_1px_2px_rgba(26,24,40,0.04)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-secondary/70" />
            <span className="whitespace-nowrap font-display text-sm font-semibold tracking-[-0.02em] text-text-secondary sm:text-base">
              {company}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type CompanyShowcaseProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function CompanyShowcase({
  eyebrow = "Our community",
  title = "Where Livefolio talent makes an impact",
  description = "Our community is part of teams across global enterprises, technology leaders, and growing startups.",
}: CompanyShowcaseProps = {}) {
  return (
    <section
      aria-labelledby="company-showcase-heading"
      className="border-y border-border-default bg-surface-sunken/55 py-[var(--space-7)]"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow uppercase">{eyebrow}</p>
            <h2
              id="company-showcase-heading"
              className="mt-2 max-w-xl text-h2 text-text-primary"
            >
              {title}
            </h2>
          </div>
          <p className="max-w-sm text-body-sm text-text-secondary sm:text-right">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-7 space-y-3">
        <CompanyRow companies={COMPANY_ROWS[0]} />
        <CompanyRow companies={COMPANY_ROWS[1]} reverse />
      </div>

      <p className="sr-only">
        Companies represented in our community: {ALL_COMPANIES.join(", ")}.
      </p>
    </section>
  );
}
