import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DocInlineText } from "@/features/docs/components/doc-inline-text";
import type { DocText } from "@/features/docs/types";
import { cn } from "@/lib/utils";

const VARIANTS = {
  info: {
    icon: Info,
    label: "Note",
    className: "border-sky-500/30 bg-sky-500/5 [&>svg]:text-sky-600 dark:[&>svg]:text-sky-400",
  },
  tip: {
    icon: Lightbulb,
    label: "Tip",
    className: "border-emerald-500/30 bg-emerald-500/5 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-400",
  },
  warning: {
    icon: AlertTriangle,
    label: "Heads up",
    className: "border-amber-500/40 bg-amber-500/5 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400",
  },
} as const;

export function DocCallout({
  variant,
  title,
  text,
}: {
  variant: keyof typeof VARIANTS;
  title?: string;
  text: DocText;
}) {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <Alert className={cn("my-6", config.className)}>
      <Icon aria-hidden />
      <AlertTitle>{title ?? config.label}</AlertTitle>
      <AlertDescription className="text-text-secondary">
        <p>
          <DocInlineText text={text} />
        </p>
      </AlertDescription>
    </Alert>
  );
}
