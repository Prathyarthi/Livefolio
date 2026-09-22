"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
} from "@/features/jobs/constants/labels";

export function PipelineStageSelect({
  value,
  onValueChange,
  disabled,
  size = "sm",
}: {
  value: string;
  onValueChange: (stage: string) => void;
  disabled?: boolean;
  size?: "sm" | "default";
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        size={size}
        className="min-w-[10.5rem]"
        aria-label="Move stage"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PIPELINE_STAGES.map((stage) => (
          <SelectItem key={stage} value={stage}>
            {PIPELINE_STAGE_LABELS[stage]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
