import { UploadCloud, ScanText, Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";

const STEPS = [
  {
    icon: UploadCloud,
    title: "Upload",
    body: "Drop in your resume as a PDF or DOCX. That is the only thing we need from you to begin.",
  },
  {
    icon: ScanText,
    title: "Parse",
    body: "We read your experience, skills, and projects, then organize everything into a clean structure.",
  },
  {
    icon: Rocket,
    title: "Publish",
    body: "Pick a layout and go live on your own link. Optionally connect GitHub, Medium, and LeetCode to keep it updated.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-16 px-6 py-[var(--space-9)]"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow uppercase">How it works</p>
          <h2 className="mt-3 text-h1 text-text-primary">
            From resume to live site in three steps
          </h2>
          <p className="prose-measure mx-auto mt-4 text-body text-text-secondary">
            No templates to wrangle, no blank canvas. Livefolio does the heavy
            lifting from your resume — then you can layer in integrations when
            you are ready.
          </p>
        </div>

        <div
          className="mt-[var(--space-6)] grid gap-[var(--space-5)]"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {STEPS.map(({ icon: Icon, title, body }) => (
            <Card
              key={title}
              className="gap-0 p-[var(--space-5)] transition-all duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-border-strong"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-brand-light">
                <Icon className="h-6 w-6 text-brand-primary" aria-hidden />
              </span>
              <h3 className="mt-5 text-h3 text-text-primary">{title}</h3>
              <p className="mt-2 text-body-sm text-text-secondary">{body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
