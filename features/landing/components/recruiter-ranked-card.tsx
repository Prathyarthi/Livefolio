import { Quote, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type RankedCardProps = {
  name: string;
  headline: string;
  score: number;
  reasons: string[];
  proof: string[];
  referenceCount: number;
  addedPoints?: number;
  rank?: number;
  className?: string;
};

export function RecruiterRankedCard({
  name,
  headline,
  score,
  reasons,
  proof,
  referenceCount,
  addedPoints = 0,
  rank,
  className,
}: RankedCardProps) {
  return (
    <Card className={cn("gap-4 text-left", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="min-w-0">
          {rank ? (
            <p className="font-mono text-xs text-text-secondary">#{rank}</p>
          ) : null}
          <p className="truncate text-h3 text-text-primary">{name}</p>
          <p className="text-body-sm text-text-secondary">{headline}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-3xl font-semibold leading-none text-text-primary tabular-nums">
            {score}
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            {addedPoints > 0 ? `incl. +${addedPoints} refs` : "out of 100"}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="eyebrow uppercase">Why this rank</p>
          <ul className="mt-2 space-y-1.5">
            {reasons.map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-2 text-body-sm text-text-secondary"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-secondary"
                  aria-hidden
                />
                {reason}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {proof.map((kind) => (
            <Badge key={kind} variant="secondary">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              {kind}
            </Badge>
          ))}
          {referenceCount > 0 ? (
            <Badge variant="brand">
              <Quote className="h-3 w-3" aria-hidden />
              {referenceCount} {referenceCount === 1 ? "reference" : "references"}
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
