import { DocInlineText } from "@/features/docs/components/doc-inline-text";
import { DocScreenshot } from "@/features/docs/components/doc-screenshot";
import type { DocStep } from "@/features/docs/types";

export function DocSteps({ steps }: { steps: DocStep[] }) {
  return (
    <ol className="my-6 space-y-0">
      {steps.map((step, index) => (
        <li key={index} className="relative flex gap-4 pb-8 last:pb-0">
          {index < steps.length - 1 ? (
            <span
              className="absolute top-9 bottom-0 left-[15px] w-px bg-border-default"
              aria-hidden
            />
          ) : null}
          <span className="relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-raised font-mono text-sm font-bold text-text-primary">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="text-base font-semibold text-text-primary">
              <DocInlineText text={step.title} />
            </h3>
            {step.body ? (
              <p className="mt-1 text-body-sm text-text-secondary">
                <DocInlineText text={step.body} />
              </p>
            ) : null}
            {step.screenshot ? (
              <DocScreenshot screenshot={step.screenshot} className="mb-0 mt-4" />
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
