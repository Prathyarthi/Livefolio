import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CHIPS = ["React", "Bangalore", "3–5 years", "Live work", "Writing"];

export function RecruiterTalentSearch() {
  return (
    <section
      id="talent-search"
      aria-labelledby="recruiter-talent-heading"
      className="border-y border-border-default bg-surface-sunken/40 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-2">
        <div>
          <p className="eyebrow uppercase">Talent search</p>
          <h2
            id="recruiter-talent-heading"
            className="mt-2 text-h2 text-text-primary"
          >
            Find people before they apply
          </h2>
          <p className="mt-3 text-body text-text-secondary">
            Search Livefolio members who opted in to be found by recruiters,
            ranked the same way as your applicants, optionally against one of
            your open jobs. Opting in is never shown on anyone&apos;s public
            portfolio.
          </p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-border-default bg-surface-raised p-5">
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border-default bg-surface-base px-3 py-2 text-body-sm text-text-secondary">
            <Search className="h-4 w-4" aria-hidden />
            react engineer in Bangalore, 3 years
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <Badge key={chip} variant="outline">
                {chip}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-xs text-text-secondary">
            Example search · demo data
          </p>
        </div>
      </div>
    </section>
  );
}
