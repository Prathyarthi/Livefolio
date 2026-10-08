"use client";

import type { ScreeningAnswer } from "@/features/jobs/lib/screening-questions";

export function ScreeningAnswersSection({
  answers,
  title = "Application questions",
}: {
  answers: ScreeningAnswer[] | null | undefined;
  title?: string;
}) {
  if (!answers || answers.length === 0) return null;

  return (
    <section className="space-y-3 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-[var(--shadow-card)] md:p-6">
      <h2 className="text-h3 text-text-primary">{title}</h2>
      <dl className="space-y-4">
        {answers.map((answer) => (
          <div key={answer.questionId} className="space-y-1">
            <dt className="text-body-sm font-medium text-text-primary">
              {answer.prompt}
            </dt>
            <dd className="whitespace-pre-wrap text-body-sm text-text-secondary">
              {answer.displayValue || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}