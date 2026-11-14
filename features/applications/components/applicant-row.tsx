"use client";

import Link from "next/link";
import { ExternalLink, FileText, MoreHorizontal, Quote, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ApplicantCard } from "@/features/applications/api/use-applications";
import { ApplicationStageSelect } from "@/features/applications/components/application-stage-select";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
  type PipelineStage,
} from "@/features/jobs/constants/labels";
import { StageBadge } from "@/features/organization/components/workspace-ui";
import { getPortfolioPublicUrl } from "@/lib/domain";
import { cn } from "@/lib/utils";

export function ApplicantRow({
  applicant,
  href,
  selected,
  onToggleSelected,
  onStage,
  onShortlist,
  includeReferences,
  busy,
}: {
  applicant: ApplicantCard;
  href: string;
  selected: boolean;
  onToggleSelected: () => void;
  onStage: (stage: PipelineStage) => void;
  onShortlist: (next: boolean) => void;
  includeReferences: boolean;
  busy?: boolean;
}) {
  const { summary, evidence } = applicant;
  const score = evidence.rankScore;
  const reasons = evidence.rankReasons ?? [];
  const refBonus = includeReferences ? (evidence.referenceBonus ?? 0) : 0;
  const stageLabel =
    PIPELINE_STAGE_LABELS[applicant.stage as PipelineStage] ?? applicant.stage;
  const meta = [
    summary.headline,
    summary.location,
    summary.yearsExperience != null ? `${summary.yearsExperience}+ yrs` : null,
  ].filter(Boolean);

  return (
    <li
      className={cn(
        "group relative flex items-start gap-3 px-3 py-3 transition-colors hover:bg-surface-sunken/60 md:items-center md:px-4",
        selected && "bg-brand-light/40",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggleSelected}
        aria-label={`Select ${summary.name} for comparison`}
        className="mt-1 md:mt-0"
      />

      <Avatar className="hidden h-8 w-8 shrink-0 sm:flex">
        <AvatarImage src={summary.avatarUrl ?? undefined} alt="" />
        <AvatarFallback>{summary.name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <Link
            href={href}
            className="truncate font-medium text-text-primary hover:underline"
          >
            {summary.name}
          </Link>
          {applicant.shortlisted ? (
            <Star className="h-3.5 w-3.5 shrink-0 fill-brand-primary text-brand-primary" aria-label="Shortlisted" />
          ) : null}
          {applicant.vouchCount ? (
            <Badge variant="outline" className="shrink-0 gap-1 text-text-secondary">
              <Quote className="h-3 w-3" aria-hidden />
              {applicant.vouchCount} ref{applicant.vouchCount === 1 ? "" : "s"}
            </Badge>
          ) : null}
          <StageBadge stage={applicant.stage} label={stageLabel} className="shrink-0 md:hidden" />
          {/* Mobile: score on the top line */}
          {score != null ? (
            <span className="ml-auto shrink-0 font-mono text-lg font-semibold tabular-nums text-text-primary md:hidden">
              {score}
            </span>
          ) : null}
        </div>
        {meta.length > 0 ? (
          <p className="truncate text-xs text-text-secondary">{meta.join(" · ")}</p>
        ) : null}
        {reasons.length > 0 ? (
          <p className="truncate text-xs text-text-muted" title={reasons.join(" · ")}>
            {reasons.join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="hidden shrink-0 items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 md:flex">
        {summary.slug ? (
          <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
            <a href={getPortfolioPublicUrl(summary.slug)} target="_blank" rel="noreferrer" aria-label="Open Livefolio">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        ) : null}
        {applicant.resumeFileId ? (
          <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
            <a href={`/api/uploads/${applicant.resumeFileId}`} target="_blank" rel="noreferrer" aria-label="Open resume">
              <FileText className="h-3.5 w-3.5" />
            </a>
          </Button>
        ) : null}
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="hidden h-8 w-8 shrink-0 md:inline-flex"
        onClick={() => onShortlist(!applicant.shortlisted)}
        disabled={busy}
        aria-pressed={applicant.shortlisted}
        aria-label={applicant.shortlisted ? "Remove from shortlist" : "Add to shortlist"}
      >
        <Star
          className={cn(
            "h-4 w-4",
            applicant.shortlisted ? "fill-brand-primary text-brand-primary" : "text-text-muted",
          )}
        />
      </Button>

      <div className="hidden w-36 shrink-0 md:block">
        <ApplicationStageSelect
          value={applicant.stage}
          onChange={onStage}
          disabled={busy}
          className="h-8 min-w-0"
        />
      </div>

      <div className="hidden w-16 shrink-0 text-right md:block">
        {score != null ? (
          <>
            <p className="font-mono text-2xl font-semibold leading-none tabular-nums text-text-primary">
              {score}
            </p>
            {refBonus > 0 ? (
              <p className="mt-1 font-mono text-[11px] tabular-nums text-brand-primary">
                +{refBonus} refs
              </p>
            ) : null}
          </>
        ) : (
          <p className="font-mono text-sm text-text-muted">—</p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" aria-label="More actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem asChild>
            <Link href={href}>Open applicant</Link>
          </DropdownMenuItem>
          {summary.slug ? (
            <DropdownMenuItem asChild>
              <a href={getPortfolioPublicUrl(summary.slug)} target="_blank" rel="noreferrer">
                Open Livefolio
              </a>
            </DropdownMenuItem>
          ) : null}
          {applicant.resumeFileId ? (
            <DropdownMenuItem asChild>
              <a href={`/api/uploads/${applicant.resumeFileId}`} target="_blank" rel="noreferrer">
                Open resume
              </a>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => onShortlist(!applicant.shortlisted)} disabled={busy}>
            {applicant.shortlisted ? "Remove from shortlist" : "Add to shortlist"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onToggleSelected}>
            {selected ? "Remove from compare" : "Add to compare"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
            Move to stage
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={applicant.stage}
            onValueChange={(value) => onStage(value as PipelineStage)}
          >
            {PIPELINE_STAGES.map((stage) => (
              <DropdownMenuRadioItem key={stage} value={stage} disabled={busy}>
                {PIPELINE_STAGE_LABELS[stage]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {refBonus > 0 ? (
            <>
              <DropdownMenuSeparator />
              <p className="px-2 py-1.5 text-xs text-text-muted">+{refBonus} from references</p>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
