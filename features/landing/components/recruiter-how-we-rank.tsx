import { Code2, ListChecks, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TILES = [
  {
    icon: ListChecks,
    title: "Skill match",
    body: "We read every section of the Livefolio they applied with. A skill in their skills list or a certification counts more than one mentioned in passing in a bio.",
  },
  {
    icon: Rocket,
    title: "Proof of work",
    body: "Live projects, source code, published articles, GitHub and LeetCode profiles. A shipped link counts most. Years of experience are a filter, not a bonus.",
  },
  {
    icon: Code2,
    title: "Coding activity, only when it matters",
    body: "For engineering roles: GitHub contributions in the last 90 days and LeetCode problems solved. For sales, design or ops roles this part is dropped, so nobody is penalised for not having a GitHub.",
  },
] as const;

export function RecruiterHowWeRank() {
  return (
    <section
      id="how-we-rank"
      aria-labelledby="recruiter-rank-heading"
      className="border-y border-border-default bg-surface-sunken/40 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">How we rank</p>
          <h2
            id="recruiter-rank-heading"
            className="mt-2 text-h2 text-text-primary"
          >
            A score you can read, not a black box
          </h2>
          <p className="mt-3 text-body text-text-secondary">
            Every applicant gets a score from 0 to 100 against your job, with up
            to four plain reasons explaining it.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TILES.map((tile) => (
            <Card key={tile.title}>
              <CardHeader>
                <tile.icon className="h-5 w-5 text-brand-secondary" aria-hidden />
                <CardTitle className="text-h3 text-text-primary">
                  {tile.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm text-text-secondary">{tile.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
