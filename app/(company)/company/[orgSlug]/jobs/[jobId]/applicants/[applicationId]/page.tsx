"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useAddRecruiterNote,
  useCompanyApplication,
  useDeleteRecruiterNote,
  useToggleShortlist,
  useUpdateApplicationStage,
} from "@/features/applications/api/use-applications";
import {
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
  type PipelineStage,
} from "@/features/jobs/constants/labels";
import type { ApplicationSnapshotData } from "@/features/applications/lib/types";
import { getPortfolioPublicUrl } from "@/lib/domain";

export default function ApplicantDetailPage() {
  const params = useParams<{
    orgSlug: string;
    jobId: string;
    applicationId: string;
  }>();
  const { orgSlug, jobId, applicationId } = params;
  const { data, isLoading, error } = useCompanyApplication(
    jobId,
    applicationId,
  );
  const updateStage = useUpdateApplicationStage(jobId);
  const toggleShortlist = useToggleShortlist(jobId);
  const addNote = useAddRecruiterNote(jobId, applicationId);
  const deleteNote = useDeleteRecruiterNote(jobId, applicationId);
  const [noteBody, setNoteBody] = useState("");

  if (isLoading) {
    return (
      <div className="p-8 text-body-sm text-text-muted">Loading applicant…</div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4 p-8">
        <h1 className="text-h3 text-text-primary">Applicant not found</h1>
        <Button asChild variant="outline">
          <Link href={`/company/${orgSlug}/jobs/${jobId}/applicants`}>
            Back to pool
          </Link>
        </Button>
      </div>
    );
  }

  const snapshot = data.snapshotData;
  const summary = data.summary;
  const livefolioUrl = summary.slug
    ? getPortfolioPublicUrl(summary.slug)
    : null;

  async function handleStage(stage: string) {
    try {
      await updateStage.mutateAsync({ applicationId, stage });
      toast.success(
        `Moved to ${PIPELINE_STAGE_LABELS[stage as PipelineStage] ?? stage}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleShortlist() {
    try {
      await toggleShortlist.mutateAsync({
        applicationId,
        shortlisted: !data!.shortlisted,
      });
      toast.success(
        data!.shortlisted ? "Removed from shortlist" : "Added to shortlist",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function handleAddNote() {
    if (!noteBody.trim()) return;
    try {
      await addNote.mutateAsync(noteBody.trim());
      setNoteBody("");
      toast.success("Note added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6 md:p-8">
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/company/${orgSlug}/jobs/${jobId}/applicants`}>
            ← Applicants
          </Link>
        </Button>
      </div>

      <header className="flex flex-wrap items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={summary.avatarUrl ?? undefined} alt="" />
          <AvatarFallback>
            {summary.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h2 text-text-primary">{summary.name}</h1>
            <Badge
              variant={data.stage === "shortlisted" ? "success" : "neutral"}
            >
              {PIPELINE_STAGE_LABELS[data.stage as PipelineStage] ?? data.stage}
            </Badge>
          </div>
          {summary.headline ? (
            <p className="text-body text-text-secondary">{summary.headline}</p>
          ) : null}
          <p className="text-body-sm text-text-muted">
            {[
              summary.location,
              summary.yearsExperience != null
                ? `${summary.yearsExperience}+ yrs experience`
                : null,
              `Applied ${new Date(data.submittedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-body-sm text-text-muted">
            Contact: {data.user.email}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-10 rounded-[var(--radius-md)] border border-border-default bg-surface-base px-3 text-sm"
          value={data.stage}
          onChange={(e) => handleStage(e.target.value)}
          disabled={updateStage.isPending}
        >
          {PIPELINE_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {PIPELINE_STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          onClick={handleShortlist}
          disabled={toggleShortlist.isPending}
        >
          <Star
            className={`h-4 w-4 ${data.shortlisted ? "fill-current" : ""}`}
          />
          {data.shortlisted ? "Remove from shortlist" : "Shortlist"}
        </Button>
        <Button variant="outline" asChild>
          <a href={`mailto:${data.user.email}`}>Contact candidate</a>
        </Button>
        {livefolioUrl ? (
          <Button variant="outline" asChild>
            <a href={livefolioUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              View Livefolio
            </a>
          </Button>
        ) : null}
      </div>

      {data.coverNote ? (
        <section className="space-y-2 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5">
          <h2 className="text-h3 text-text-primary">Candidate note</h2>
          <p className="whitespace-pre-wrap text-body-sm text-text-secondary">
            {data.coverNote}
          </p>
        </section>
      ) : null}

      {data.evidence &&
      (data.evidence.requirementMatches.length > 0 ||
        data.evidence.highlights.length > 0) ? (
        <section className="space-y-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5">
          <div>
            <h2 className="text-h3 text-text-primary">
              Relevant evidence & requirements
            </h2>
            <p className="text-body-sm text-text-muted">
              Matched against this job&apos;s structured requirements from the
              application snapshot.
            </p>
          </div>

          {data.evidence.totalRequired > 0 || data.evidence.totalPreferred > 0 ? (
            <p className="text-body-sm text-text-secondary">
              Required {data.evidence.matchedRequired}/
              {data.evidence.totalRequired}
              {data.evidence.totalPreferred > 0
                ? ` · Preferred ${data.evidence.matchedPreferred}/${data.evidence.totalPreferred}`
                : null}
            </p>
          ) : null}

          {data.evidence.requirementMatches.length > 0 ? (
            <ul className="space-y-3">
              {data.evidence.requirementMatches.map((req) => (
                <li key={`${req.type}-${req.label}`} className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={req.matched ? "success" : "neutral"}>
                      {req.matched ? "Evidence found" : "No clear evidence"}
                    </Badge>
                    <span className="text-xs uppercase text-text-muted">
                      {req.type}
                    </span>
                    <span className="font-medium text-text-primary">
                      {req.label}
                    </span>
                  </div>
                  {req.evidence.length > 0 ? (
                    <ul className="pl-1 text-body-sm text-text-secondary">
                      {req.evidence.map((item) => (
                        <li key={`${item.kind}-${item.label}`}>
                          {item.kind}: {item.label}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : data.evidence.highlights.length > 0 ? (
            <ul className="space-y-1 text-body-sm text-text-secondary">
              {data.evidence.highlights.map((item) => (
                <li key={`${item.kind}-${item.label}`}>
                  {item.kind}: {item.label}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <SnapshotSections snapshot={snapshot} />

      <section className="space-y-4 border-t border-border-default pt-8">
        <div>
          <h2 className="text-h3 text-text-primary">Private recruiter notes</h2>
          <p className="text-body-sm text-text-muted">
            Only visible to your hiring team — never shown to candidates.
          </p>
        </div>

        <div className="space-y-2">
          <Textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            rows={3}
            placeholder="Strong leadership experience. Need to verify enterprise work…"
          />
          <Button
            onClick={handleAddNote}
            disabled={addNote.isPending || !noteBody.trim()}
          >
            Add note
          </Button>
        </div>

        {data.notes.length === 0 ? (
          <p className="text-body-sm text-text-muted">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {data.notes.map((note) => (
              <li
                key={note.id}
                className="rounded-[var(--radius-md)] border border-border-default bg-surface-raised p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-body-sm font-medium text-text-primary">
                      {note.author.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await deleteNote.mutateAsync(note.id);
                        toast.success("Note deleted");
                      } catch (err) {
                        toast.error(
                          err instanceof Error ? err.message : "Delete failed",
                        );
                      }
                    }}
                    disabled={deleteNote.isPending}
                  >
                    Delete
                  </Button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-body-sm text-text-secondary">
                  {note.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SnapshotSections({
  snapshot,
}: {
  snapshot: ApplicationSnapshotData | null;
}) {
  if (!snapshot) {
    return (
      <p className="text-body-sm text-text-muted">
        No application snapshot available.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {snapshot.profile.summary ? (
        <section className="space-y-2">
          <h2 className="text-h3 text-text-primary">About</h2>
          <p className="whitespace-pre-wrap text-body-sm text-text-secondary">
            {snapshot.profile.summary}
          </p>
        </section>
      ) : null}

      <SectionList
        title="Experience"
        items={snapshot.experiences.map((e) => ({
          title: `${e.role} · ${e.company}`,
          body: e.description,
          meta: [e.location, formatRange(e.startDate, e.endDate)]
            .filter(Boolean)
            .join(" · "),
        }))}
      />

      <section className="space-y-3">
        <h2 className="text-h3 text-text-primary">Skills</h2>
        {snapshot.skills.length === 0 ? (
          <p className="text-body-sm text-text-muted">None listed</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {snapshot.skills.map((s) => (
              <span
                key={`${s.category}-${s.name}`}
                className="rounded-[var(--radius-sm)] bg-surface-base px-2.5 py-1 text-sm text-text-secondary"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <SectionList
        title="Projects"
        items={snapshot.projects.map((p) => ({
          title: p.title,
          body: p.description,
          meta: p.techStack?.slice(0, 6).join(", ") || undefined,
        }))}
      />

      <SectionList
        title="Education"
        items={snapshot.educations.map((e) => ({
          title: `${e.degree} · ${e.institution}`,
          body: e.description ?? undefined,
          meta: formatRange(e.startDate, e.endDate) || undefined,
        }))}
      />

      <SectionList
        title="Certifications"
        items={snapshot.certifications.map((c) => ({
          title: `${c.name} · ${c.issuer}`,
        }))}
      />

      <SectionList
        title="Achievements"
        items={snapshot.achievements.map((a) => ({
          title: a.title,
        }))}
      />

      <SectionList
        title="Publications"
        items={snapshot.articles.map((a) => ({
          title: a.title,
          body: a.description,
          meta: a.url,
        }))}
      />

      <SectionList
        title="Connected work"
        items={snapshot.socialProfiles.map((s) => ({
          title: s.platform,
          meta: s.url,
        }))}
      />
    </div>
  );
}

function SectionList({
  title,
  items,
}: {
  title: string;
  items: Array<{ title: string; body?: string; meta?: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-h3 text-text-primary">{title}</h2>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={`${item.title}-${item.meta ?? ""}`} className="space-y-1">
            <p className="font-medium text-text-primary">{item.title}</p>
            {item.meta ? (
              <p className="text-xs text-text-muted">{item.meta}</p>
            ) : null}
            {item.body ? (
              <p className="whitespace-pre-wrap text-body-sm text-text-secondary">
                {item.body}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatRange(start: string | null, end: string | null) {
  const fmt = (value: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  };
  const a = fmt(start);
  const b = end ? fmt(end) : "Present";
  if (!a) return "";
  return `${a} – ${b}`;
}
