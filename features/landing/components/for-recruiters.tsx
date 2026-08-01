import Link from "next/link";
import { FileSearch, Filter, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const POINTS = [
  {
    icon: FileSearch,
    title: "Resume → verification dossier",
    body: "Upload a PDF. We structure the profile and auto-enrich connected sources found on the resume—no candidate email chase.",
  },
  {
    icon: Filter,
    title: "JD & natural-language search",
    body: "Match on skills, experience, and work samples first. Optional living-proof filters apply when sources are connected.",
  },
  {
    icon: Sparkles,
    title: "Claims vs proof",
    body: "See what the resume claims beside evidence from connected sources—so shortlists take minutes, not hours.",
  },
];

export function ForRecruiters() {
  return (
    <section
      id="recruiters"
      className="scroll-mt-16 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">For recruiters</p>
          <h2 className="mt-3 text-h1 text-text-primary">
            Hire from living proof, not keyword bingo
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            Paste a JD or upload resumes. Search your pool with structured
            profile data—and verify with connected sources when they exist.
          </p>
        </div>

        <div
          className="mt-[var(--space-6)] grid gap-[var(--space-5)]"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          }}
        >
          {POINTS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-[var(--radius-lg)] border border-border-default bg-surface-base p-[var(--space-5)]"
            >
              <Icon className="h-5 w-5 text-brand-primary" aria-hidden />
              <h3 className="mt-4 text-h3 text-text-primary">{title}</h3>
              <p className="mt-2 text-body-sm text-text-secondary">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-[var(--space-6)] flex justify-center">
          <Button asChild variant="accent" size="lg">
            <Link href="/sign-in?callbackUrl=/recruiter">
              Open recruiter workspace
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
