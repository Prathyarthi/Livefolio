"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isPipelineStage,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
  type PipelineStage,
} from "@/features/applications/lib/pipeline";
import { cn } from "@/lib/utils";

export function ApplicationStageSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (stage: PipelineStage) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select
      value={isPipelineStage(value) ? value : undefined}
      onValueChange={(next) => {
        if (isPipelineStage(next)) onChange(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        aria-label="Application status"
        className={cn(
          "w-full min-w-36 border-border-default bg-surface-base text-text-primary shadow-none",
          className,
        )}
      >
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent align="end" position="popper">
        {PIPELINE_STAGES.map((stage) => (
          <SelectItem key={stage} value={stage}>
            {PIPELINE_STAGE_LABELS[stage]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}